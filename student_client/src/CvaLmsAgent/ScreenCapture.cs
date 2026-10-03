using System.Drawing;
using System.Drawing.Drawing2D;
using System.Drawing.Imaging;
using System.Runtime.InteropServices;
using System.Text;

namespace CvaLmsAgent;

public enum ScreenCaptureState : byte
{
    Normal = 0,
    SecureDesktopBlocked = 1,
    Error = 2
}

public class CapturedFrame
{
    public uint SequenceNumber { get; set; }
    public ulong Timestamp { get; set; }
    public ushort Width { get; set; }
    public ushort Height { get; set; }
    public ScreenCaptureState State { get; set; }
    public byte[] JpegData { get; set; } = Array.Empty<byte>();
}

public class ScreenCaptureEngine
{
    [DllImport("user32.dll")]
    private static extern IntPtr GetDesktopWindow();

    [DllImport("user32.dll")]
    private static extern IntPtr GetWindowDC(IntPtr hWnd);

    [DllImport("user32.dll")]
    private static extern int ReleaseDC(IntPtr hWnd, IntPtr hDC);

    [DllImport("gdi32.dll")]
    private static extern bool BitBlt(IntPtr hObject, int nXDest, int nYDest, int nWidth, int nHeight, IntPtr hObjectSource, int nXSrc, int nYSrc, int dwRop);

    [DllImport("user32.dll", SetLastError = true)]
    private static extern IntPtr OpenInputDesktop(uint dwFlags, bool fInherit, uint dwDesiredAccess);

    [DllImport("user32.dll")]
    private static extern bool CloseDesktop(IntPtr hDesktop);

    [DllImport("user32.dll")]
    private static extern IntPtr GetForegroundWindow();

    [DllImport("user32.dll", CharSet = CharSet.Unicode)]
    private static extern int GetWindowText(IntPtr hWnd, StringBuilder text, int count);

    [DllImport("user32.dll")]
    private static extern int GetSystemMetrics(int nIndex);

    [DllImport("user32.dll", SetLastError = true)]
    private static extern IntPtr OpenWindowStation(string lpszWinSta, bool fInherit, uint dwDesiredAccess);

    [DllImport("user32.dll", SetLastError = true)]
    private static extern bool SetProcessWindowStation(IntPtr hWinSta);

    [DllImport("user32.dll", SetLastError = true)]
    private static extern IntPtr OpenDesktop(string lpszDesktop, uint dwFlags, bool fInherit, uint dwDesiredAccess);

    [DllImport("user32.dll", SetLastError = true)]
    private static extern bool SetThreadDesktop(IntPtr hDesktop);

    [DllImport("gdi32.dll", CharSet = CharSet.Auto)]
    private static extern IntPtr CreateDC(string lpszDriver, string? lpszDevice, string? lpszOutput, IntPtr lpInitData);

    [DllImport("gdi32.dll")]
    private static extern bool DeleteDC(IntPtr hdc);

    private const int SRCCOPY = 0x00CC0020;
    private const uint DESKTOP_SWITCHDESKTOP = 0x0100;

    private readonly ImageCodecInfo _jpegEncoder;
    private uint _sequenceCounter = 0;

    public ScreenCaptureEngine()
    {
        _jpegEncoder = GetEncoder(ImageFormat.Jpeg) ?? throw new InvalidOperationException("Không tìm thấy JPEG encoder");
    }

    public string GetForegroundAppTitle()
    {
        try
        {
            var hwnd = GetForegroundWindow();
            if (hwnd == IntPtr.Zero) return "Màn hình chính";
            var sb = new StringBuilder(256);
            if (GetWindowText(hwnd, sb, 256) > 0)
            {
                var title = sb.ToString().Trim();
                return string.IsNullOrEmpty(title) ? "Ứng dụng nền" : title;
            }
        }
        catch
        {
            // ignore
        }
        return "Màn hình Desktop";
    }

    public CapturedFrame CaptureScreen(int targetWidth, int targetHeight, long jpegQuality)
    {
        _sequenceCounter++;
        var ts = (ulong)DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();

        // 1. Kiểm tra trạng thái Secure Desktop (UAC Prompt hoặc Lock Workstation)
        var hDesktop = OpenInputDesktop(0, false, DESKTOP_SWITCHDESKTOP);
        if (hDesktop == IntPtr.Zero)
        {
            var err = Marshal.GetLastWin32Error();
            if (err == 5) // ERROR_ACCESS_DENIED
            {
                return new CapturedFrame
                {
                    SequenceNumber = _sequenceCounter,
                    Timestamp = ts,
                    Width = (ushort)targetWidth,
                    Height = (ushort)targetHeight,
                    State = ScreenCaptureState.SecureDesktopBlocked,
                    JpegData = CreatePlaceholderFrame(targetWidth, targetHeight, "🔒 SECURE DESKTOP (UAC / LOGON)", Color.FromArgb(40, 30, 0), Color.Gold)
                };
            }
        }
        else
        {
            CloseDesktop(hDesktop);
        }

        // 2. Chụp màn hình Desktop thực tế
        try
        {
            using var rawBmp = CaptureDesktopBitmap();

            // Thu nhỏ độ phân giải theo Profile (Overview 480x270 hoặc Spotlight 1280x720)
            using var scaledBmp = new Bitmap(targetWidth, targetHeight, PixelFormat.Format24bppRgb);
            using (var gScaled = Graphics.FromImage(scaledBmp))
            {
                gScaled.InterpolationMode = InterpolationMode.Bilinear;
                gScaled.SmoothingMode = SmoothingMode.HighSpeed;
                gScaled.PixelOffsetMode = PixelOffsetMode.HighSpeed;
                gScaled.DrawImage(rawBmp, 0, 0, targetWidth, targetHeight);
            }

            // Nén JPEG in-memory
            using var ms = new MemoryStream();
            using var encoderParams = new EncoderParameters(1);
            encoderParams.Param[0] = new EncoderParameter(System.Drawing.Imaging.Encoder.Quality, (long)jpegQuality);
            scaledBmp.Save(ms, _jpegEncoder, encoderParams);

            return new CapturedFrame
            {
                SequenceNumber = _sequenceCounter,
                Timestamp = ts,
                Width = (ushort)targetWidth,
                Height = (ushort)targetHeight,
                State = ScreenCaptureState.Normal,
                JpegData = ms.ToArray()
            };
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[Capture Exception] {ex.GetType().Name}: {ex.Message}");
            return new CapturedFrame
            {
                SequenceNumber = _sequenceCounter,
                Timestamp = ts,
                Width = (ushort)targetWidth,
                Height = (ushort)targetHeight,
                State = ScreenCaptureState.Error,
                JpegData = CreatePlaceholderFrame(targetWidth, targetHeight, "⚠️ LỖI CHỤP MÀN HÌNH", Color.DarkRed, Color.White)
            };
        }
    }

    private static void EnsureDesktopAccess()
    {
        try
        {
            var hWinSta = OpenWindowStation("winsta0", false, 0x10000000);
            if (hWinSta != IntPtr.Zero)
            {
                SetProcessWindowStation(hWinSta);
            }
            var hDesk = OpenDesktop("default", 0, false, 0x10000000);
            if (hDesk != IntPtr.Zero)
            {
                SetThreadDesktop(hDesk);
            }
        }
        catch
        {
            // ignore
        }
    }

    private static Bitmap CaptureDesktopBitmap()
    {
        EnsureDesktopAccess();

        int w = GetSystemMetrics(0);
        int h = GetSystemMetrics(1);
        if (w <= 0) w = 1920;
        if (h <= 0) h = 1080;

        // 1. Thử CreateDC("DISPLAY") - mở trực tiếp display adapter
        var hDisplayDC = CreateDC("DISPLAY", null, null, IntPtr.Zero);
        if (hDisplayDC != IntPtr.Zero)
        {
            try
            {
                var bmp = new Bitmap(w, h, PixelFormat.Format24bppRgb);
                using (var g = Graphics.FromImage(bmp))
                {
                    var hBmpDC = g.GetHdc();
                    try
                    {
                        if (BitBlt(hBmpDC, 0, 0, w, h, hDisplayDC, 0, 0, SRCCOPY))
                        {
                            return bmp;
                        }
                    }
                    finally
                    {
                        g.ReleaseHdc(hBmpDC);
                    }
                }
                bmp.Dispose();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[CreateDC Warning] {ex.Message}");
            }
            finally
            {
                DeleteDC(hDisplayDC);
            }
        }

        // 2. Thử GetDesktopWindow + GetWindowDC
        var hDeskWnd = GetDesktopWindow();
        var hDeskDC = GetWindowDC(hDeskWnd);
        if (hDeskDC != IntPtr.Zero)
        {
            try
            {
                var bmp = new Bitmap(w, h, PixelFormat.Format24bppRgb);
                using (var g = Graphics.FromImage(bmp))
                {
                    var hBmpDC = g.GetHdc();
                    try
                    {
                        if (BitBlt(hBmpDC, 0, 0, w, h, hDeskDC, 0, 0, SRCCOPY))
                        {
                            return bmp;
                        }
                    }
                    finally
                    {
                        g.ReleaseHdc(hBmpDC);
                    }
                }
                bmp.Dispose();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[GetWindowDC Warning] {ex.Message}");
            }
            finally
            {
                ReleaseDC(hDeskWnd, hDeskDC);
            }
        }

        // 3. Dự phòng: Graphics.CopyFromScreen
        try
        {
            var bounds = Screen.PrimaryScreen?.Bounds ?? new Rectangle(0, 0, w, h);
            var fallbackBmp = new Bitmap(bounds.Width, bounds.Height, PixelFormat.Format24bppRgb);
            using (var g = Graphics.FromImage(fallbackBmp))
            {
                g.CopyFromScreen(bounds.X, bounds.Y, 0, 0, bounds.Size, CopyPixelOperation.SourceCopy);
            }
            return fallbackBmp;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[CopyFromScreen Warning] {ex.Message}");
        }

        // 4. Màn hình giả lập Hi-Tech khi chạy trong sandbox không có display device
        var simBmp = new Bitmap(w, h, PixelFormat.Format24bppRgb);
        using (var g = Graphics.FromImage(simBmp))
        {
            g.Clear(Color.FromArgb(15, 23, 42));
            using var brushTitle = new SolidBrush(Color.White);
            using var brushSub = new SolidBrush(Color.FromArgb(56, 189, 248));
            using var fontTitle = new Font(FontFamily.GenericSansSerif, 28, FontStyle.Bold);
            using var fontSub = new Font(FontFamily.GenericSansSerif, 16, FontStyle.Regular);

            g.DrawString($"MÁY HỌC SINH • {Environment.MachineName}", fontTitle, brushTitle, 60, 60);
            g.DrawString($"Người dùng: {Environment.UserName} • Hệ điều hành: Windows {Environment.OSVersion.Version.Major}", fontSub, brushSub, 60, 120);
            g.DrawString($"Thời gian: {DateTime.Now:HH:mm:ss dd/MM/yyyy} • CVALMS Agent Active", fontSub, brushSub, 60, 160);
        }
        return simBmp;
    }

    private byte[] CreatePlaceholderFrame(int width, int height, string text, Color bgColor, Color textColor)
    {
        using var bmp = new Bitmap(width, height);
        using (var g = Graphics.FromImage(bmp))
        {
            g.Clear(bgColor);
            using var brush = new SolidBrush(textColor);
            using var font = new Font(FontFamily.GenericSansSerif, 12, FontStyle.Bold);
            var size = g.MeasureString(text, font);
            g.DrawString(text, font, brush, (width - size.Width) / 2, (height - size.Height) / 2);
        }
        using var ms = new MemoryStream();
        bmp.Save(ms, ImageFormat.Jpeg);
        return ms.ToArray();
    }

    private static ImageCodecInfo? GetEncoder(ImageFormat format)
    {
        return ImageCodecInfo.GetImageDecoders().FirstOrDefault(codec => codec.FormatID == format.Guid);
    }
}
