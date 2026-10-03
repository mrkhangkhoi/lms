using System;
using System.IO;
using System.Runtime.InteropServices;
using System.Security.Cryptography;
using Microsoft.Win32;

namespace CvaLmsAgent;

public static class WallpaperManager
{
    [DllImport("user32.dll", EntryPoint = "SystemParametersInfoW", SetLastError = true, CharSet = CharSet.Unicode)]
    [return: MarshalAs(UnmanagedType.Bool)]
    private static extern bool SystemParametersInfoW(uint uAction, uint uParam, string lpvParam, uint fuWinIni);

    private const uint SPI_SETDESKWALLPAPER = 0x0014;
    private const uint SPIF_UPDATEINIFILE = 0x01;
    private const uint SPIF_SENDCHANGE = 0x02;

    public static void EnsureLockedWallpaper()
    {
        try
        {
            string? wallpaperPath = FindWallpaperPath();
            if (string.IsNullOrEmpty(wallpaperPath) || !File.Exists(wallpaperPath))
            {
                return;
            }

            // 1. Cấu hình Registry cá nhân hóa Desktop
            using (RegistryKey? deskKey = Registry.CurrentUser.OpenSubKey(@"Control Panel\Desktop", true))
            {
                if (deskKey != null)
                {
                    deskKey.SetValue("Wallpaper", wallpaperPath);
                    deskKey.SetValue("WallpaperStyle", "10"); // Fill
                    deskKey.SetValue("TileWallpaper", "0");
                }
            }

            // 2. Thiết lập Policies khóa cứng đổi hình nền cho học sinh
            using (RegistryKey actKey = Registry.CurrentUser.CreateSubKey(@"Software\Microsoft\Windows\CurrentVersion\Policies\ActiveDesktop"))
            {
                actKey.SetValue("NoChangingWallPaper", 1, RegistryValueKind.DWord);
            }

            using (RegistryKey sysKey = Registry.CurrentUser.CreateSubKey(@"Software\Microsoft\Windows\CurrentVersion\Policies\System"))
            {
                sysKey.SetValue("Wallpaper", wallpaperPath);
                sysKey.SetValue("WallpaperStyle", "2");
            }

            // Lưu vào Explorer History để Windows 11 nhận diện
            using (RegistryKey? expKey = Registry.CurrentUser.OpenSubKey(@"Software\Microsoft\Windows\CurrentVersion\Explorer\Wallpapers", true))
            {
                expKey?.SetValue("BackgroundHistoryPath0", wallpaperPath);
            }

            // 3. Đồng bộ vào TranscodedWallpaper nếu là Windows 10/11
            SyncTranscodedWallpaper(wallpaperPath);

            // 4. Kích hoạt cập nhật màn hình qua Win32 API
            SystemParametersInfoW(SPI_SETDESKWALLPAPER, 0, wallpaperPath, SPIF_UPDATEINIFILE | SPIF_SENDCHANGE);
            Console.WriteLine($"🖼️ [Wallpaper] Đã khóa cứng hình nền phòng máy CVALMS thành công ({wallpaperPath})");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"⚠️ [Wallpaper Warning]: {ex.Message}");
        }
    }

    private static void SyncTranscodedWallpaper(string sourcePath)
    {
        try
        {
            string appData = Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData);
            string themesDir = Path.Combine(appData, "Microsoft", "Windows", "Themes");
            if (!Directory.Exists(themesDir)) return;

            string targetTranscoded = Path.Combine(themesDir, "TranscodedWallpaper");
            bool needCopy = true;

            if (File.Exists(targetTranscoded))
            {
                byte[] hashSrc = ComputeFileHash(sourcePath);
                byte[] hashTarget = ComputeFileHash(targetTranscoded);
                if (CryptographicOperations.FixedTimeEquals(hashSrc, hashTarget))
                {
                    needCopy = false;
                }
            }

            if (needCopy)
            {
                File.Copy(sourcePath, targetTranscoded, true);
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[Sync Transcoded Log]: {ex.Message}");
        }
    }

    private static byte[] ComputeFileHash(string path)
    {
        using SHA256 sha = SHA256.Create();
        using FileStream fs = File.OpenRead(path);
        return sha.ComputeHash(fs);
    }

    private static string? FindWallpaperPath()
    {
        string baseDir = AppDomain.CurrentDomain.BaseDirectory;
        string candidate1 = Path.Combine(baseDir, "cvalms_wallpaper.jpg");
        if (File.Exists(candidate1)) return candidate1;

        string candidate2 = @"C:\CVALMS-Agent\cvalms_wallpaper.jpg";
        if (File.Exists(candidate2)) return candidate2;

        string localApp = Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData);
        string candidate3 = Path.Combine(localApp, "CVALMS-Agent", "cvalms_wallpaper.jpg");
        if (File.Exists(candidate3)) return candidate3;

        string candidate4 = Path.Combine(Directory.GetCurrentDirectory(), "cvalms_wallpaper.jpg");
        if (File.Exists(candidate4)) return candidate4;

        return null;
    }
}
