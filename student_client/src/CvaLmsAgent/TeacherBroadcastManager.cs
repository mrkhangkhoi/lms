using System.Diagnostics;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.Drawing.Imaging;
using System.Runtime.InteropServices;
using System.Windows.Forms;

namespace CvaLmsAgent;

public class TeacherBroadcastManager
{
    [DllImport("user32.dll", SetLastError = true)]
    private static extern bool BlockInput(bool fBlockIt);

    [DllImport("user32.dll", SetLastError = true)]
    private static extern IntPtr SetWindowsHookEx(int idHook, LowLevelProc lpfn, IntPtr hMod, uint dwThreadId);

    [DllImport("user32.dll", SetLastError = true)]
    [return: MarshalAs(UnmanagedType.Bool)]
    private static extern bool UnhookWindowsHookEx(IntPtr hhk);

    [DllImport("user32.dll")]
    private static extern IntPtr CallNextHookEx(IntPtr hhk, int nCode, IntPtr wParam, IntPtr lParam);

    [DllImport("kernel32.dll", CharSet = CharSet.Auto, SetLastError = true)]
    private static extern IntPtr GetModuleHandle(string lpModuleName);

    private delegate IntPtr LowLevelProc(int nCode, IntPtr wParam, IntPtr lParam);

    private const int WH_KEYBOARD_LL = 13;
    private const int WH_MOUSE_LL = 14;

    private static IntPtr _keyboardHookId = IntPtr.Zero;
    private static IntPtr _mouseHookId = IntPtr.Zero;
    private static LowLevelProc? _keyboardProc;
    private static LowLevelProc? _mouseProc;
    private static BroadcastViewerForm? _activeViewerForm;
    private static readonly object _lock = new();
    private static volatile bool _isBroadcasting = false;
    private static long _lastFrameTicks = 0;
    private static System.Threading.Timer? _watchdogTimer;
    private static bool _failSafeInitialized = false;

    public static bool IsBroadcasting => _isBroadcasting;

    private static void EnsureFailSafeRegistered()
    {
        if (_failSafeInitialized) return;
        _failSafeInitialized = true;

        // Bắt buộc đăng ký giải phóng chuột/phím khi tiến trình tắt hoặc gặp sự cố bất ngờ
        AppDomain.CurrentDomain.ProcessExit += (s, e) => ForceEmergencyUnlock();
        AppDomain.CurrentDomain.UnhandledException += (s, e) => ForceEmergencyUnlock();

        // Khởi tạo Watchdog định kỳ 3 giây kiểm tra tín hiệu từ Gateway
        _watchdogTimer = new System.Threading.Timer(WatchdogCheck, null, 3000, 3000);
    }

    private static void WatchdogCheck(object? state)
    {
        if (!_isBroadcasting) return;

        // Nếu quá 15 giây mà không nhận được khung hình nào từ Gateway -> Tự động mở khóa an toàn cho học sinh!
        long elapsedMs = (DateTime.UtcNow.Ticks - Interlocked.Read(ref _lastFrameTicks)) / TimeSpan.TicksPerMillisecond;
        if (elapsedMs > 15000)
        {
            Console.WriteLine("⚠️ [Watchdog Fail-Safe] Quá 15s không nhận được tín hiệu bài giảng từ Gateway -> Tự động mở khóa an toàn cho học sinh!");
            StopBroadcast();
        }
    }

    public static void ForceEmergencyUnlock()
    {
        lock (_lock)
        {
            _isBroadcasting = false;
            try { BlockInput(false); } catch (Exception ex) { Console.WriteLine($"[FailSafe BlockInput]: {ex.Message}"); }
            try
            {
                if (_keyboardHookId != IntPtr.Zero) { UnhookWindowsHookEx(_keyboardHookId); _keyboardHookId = IntPtr.Zero; }
                if (_mouseHookId != IntPtr.Zero) { UnhookWindowsHookEx(_mouseHookId); _mouseHookId = IntPtr.Zero; }
            }
            catch (Exception ex) { Console.WriteLine($"[FailSafe Hooks]: {ex.Message}"); }
            try { Cursor.Show(); } catch (Exception ex) { Console.WriteLine($"[FailSafe Cursor]: {ex.Message}"); }
            if (_activeViewerForm != null && !_activeViewerForm.IsDisposed)
            {
                try
                {
                    _activeViewerForm.Invoke(new Action(() => _activeViewerForm.Close()));
                }
                catch (Exception ex) { Console.WriteLine($"[FailSafe CloseForm]: {ex.Message}"); }
                _activeViewerForm = null;
            }
        }
    }

    public static void StartBroadcast(string title)
    {
        EnsureFailSafeRegistered();

        lock (_lock)
        {
            if (_isBroadcasting) return;

            Console.WriteLine("📡 [Broadcast] Kích hoạt chế độ Trình chiếu Bài giảng từ Giáo viên!");
            Interlocked.Exchange(ref _lastFrameTicks, DateTime.UtcNow.Ticks);

            // 1. Khóa chuột và bàn phím phần cứng
            try
            {
                BlockInput(true);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[BlockInput Warning] {ex.Message}");
            }

            // 2. Cài đặt Low-Level Keyboard & Mouse Hook
            try
            {
                using Process curProcess = Process.GetCurrentProcess();
                using ProcessModule? curModule = curProcess.MainModule;
                IntPtr hMod = GetModuleHandle(curModule?.ModuleName ?? "CvaLmsAgent");

                _keyboardProc = KeyboardHookCallback;
                _keyboardHookId = SetWindowsHookEx(WH_KEYBOARD_LL, _keyboardProc, hMod, 0);

                _mouseProc = MouseHookCallback;
                _mouseHookId = SetWindowsHookEx(WH_MOUSE_LL, _mouseProc, hMod, 0);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[Hook Warning] {ex.Message}");
            }

            // 3. Khởi tạo Cửa sổ Fullscreen Viewer trên STA Thread
            Thread thread = new Thread(() =>
            {
                try
                {
                    BroadcastViewerForm form = new BroadcastViewerForm(title);
                    lock (_lock)
                    {
                        _activeViewerForm = form;
                        _isBroadcasting = true; // Đặt true khi Form đã sẵn sàng
                    }
                    Application.Run(form);
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"[Broadcast Viewer Error]: {ex.Message}");
                }
                finally
                {
                    lock (_lock)
                    {
                        _isBroadcasting = false;
                        _activeViewerForm = null;
                    }
                    ForceEmergencyUnlock();
                }
            });
            thread.SetApartmentState(ApartmentState.STA);
            thread.IsBackground = true;
            thread.Start();
        }
    }

    public static void UpdateBroadcastFrame(byte[] jpegBytes)
    {
        Interlocked.Exchange(ref _lastFrameTicks, DateTime.UtcNow.Ticks);
        if (_activeViewerForm != null && !_activeViewerForm.IsDisposed)
        {
            _activeViewerForm.UpdateFrame(jpegBytes);
        }
    }

    public static void StopBroadcast()
    {
        lock (_lock)
        {
            if (!_isBroadcasting && _activeViewerForm == null) return;
            _isBroadcasting = false;

            Console.WriteLine("🛑 [Broadcast] Dừng trình chiếu bài giảng - Trả lại quyền điều khiển chuột & bàn phím!");

            // 1. Mở khóa chuột và bàn phím
            try
            {
                BlockInput(false);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[BlockInput Unlock Warning] {ex.Message}");
            }

            // 2. Gỡ bỏ Hook
            if (_keyboardHookId != IntPtr.Zero)
            {
                UnhookWindowsHookEx(_keyboardHookId);
                _keyboardHookId = IntPtr.Zero;
            }
            if (_mouseHookId != IntPtr.Zero)
            {
                UnhookWindowsHookEx(_mouseHookId);
                _mouseHookId = IntPtr.Zero;
            }

            // 3. Đóng Form Viewer an toàn
            if (_activeViewerForm != null && !_activeViewerForm.IsDisposed)
            {
                try
                {
                    _activeViewerForm.Invoke(new Action(() =>
                    {
                        Cursor.Show();
                        _activeViewerForm.Close();
                    }));
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"[StopBroadcast Close Warning]: {ex.Message}");
                }
                _activeViewerForm = null;
            }

            ForceEmergencyUnlock();
        }
    }

    private static IntPtr KeyboardHookCallback(int nCode, IntPtr wParam, IntPtr lParam)
    {
        if (nCode >= 0)
        {
            int vkCode = Marshal.ReadInt32(lParam);
            Keys key = (Keys)vkCode;

            // Chặn phím Windows trái / phải
            if (key == Keys.LWin || key == Keys.RWin)
                return (IntPtr)1;

            // Chặn Alt + Tab, Alt + F4, Alt + Escape
            bool isAlt = (Control.ModifierKeys & Keys.Alt) != 0;
            if (isAlt && (key == Keys.Tab || key == Keys.F4 || key == Keys.Escape))
                return (IntPtr)1;

            // Chặn Ctrl + Escape
            bool isCtrl = (Control.ModifierKeys & Keys.Control) != 0;
            if (isCtrl && key == Keys.Escape)
                return (IntPtr)1;

            // Chặn tất cả các phím khác khi đang chiếu để học sinh không gõ lung tung
            return (IntPtr)1;
        }
        return CallNextHookEx(_keyboardHookId, nCode, wParam, lParam);
    }

    private static IntPtr MouseHookCallback(int nCode, IntPtr wParam, IntPtr lParam)
    {
        if (nCode >= 0)
        {
            // Triệt tiêu tất cả sự kiện chuột khi đang trình chiếu bài giảng
            return (IntPtr)1;
        }
        return CallNextHookEx(_mouseHookId, nCode, wParam, lParam);
    }
}

public class BroadcastViewerForm : Form
{
    private Bitmap? _currentFrame;
    private readonly object _frameLock = new();
    private readonly string _title;

    public BroadcastViewerForm(string title)
    {
        _title = title;

        FormBorderStyle = FormBorderStyle.None;
        WindowState = FormWindowState.Maximized;
        TopMost = true;
        BackColor = Color.FromArgb(9, 13, 22);
        ShowInTaskbar = false;
        DoubleBuffered = true;

        try
        {
            Cursor.Hide();
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[Cursor Hide Warning]: {ex.Message}");
        }
    }

    public void UpdateFrame(byte[] jpegBytes)
    {
        try
        {
            using var ms = new MemoryStream(jpegBytes);
            using var tempBmp = new Bitmap(ms);

            // Tạo Bitmap độc lập tách rời MemoryStream để triệt tiêu lỗi GDI+ Generic Error
            var standaloneBmp = new Bitmap(tempBmp.Width, tempBmp.Height, PixelFormat.Format24bppRgb);
            using (var g = Graphics.FromImage(standaloneBmp))
            {
                g.DrawImage(tempBmp, 0, 0, tempBmp.Width, tempBmp.Height);
            }

            lock (_frameLock)
            {
                _currentFrame?.Dispose();
                _currentFrame = standaloneBmp;
            }

            if (!IsDisposed && IsHandleCreated)
            {
                BeginInvoke(new Action(Invalidate));
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[UpdateFrame Error]: {ex.Message}");
        }
    }

    protected override void OnPaint(PaintEventArgs e)
    {
        base.OnPaint(e);
        Graphics g = e.Graphics;
        g.InterpolationMode = InterpolationMode.Bilinear;
        g.SmoothingMode = SmoothingMode.HighSpeed;
        g.PixelOffsetMode = PixelOffsetMode.HighSpeed;

        lock (_frameLock)
        {
            if (_currentFrame != null)
            {
                // Fit frame into screen aspect ratio (Letterbox / Pillarbox)
                float screenRatio = (float)Width / Height;
                float frameRatio = (float)_currentFrame.Width / _currentFrame.Height;
                int drawW = Width;
                int drawH = Height;
                int drawX = 0;
                int drawY = 0;

                if (frameRatio > screenRatio)
                {
                    drawH = (int)(Width / frameRatio);
                    drawY = (Height - drawH) / 2;
                }
                else
                {
                    drawW = (int)(Height * frameRatio);
                    drawX = (Width - drawW) / 2;
                }

                g.DrawImage(_currentFrame, drawX, drawY, drawW, drawH);
            }
            else
            {
                // Initial placeholder while waiting for first slide
                using SolidBrush brushBg = new SolidBrush(Color.FromArgb(15, 23, 42));
                g.FillRectangle(brushBg, ClientRectangle);

                using Font font = new Font(FontFamily.GenericSansSerif, 24, FontStyle.Bold);
                using SolidBrush brushText = new SolidBrush(Color.FromArgb(248, 250, 252));
                using Font fontSub = new Font(FontFamily.GenericSansSerif, 15, FontStyle.Regular);
                using SolidBrush brushSub = new SolidBrush(Color.FromArgb(56, 189, 248));

                string str = "📡 THẦY ĐANG KẾT NỐI MÀN HÌNH BÀI GIẢNG...";
                SizeF size = g.MeasureString(str, font);
                g.DrawString(str, font, brushText, (Width - size.Width) / 2, Height / 2 - 40);

                string sub = "Chuột và bàn phím đang được khóa • Chú ý lắng nghe bài giảng";
                SizeF sizeSub = g.MeasureString(sub, fontSub);
                g.DrawString(sub, fontSub, brushSub, (Width - sizeSub.Width) / 2, Height / 2 + 20);
            }
        }

        // Top Floating Pill Badge
        int pillW = 460;
        int pillH = 36;
        int pillX = (Width - pillW) / 2;
        int pillY = 16;
        using SolidBrush pillBrush = new SolidBrush(Color.FromArgb(220, 15, 23, 42));
        using Pen pillPen = new Pen(Color.FromArgb(59, 130, 246), 1.5f);
        using GraphicsPath path = GetRoundedRectPath(new Rectangle(pillX, pillY, pillW, pillH), 8);
        g.FillPath(pillBrush, path);
        g.DrawPath(pillPen, path);

        using SolidBrush dotBrush = new SolidBrush(Color.FromArgb(239, 68, 68)); // red live indicator
        g.FillEllipse(dotBrush, pillX + 16, pillY + 12, 12, 12);

        using Font fontPill = new Font(FontFamily.GenericSansSerif, 11, FontStyle.Bold);
        using SolidBrush brushPill = new SolidBrush(Color.White);
        g.DrawString("LIVE • THẦY ĐANG TRÌNH CHIẾU BÀI GIẢNG", fontPill, brushPill, pillX + 36, pillY + 9);
    }

    private static GraphicsPath GetRoundedRectPath(Rectangle rect, int radius)
    {
        GraphicsPath path = new GraphicsPath();
        int d = radius * 2;
        path.AddArc(rect.X, rect.Y, d, d, 180, 90);
        path.AddArc(rect.Right - d, rect.Y, d, d, 270, 90);
        path.AddArc(rect.Right - d, rect.Bottom - d, d, d, 0, 90);
        path.AddArc(rect.X, rect.Bottom - d, d, d, 90, 90);
        path.CloseFigure();
        return path;
    }
}
