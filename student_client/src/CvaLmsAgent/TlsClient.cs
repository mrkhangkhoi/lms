using System.Collections.Concurrent;
using System.Diagnostics;
using System.Net.Security;
using System.Net.Sockets;
using System.Security.Authentication;
using System.Security.Cryptography.X509Certificates;
using System.Text;
using System.Text.Json;

namespace CvaLmsAgent;

public class StreamProfile
{
    public int Width { get; set; } = 480;
    public int Height { get; set; } = 270;
    public int Fps { get; set; } = 2;
    public long JpegQuality { get; set; } = 60;
}

public class AgentTlsClient
{
    private readonly string _gatewayHost;
    private readonly int _gatewayPort;
    private readonly string _machineId;
    private readonly string? _pfxPath;
    private readonly ScreenCaptureEngine _captureEngine;
    private readonly ConcurrentDictionary<string, TaskCompletionSource<bool>> _pendingSubmissions = new();
    private readonly ConcurrentDictionary<string, long> _processedCommandIds = new();
    private StreamProfile _currentProfile = new();
    private SslStream? _sslStream;
    private TcpClient? _tcpClient;
    private bool _running = false;
    private string? _sessionEpochId;

    public AgentTlsClient(string gatewayHost, int gatewayPort, string machineId, string? pfxPath = null)
    {
        _gatewayHost = gatewayHost;
        _gatewayPort = gatewayPort;
        _machineId = machineId;
        _pfxPath = pfxPath;
        _captureEngine = new ScreenCaptureEngine();
    }

    public async Task StartAsync(CancellationToken ct)
    {
        _running = true;
        Console.WriteLine($"🚀 Agent khởi động trên [{_machineId}] kết nối tới Gateway {_gatewayHost}:{_gatewayPort}...");

        int retryAttempt = 0;
        while (_running && !ct.IsCancellationRequested)
        {
            try
            {
                DateTime connectStart = DateTime.UtcNow;
                await ConnectAndRunAsync(ct);
                if ((DateTime.UtcNow - connectStart).TotalSeconds > 30)
                {
                    retryAttempt = 0;
                }
            }
            catch (Exception ex)
            {
                retryAttempt++;
                int baseDelay = (int)Math.Min(15000, 1000 * Math.Pow(1.5, Math.Min(retryAttempt, 6)));
                int jitter = Random.Shared.Next(0, 600);
                int delayMs = baseDelay + jitter;
                Console.WriteLine($"⚠️ Mất kết nối Gateway: {ex.Message}. Tự kết nối lại sau {delayMs}ms (Lần thử {retryAttempt})...");
                try { _sslStream?.Dispose(); } catch (Exception dEx) { Console.WriteLine($"[Dispose SSL]: {dEx.Message}"); }
                try { _tcpClient?.Dispose(); } catch (Exception dEx) { Console.WriteLine($"[Dispose TCP]: {dEx.Message}"); }
                await Task.Delay(delayMs, ct);
            }
        }
    }

    private async Task ConnectAndRunAsync(CancellationToken ct)
    {
        _tcpClient = new TcpClient();
        await _tcpClient.ConnectAsync(_gatewayHost, _gatewayPort, ct);

        // Nạp chứng chỉ máy trạm
        X509Certificate2Collection clientCerts = new X509Certificate2Collection();
        if (!string.IsNullOrEmpty(_pfxPath) && File.Exists(_pfxPath))
        {
            X509Certificate2 cert = new X509Certificate2(_pfxPath, "cvalms2026");
            clientCerts.Add(cert);
        }

        _sslStream = new SslStream(
            _tcpClient.GetStream(),
            false,
            ValidateServerCertificate,
            (sender, targetHost, localCerts, remoteCert, acceptableIssuers) => clientCerts.Count > 0 ? clientCerts[0] : null!
        );

        await _sslStream.AuthenticateAsClientAsync(new SslClientAuthenticationOptions
        {
            TargetHost = _gatewayHost,
            ClientCertificates = clientCerts,
            EnabledSslProtocols = SslProtocols.Tls12 | SslProtocols.Tls13
        }, ct);

        Console.WriteLine($"✅ Đã bắt tay mTLS thành công với Gateway [{_gatewayHost}:{_gatewayPort}]");

        // Gửi bản tin REGISTER
        await SendJsonMessageAsync(new
        {
            type = "REGISTER",
            machineId = _machineId,
            foregroundApp = _captureEngine.GetForegroundAppTitle(),
            timestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()
        }, ct);

        // Chạy song song 3 luồng với Linked CancellationTokenSource để giải phóng đồng bộ khi 1 luồng kết thúc
        using CancellationTokenSource linkedCts = CancellationTokenSource.CreateLinkedTokenSource(ct);
        CancellationToken innerCt = linkedCts.Token;

        Task receiveTask = Task.Run(() => ReceiveLoopAsync(innerCt), innerCt);
        Task captureTask = Task.Run(() => CaptureAndStreamLoopAsync(innerCt), innerCt);
        Task heartbeatTask = Task.Run(() => HeartbeatLoopAsync(innerCt), innerCt);

        Task completed = await Task.WhenAny(receiveTask, captureTask, heartbeatTask);
        linkedCts.Cancel(); // Signal ngay cho các luồng còn lại dừng việc đọc/ghi trên sslStream đang đóng

        try
        {
            await Task.WhenAll(receiveTask, captureTask, heartbeatTask);
        }
        catch (OperationCanceledException) { }
        catch (Exception ex)
        {
            Console.WriteLine($"[Session Teardown Warning]: {ex.Message}");
        }
    }

    private static bool ValidateServerCertificate(
        object sender,
        X509Certificate? certificate,
        X509Chain? chain,
        SslPolicyErrors sslPolicyErrors)
    {
        if (certificate == null) return false;

        X509Certificate2 cert2 = certificate as X509Certificate2 ?? new X509Certificate2(certificate);

        // 1. Tìm kiếm chứng chỉ gốc ca.crt (Bắt buộc phải có CA chính thức để xác thực chuỗi)
        string caPath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "certs", "ca.crt");
        if (!File.Exists(caPath))
        {
            string baseDir = AppDomain.CurrentDomain.BaseDirectory;
            string[] candidates = new string[]
            {
                Path.Combine(baseDir, "ca.crt"),
                Path.Combine(baseDir, "gateway", "certs", "ca.crt"),
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "CVALMS-Agent", "certs", "ca.crt")
            };
            foreach (string c in candidates)
            {
                if (File.Exists(c)) { caPath = c; break; }
            }
        }

        if (!File.Exists(caPath))
        {
            Console.WriteLine("❌ [TLS Security] Không tìm thấy chứng chỉ Root CA (ca.crt). Bác bỏ kết nối mTLS.");
            return false;
        }

        try
        {
            X509Certificate2 caCert = new X509Certificate2(caPath);
            if (chain != null)
            {
                chain.ChainPolicy.ExtraStore.Add(caCert);
                chain.ChainPolicy.VerificationFlags = X509VerificationFlags.AllowUnknownCertificateAuthority;
                chain.ChainPolicy.RevocationMode = X509RevocationMode.NoCheck;
                if (chain.Build(cert2))
                {
                    foreach (X509ChainElement element in chain.ChainElements)
                    {
                        if (element.Certificate.Thumbprint.Equals(caCert.Thumbprint, StringComparison.OrdinalIgnoreCase))
                        {
                            bool hasGatewaySubject = cert2.Subject.Contains("Gateway", StringComparison.OrdinalIgnoreCase) &&
                                                     cert2.Subject.Contains("Cvalms", StringComparison.OrdinalIgnoreCase);
                            if (hasGatewaySubject)
                            {
                                return true;
                            }
                        }
                    }
                }
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[Cert Chain Error]: {ex.Message}");
            return false;
        }

        Console.WriteLine($"❌ [TLS Security] Bác bỏ chứng chỉ máy chủ không hợp lệ: Subject={cert2.Subject}, Issuer={cert2.Issuer}");
        return false;
    }

    private async Task HeartbeatLoopAsync(CancellationToken ct)
    {
        while (_running && !ct.IsCancellationRequested && _sslStream != null)
        {
            try
            {
                await Task.Delay(5000, ct);
                if (_sslStream == null) break;

                await SendJsonMessageAsync(new
                {
                    type = "HEARTBEAT",
                    machineId = _machineId,
                    foregroundApp = _captureEngine.GetForegroundAppTitle(),
                    timestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()
                }, ct);
            }
            catch (OperationCanceledException)
            {
                break;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[Heartbeat Loop Error]: {ex.Message}");
                break;
            }
        }
    }

    private async Task CaptureAndStreamLoopAsync(CancellationToken ct)
    {
        while (_running && !ct.IsCancellationRequested && _sslStream != null)
        {
            try
            {
                StreamProfile profile = _currentProfile;
                CapturedFrame frame = _captureEngine.CaptureScreen(profile.Width, profile.Height, profile.JpegQuality);

                // Gửi gói tin nhị phân CVFR (0x43564652)
                await SendFrameAsync(frame, ct);

                // Nghỉ theo FPS mục tiêu (2 FPS ~ 500ms, 12 FPS ~ 83ms)
                int delayMs = Math.Max(50, 1000 / profile.Fps);
                await Task.Delay(delayMs, ct);
            }
            catch (OperationCanceledException)
            {
                break;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[Stream Frame Error]: {ex.Message}");
                break;
            }
        }
    }

    private async Task SendFrameAsync(CapturedFrame frame, CancellationToken ct)
    {
        if (_sslStream == null) return;

        byte[] mIdBytes = Encoding.UTF8.GetBytes(_machineId);
        int headerLen = 5 + mIdBytes.Length + 4 + 8 + 2 + 2 + 1 + 4;
        byte[] header = new byte[headerLen];

        using MemoryStream ms = new MemoryStream(header);
        using BinaryWriter bw = new BinaryWriter(ms);

        // Magic 0x43564652 ('CVFR')
        bw.Write(new byte[] { 0x43, 0x56, 0x46, 0x52 });
        bw.Write((byte)mIdBytes.Length);
        bw.Write(mIdBytes);

        // Big Endian fields
        WriteUInt32BE(bw, frame.SequenceNumber);
        WriteUInt64BE(bw, frame.Timestamp);
        WriteUInt16BE(bw, frame.Width);
        WriteUInt16BE(bw, frame.Height);
        bw.Write((byte)frame.State);
        WriteUInt32BE(bw, (uint)frame.JpegData.Length);

        await _sslStream.WriteAsync(header, ct);
        await _sslStream.WriteAsync(frame.JpegData, ct);
        await _sslStream.FlushAsync(ct);
    }

    private async Task ReceiveLoopAsync(CancellationToken ct)
    {
        byte[] readBuf = new byte[8192];
        List<byte> memoryBuffer = new List<byte>();

        while (_running && !ct.IsCancellationRequested && _sslStream != null)
        {
            int bytesRead = await _sslStream.ReadAsync(readBuf, ct);
            if (bytesRead <= 0) break;

            memoryBuffer.AddRange(readBuf.Take(bytesRead));

            // Xử lý framing
            while (memoryBuffer.Count >= 8)
            {
                uint magic = (uint)((memoryBuffer[0] << 24) | (memoryBuffer[1] << 16) | (memoryBuffer[2] << 8) | memoryBuffer[3]);
                if (magic == 0x4356414C) // 'CVAL'
                {
                    uint len = (uint)((memoryBuffer[4] << 24) | (memoryBuffer[5] << 16) | (memoryBuffer[6] << 8) | memoryBuffer[7]);
                    if (len > 10 * 1024 * 1024)
                    {
                        Console.WriteLine($"❌ [Security] Gói tin CVAL bất thường quá lớn ({len} bytes) -> Đóng socket phòng vệ!");
                        return;
                    }
                    if (memoryBuffer.Count < 8 + len) break;

                    byte[] jsonBytes = memoryBuffer.Skip(8).Take((int)len).ToArray();
                    memoryBuffer.RemoveRange(0, 8 + (int)len);

                    string jsonStr = Encoding.UTF8.GetString(jsonBytes);
                    ProcessCommand(jsonStr);
                }
                else if (magic == 0x43564243) // 'CVBC' Teacher Broadcast Frame
                {
                    uint len = (uint)((memoryBuffer[4] << 24) | (memoryBuffer[5] << 16) | (memoryBuffer[6] << 8) | memoryBuffer[7]);
                    if (len > 10 * 1024 * 1024)
                    {
                        Console.WriteLine($"❌ [Security] Gói tin CVBC bất thường quá lớn ({len} bytes) -> Đóng socket phòng vệ!");
                        return;
                    }
                    if (memoryBuffer.Count < 8 + len) break;

                    byte[] jpegBytes = memoryBuffer.Skip(8).Take((int)len).ToArray();
                    memoryBuffer.RemoveRange(0, 8 + (int)len);

                    TeacherBroadcastManager.UpdateBroadcastFrame(jpegBytes);
                }
                else
                {
                    memoryBuffer.RemoveAt(0);
                }
            }
        }
    }

    private void ProcessCommand(string jsonStr)
    {
        try
        {
            using JsonDocument doc = JsonDocument.Parse(jsonStr);
            JsonElement root = doc.RootElement;

            if (root.TryGetProperty("type", out JsonElement typeProp))
            {
                string? type = typeProp.GetString();
                if (type == "SESSION_INIT")
                {
                    _sessionEpochId = root.GetProperty("sessionEpochId").GetString();
                    Console.WriteLine($"🔑 Nhận Session Epoch mới từ Gateway: {_sessionEpochId}");
                }
                else if (type == "SET_STREAM_PROFILE")
                {
                    string? profileName = root.GetProperty("profile").GetString();
                    if (profileName == "SPOTLIGHT_HD")
                    {
                        _currentProfile = new StreamProfile { Width = 1280, Height = 720, Fps = 12, JpegQuality = 75 };
                        Console.WriteLine("🌟 Kích hoạt chế độ Spotlight Full HD (1280x720 @ 12 FPS)");
                    }
                    else
                    {
                        _currentProfile = new StreamProfile { Width = 480, Height = 270, Fps = 2, JpegQuality = 60 };
                        Console.WriteLine("📺 Chuyển về chế độ Overview Thumbnail (480x270 @ 2 FPS)");
                    }
                }
                else if (type == "COMMIT_ACK")
                {
                    string? subId = root.GetProperty("submissionId").GetString();
                    string hash = root.TryGetProperty("contentHash", out JsonElement h) ? (h.GetString() ?? "") : "";
                    Console.WriteLine($"🎉 Bài tập [{subId}] đã được Gateway xác nhận lưu trữ thành công (SHA-256: {hash})!");
                    if (subId != null && _pendingSubmissions.TryGetValue(subId, out TaskCompletionSource<bool>? tcs))
                    {
                        tcs.TrySetResult(true);
                    }
                }
                else if (type == "COMMIT_NACK")
                {
                    string? subId = root.GetProperty("submissionId").GetString();
                    string err = root.TryGetProperty("error", out JsonElement e) ? (e.GetString() ?? "Lỗi server") : "Lỗi server";
                    Console.WriteLine($"❌ Bài tập [{subId}] bị Gateway từ chối: {err}");
                    if (subId != null && _pendingSubmissions.TryGetValue(subId, out TaskCompletionSource<bool>? tcs))
                    {
                        tcs.TrySetResult(false);
                    }
                }
            }
            else if (root.TryGetProperty("action", out JsonElement actionProp))
            {
                string? action = actionProp.GetString();

                // Kiểm tra commandId chống Replay Attack
                if (root.TryGetProperty("commandId", out JsonElement cmdIdProp))
                {
                    string? cmdId = cmdIdProp.GetString();
                    if (!string.IsNullOrEmpty(cmdId))
                    {
                        if (_processedCommandIds.ContainsKey(cmdId))
                        {
                            Console.WriteLine($"⚠️ [Replay Protection] Bỏ qua lệnh trùng lặp [{cmdId}] đã được xử lý trước đó.");
                            return;
                        }
                        _processedCommandIds[cmdId] = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();

                        // Tự động dọn dẹp lệnh quá 5 phút
                        if (_processedCommandIds.Count > 500)
                        {
                            long nowMs = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
                            foreach (KeyValuePair<string, long> kv in _processedCommandIds)
                            {
                                if (nowMs - kv.Value > 300000) _processedCommandIds.TryRemove(kv.Key, out _);
                            }
                        }
                    }
                }

                // Kiểm tra SessionEpochId
                if (root.TryGetProperty("sessionEpochId", out JsonElement epochProp))
                {
                    string? ep = epochProp.GetString();
                    if (!string.IsNullOrEmpty(_sessionEpochId) && !string.IsNullOrEmpty(ep) && ep != _sessionEpochId)
                    {
                        Console.WriteLine($"⚠️ [Epoch Mismatch] Bỏ qua lệnh từ epoch cũ: {ep} (Hiện tại: {_sessionEpochId})");
                        return;
                    }
                }

                Console.WriteLine($"⚡ Nhận lệnh điều khiển: {action}");

                if (action == "CLASSROOM_FOCUS_LOCK")
                {
                    string msg = "Thầy đang giảng bài, các em chú ý lên bảng!";
                    if (root.TryGetProperty("payload", out JsonElement p) && p.TryGetProperty("message", out JsonElement m))
                    {
                        msg = m.GetString() ?? msg;
                    }
                    ClassroomFocusLockManager.Lock(msg);
                }
                else if (action == "CLASSROOM_FOCUS_UNLOCK")
                {
                    ClassroomFocusLockManager.Unlock();
                }
                else if (action == "START_TEACHER_BROADCAST")
                {
                    string title = "Thầy đang trình chiếu bài giảng";
                    if (root.TryGetProperty("payload", out JsonElement p) && p.TryGetProperty("title", out JsonElement t))
                    {
                        title = t.GetString() ?? title;
                    }
                    TeacherBroadcastManager.StartBroadcast(title);
                }
                else if (action == "STOP_TEACHER_BROADCAST")
                {
                    TeacherBroadcastManager.StopBroadcast();
                }
                else if (action == "PREPARE_COLLECT")
                {
                    string subId = root.TryGetProperty("submissionId", out JsonElement s) ? (s.GetString() ?? "default") : "default";
                    _ = UploadExerciseSubmissionAsync(subId);
                }
                else if (action == "SYSTEM_SHUTDOWN")
                {
                    Console.WriteLine("🛑 Nhận lệnh tắt máy từ giáo viên!");
                    if (!SendPipeCommand("POWER_SHUTDOWN"))
                    {
                        Process.Start("shutdown.exe", "/s /t 5 /c \"Giao vien yeu cau tat phong may\"");
                    }
                }
                else if (action == "SYSTEM_RESTART")
                {
                    Console.WriteLine("🔄 Nhận lệnh khởi động lại từ giáo viên!");
                    if (!SendPipeCommand("POWER_RESTART"))
                    {
                        Process.Start("shutdown.exe", "/r /t 5 /c \"Giao vien yeu cau khoi dong lai phong may\"");
                    }
                }
                else if (action == "BLOCK_INTERNET")
                {
                    Console.WriteLine("🔒 Nhận lệnh Khóa Internet từ giáo viên (Chỉ cho phép LMS)");
                    if (!SendPipeCommand("FIREWALL_BLOCK"))
                    {
                        ExecuteFirewallInternetLock(true);
                    }
                }
                else if (action == "UNBLOCK_INTERNET")
                {
                    Console.WriteLine("🌐 Nhận lệnh Mở Internet từ giáo viên");
                    if (!SendPipeCommand("FIREWALL_UNBLOCK"))
                    {
                        ExecuteFirewallInternetLock(false);
                    }
                }
                else if (action == "ENFORCE_WALLPAPER")
                {
                    Console.WriteLine("🖼️ Nhận lệnh Khóa hình nền chuẩn từ giáo viên");
                    WallpaperManager.EnsureLockedWallpaper();
                }
                else if (action == "PERFORM_UPDATE")
                {
                    Console.WriteLine("🚀 Nhận lệnh nâng cấp hệ thống OTA từ máy giáo viên!");
                    string downloadUrl = root.TryGetProperty("downloadUrl", out var urlEl) ? urlEl.GetString() ?? "" : "";
                    string sha256 = root.TryGetProperty("sha256", out var shaEl) ? shaEl.GetString() ?? "" : "";
                    if (!string.IsNullOrEmpty(downloadUrl))
                    {
                        _ = ExecuteAutoUpdateAsync(downloadUrl, sha256);
                    }
                }
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"⚠️ Lỗi xử lý lệnh: {ex.Message}");
        }
    }

    private static bool SendPipeCommand(string command)
    {
        try
        {
            using var client = new System.IO.Pipes.NamedPipeClientStream(".", "CvaLmsAdminPipe", System.IO.Pipes.PipeDirection.InOut);
            client.Connect(1500);
            using var writer = new StreamWriter(client, System.Text.Encoding.UTF8) { AutoFlush = true };
            using var reader = new StreamReader(client, System.Text.Encoding.UTF8);
            writer.WriteLine(command);
            string? resp = reader.ReadLine();
            return resp != null && resp.StartsWith("OK");
        }
        catch
        {
            return false;
        }
    }

    private static bool IsAdministrator()
    {
        try
        {
            using System.Security.Principal.WindowsIdentity id = System.Security.Principal.WindowsIdentity.GetCurrent();
            System.Security.Principal.WindowsPrincipal principal = new System.Security.Principal.WindowsPrincipal(id);
            return principal.IsInRole(System.Security.Principal.WindowsBuiltInRole.Administrator);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[Admin Check Error]: {ex.Message}");
            return false;
        }
    }

    private static bool RunNetsh(string args)
    {
        try
        {
            if (!IsAdministrator())
            {
                Console.WriteLine("⚠️ [Firewall Warning]: Tiến trình hiện tại không có quyền Administrator. Không thể cấu hình Windows Firewall.");
                return false;
            }

            ProcessStartInfo psi = new ProcessStartInfo
            {
                FileName = "netsh.exe",
                Arguments = args,
                CreateNoWindow = true,
                UseShellExecute = false,
                RedirectStandardError = true,
                RedirectStandardOutput = true
            };
            using Process? p = Process.Start(psi);
            if (p == null) return false;
            p.WaitForExit(5000);
            if (p.ExitCode != 0)
            {
                string err = p.StandardError.ReadToEnd();
                Console.WriteLine($"⚠️ [Netsh Warning ExitCode {p.ExitCode}]: {err.Trim()}");
                return false;
            }
            return true;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[Netsh Error]: {ex.Message}");
            return false;
        }
    }

    private void RemoveFirewallRules()
    {
        RunNetsh("advfirewall firewall delete rule name=\"CVALMS_BLOCK_WEB\"");
        RunNetsh("advfirewall firewall delete rule name=\"CVALMS_BLOCK_DNS\"");
        RunNetsh("advfirewall firewall delete rule name=\"CVALMS_BLOCK_DNS_TCP\"");
        RunNetsh("advfirewall firewall delete rule name=\"CVALMS_BLOCK_VPN\"");
        RunNetsh("advfirewall firewall delete rule name=\"CVALMS_BLOCK_IPV6\"");
        RunNetsh("advfirewall firewall delete rule name=\"CVALMS_ALLOW_LAN\"");
        RunNetsh("advfirewall firewall delete rule name=\"CVALMS_ALLOW_GATEWAY\"");
    }

    private void ExecuteFirewallInternetLock(bool block)
    {
        try
        {
            // 1. Dọn dẹp sạch các rule cũ nếu có
            RemoveFirewallRules();

            if (block)
            {
                // 2. Cho phép kết nối LAN nội bộ và Cổng Gateway giáo viên
                bool rLan = RunNetsh("advfirewall firewall add rule name=\"CVALMS_ALLOW_LAN\" dir=out action=allow remoteip=localsubnet");
                bool rGateway = RunNetsh($"advfirewall firewall add rule name=\"CVALMS_ALLOW_GATEWAY\" dir=out action=allow protocol=TCP remoteip=localsubnet,{_gatewayHost} remoteport=49150,49152");

                // 3. Chặn lưu lượng Web ngoại mạng (HTTP, HTTPS, proxy thông dụng)
                bool rWeb = RunNetsh("advfirewall firewall add rule name=\"CVALMS_BLOCK_WEB\" dir=out action=block protocol=TCP remoteport=80,443,8000,8080,8443,8888");

                // 4. Chặn DNS ngoại mạng (UDP 53, TCP 53, DoT 853)
                bool rDns = RunNetsh("advfirewall firewall add rule name=\"CVALMS_BLOCK_DNS\" dir=out action=block protocol=UDP remoteport=53,853");
                bool rDnsTcp = RunNetsh("advfirewall firewall add rule name=\"CVALMS_BLOCK_DNS_TCP\" dir=out action=block protocol=TCP remoteport=53,853");

                // 5. Chặn VPN/QUIC (UDP 443, WireGuard 51820, OpenVPN 1194, IPSec 500, 4500)
                bool rVpn = RunNetsh("advfirewall firewall add rule name=\"CVALMS_BLOCK_VPN\" dir=out action=block protocol=UDP remoteport=443,1194,500,4500,51820");

                // 6. Chặn toàn bộ IPv6 ra ngoài để hạn chế bypass qua IPv6
                bool rIpv6 = RunNetsh("advfirewall firewall add rule name=\"CVALMS_BLOCK_IPV6\" dir=out action=block remoteip=::/0");

                if (!rLan || !rGateway || !rWeb || !rDns || !rDnsTcp || !rVpn || !rIpv6)
                {
                    Console.WriteLine("⚠️ [Firewall Rollback]: Có lỗi khi cấu hình firewall. Đang rollback trả lại trạng thái ban đầu.");
                    RemoveFirewallRules();
                    return;
                }

                // Xác minh sau áp dụng (Verification Probe)
                bool verified = RunNetsh("advfirewall firewall show rule name=\"CVALMS_BLOCK_WEB\"");
                if (verified)
                {
                    Console.WriteLine("✅ Đã kích hoạt và xác thực chính sách Firewall phòng máy: Chặn lưu lượng Web/DNS/VPN/IPv6 ngoại vi (Chỉ cho phép LMS và LAN).");
                }
                else
                {
                    Console.WriteLine("⚠️ [Firewall Verification Failed]: Không tìm thấy rule sau khi thêm. Rollback!");
                    RemoveFirewallRules();
                }
            }
            else
            {
                Console.WriteLine("✅ Đã gỡ bỏ chính sách Firewall: Khôi phục kết nối mạng thông thường.");
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"⚠️ Lỗi thiết lập firewall: {ex.Message}");
            RemoveFirewallRules();
        }
    }

    private async Task UploadExerciseSubmissionAsync(string submissionId)
    {
        const int maxRetries = 3;
        for (int attempt = 1; attempt <= maxRetries; attempt++)
        {
            try
            {
                Console.WriteLine($"📦 Đang đóng gói bài tập nộp cho giao dịch [{submissionId}] (Lần {attempt}/{maxRetries})...");
                CollectedArchive archive = FileCollectorEngine.CreateExerciseArchive();

                TaskCompletionSource<bool> tcs = new TaskCompletionSource<bool>(TaskCreationOptions.RunContinuationsAsynchronously);
                _pendingSubmissions[submissionId] = tcs;

                // Gửi bản tin chuẩn bị giao dịch
                await SendJsonMessageAsync(new
                {
                    type = "COLLECT_SUBMIT",
                    submissionId,
                    machineId = _machineId,
                    studentName = Environment.UserName,
                    expectedHash = archive.Sha256Hash,
                    fileCount = archive.FileCount,
                    sessionEpochId = _sessionEpochId
                }, CancellationToken.None);

                // Gửi binary zip payload CVSU (0x43565355)
                byte[] subIdBytes = Encoding.UTF8.GetBytes(submissionId);
                byte[] header = new byte[12 + subIdBytes.Length];
                using (MemoryStream ms = new MemoryStream(header))
                using (BinaryWriter bw = new BinaryWriter(ms))
                {
                    bw.Write(new byte[] { 0x43, 0x56, 0x53, 0x55 }); // 'CVSU'
                    WriteUInt32BE(bw, (uint)subIdBytes.Length);
                    WriteUInt32BE(bw, (uint)archive.ZipData.Length);
                    bw.Write(subIdBytes);
                }

                if (_sslStream != null)
                {
                    await _sslStream.WriteAsync(header);
                    await _sslStream.WriteAsync(archive.ZipData);
                    await _sslStream.FlushAsync();
                    Console.WriteLine($"📤 Đã gửi {archive.FileCount} tệp ({archive.ZipData.Length / 1024} KB) lên Gateway. Đang chờ Gateway kiểm tra mã băm SHA-256...");

                    // Chờ phản hồi COMMIT_ACK từ Gateway tối đa 15s
                    using CancellationTokenSource timeoutCts = new CancellationTokenSource(TimeSpan.FromSeconds(15));
                    Task completed = await Task.WhenAny(tcs.Task, Task.Delay(15000, timeoutCts.Token));

                    if (completed == tcs.Task && await tcs.Task)
                    {
                        Console.WriteLine($"✅ [Nộp bài Hoàn tất] Giao dịch [{submissionId}] đã được kiểm tra khớp mã băm SHA-256 và lưu trữ thành công trên máy Thầy!");
                        _pendingSubmissions.TryRemove(submissionId, out _);
                        return;
                    }
                    else
                    {
                        Console.WriteLine($"⚠️ [Thu bài] Gateway chưa xác nhận hoặc hash không khớp (Lần {attempt}/{maxRetries})...");
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ Lỗi thu bài lần {attempt}: {ex.Message}");
            }

            if (attempt < maxRetries)
            {
                await Task.Delay(2000);
            }
        }
        _pendingSubmissions.TryRemove(submissionId, out _);
        Console.WriteLine($"🚨 [Thu bài Thất bại] Không thể hoàn tất giao dịch [{submissionId}] sau {maxRetries} lần thử.");
    }

    private async Task SendJsonMessageAsync(object obj, CancellationToken ct)
    {
        if (_sslStream == null) return;
        string json = JsonSerializer.Serialize(obj);
        byte[] bytes = Encoding.UTF8.GetBytes(json);
        byte[] header = new byte[8];
        header[0] = 0x43; header[1] = 0x56; header[2] = 0x41; header[3] = 0x4C; // 'CVAL'
        header[4] = (byte)((bytes.Length >> 24) & 0xFF);
        header[5] = (byte)((bytes.Length >> 16) & 0xFF);
        header[6] = (byte)((bytes.Length >> 8) & 0xFF);
        header[7] = (byte)(bytes.Length & 0xFF);

        await _sslStream.WriteAsync(header, ct);
        await _sslStream.WriteAsync(bytes, ct);
        await _sslStream.FlushAsync(ct);
    }

    private static void WriteUInt16BE(BinaryWriter bw, ushort val)
    {
        bw.Write((byte)((val >> 8) & 0xFF));
        bw.Write((byte)(val & 0xFF));
    }

    private static void WriteUInt32BE(BinaryWriter bw, uint val)
    {
        bw.Write((byte)((val >> 24) & 0xFF));
        bw.Write((byte)((val >> 16) & 0xFF));
        bw.Write((byte)((val >> 8) & 0xFF));
        bw.Write((byte)(val & 0xFF));
    }

    private static void WriteUInt64BE(BinaryWriter bw, ulong val)
    {
        for (int i = 7; i >= 0; i--)
        {
            bw.Write((byte)((val >> (i * 8)) & 0xFF));
        }
    }

    private static async Task ExecuteAutoUpdateAsync(string downloadUrl, string expectedSha256)
    {
        try
        {
            Console.WriteLine($"[OTA Update] Bắt đầu tải bản cập nhật từ: {downloadUrl}");
            string tempZip = Path.Combine(Path.GetTempPath(), "cvalms_patch.zip");
            string extractDir = Path.Combine(Path.GetTempPath(), "cvalms_patch_extracted");

            using (var http = new HttpClient { Timeout = TimeSpan.FromMinutes(5) })
            {
                byte[] data = await http.GetByteArrayAsync(downloadUrl);
                await File.WriteAllBytesAsync(tempZip, data);

                if (!string.IsNullOrEmpty(expectedSha256))
                {
                    using var sha = System.Security.Cryptography.SHA256.Create();
                    byte[] hash = sha.ComputeHash(data);
                    string actualHash = BitConverter.ToString(hash).Replace("-", "").ToLowerInvariant();
                    if (!string.Equals(actualHash, expectedSha256.ToLowerInvariant(), StringComparison.OrdinalIgnoreCase))
                    {
                        Console.WriteLine($"[OTA Update Error]: Sai mã băm SHA-256! Kỳ vọng: {expectedSha256}, Thực tế: {actualHash}");
                        return;
                    }
                }
            }

            if (Directory.Exists(extractDir)) Directory.Delete(extractDir, true);
            System.IO.Compression.ZipFile.ExtractToDirectory(tempZip, extractDir);

            string appDir = AppDomain.CurrentDomain.BaseDirectory.TrimEnd('\\', '/');
            string updaterExe = Path.Combine(appDir, "CvaLms.Updater.exe");
            if (!File.Exists(updaterExe))
            {
                updaterExe = Path.Combine(extractDir, "CvaLms.Updater.exe");
            }

            if (File.Exists(updaterExe))
            {
                int pid = Environment.ProcessId;
                var psi = new ProcessStartInfo
                {
                    FileName = updaterExe,
                    Arguments = $"--pid {pid} --source \"{extractDir}\" --target \"{appDir}\" --restart \"CvaLmsAgent.exe\"",
                    UseShellExecute = true
                };
                Process.Start(psi);
                Environment.Exit(0);
            }
            else
            {
                Console.WriteLine("[OTA Update Error]: Không tìm thấy CvaLms.Updater.exe để thực thi cập nhật.");
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[OTA Update Error]: {ex.Message}");
        }
    }
}
