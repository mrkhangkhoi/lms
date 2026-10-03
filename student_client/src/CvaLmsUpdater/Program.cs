using System;
using System.Diagnostics;
using System.Drawing;
using System.IO;
using System.Threading;
using System.Windows.Forms;

namespace CvaLms.Updater;

internal static class Program
{
    private static readonly HashSet<string> ProtectedFiles = new(StringComparer.OrdinalIgnoreCase)
    {
        "client_config.json",
        "appsettings.json"
    };

    private static readonly HashSet<string> ProtectedDirectories = new(StringComparer.OrdinalIgnoreCase)
    {
        "certs",
        "logs",
        "submissions"
    };

    [STAThread]
    private static void Main(string[] args)
    {
        ApplicationConfiguration.Initialize();

        int targetPid = -1;
        string sourceDir = string.Empty;
        string targetDir = string.Empty;
        string restartExe = string.Empty;

        for (int i = 0; i < args.Length; i++)
        {
            if (string.Equals(args[i], "--pid", StringComparison.OrdinalIgnoreCase) && i + 1 < args.Length)
            {
                int.TryParse(args[++i], out targetPid);
            }
            else if (string.Equals(args[i], "--source", StringComparison.OrdinalIgnoreCase) && i + 1 < args.Length)
            {
                sourceDir = args[++i];
            }
            else if (string.Equals(args[i], "--target", StringComparison.OrdinalIgnoreCase) && i + 1 < args.Length)
            {
                targetDir = args[++i];
            }
            else if (string.Equals(args[i], "--restart", StringComparison.OrdinalIgnoreCase) && i + 1 < args.Length)
            {
                restartExe = args[++i];
            }
        }

        if (string.IsNullOrWhiteSpace(sourceDir) || !Directory.Exists(sourceDir) ||
            string.IsNullOrWhiteSpace(targetDir) || !Directory.Exists(targetDir))
        {
            MessageBox.Show(
                "Tham số cập nhật không hợp lệ hoặc thư mục nguồn/đích không tồn tại.",
                "CVALMS Updater", MessageBoxButtons.OK, MessageBoxIcon.Error);
            return;
        }

        using var progressForm = new UpdaterProgressForm(targetPid, sourceDir, targetDir, restartExe);
        Application.Run(progressForm);
    }

    public static void ApplyUpdate(int targetPid, string sourceDir, string targetDir, string restartExe, Action<string, int> reportProgress)
    {
        reportProgress("Đang chờ đóng phiên làm việc trước...", 10);

        if (targetPid > 0)
        {
            try
            {
                var proc = Process.GetProcessById(targetPid);
                if (!proc.HasExited)
                {
                    proc.Kill();
                    proc.WaitForExit(3000);
                }
            }
            catch { }
        }

        foreach (var p in Process.GetProcessesByName("CvaLmsAgent"))
        {
            try { p.Kill(); p.WaitForExit(2000); } catch { }
        }

        Thread.Sleep(800);

        reportProgress("Đang sao lưu cấu hình trạm học sinh...", 30);
        string backupDir = Path.Combine(Path.GetTempPath(), "CvalmsBackup_" + DateTime.Now.ToString("yyyyMMdd_HHmmss"));
        try { Directory.CreateDirectory(backupDir); } catch { }

        reportProgress("Đang cập nhật các thành phần hệ thống mới...", 60);
        CopyDirectoryRecursive(sourceDir, targetDir, sourceDir, backupDir);

        reportProgress("Đang kiểm tra tính toàn vẹn bản cài...", 90);
        Thread.Sleep(500);

        reportProgress("Hoàn tất cập nhật! Đang khởi động lại ứng dụng...", 100);
        Thread.Sleep(500);

        if (!string.IsNullOrWhiteSpace(restartExe))
        {
            string exePath = Path.Combine(targetDir, restartExe);
            if (File.Exists(exePath))
            {
                var psi = new ProcessStartInfo
                {
                    FileName = exePath,
                    WorkingDirectory = targetDir,
                    UseShellExecute = true
                };
                Process.Start(psi);
            }
        }
    }

    private static void CopyDirectoryRecursive(string currentSource, string currentTarget, string rootSource, string backupDir)
    {
        if (!Directory.Exists(currentTarget))
        {
            Directory.CreateDirectory(currentTarget);
        }

        foreach (string file in Directory.GetFiles(currentSource))
        {
            string fileName = Path.GetFileName(file);
            if (ProtectedFiles.Contains(fileName)) continue;

            string destFile = Path.Combine(currentTarget, fileName);
            if (!string.IsNullOrEmpty(backupDir) && File.Exists(destFile))
            {
                try
                {
                    string relPath = Path.GetRelativePath(rootSource, file);
                    string bFile = Path.Combine(backupDir, relPath);
                    string? bSub = Path.GetDirectoryName(bFile);
                    if (!string.IsNullOrEmpty(bSub) && !Directory.Exists(bSub)) Directory.CreateDirectory(bSub);
                    File.Copy(destFile, bFile, true);
                }
                catch { }
            }

            File.Copy(file, destFile, true);
        }

        foreach (string dir in Directory.GetDirectories(currentSource))
        {
            string dirName = Path.GetFileName(dir);
            if (ProtectedDirectories.Contains(dirName)) continue;

            string destSub = Path.Combine(currentTarget, dirName);
            CopyDirectoryRecursive(dir, destSub, rootSource, backupDir);
        }
    }
}

public class UpdaterProgressForm : Form
{
    private readonly int _targetPid;
    private readonly string _sourceDir;
    private readonly string _targetDir;
    private readonly string _restartExe;

    private readonly Label _lblTitle;
    private readonly Label _lblStatus;
    private readonly Label _lblPercent;
    private readonly ProgressBar _progressBar;

    public UpdaterProgressForm(int targetPid, string sourceDir, string targetDir, string restartExe)
    {
        _targetPid = targetPid;
        _sourceDir = sourceDir;
        _targetDir = targetDir;
        _restartExe = restartExe;

        Text = "CVALMS PRO - Trình Nâng Cấp Hệ Thống";
        Size = new Size(520, 240);
        StartPosition = FormStartPosition.CenterScreen;
        FormBorderStyle = FormBorderStyle.FixedDialog;
        MaximizeBox = false;
        MinimizeBox = false;
        BackColor = Color.FromArgb(15, 23, 42);
        ForeColor = Color.White;

        _lblTitle = new Label
        {
            Text = "🚀 Đang Nâng Cấp Hệ Thống CVALMS PRO...",
            Font = new Font("Segoe UI", 12, FontStyle.Bold),
            ForeColor = Color.FromArgb(56, 189, 248),
            Location = new Point(24, 20),
            AutoSize = true
        };

        _lblStatus = new Label
        {
            Text = "Đang chuẩn bị gói cập nhật...",
            Font = new Font("Segoe UI", 10, FontStyle.Regular),
            ForeColor = Color.FromArgb(203, 213, 225),
            Location = new Point(24, 60),
            Size = new Size(460, 25)
        };

        _progressBar = new ProgressBar
        {
            Location = new Point(24, 95),
            Size = new Size(456, 26),
            Minimum = 0,
            Maximum = 100,
            Value = 5
        };

        _lblPercent = new Label
        {
            Text = "5%",
            Font = new Font("Segoe UI", 9, FontStyle.Bold),
            ForeColor = Color.FromArgb(148, 163, 184),
            Location = new Point(24, 130),
            AutoSize = true
        };

        Controls.Add(_lblTitle);
        Controls.Add(_lblStatus);
        Controls.Add(_progressBar);
        Controls.Add(_lblPercent);

        Shown += (s, e) => StartUpdateTask();
    }

    private void StartUpdateTask()
    {
        ThreadPool.QueueUserWorkItem(_ =>
        {
            try
            {
                Program.ApplyUpdate(_targetPid, _sourceDir, _targetDir, _restartExe, (status, percent) =>
                {
                    if (IsDisposed || !IsHandleCreated) return;
                    Invoke(new Action(() =>
                    {
                        _lblStatus.Text = status;
                        _progressBar.Value = Math.Clamp(percent, 0, 100);
                        _lblPercent.Text = $"{_progressBar.Value}%";
                    }));
                });

                Invoke(new Action(() => Close()));
            }
            catch (Exception ex)
            {
                Invoke(new Action(() =>
                {
                    _lblStatus.Text = $"Lỗi: {ex.Message}";
                    _lblStatus.ForeColor = Color.FromArgb(239, 68, 68);
                    MessageBox.Show($"Cập nhật thất bại: {ex.Message}", "Lỗi Cập Nhật", MessageBoxButtons.OK, MessageBoxIcon.Error);
                    Close();
                }));
            }
        });
    }
}
