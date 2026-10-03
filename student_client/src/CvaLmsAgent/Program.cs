namespace CvaLmsAgent;

public class Program
{
    private const string SINGLE_INSTANCE_MUTEX_NAME = @"Global\CvaLmsAgent_SingleInstance_Mutex";

    public static async Task Main(string[] args)
    {
        Console.OutputEncoding = System.Text.Encoding.UTF8;

        // Chốt chặn Kiểm soát Tiến trình Đơn nhất (Single-Instance Enforcement)
        using System.Threading.Mutex singleMutex = new System.Threading.Mutex(true, SINGLE_INSTANCE_MUTEX_NAME, out bool isOnlyInstance);
        if (!isOnlyInstance)
        {
            Console.ForegroundColor = ConsoleColor.Yellow;
            Console.WriteLine("⚠️ Một phiên bản CvaLmsAgent khác đang hoạt động trên máy này.");
            Console.WriteLine("👉 Đang dừng phiên làm việc mới để chống xung đột tài nguyên mạng, socket và hook bàn phím.");
            Console.ResetColor();
            return;
        }

        Console.WriteLine("═══════════════════════════════════════════════════════════════");
        Console.WriteLine("💻  CVALMS STUDENT AGENT (v3.5.0 ENTERPRISE SPECIFICATION)");
        Console.WriteLine("    Mô hình Hybrid Giám Sát & Điều Khiển Phòng Máy THCS");
        Console.WriteLine("═══════════════════════════════════════════════════════════════");

        string machineId = "MAY-01";
        string gatewayHost = "127.0.0.1";
        int gatewayPort = 49152;
        string? pfxPath = null;

        // 1. Tự động nạp từ config.json nếu có trong thư mục exe
        try
        {
            string configPath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "config.json");
            if (File.Exists(configPath))
            {
                using System.Text.Json.JsonDocument doc = System.Text.Json.JsonDocument.Parse(File.ReadAllText(configPath));
                System.Text.Json.JsonElement root = doc.RootElement;
                if (root.TryGetProperty("machineId", out System.Text.Json.JsonElement m)) machineId = m.GetString() ?? machineId;
                if (root.TryGetProperty("gatewayHost", out System.Text.Json.JsonElement g)) gatewayHost = g.GetString() ?? gatewayHost;
                if (root.TryGetProperty("gatewayPort", out System.Text.Json.JsonElement gp) && gp.TryGetInt32(out int p)) gatewayPort = p;
                if (root.TryGetProperty("certPath", out System.Text.Json.JsonElement cp)) pfxPath = cp.GetString() ?? pfxPath;
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[Config Read Error]: {ex.Message}");
        }

        // Bắt buộc thực thi kiểm tra Bản Quyền RSA-4096 (Hard License Enforcement)
        string licensePath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "license.cva");
        if (!File.Exists(licensePath))
        {
            licensePath = Path.Combine(Directory.GetCurrentDirectory(), "license.cva");
        }

        string licErr = "Không tìm thấy file bản quyền license.cva trong thư mục cài đặt!";
        LicensePayload? licPayload = null;
        bool isLicensed = File.Exists(licensePath) && LicenseManager.VerifyLicense(licensePath, out licPayload, out licErr);

        if (!isLicensed)
        {
            Console.ForegroundColor = ConsoleColor.Red;
            Console.WriteLine("\n═══════════════════════════════════════════════════════════════");
            Console.WriteLine("⛔ LỖI BẢN QUYỀN: PHẦN MỀM CHƯA ĐƯỢC CẤP PHÉP HOẶC KHÔNG HỢP LỆ!");
            Console.WriteLine($"👉 Chi tiết lỗi: {licErr}");
            Console.WriteLine($"👉 Mã phần cứng máy này (Hardware ID): {LicenseManager.ComputeHardwareId()}");
            Console.WriteLine("👉 Vui lòng liên hệ Tác giả Thầy Hà Văn Tý (Sở GD&ĐT Quảng Ngãi) để nhận file license.cva!");
            Console.WriteLine("═══════════════════════════════════════════════════════════════\n");
            Console.ResetColor();
            return;
        }

        Console.ForegroundColor = ConsoleColor.Green;
        Console.WriteLine($"🔑 [BẢN QUYỀN HỢP LỆ]: Cấp cho {licPayload?.CustomerSchool} ({licPayload?.AllowedMachines} máy) - Hạn dùng: {licPayload?.ExpiresAt:dd/MM/yyyy}");
        Console.ResetColor();

        // Tự động kiểm tra và khóa cứng hình nền chuẩn phòng máy CVALMS
        WallpaperManager.EnsureLockedWallpaper();

        // 2. Parse CLI options (ghi đè nếu có)
        for (int i = 0; i < args.Length; i++)
        {
            if (args[i] == "--machine" && i + 1 < args.Length)
            {
                machineId = args[++i];
            }
            else if (args[i] == "--gateway" && i + 1 < args.Length)
            {
                gatewayHost = args[++i];
            }
            else if (args[i] == "--port" && i + 1 < args.Length && int.TryParse(args[++i], out int p))
            {
                gatewayPort = p;
            }
            else if (args[i] == "--cert" && i + 1 < args.Length)
            {
                pfxPath = args[++i];
            }
        }

        // Tự động tìm kiếm chứng chỉ agent.pfx đa tầng
        if (string.IsNullOrEmpty(pfxPath))
        {
            string baseDir = AppDomain.CurrentDomain.BaseDirectory;
            List<string> candidates = new List<string>
            {
                Path.Combine(baseDir, "certs", "agent.pfx"),
                Path.Combine(baseDir, "agent.pfx"),
                Path.Combine(baseDir, "gateway", "certs", "agent.pfx"),
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "CVALMS-Agent", "certs", "agent.pfx"),
                @"C:\CVALMS-Agent\certs\agent.pfx"
            };

            foreach (string c in candidates)
            {
                if (File.Exists(c))
                {
                    pfxPath = Path.GetFullPath(c);
                    break;
                }
            }

            // Nếu vẫn chưa thấy, quét ngược lên các thư mục cha
            if (string.IsNullOrEmpty(pfxPath))
            {
                string dir = baseDir;
                for (int depth = 0; depth < 8; depth++)
                {
                    string c1 = Path.Combine(dir, "certs", "agent.pfx");
                    string c2 = Path.Combine(dir, "gateway", "certs", "agent.pfx");
                    if (File.Exists(c1)) { pfxPath = Path.GetFullPath(c1); break; }
                    if (File.Exists(c2)) { pfxPath = Path.GetFullPath(c2); break; }
                    DirectoryInfo? parent = Directory.GetParent(dir);
                    if (parent == null) break;
                    dir = parent.FullName;
                }
            }
        }

        Console.WriteLine($"📍 Mã máy định danh: {machineId}");
        Console.WriteLine($"🌐 Cổng kết nối Gateway: {gatewayHost}:{gatewayPort}");
        Console.WriteLine($"🔒 Đường dẫn chứng chỉ: {pfxPath ?? "⚠️ KHÔNG TÌM THẤY CHỨNG CHỈ"}");

        if (string.IsNullOrEmpty(pfxPath) || !File.Exists(pfxPath))
        {
            Console.ForegroundColor = ConsoleColor.Red;
            Console.WriteLine("\n❌ LỖI: Không tìm thấy chứng chỉ bảo mật mTLS 'agent.pfx'!");
            Console.WriteLine("👉 Hãy chắc chắn thư mục 'certs' nằm ngay cạnh file CvaLmsAgent.exe");
            Console.WriteLine("👉 Hoặc click đúp file 'install_agent.bat' để hệ thống tự cài đặt chuẩn!");
            Console.ResetColor();
            Console.WriteLine("\nNhấn phím bất kỳ để thoát...");
            Console.ReadKey();
            return;
        }
        Console.WriteLine("───────────────────────────────────────────────────────────────");

        using CancellationTokenSource cts = new CancellationTokenSource();
        Console.CancelKeyPress += (s, e) =>
        {
            e.Cancel = true;
            cts.Cancel();
            ClassroomFocusLockManager.Unlock();
            Console.WriteLine("\n🛑 Đang dừng Agent...");
        };

        AgentTlsClient client = new AgentTlsClient(gatewayHost, gatewayPort, machineId, pfxPath);
        await client.StartAsync(cts.Token);
    }
}
