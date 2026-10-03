using System.IO.Compression;
using System.Security.Cryptography;

namespace CvaLmsAgent;

public class CollectedArchive
{
    public byte[] ZipData { get; set; } = Array.Empty<byte>();
    public string Sha256Hash { get; set; } = string.Empty;
    public int FileCount { get; set; }
}

public class FileCollectorEngine
{
    public static string GetStudentExerciseFolder()
    {
        string desktop = Environment.GetFolderPath(Environment.SpecialFolder.DesktopDirectory);
        string folder = Path.Combine(desktop, "BaiTap_TinHoc");
        if (!Directory.Exists(folder))
        {
            Directory.CreateDirectory(folder);
            // Tạo 1 file mẫu hướng dẫn
            string sampleFile = Path.Combine(folder, "huong_dan_lam_bai.txt");
            if (!File.Exists(sampleFile))
            {
                File.WriteAllText(sampleFile, "Các em lưu bài làm thực hành (Scratch, Word, Python) vào thư mục này để nộp cho Thầy/Cô.");
            }
        }
        return folder;
    }

    public static CollectedArchive CreateExerciseArchive()
    {
        string sourceDir = GetStudentExerciseFolder();
        string tempZipPath = Path.Combine(Path.GetTempPath(), $"cva_collect_{Guid.NewGuid():N}.zip");

        try
        {
            if (File.Exists(tempZipPath)) File.Delete(tempZipPath);

            int count = 0;
            using (ZipArchive zip = ZipFile.Open(tempZipPath, ZipArchiveMode.Create))
            {
                string[] files = Directory.GetFiles(sourceDir, "*.*", SearchOption.AllDirectories);
                foreach (string file in files)
                {
                    FileInfo fileInfo = new FileInfo(file);

                    // Bỏ qua symlink, junction, reparse point để chống TOCTOU
                    if ((fileInfo.Attributes & FileAttributes.ReparsePoint) != 0)
                        continue;

                    // Giới hạn 25MB per file
                    if (fileInfo.Length > 25 * 1024 * 1024)
                        continue;

                    string relPath = Path.GetRelativePath(sourceDir, file);
                    zip.CreateEntryFromFile(file, relPath, CompressionLevel.Optimal);
                    count++;
                }
            }

            byte[] zipBytes = File.ReadAllBytes(tempZipPath);
            using SHA256 sha = SHA256.Create();
            string hash = Convert.ToHexString(sha.ComputeHash(zipBytes)).ToLowerInvariant();

            return new CollectedArchive
            {
                ZipData = zipBytes,
                Sha256Hash = hash,
                FileCount = count
            };
        }
        finally
        {
            if (File.Exists(tempZipPath))
            {
                try { File.Delete(tempZipPath); } catch (Exception ex) { Console.WriteLine($"[Temp Zip Cleanup Error]: {ex.Message}"); }
            }
        }
    }
}
