using System.Diagnostics;
using System.IO.Pipes;
using System.Security.AccessControl;
using System.Security.Principal;
using System.Text;
using Microsoft.Win32;

namespace CvaLmsService;

public class Program
{
    public static void Main(string[] args)
    {
        var builder = Host.CreateApplicationBuilder(args);
        builder.Services.AddWindowsService(options =>
        {
            options.ServiceName = "CvaLmsService";
        });
        builder.Services.AddHostedService<Worker>();

        var host = builder.Build();
        host.Run();
    }
}

public class Worker : BackgroundService
{
    private readonly ILogger<Worker> _logger;

    public Worker(ILogger<Worker> logger)
    {
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("CvaLmsService (SYSTEM privileged worker) started.");

        // Khởi động Pipe Server lắng nghe lệnh đặc quyền từ CvaLmsAgent
        _ = Task.Run(() => RunPipeServerAsync(stoppingToken), stoppingToken);

        // Vòng lặp Watchdog giám sát tiến trình Agent
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                CheckAndEnforceAgentIntegrity();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in Watchdog loop");
            }

            await Task.Delay(10000, stoppingToken);
        }
    }

    private async Task RunPipeServerAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                var pipeSecurity = new PipeSecurity();
                pipeSecurity.AddAccessRule(new PipeAccessRule(
                    new SecurityIdentifier(WellKnownSidType.WorldSid, null),
                    PipeAccessRights.ReadWrite,
                    AccessControlType.Allow));

                using var server = NamedPipeServerStreamAcl.Create(
                    "CvaLmsAdminPipe",
                    PipeDirection.InOut,
                    NamedPipeServerStream.MaxAllowedServerInstances,
                    PipeTransmissionMode.Byte,
                    PipeOptions.Asynchronous,
                    1024,
                    1024,
                    pipeSecurity);

                await server.WaitForConnectionAsync(stoppingToken);

                using var reader = new StreamReader(server, Encoding.UTF8);
                using var writer = new StreamWriter(server, Encoding.UTF8) { AutoFlush = true };

                string? line = await reader.ReadLineAsync(stoppingToken);
                if (!string.IsNullOrEmpty(line))
                {
                    _logger.LogInformation("Received privileged command: {Command}", line);
                    string response = ExecutePrivilegedCommand(line.Trim());
                    await writer.WriteLineAsync(response);
                }
            }
            catch (OperationCanceledException)
            {
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Pipe error");
                await Task.Delay(1000, stoppingToken);
            }
        }
    }

    private string ExecutePrivilegedCommand(string cmd)
    {
        try
        {
            var parts = cmd.Split(':', 2);
            string action = parts[0].ToUpperInvariant();
            string arg = parts.Length > 1 ? parts[1] : string.Empty;

            switch (action)
            {
                case "FIREWALL_BLOCK":
                    RemoveFirewallRules();
                    // 1. Cho phép LAN nội bộ và Cổng Gateway giáo viên
                    RunCommand("netsh", "advfirewall firewall add rule name=\"CVALMS_ALLOW_LAN\" dir=out action=allow remoteip=localsubnet");
                    RunCommand("netsh", "advfirewall firewall add rule name=\"CVALMS_ALLOW_GATEWAY\" dir=out action=allow protocol=TCP remoteip=localsubnet remoteport=49150,49152");
                    // 2. Chặn lưu lượng Web ngoại mạng TCP
                    RunCommand("netsh", "advfirewall firewall add rule name=\"CVALMS_BLOCK_WEB\" dir=out action=block protocol=TCP remoteport=80,443,8000,8080,8443,8888");
                    // 3. Chặn DNS ngoại mạng (UDP/TCP 53, DoT 853)
                    RunCommand("netsh", "advfirewall firewall add rule name=\"CVALMS_BLOCK_DNS\" dir=out action=block protocol=UDP remoteport=53,853");
                    RunCommand("netsh", "advfirewall firewall add rule name=\"CVALMS_BLOCK_DNS_TCP\" dir=out action=block protocol=TCP remoteport=53,853");
                    // 4. Chặn UDP QUIC và VPN (UDP 443, WireGuard 51820, OpenVPN 1194, IPSec)
                    RunCommand("netsh", "advfirewall firewall add rule name=\"CVALMS_BLOCK_VPN\" dir=out action=block protocol=UDP remoteport=443,1194,500,4500,51820");
                    // 5. Chặn toàn bộ IPv6 ra ngoài
                    RunCommand("netsh", "advfirewall firewall add rule name=\"CVALMS_BLOCK_IPV6\" dir=out action=block remoteip=::/0");
                    return "OK:FIREWALL_BLOCKED";

                case "FIREWALL_UNBLOCK":
                    RemoveFirewallRules();
                    return "OK:FIREWALL_UNBLOCKED";

                case "EXECUTE_UPDATE":
                    var uParts = arg.Split('|');
                    if (uParts.Length >= 3)
                    {
                        string extractDir = uParts[0];
                        string targetDir = uParts[1];
                        string pid = uParts[2];
                        string updaterExe = Path.Combine(targetDir, "CvaLms.Updater.exe");
                        if (!File.Exists(updaterExe))
                        {
                            updaterExe = Path.Combine(extractDir, "CvaLms.Updater.exe");
                        }
                        if (File.Exists(updaterExe))
                        {
                            var psi = new ProcessStartInfo
                            {
                                FileName = updaterExe,
                                Arguments = $"--pid {pid} --source \"{extractDir}\" --target \"{targetDir}\" --restart \"CvaLmsAgent.exe\"",
                                UseShellExecute = false,
                                CreateNoWindow = true
                            };
                            Process.Start(psi);
                            return "OK:UPDATE_STARTED";
                        }
                        return "ERR:UPDATER_NOT_FOUND";
                    }
                    return "ERR:INVALID_ARGS";

                case "TASKMGR_LOCK":
                    SetTaskMgrPolicy(true);
                    return "OK:TASKMGR_LOCKED";

                case "TASKMGR_UNLOCK":
                    SetTaskMgrPolicy(false);
                    return "OK:TASKMGR_UNLOCKED";

                case "POWER_SHUTDOWN":
                    RunCommand("shutdown.exe", "/s /f /t 0");
                    return "OK:SHUTDOWN_TRIGGERED";

                case "POWER_RESTART":
                    RunCommand("shutdown.exe", "/r /f /t 0");
                    return "OK:RESTART_TRIGGERED";

                case "PING":
                    return "OK:PONG";

                default:
                    return "ERR:UNKNOWN_COMMAND";
            }
        }
        catch (Exception ex)
        {
            return $"ERR:{ex.Message}";
        }
    }

    private void SetTaskMgrPolicy(bool disable)
    {
        try
        {
            // Ghi vào LocalMachine để áp dụng toàn hệ thống cho mọi phiên người dùng
            using var key = Registry.LocalMachine.CreateSubKey(@"Software\Microsoft\Windows\CurrentVersion\Policies\System", true);
            if (key != null)
            {
                if (disable)
                {
                    key.SetValue("DisableTaskMgr", 1, RegistryValueKind.DWord);
                }
                else
                {
                    key.DeleteValue("DisableTaskMgr", false);
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Could not set TaskMgr registry policy");
        }
    }

    private void CheckAndEnforceAgentIntegrity()
    {
        // Kiểm tra xem CvaLmsAgent có đang chạy không
        var processes = Process.GetProcessesByName("CvaLmsAgent");
        if (processes.Length == 0)
        {
            _logger.LogWarning("Watchdog: CvaLmsAgent is not running.");
        }
    }

    private static void RemoveFirewallRules()
    {
        RunCommand("netsh", "advfirewall firewall delete rule name=\"CVALMS_BLOCK_WAN\"");
        RunCommand("netsh", "advfirewall firewall delete rule name=\"CVALMS_BLOCK_WEB\"");
        RunCommand("netsh", "advfirewall firewall delete rule name=\"CVALMS_BLOCK_DNS\"");
        RunCommand("netsh", "advfirewall firewall delete rule name=\"CVALMS_BLOCK_DNS_TCP\"");
        RunCommand("netsh", "advfirewall firewall delete rule name=\"CVALMS_BLOCK_VPN\"");
        RunCommand("netsh", "advfirewall firewall delete rule name=\"CVALMS_BLOCK_IPV6\"");
        RunCommand("netsh", "advfirewall firewall delete rule name=\"CVALMS_ALLOW_LAN\"");
        RunCommand("netsh", "advfirewall firewall delete rule name=\"CVALMS_ALLOW_GATEWAY\"");
    }

    private static void RunCommand(string fileName, string args)
    {
        var psi = new ProcessStartInfo
        {
            FileName = fileName,
            Arguments = args,
            CreateNoWindow = true,
            UseShellExecute = false
        };
        using var proc = Process.Start(psi);
        proc?.WaitForExit(5000);
    }
}
