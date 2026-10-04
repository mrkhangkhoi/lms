using System.Diagnostics;
using System.Drawing;
using System.Runtime.InteropServices;
using System.Security.Cryptography;
using System.Text;
using System.Windows.Forms;

namespace CvaLmsAgent;

public class ClassroomFocusLockManager
{
    [DllImport("user32.dll", SetLastError = true)]
    private static extern IntPtr SetWindowsHookEx(int idHook, LowLevelKeyboardProc lpfn, IntPtr hMod, uint dwThreadId);

    [DllImport("user32.dll", SetLastError = true)]
    [return: MarshalAs(UnmanagedType.Bool)]
    private static extern bool UnhookWindowsHookEx(IntPtr hhk);

    [DllImport("user32.dll")]
    private static extern IntPtr CallNextHookEx(IntPtr hhk, int nCode, IntPtr wParam, IntPtr lParam);

    [DllImport("kernel32.dll", CharSet = CharSet.Auto, SetLastError = true)]
    private static extern IntPtr GetModuleHandle(string lpModuleName);

    [StructLayout(LayoutKind.Sequential)]
    public struct RECT
    {
        public int Left;
        public int Top;
        public int Right;
        public int Bottom;
    }

    [DllImport("user32.dll")]
    private static extern bool ClipCursor(ref RECT lpRect);

    [DllImport("user32.dll")]
    private static extern bool ClipCursor(IntPtr lpRect);

    private delegate IntPtr LowLevelKeyboardProc(int nCode, IntPtr wParam, IntPtr lParam);

    private const int WH_KEYBOARD_LL = 13;
    private const int WM_KEYDOWN = 0x0100;
    private const int WM_SYSKEYDOWN = 0x0104;

    private static IntPtr _hookId = IntPtr.Zero;
    private static LowLevelKeyboardProc? _proc;
    private static readonly List<Form> _activeForms = new();
    private static readonly object _lock = new();

    public static bool IsLocked => _activeForms.Count > 0 && _activeForms.Any(f => !f.IsDisposed);

    public static void Lock(string message)
    {
        lock (_lock)
        {
            if (IsLocked)
            {
                foreach (var form in _activeForms)
                {
                    if (form is FocusLockOverlayForm primaryForm && !primaryForm.IsDisposed)
                    {
                        primaryForm.UpdateMessage(message);
                    }
                }
                return;
            }

            // Cài đặt Keyboard Hook chặn phím hệ thống
            _proc = HookCallback;
            using var curProcess = Process.GetCurrentProcess();
            using var curModule = curProcess.MainModule;
            _hookId = SetWindowsHookEx(WH_KEYBOARD_LL, _proc, GetModuleHandle(curModule?.ModuleName ?? "CvaLmsAgent"), 0);

            // Mở Form Overlay trên UI Thread che phủ TẤT CẢ các màn hình (Multi-Monitor)
            var thread = new Thread(() =>
            {
                var screens = Screen.AllScreens;
                FocusLockOverlayForm? primaryOverlay = null;

                foreach (var scr in screens)
                {
                    if (scr.Primary)
                    {
                        primaryOverlay = new FocusLockOverlayForm(message, OnEmergencyUnlocked, scr);
                        lock (_lock)
                        {
                            _activeForms.Add(primaryOverlay);
                        }

                        // Giới hạn chuột trong màn hình khóa chính
                        var b = scr.Bounds;
                        RECT r = new RECT { Left = b.Left, Top = b.Top, Right = b.Right, Bottom = b.Bottom };
                        ClipCursor(ref r);
                    }
                    else
                    {
                        var secondaryOverlay = new FocusLockSecondaryForm(scr);
                        lock (_lock)
                        {
                            _activeForms.Add(secondaryOverlay);
                        }
                        secondaryOverlay.Show();
                    }
                }

                if (primaryOverlay != null)
                {
                    Application.Run(primaryOverlay);
                }
            });
            thread.SetApartmentState(ApartmentState.STA);
            thread.IsBackground = true;
            thread.Start();
        }
    }

    public static void Unlock()
    {
        lock (_lock)
        {
            if (_hookId != IntPtr.Zero)
            {
                UnhookWindowsHookEx(_hookId);
                _hookId = IntPtr.Zero;
            }

            // Giải phóng giới hạn chuột
            try
            {
                ClipCursor(IntPtr.Zero);
            }
            catch
            {
            }

            foreach (var form in _activeForms)
            {
                if (form != null && !form.IsDisposed)
                {
                    try
                    {
                        if (form.IsHandleCreated)
                        {
                            form.Invoke(new Action(() => form.Close()));
                        }
                        else
                        {
                            form.Close();
                        }
                    }
                    catch
                    {
                    }
                }
            }
            _activeForms.Clear();
        }
    }

    private static void OnEmergencyUnlocked()
    {
        Unlock();
    }

    private static IntPtr HookCallback(int nCode, IntPtr wParam, IntPtr lParam)
    {
        if (nCode >= 0 && (wParam == (IntPtr)WM_KEYDOWN || wParam == (IntPtr)WM_SYSKEYDOWN))
        {
            int vkCode = Marshal.ReadInt32(lParam);
            var key = (Keys)vkCode;

            // Chặn phím Windows trái/phải và Context Menu
            if (key == Keys.LWin || key == Keys.RWin || key == Keys.Apps)
                return (IntPtr)1;

            bool isAlt = (Control.ModifierKeys & Keys.Alt) != 0;
            bool isCtrl = (Control.ModifierKeys & Keys.Control) != 0;
            bool isShift = (Control.ModifierKeys & Keys.Shift) != 0;

            // Chặn Alt + Tab, Alt + F4, Alt + Escape
            if (isAlt && (key == Keys.Tab || key == Keys.F4 || key == Keys.Escape))
                return (IntPtr)1;

            // Chặn Ctrl + Escape và ĐẶC BIỆT CHẶN Ctrl + Shift + Escape (Task Manager)
            if (isCtrl && key == Keys.Escape)
                return (IntPtr)1;
            if (isCtrl && isShift && key == Keys.Escape)
                return (IntPtr)1;
        }

        return CallNextHookEx(_hookId, nCode, wParam, lParam);
    }
}

public class FocusLockOverlayForm : Form
{
    private readonly Action _onUnlocked;
    private readonly Label _lblTitle;
    private readonly Label _lblMessage;
    private readonly TextBox _txtPasscode;
    private readonly Button _btnUnlock;
    private readonly Label _lblStatus;
    private int _failedAttempts = 0;
    private DateTime _lockoutUntil = DateTime.MinValue;

    public FocusLockOverlayForm(string message, Action onUnlocked, Screen? targetScreen = null)
    {
        _onUnlocked = onUnlocked;

        FormBorderStyle = FormBorderStyle.None;
        StartPosition = FormStartPosition.Manual;
        var bounds = targetScreen?.Bounds ?? Screen.PrimaryScreen?.Bounds ?? new Rectangle(0, 0, 1920, 1080);
        Bounds = bounds;
        TopMost = true;
        BackColor = Color.FromArgb(10, 14, 26);
        ShowInTaskbar = false;
        DoubleBuffered = true;

        var panel = new Panel
        {
            Size = new Size(700, 450),
            BackColor = Color.FromArgb(18, 24, 42),
            BorderStyle = BorderStyle.FixedSingle
        };
        panel.Location = new Point((bounds.Width - panel.Width) / 2, (bounds.Height - panel.Height) / 2);

        _lblTitle = new Label
        {
            Text = "🔒 KHÔNG GIAN HỌC TẬP TẬP TRUNG",
            Font = new Font("Segoe UI", 18, FontStyle.Bold),
            ForeColor = Color.FromArgb(0, 242, 254),
            TextAlign = ContentAlignment.MiddleCenter,
            Dock = DockStyle.Top,
            Height = 60
        };

        _lblMessage = new Label
        {
            Text = message,
            Font = new Font("Segoe UI", 14, FontStyle.Regular),
            ForeColor = Color.FromArgb(226, 232, 240),
            TextAlign = ContentAlignment.MiddleCenter,
            Dock = DockStyle.Top,
            Height = 100
        };

        var lblInstruction = new Label
        {
            Text = "Các em vui lòng chú ý lắng nghe Thầy/Cô hướng dẫn trên bảng chiếu!",
            Font = new Font("Segoe UI", 11, FontStyle.Italic),
            ForeColor = Color.FromArgb(148, 163, 184),
            TextAlign = ContentAlignment.MiddleCenter,
            Dock = DockStyle.Top,
            Height = 40
        };

        var pnlPasscode = new Panel
        {
            Dock = DockStyle.Bottom,
            Height = 140,
            BackColor = Color.Transparent
        };

        var lblPass = new Label
        {
            Text = "Mã khẩn cấp giáo viên (Break-Glass):",
            Font = new Font("Segoe UI", 10, FontStyle.Regular),
            ForeColor = Color.FromArgb(148, 163, 184),
            Location = new Point(150, 15),
            AutoSize = true
        };

        _txtPasscode = new TextBox
        {
            PasswordChar = '●',
            Font = new Font("Segoe UI", 12),
            Width = 220,
            Location = new Point(150, 45),
            BackColor = Color.FromArgb(15, 23, 42),
            ForeColor = Color.White
        };

        _btnUnlock = new Button
        {
            Text = "Mở khóa",
            Font = new Font("Segoe UI", 10, FontStyle.Bold),
            BackColor = Color.FromArgb(14, 165, 233),
            ForeColor = Color.White,
            FlatStyle = FlatStyle.Flat,
            Width = 120,
            Height = 35,
            Location = new Point(390, 43)
        };
        _btnUnlock.Click += (s, e) => TryUnlock();

        _lblStatus = new Label
        {
            Text = "",
            Font = new Font("Segoe UI", 9, FontStyle.Bold),
            ForeColor = Color.FromArgb(239, 68, 68),
            Location = new Point(150, 85),
            AutoSize = true
        };

        pnlPasscode.Controls.Add(lblPass);
        pnlPasscode.Controls.Add(_txtPasscode);
        pnlPasscode.Controls.Add(_btnUnlock);
        pnlPasscode.Controls.Add(_lblStatus);

        panel.Controls.Add(pnlPasscode);
        panel.Controls.Add(lblInstruction);
        panel.Controls.Add(_lblMessage);
        panel.Controls.Add(_lblTitle);

        Controls.Add(panel);
    }

    public void UpdateMessage(string msg)
    {
        if (InvokeRequired)
        {
            Invoke(new Action(() => UpdateMessage(msg)));
            return;
        }
        _lblMessage.Text = msg;
    }

    private void TryUnlock()
    {
        if (DateTime.UtcNow < _lockoutUntil)
        {
            var remaining = (int)(_lockoutUntil - DateTime.UtcNow).TotalSeconds;
            _lblStatus.Text = $"Đã khóa nhập tạm thời! Thử lại sau {remaining} giây.";
            return;
        }

        var pass = _txtPasscode.Text.Trim();
        // Kiểm tra băm SHA-256 (Cấm tuyệt đối hardcode plain-text và pass 123456)
        using var sha = SHA256.Create();
        byte[] hash = sha.ComputeHash(Encoding.UTF8.GetBytes(pass));
        string hex = BitConverter.ToString(hash).Replace("-", "").ToLowerInvariant();

        // SHA-256 của "ThayKhang@2026"
        if (hex == "33c39cf33ac4a48e2fb588c2fbb99092043744f685a6f5c8d91c8f554139604b")
        {
            _onUnlocked();
        }
        else
        {
            _failedAttempts++;
            if (_failedAttempts >= 5)
            {
                _lockoutUntil = DateTime.UtcNow.AddSeconds(60);
                _lblStatus.Text = "Nhập sai quá 5 lần! Khóa chức năng nhập 60 giây.";
            }
            else
            {
                _lblStatus.Text = $"Sai mật mã! ({_failedAttempts}/5 lần)";
            }
            _txtPasscode.Clear();
        }
    }

    protected override void OnDeactivate(EventArgs e)
    {
        base.OnDeactivate(e);
        try
        {
            if (!IsDisposed)
            {
                TopMost = true;
                Activate();
            }
        }
        catch
        {
        }
    }
}

public class FocusLockSecondaryForm : Form
{
    public FocusLockSecondaryForm(Screen screen)
    {
        FormBorderStyle = FormBorderStyle.None;
        StartPosition = FormStartPosition.Manual;
        Bounds = screen.Bounds;
        TopMost = true;
        BackColor = Color.FromArgb(10, 14, 26);
        ShowInTaskbar = false;
        DoubleBuffered = true;

        var lbl = new Label
        {
            Text = "🔒 MÀN HÌNH ĐANG ĐƯỢC GIÁM SÁT & KHÓA TẬP TRUNG",
            Font = new Font("Segoe UI", 16, FontStyle.Bold),
            ForeColor = Color.FromArgb(148, 163, 184),
            TextAlign = ContentAlignment.MiddleCenter,
            Dock = DockStyle.Fill
        };
        Controls.Add(lbl);
    }
}
