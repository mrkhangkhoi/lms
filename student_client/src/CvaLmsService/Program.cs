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
                    // Chặn Internet toàn bộ (chỉ chừa mạng nội bộ LAN / Gateway)
                    RunCommand("netsh", "advfirewall firewall delete rule name=\"CVALMS_BLOCK_WAN\"");
                    // Block tất cả Outbound port 80, 443 ngoại trừ subnet LAN nếu có chỉ định
                    RunCommand("netsh", "advfirewall firewall add rule name=\"CVALMS_BLOCK_WAN\" dir=out action=block protocol=TCP remoteport=80,443,8080,8443");
                    return "OK:FIREWALL_BLOCKED";

                case "FIREWALL_UNBLOCK":
                    RunCommand("netsh", "advfirewall firewall delete rule name=\"CVALMS_BLOCK_WAN\"");
                    return "OK:FIREWALL_UNBLOCKED";

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
            using var key = Registry.CurrentUser.CreateSubKey(@"Software\Microsoft\Windows\CurrentVersion\Policies\System", true);
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
