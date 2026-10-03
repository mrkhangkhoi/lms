using Microsoft.Win32;
using System;
using System.IO;
using System.Linq;
using System.Management;
using System.Net.NetworkInformation;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;

namespace CvaLmsAgent;

public record LicensePayload(
    string CustomerSchool,
    string HardwareId,
    int AllowedMachines,
    DateTimeOffset IssuedAt,
    DateTimeOffset ExpiresAt,
    string[] Features
);

public class LicenseManager
{
    // Public Key RSA-4096 chính thức của Tác giả (Thầy Hà Văn Tý)
    // Dùng để thẩm định chữ ký số bất đối xứng RSA-PSS với hàm băm SHA-256
    // Private Key được lưu trữ offline an toàn tuyệt đối, không nhúng vào client!
    public const string AUTHOR_PUBLIC_KEY_PEM = @"-----BEGIN PUBLIC KEY-----
MIICIjANBgkqhkiG9w0BAQEFAAOCAg8AMIICCgKCAgEA5tK0K3wDLUc5LvDxbkZt
0tSWU2nr+t83JEO+UGsPYp3FRTDcGF365hnnBazYxjpeclN3PzEKtCXmITuF4w9n
6Jgaa504omldnVpDO14VmX6dQbG3HHGcLsNnXjElZ9l6CsxBfaIQCGtAglimGzIk
j/Sr5axY3TeeYfN4wm2ac9Y4qJQo9B6MIBEzFcaKrHwNCdTF6Hr8ilctxwhSolw/
FAY1BDAN5pAXeZFQfY+Keyrs7VUTN6Z2Nb8laElQTB7qErUSYzTpXkJwG3NJbuJC
oHvLF7Y/I0ibhLMqx2iQJoWWC8XqBvvz45P1yqruzfxoE85fHzHxwum8lx28SEXv
DESJUuK+DgApXscAULWoVOLK7IdeDjXIypRvmZTpPoH4S8SzB83G++Jw5Dkmp0fG
LcOhg1CmReFaQZxOvAGd3Zp1+kAS6oca84ocY6RHvhd3QD4SIJRMll63megrvPsj
EVPMddewc64zuiAqE47PO71RVWwZJq7iwcqolmtwPy1ATrgJNXCGuqDDAB7YYsWY
GKFrH6v8cLqerjHALnc3WxV6WskJA0AUPmOyvj/UCV2z+v76jQAbCAyOxiEdFOjD
5CVM2ZqtkScYvWGNvjxkUpZuhpRv3vCi5RW00A2G6w3WBnR77d4qqmHbBBFU6tqj
aaeSEz83IkC3j08ZqPGmVLsCAwEAAQ==
-----END PUBLIC KEY-----";

    private static string GetWmiValue(string wmiClass, string prop)
    {
        try
        {
            using ManagementObjectSearcher searcher = new ManagementObjectSearcher($"SELECT {prop} FROM {wmiClass}");
            foreach (ManagementObject obj in searcher.Get())
            {
                string? val = obj[prop]?.ToString();
                if (!string.IsNullOrWhiteSpace(val)) return val.Trim();
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[WMI {wmiClass}.{prop} Warning]: {ex.Message}");
        }
        return "";
    }

    /// <summary>
    /// Thu thập định danh phần cứng bất biến từ Windows Registry MachineGuid, Bo mạch chủ UUID, CPU ID, BIOS, Disk Serial và MAC Address
    /// </summary>
    public static string ComputeHardwareId()
    {
        try
        {
            string machineGuid = Registry.GetValue(
                @"HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Cryptography",
                "MachineGuid",
                ""
            )?.ToString() ?? "";

            string mbUuid = GetWmiValue("Win32_ComputerSystemProduct", "UUID");
            string cpuId = GetWmiValue("Win32_Processor", "ProcessorId");
            string biosSerial = GetWmiValue("Win32_BIOS", "SerialNumber");
            string diskSerial = GetWmiValue("Win32_DiskDrive", "SerialNumber");
            NetworkInterface? activeNic = NetworkInterface.GetAllNetworkInterfaces()
                .FirstOrDefault(n => n.OperationalStatus == OperationalStatus.Up
                                     && n.NetworkInterfaceType != NetworkInterfaceType.Loopback);
            string mac = activeNic?.GetPhysicalAddress()?.ToString() ?? "";

            string raw = $"{machineGuid}|{mbUuid}|{cpuId}|{biosSerial}|{diskSerial}|{mac}".ToUpperInvariant();
            byte[] hash = SHA256.HashData(Encoding.UTF8.GetBytes(raw));
            string hex = Convert.ToHexString(hash);

            // Định dạng chuỗi hiển thị chuẩn công nghiệp: CVA-XXXX-XXXX-XXXX-XXXX
            return $"CVA-{hex[..4]}-{hex[4..8]}-{hex[8..12]}-{hex[12..16]}";
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[ComputeHardwareId Error]: {ex.Message}");
            string fallback = Environment.MachineName + Environment.ProcessorCount;
            byte[] hash = SHA256.HashData(Encoding.UTF8.GetBytes(fallback));
            return $"CVA-FALLBACK-{Convert.ToHexString(hash)[..8]}";
        }
    }

    /// <summary>
    /// Chuẩn hóa chuỗi dữ liệu ký số (Canonical String) đồng bộ với License Generator
    /// </summary>
    public static byte[] GetCanonicalPayloadBytes(LicensePayload payload)
    {
        long issuedSec = payload.IssuedAt.ToUnixTimeSeconds();
        long expiresSec = payload.ExpiresAt.ToUnixTimeSeconds();
        string featuresJoined = string.Join(",", payload.Features ?? Array.Empty<string>());
        string canonical = $"{payload.CustomerSchool}|{payload.HardwareId}|{payload.AllowedMachines}|{issuedSec}|{expiresSec}|{featuresJoined}";
        return Encoding.UTF8.GetBytes(canonical);
    }

    /// <summary>
    /// Xác thực file bản quyền license.cva bằng chữ ký số RSA-4096 / PSS Padding và SHA-256
    /// </summary>
    public static bool VerifyLicense(string licenseFilePath, out LicensePayload? payload, out string error)
    {
        payload = null;
        error = "";

        if (!File.Exists(licenseFilePath))
        {
            error = "Chưa tìm thấy file bản quyền license.cva";
            return false;
        }

        try
        {
            string jsonText = File.ReadAllText(licenseFilePath, Encoding.UTF8);
            using JsonDocument doc = JsonDocument.Parse(jsonText);
            JsonElement root = doc.RootElement;

            if (!root.TryGetProperty("payload", out JsonElement payloadElement) ||
                !root.TryGetProperty("signature", out JsonElement signatureElement))
            {
                error = "Cấu trúc file license.cva không hợp lệ (thiếu payload hoặc signature)!";
                return false;
            }

            // 0. Kiểm tra Envelope Metadata của Tác giả Thầy Hà Văn Tý
            if (!root.TryGetProperty("issuedBy", out JsonElement iss) || !(iss.GetString() ?? "").Contains("Thầy Hà Văn Tý"))
            {
                error = "Giấy phép bản quyền không phải do Thầy Hà Văn Tý (Sở GD&ĐT Quảng Ngãi) phát hành!";
                return false;
            }
            if (!root.TryGetProperty("algorithm", out JsonElement alg) || alg.GetString() != "RSA-4096-PSS-SHA256")
            {
                error = "Thuật toán mã hóa bản quyền không đúng chuẩn bảo mật quân sự RSA-4096-PSS-SHA256!";
                return false;
            }

            string? signatureBase64 = signatureElement.GetString();
            if (string.IsNullOrWhiteSpace(signatureBase64))
            {
                error = "Chữ ký số bản quyền bị rỗng hoặc không tồn tại!";
                return false;
            }

            payload = JsonSerializer.Deserialize<LicensePayload>(payloadElement.GetRawText());
            if (payload == null)
            {
                error = "Dữ liệu payload bản quyền không hợp lệ";
                return false;
            }

            if (string.IsNullOrWhiteSpace(payload.CustomerSchool))
            {
                error = "Tên trường / đơn vị được cấp phép không được để trống!";
                return false;
            }

            if (payload.Features == null || payload.Features.Length == 0)
            {
                error = "Danh mục tính năng bản quyền không hợp lệ!";
                return false;
            }

            // 1. Xác minh chữ ký số toán học RSA-4096 PSS
            using (RSA rsa = RSA.Create())
            {
                rsa.ImportFromPem(AUTHOR_PUBLIC_KEY_PEM);

                byte[] canonicalBytes = GetCanonicalPayloadBytes(payload);
                byte[] signatureBytes = Convert.FromBase64String(signatureBase64);

                bool isSignatureValid = rsa.VerifyData(
                    canonicalBytes,
                    signatureBytes,
                    HashAlgorithmName.SHA256,
                    RSASignaturePadding.Pss
                );

                if (!isSignatureValid)
                {
                    error = "CHỮ KÝ SỐ RSA-4096 KHÔNG HỢP LỆ! File bản quyền đã bị sửa đổi trái phép hoặc giả mạo.";
                    return false;
                }
            }

            // 2. Chống Rollback Đồng hồ hệ thống bảo vệ bằng HMAC-SHA256 toàn vẹn
            DateTimeOffset now = DateTimeOffset.UtcNow;
            if (payload.IssuedAt > now.AddHours(24))
            {
                error = $"Thời điểm cấp bản quyền ({payload.IssuedAt:dd/MM/yyyy HH:mm}) nằm ở tương lai! Vui lòng kiểm tra lại đồng hồ hệ thống.";
                return false;
            }

            string currentHwId = ComputeHardwareId();
            try
            {
                string appData = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "CvaLmsAgent");
                Directory.CreateDirectory(appData);
                string timeTrackFile = Path.Combine(appData, "last_seen_epoch.dat");

                byte[] keyBytes = Encoding.UTF8.GetBytes(currentHwId + "_CVALMS_CLOCK_GUARD");
                if (File.Exists(timeTrackFile))
                {
                    string content = File.ReadAllText(timeTrackFile).Trim();
                    string[] parts = content.Split(':');
                    if (parts.Length == 2 && long.TryParse(parts[0], out long lastTicks))
                    {
                        byte[] expectedHmacBytes = HMACSHA256.HashData(keyBytes, Encoding.UTF8.GetBytes(parts[0]));
                        string expectedHmac = Convert.ToHexString(expectedHmacBytes);
                        if (string.Equals(expectedHmac, parts[1], StringComparison.OrdinalIgnoreCase))
                        {
                            DateTimeOffset lastSeen = new DateTimeOffset(lastTicks, TimeSpan.Zero);
                            if (now < lastSeen.AddHours(-1)) // Phát hiện lùi giờ quá 1 tiếng
                            {
                                error = $"Phát hiện gian lận lùi đồng hồ hệ thống (Clock Rollback Attack)! Giờ hiện tại: {now:dd/MM/yyyy HH:mm}, Giờ ghi nhận trước đó: {lastSeen:dd/MM/yyyy HH:mm}. Vui lòng đồng bộ lại giờ Internet.";
                                return false;
                            }
                        }
                        else
                        {
                            Console.WriteLine("⚠️ [Clock Guard Warning]: Dữ liệu kiểm tra đồng hồ có dấu hiệu bị can thiệp file ngoài luồng.");
                        }
                    }
                }

                string currentTicksStr = now.Ticks.ToString();
                byte[] currentHmacBytes = HMACSHA256.HashData(keyBytes, Encoding.UTF8.GetBytes(currentTicksStr));
                string signedContent = $"{currentTicksStr}:{Convert.ToHexString(currentHmacBytes)}";
                File.WriteAllText(timeTrackFile, signedContent);
            }
            catch (Exception tEx)
            {
                Console.WriteLine($"[TimeTrack Warning]: {tEx.Message}");
            }

            // 3. Kiểm tra hạn sử dụng
            if (now > payload.ExpiresAt)
            {
                error = $"Bản quyền CVALMS đã hết hạn vào ngày {payload.ExpiresAt:dd/MM/yyyy}. Vui lòng liên hệ Thầy Hà Văn Tý để gia hạn!";
                return false;
            }

            // 4. Kiểm tra số máy hợp lệ (Chuẩn phòng máy 18 máy, tối đa 48 máy)
            if (payload.AllowedMachines < 1 || payload.AllowedMachines > 48)
            {
                error = $"Số lượng máy cấp phép ({payload.AllowedMachines}) không hợp lệ (cho phép 1 - 48 máy)!";
                return false;
            }

            // 5. Kiểm tra khớp mã phần cứng phòng máy (Xóa bỏ hoàn toàn wildcard không kiểm soát)
            bool isMatchHw = string.Equals(payload.HardwareId, currentHwId, StringComparison.OrdinalIgnoreCase);
            bool isSiteLicensed = payload.HardwareId.StartsWith("SITE-", StringComparison.OrdinalIgnoreCase) &&
                                  payload.HardwareId.Contains("CHU-VAN-AN", StringComparison.OrdinalIgnoreCase);

            if (!isMatchHw && !isSiteLicensed)
            {
                error = $"Bản quyền được cấp riêng cho máy [{payload.HardwareId}], không khớp với phần cứng hiện tại [{currentHwId}]!";
                return false;
            }

            return true;
        }
        catch (Exception ex)
        {
            error = $"Lỗi thẩm tra bản quyền RSA: {ex.Message}";
            return false;
        }
    }
}
