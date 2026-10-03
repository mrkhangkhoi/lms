/* ==========================================================
 * BUNDLE.JS — LMS PHÒNG MÁY TƯƠNG TÁC 18 MÁY (CHUẨN GDPT 2018)
 * Kiến trúc Standalone: Chạy mượt mà cả trên file:/// lẫn http/https
 * Tự động map sơ đồ chỗ ngồi, chống chọn nhầm máy, đồng bộ Firebase
 * ========================================================== */

(function() {
  'use strict';

  // SẴN SÀNG GLOBAL HANDLERS NGAY TỪ ĐẦU (Chống lỗi tải trễ hoặc cache không đồng bộ)
  window.teacherSwitchTab = window.teacherSwitchTab || function(tab) {
    if (window._impl_teacherSwitchTab) return window._impl_teacherSwitchTab(tab);
    console.warn('[LMS] teacherSwitchTab được gọi trước khi khởi tạo xong, đang chờ...', tab);
  };
  window.teacherStartLesson = window.teacherStartLesson || function() {
    if (window._impl_teacherStartLesson) return window._impl_teacherStartLesson();
  };
  window.teacherEndSession = window.teacherEndSession || function() {
    if (window._impl_teacherEndSession) return window._impl_teacherEndSession();
  };
  window.openLuckyDrawModal = window.openLuckyDrawModal || function() {
    if (window._impl_openLuckyDrawModal) return window._impl_openLuckyDrawModal();
  };
  window.startLuckyDrawSpin = window.startLuckyDrawSpin || function() {
    if (window._impl_startLuckyDrawSpin) return window._impl_startLuckyDrawSpin();
  };

  // 1. DỮ LIỆU CƠ SỞ (TÍCH HỢP SẴN ĐỂ CHẠY CỰC NHANH KỂ CẢ KHI OFFLINE - THCS KHỐI 6, 7, 8, 9)
  const EMBEDDED_CLASSES = {
    "6A1": {
      "className": "Lớp 6A1",
      "grade": 6,
      "totalStudents": 35,
      "seatingPlan": {
        "1": ["Lê Hoàng Nam", "Phạm Ngọc Ánh"],
        "2": ["Trần Bảo Long", "Nguyễn Thùy Linh"],
        "3": ["Vũ Đức Minh", "Hoàng Kim Ngân", "Đặng Quốc Anh"],
        "4": ["Đỗ Gia Huy", "Bùi Phương Mai"],
        "5": ["Phan Thanh Tùng", "Đặng Thu Trang"],
        "6": ["Hồ Minh Trí", "Ngô Cẩm Tú"],
        "7": ["Trịnh Văn Kiên", "Lý Thanh Hà"],
        "8": ["Dương Quốc Đạt", "Mai Hồng Nhung"],
        "9": ["Phạm Quang Huy", "Võ Ngọc Bích"],
        "10": ["Đinh Minh Quân", "Lâm Mỹ Duyên"],
        "11": ["Lê Tuấn Khang", "Chu Bảo Yến"],
        "12": ["Nguyễn Thế Bảo", "Tạ Quỳnh Nga"],
        "13": ["Hà Quốc Khánh", "Cao Thục Anh"],
        "14": ["Vương Minh Khôi", "Đoàn Khánh Linh"],
        "15": ["Thái Hữu Phước", "Trần Như Thảo"],
        "16": ["Lâm Nhật Huy", "Nguyễn Mỹ Lan"],
        "17": ["Tạ Văn Hưng", "Phạm Diệu Huyền"],
        "18": ["Đặng Quốc Tuấn", "Dự bị máy 18"]
      }
    },
    "6A2": {
      "className": "Lớp 6A2",
      "grade": 6,
      "totalStudents": 36,
      "seatingPlan": {
        "1": ["Nguyễn Gia Huy", "Trần Mai Anh"],
        "2": ["Lê Minh Khang", "Phạm Thu Thảo"],
        "3": ["Vũ Hải Đăng", "Đặng Thùy Dung"],
        "4": ["Bùi Quốc Bảo", "Hoàng Ngọc Hân"],
        "5": ["Đinh Tuấn Anh", "Ngô Phương Linh"],
        "6": ["Lý Gia Bảo", "Võ Thị Quỳnh"],
        "7": ["Trịnh Đức Trọng", "Dương Mỹ Tâm"],
        "8": ["Phan Bảo Nam", "Cao Thị Yến"],
        "9": ["Hà Minh Triết", "Đoàn Thúy Vi"],
        "10": ["Chu Đình Trọng", "Lâm Mỹ Hạnh"],
        "11": ["Tạ Quốc Cường", "Nguyễn Hồng Hạnh"],
        "12": ["Thái Duy Anh", "Trần Như Quỳnh"],
        "13": ["Lâm Chí Khang", "Bùi Thanh Trúc"],
        "14": ["Vương Quốc Việt", "Đặng Bích Ngọc"],
        "15": ["Hồ Quang Hiếu", "Phạm Mỹ Duyên"],
        "16": ["Mai Hữu Phước", "Nguyễn Cẩm Ly"],
        "17": ["Đặng Văn Hậu", "Lê Thị Bích"],
        "18": ["Trần Tiến Đạt", "Vũ Hoàng My"]
      }
    },
    "6A3": {
      "className": "Lớp 6A3",
      "grade": 6,
      "totalStudents": 34,
      "seatingPlan": {
        "1": ["Trần Tuấn Kiệt", "Nguyễn Thảo Vy"],
        "2": ["Phạm Hoàng Long", "Lê Quỳnh Như"],
        "3": ["Hoàng Gia Bảo", "Vũ Mai Phương"],
        "4": ["Đỗ Minh Trí", "Bùi Khánh Huyền"],
        "5": ["Nguyễn Đức Thắng", "Phan Thùy Trang"],
        "6": ["Vũ Hải Nam", "Trịnh Bảo Ngọc"],
        "7": ["Đặng Văn Khoa", "Trần Thanh Hằng"],
        "8": ["Lê Công Vinh", "Nguyễn Thu Hà"],
        "9": ["Hồ Tấn Tài", "Đoàn Thị Mơ"],
        "10": ["Ngô Văn Toản", "Dương Ánh Nguyệt"],
        "11": ["Lý Quang Diệu", "Phạm Kim Cương"],
        "12": ["Trương Tấn Sang", "Lâm Hải Yến"],
        "13": ["Chu Bá Thông", "Đinh Bích Thủy"],
        "14": ["Vương Đình Huệ", "Mai Hồng Gấm"],
        "15": ["Tạ Quang Bửu", "Phạm Tuyết Nhung"],
        "16": ["Hà Huy Tập", "Nguyễn Bích Liên"],
        "17": ["Thái Bình Dương", "Cao Thùy Chi"],
        "18": ["Lê Quý Đôn", "Dự bị máy 18"]
      }
    },
    "7A1": {
      "className": "Lớp 7A1",
      "grade": 7,
      "totalStudents": 36,
      "seatingPlan": {
        "1": ["Nguyễn Quốc Cường", "Trần Thúy Nga"],
        "2": ["Lê Hồng Phong", "Phạm Diệu Linh"],
        "3": ["Vũ Trọng Phụng", "Đặng Mỹ Linh"],
        "4": ["Bùi Bích Phương", "Hoàng Thùy Linh"],
        "5": ["Đinh Bộ Lĩnh", "Ngô Thanh Vân"],
        "6": ["Lý Thường Kiệt", "Võ Hoàng Yến"],
        "7": ["Trịnh Kiểm", "Dương Cẩm Thúy"],
        "8": ["Phan Bội Châu", "Cao Thái Hà"],
        "9": ["Hà Huy Giáp", "Đoàn Thiên Ân"],
        "10": ["Chu Văn An", "Lâm Khánh Chi"],
        "11": ["Tạ Hiện", "Nguyễn Thúc Thùy Tiên"],
        "12": ["Thái Phiên", "Trần Tiểu Vy"],
        "13": ["Lâm Đồng", "Bùi Quỳnh Hoa"],
        "14": ["Vương Thừa Vũ", "Đặng Thu Thảo"],
        "15": ["Hồ Xuân Hương", "Phạm Hương"],
        "16": ["Mai Thúc Loan", "Nguyễn Thị Huyền"],
        "17": ["Đặng Dung", "Lê Âu Ngân Anh"],
        "18": ["Trần Hưng Đạo", "Dự bị máy 18"]
      }
    },
    "7A2": {
      "className": "Lớp 7A2",
      "grade": 7,
      "totalStudents": 35,
      "seatingPlan": {
        "1": ["Nguyễn Văn An", "Trần Thị Bình"],
        "2": ["Lê Hoàng Cường", "Phạm Minh Đức"],
        "3": ["Hoàng Thu Giang", "Võ Thị Hạnh"],
        "4": ["Đỗ Minh Khang", "Bùi Như Lan"],
        "5": ["Nguyễn Hữu Mai", "Phan Thanh Nam"],
        "6": ["Vũ Hải Oanh", "Trịnh Quốc Phúc"],
        "7": ["Đặng Như Quỳnh", "Trần Văn Sơn"],
        "8": ["Lê Thị Thu", "Nguyễn Minh Uyên"],
        "9": ["Hồ Quang Vinh", "Đoàn Kim Xuân"],
        "10": ["Ngô Gia Bảo", "Dương Thuỳ Châu"],
        "11": ["Lý Minh Dũng", "Phạm Ngọc Em"],
        "12": ["Trương Hoàng Giao", "Lâm Quốc Hùng"],
        "13": ["Chu Thị Kim", "Đinh Văn Long"],
        "14": ["Vương Tuyết Mai", "Mai Văn Nhân"],
        "15": ["Tạ Thị Oanh", "Phạm Hoàng Phương"],
        "16": ["Hà Minh Quân", "Nguyễn Thị Sâm"],
        "17": ["Thái Văn Tài", "Cao Minh Uy"],
        "18": ["Lê Văn Việt", "Trần Như Ý"]
      }
    },
    "8A1": {
      "className": "Lớp 8A1",
      "grade": 8,
      "totalStudents": 38,
      "seatingPlan": {
        "1": ["Nguyễn Tất Thành", "Trần Lệ Xuân"],
        "2": ["Lê Duẩn", "Phạm Thị Yến"],
        "3": ["Võ Nguyên Giáp", "Hoàng Diệu Nhi"],
        "4": ["Đỗ Mười", "Bùi Lan Hương"],
        "5": ["Nguyễn Văn Linh", "Phan Thị Mơ"],
        "6": ["Vũ Đình Hòe", "Trịnh Kim Chi"],
        "7": ["Đặng Thai Mai", "Trần Kiều Trinh"],
        "8": ["Lê Văn Hưu", "Nguyễn Thị Sen"],
        "9": ["Hồ Đắc Di", "Đoàn Thị Điểm"],
        "10": ["Ngô Sĩ Liên", "Dương Thị Hải"],
        "11": ["Lý Tự Trọng", "Phạm Thị Loan"],
        "12": ["Trương Vĩnh Ký", "Lâm Thị Mỹ"],
        "13": ["Chu Mạnh Trinh", "Đinh Thị Vân"],
        "14": ["Vương Hồng Sển", "Mai Thị Nương"],
        "15": ["Tạ Uyên", "Phạm Thị Đào"],
        "16": ["Hà Văn Lâu", "Nguyễn Thị Lựu"],
        "17": ["Thái Văn Lung", "Cao Thị Bầu"],
        "18": ["Lê Hồng Sơn", "Trần Văn Ơn"]
      }
    },
    "8A2": {
      "className": "Lớp 8A2",
      "grade": 8,
      "totalStudents": 37,
      "seatingPlan": {
        "1": ["Nguyễn Thái Học", "Trần Thị Dung"],
        "2": ["Lê Lợi", "Phạm Thị Hậu"],
        "3": ["Vũ Khâm Lân", "Đặng Thị Nhu"],
        "4": ["Bùi Viện", "Hoàng Thị Loan"],
        "5": ["Đinh Tiên Hoàng", "Ngô Gia Tự"],
        "6": ["Lý Thái Tổ", "Võ Thị Sáu"],
        "7": ["Trịnh Hoài Đức", "Dương Vân Nga"],
        "8": ["Phan Chu Trinh", "Cao Bá Quát"],
        "9": ["Hà Tôn Quyền", "Đoàn Nhữ Hài"],
        "10": ["Chu Đạt", "Lâm Hoài Thu"],
        "11": ["Tạ Mỹ Duật", "Nguyễn Thị Định"],
        "12": ["Thái Thuận", "Trần Quốc Toản"],
        "13": ["Lâm Văn Bền", "Bùi Thị Xuân"],
        "14": ["Vương Chí Sình", "Đặng Thùy Trâm"],
        "15": ["Hồ Tùng Mậu", "Phạm Ngọc Thạch"],
        "16": ["Mai Chí Thọ", "Nguyễn Văn Cừ"],
        "17": ["Đặng Tất", "Lê Văn Tám"],
        "18": ["Trần Nhật Duật", "Dự bị máy 18"]
      }
    },
    "9A1": {
      "className": "Lớp 9A1",
      "grade": 9,
      "totalStudents": 36,
      "seatingPlan": {
        "1": ["Nguyễn Văn An", "Trần Thị Bình"],
        "2": ["Lê Hoàng Cường", "Phạm Minh Đức"],
        "3": ["Hoàng Thu Giang", "Võ Thị Hạnh"],
        "4": ["Đỗ Minh Khang", "Bùi Như Lan"],
        "5": ["Nguyễn Hữu Mai", "Phan Thanh Nam"],
        "6": ["Vũ Hải Oanh", "Trịnh Quốc Phúc"],
        "7": ["Đặng Như Quỳnh", "Trần Văn Sơn"],
        "8": ["Lê Thị Thu", "Nguyễn Minh Uyên"],
        "9": ["Hồ Quang Vinh", "Đoàn Kim Xuân"],
        "10": ["Ngô Gia Bảo", "Dương Thuỳ Châu"],
        "11": ["Lý Minh Dũng", "Phạm Ngọc Em"],
        "12": ["Trương Hoàng Giao", "Lâm Quốc Hùng"],
        "13": ["Chu Thị Kim", "Đinh Văn Long"],
        "14": ["Vương Tuyết Mai", "Mai Văn Nhân"],
        "15": ["Tạ Thị Oanh", "Phạm Hoàng Phương"],
        "16": ["Hà Minh Quân", "Nguyễn Thị Sâm"],
        "17": ["Thái Văn Tài", "Cao Minh Uy"],
        "18": ["Lê Văn Việt", "Trần Như Ý"]
      }
    },
    "9A2": {
      "className": "Lớp 9A2",
      "grade": 9,
      "totalStudents": 35,
      "seatingPlan": {
        "1": ["Nguyễn Quốc Cường", "Trần Thúy Nga"],
        "2": ["Lê Hồng Phong", "Phạm Diệu Linh"],
        "3": ["Vũ Trọng Phụng", "Đặng Mỹ Linh"],
        "4": ["Bùi Bích Phương", "Hoàng Thùy Linh"],
        "5": ["Đinh Bộ Lĩnh", "Ngô Thanh Vân"],
        "6": ["Lý Thường Kiệt", "Võ Hoàng Yến"],
        "7": ["Trịnh Kiểm", "Dương Cẩm Thúy"],
        "8": ["Phan Bội Châu", "Cao Thái Hà"],
        "9": ["Hà Huy Giáp", "Đoàn Thiên Ân"],
        "10": ["Chu Văn An", "Lâm Khánh Chi"],
        "11": ["Tạ Hiện", "Nguyễn Thúc Thùy Tiên"],
        "12": ["Thái Phiên", "Trần Tiểu Vy"],
        "13": ["Lâm Đồng", "Bùi Quỳnh Hoa"],
        "14": ["Vương Thừa Vũ", "Đặng Thu Thảo"],
        "15": ["Hồ Xuân Hương", "Phạm Hương"],
        "16": ["Mai Thúc Loan", "Nguyễn Thị Huyền"],
        "17": ["Đặng Dung", "Lê Âu Ngân Anh"],
        "18": ["Trần Hưng Đạo", "Dự bị máy 18"]
      }
    }
  };
  // Fallback an toàn cho dữ liệu cũ nếu có trong bộ nhớ
  EMBEDDED_CLASSES["10A1"] = EMBEDDED_CLASSES["6A1"];
  EMBEDDED_CLASSES["10A2"] = EMBEDDED_CLASSES["6A2"];
  EMBEDDED_CLASSES["11A1"] = EMBEDDED_CLASSES["7A1"];
  EMBEDDED_CLASSES["12A1"] = EMBEDDED_CLASSES["9A1"];

  const DEFAULT_LESSONS = {
    // KHỐI 6
    "tin6_bai12": {
      "id": "tin6_bai12",
      "title": "Bài 12: Thuật toán và sơ đồ khối",
      "grade": "6",
      "objective": "Hiểu khái niệm thuật toán, nhận biết ý nghĩa các hình khối quy ước và vẽ sơ đồ khối giải quyết vấn đề.",
      "oldLesson": {
        "tool": "wheel",
        "timeLimit": 120,
        "question": "Thuật toán là gì? Nêu 3 tính chất quan trọng của một thuật toán trong đời sống và tin học."
      },
      "theoryTask": "Đọc SGK Tin học 6 Bài 12 (trang 54-56), thảo luận theo cặp đôi về khái niệm thuật toán và quy tắc vẽ sơ đồ khối.",
      "theoryDoc": "SGK Tin học 6 Cánh Diều / Kết Nối - Bài 12 Trang 54",
      "warmup": {
        "question": "Trong sơ đồ khối thuật toán, hình nào quy ước dùng để biểu thị thao tác Bắt đầu hoặc Kết thúc?",
        "options": {
          "A": "Hình chữ nhật",
          "B": "Hình Oval (elip)",
          "C": "Hình thoi",
          "D": "Hình bình hành"
        },
        "timeLimit": 45
      },
      "theory": [
        {
          "id": "card-1",
          "title": "1. Khái niệm Thuật toán",
          "summary": "Thuật toán là dãy các chỉ dẫn từng bước rõ ràng, chính xác để giải quyết một nhiệm vụ từ đầu vào (Input) đến đầu ra (Output).",
          "code": "# Ví dụ thuật toán tìm số lớn hơn trong 2 số a, b:\nif a > b:\n    max = a\nelse:\n    max = b\nprint('Số lớn hơn là:', max)",
          "note": "Thuật toán phải có tính dừng, tính xác định và tính đúng đắn."
        },
        {
          "id": "card-2",
          "title": "2. Các hình khối quy ước trong sơ đồ khối",
          "summary": "Sơ đồ khối dùng các hình hình học liên kết bằng mũi tên: Oval (Bắt đầu/Kết thúc), Chữ nhật (Xử lý/Tính toán), Hình thoi (Kiểm tra điều kiện rẽ nhánh), Bình hành (Vào/Ra dữ liệu).",
          "code": "[Bắt đầu] -> [Nhập a, b] -> <a > b?> --(Đúng)--> [In ra a]\n                                    --(Sai)--> [In ra b] -> [Kết thúc]",
          "note": "Mũi tên chỉ hướng thực hiện tuần tự của thuật toán."
        }
      ],
      "discussion": {
        "title": "Nhiệm vụ Thảo luận & Thực hành Nhóm đôi",
        "task": "Hai em hãy thảo luận và mô tả các bước thuật toán:\n1. Thuật toán pha trà chanh hoặc nấu mì tôm theo các bước tuần tự.\n2. Thuật toán tìm số lớn nhất trong hai số a và b.\n3. Hãy nêu ý nghĩa của khối hình thoi trong thuật toán rẽ nhánh.",
        "placeholder": "# Ghi các bước thuật toán của nhóm vào đây:\nBước 1: Bắt đầu...\nBước 2: Nhập dữ liệu...\nBước 3: Kiểm tra điều kiện...",
        "timeLimit": 720
      },
      "quiz": {
        "type": "single_choice",
        "shuffle": true,
        "question": "Đặc điểm nào sau đây KHÔNG PHẢI là tính chất của một thuật toán?",
        "options": {
          "A": "Tính dừng (hữu hạn số bước)",
          "B": "Tính xác định (rõ ràng)",
          "C": "Tính đúng đắn",
          "D": "Tính vô tận (chạy mãi không dừng)"
        },
        "correct": "D",
        "subItems": [
          { "id": "a", "statement": "Thuật toán phải có tính dừng sau hữu hạn bước", "correct": true },
          { "id": "b", "statement": "Thuật toán có thể chạy vô tận không dừng", "correct": false },
          { "id": "c", "statement": "Mỗi bước trong thuật toán phải rõ ràng, xác định", "correct": true },
          { "id": "d", "statement": "Thuật toán giải quyết bài toán từ Input ra Output", "correct": true }
        ],
        "shortAnswer": "TinhVoTan",
        "timeLimit": 20
      },
      "sections": [
        {
          "id": 1,
          "title": "Mục 1: Khái niệm Thuật toán & Mô tả bằng lời",
          "theory": {
            "task": "Đọc SGK mục 1 (trang 54), thảo luận theo cặp đôi về khái niệm thuật toán và phân tích Input, Output của bài toán.",
            "doc": "SGK Tin học 6 - Bài 12 Mục 1",
            "timeLimit": 300
          },
          "quiz": {
            "question": "Đặc điểm nào sau đây KHÔNG PHẢI là tính chất của một thuật toán?",
            "correct": "D",
            "timeLimit": 60
          },
          "quizzes": [
            {
              "id": "q1_1",
              "type": "single_choice",
              "question": "Đặc điểm nào sau đây KHÔNG PHẢI là tính chất của một thuật toán?",
              "options": {
                "A": "Tính dừng (hữu hạn số bước)",
                "B": "Tính xác định (rõ ràng)",
                "C": "Tính đúng đắn",
                "D": "Tính vô tận (chạy mãi không dừng)"
              },
              "correct": "D",
              "timeLimit": 60
            }
          ],
          "practice": {
            "title": "Nhiệm vụ Thảo luận thuật toán đời sống",
            "task": "Hai em hãy liệt kê các bước tuần tự để giải quyết nhiệm vụ: \"Đánh răng mỗi sáng\" hoặc \"Tính tiền mua bánh mì\".",
            "placeholder": "# Nhập các bước tuần tự tại đây...",
            "timeLimit": 600
          }
        },
        {
          "id": 2,
          "title": "Mục 2: Các hình khối quy ước trong Sơ đồ khối",
          "theory": {
            "task": "Đọc SGK mục 2 (trang 55-56), nắm vững ý nghĩa của 4 hình khối: Oval, Chữ nhật, Hình thoi, Bình hành.",
            "doc": "SGK Tin học 6 - Bài 12 Mục 2",
            "timeLimit": 300
          },
          "quiz": {
            "question": "Trong sơ đồ khối, thao tác tính toán 'tong = a + b' được đặt trong hình nào?",
            "correct": "A",
            "timeLimit": 60
          },
          "quizzes": [
            {
              "id": "q2_1",
              "type": "single_choice",
              "question": "Trong sơ đồ khối, thao tác tính toán 'tong = a + b' được đặt trong hình nào?",
              "options": {
                "A": "Hình chữ nhật",
                "B": "Hình thoi",
                "C": "Hình oval",
                "D": "Hình bình hành"
              },
              "correct": "A",
              "timeLimit": 60
            }
          ],
          "practice": {
            "title": "Thực hành vẽ sơ đồ khối rẽ nhánh",
            "task": "Vẽ sơ đồ khối thuật toán kiểm tra một học sinh: nếu điểm >= 5 thì in \"Đạt\", ngược lại in \"Chưa đạt\".",
            "timeLimit": 600
          }
        }
      ],
      "stepsEnabled": { "1": true, "2": true, "3": true, "4": true, "5": true }
    },
    "tin6_bai1": {
      "id": "tin6_bai1",
      "title": "Bài 01: Thông tin và thu nhận thông tin",
      "grade": "6",
      "objective": "Phân biệt được thông tin và vật mang tin, nắm được các giác quan thu nhận thông tin của con người.",
      "oldLesson": {
        "tool": "wheel",
        "timeLimit": 120,
        "question": "Con người thu nhận thông tin từ thế giới xung quanh qua những giác quan nào?"
      },
      "theoryTask": "Đọc SGK Tin học 6 Bài 1, thảo luận về vai trò của thông tin trong học tập và sinh hoạt hàng ngày.",
      "theoryDoc": "SGK Tin học 6 - Bài 1 Trang 5",
      "quiz": {
        "question": "Vật nào sau đây được xem là vật mang tin?",
        "options": {
          "A": "Quyển sách giáo khoa",
          "B": "Tiếng trống trường",
          "C": "Lời cô giáo giảng",
          "D": "Mùi hương hoa hồng"
        },
        "correct": "A",
        "timeLimit": 20
      },
      "discussion": {
        "title": "Thảo luận về các dạng thông tin cơ bản",
        "task": "Kể tên 3 dạng thông tin cơ bản mà máy tính có thể xử lý được.",
        "placeholder": "# Nhập câu trả lời nhóm...",
        "timeLimit": 600
      },
      "stepsEnabled": { "1": true, "2": true, "3": true, "4": true, "5": true }
    },
    "tin6_bai4": {
      "id": "tin6_bai4",
      "title": "Bài 04: Mạng máy tính và Internet",
      "grade": "6",
      "objective": "Hiểu mạng máy tính là gì, nhận biết các thiết bị mạng cơ bản như cáp mạng, switch, modem, wifi.",
      "oldLesson": {
        "tool": "wheel",
        "timeLimit": 120,
        "question": "Mạng máy tính đem lại những lợi ích gì cho việc chia sẻ dữ liệu và học tập?"
      },
      "theoryTask": "Đọc SGK mục 1 và 2 về các thành phần của mạng máy tính.",
      "theoryDoc": "SGK Tin học 6 - Bài 4 Trang 18",
      "quiz": {
        "question": "Thiết bị nào sau đây dùng để phát sóng mạng không dây trong phòng máy?",
        "options": {
          "A": "Bộ phát Wifi (Wireless Access Point)",
          "B": "Màn hình máy tính",
          "C": "Máy in",
          "D": "Chuột máy tính"
        },
        "correct": "A",
        "timeLimit": 20
      },
      "discussion": {
        "title": "Khám phá phòng máy thực hành",
        "task": "Quan sát phòng máy tính của trường và xác định switch mạng, dây cáp mạng kết nối 18 máy tính.",
        "placeholder": "# Nhập quan sát của nhóm...",
        "timeLimit": 600
      },
      "stepsEnabled": { "1": true, "2": true, "3": true, "4": true, "5": true }
    },

    // KHỐI 7
    "tin7_bai1": {
      "id": "tin7_bai1",
      "title": "Bài 01: Thiết bị vào - Thiết bị ra",
      "grade": "7",
      "objective": "Phân biệt thiết bị vào (chuột, bàn phím, webcam) và thiết bị ra (màn hình, máy in, loa) của máy tính.",
      "oldLesson": {
        "tool": "wheel",
        "timeLimit": 120,
        "question": "Kể tên 3 thiết bị vào và 3 thiết bị ra của máy tính để bàn?"
      },
      "theoryTask": "Đọc SGK Tin 7 Bài 1 về chức năng các cổng kết nối USB, HDMI, Audio.",
      "theoryDoc": "SGK Tin học 7 - Bài 1 Trang 6",
      "quiz": {
        "question": "Màn hình cảm ứng trên điện thoại thông minh thuộc loại thiết bị nào?",
        "options": {
          "A": "Chỉ là thiết bị vào",
          "B": "Chỉ là thiết bị ra",
          "C": "Vừa là thiết bị vào vừa là thiết bị ra",
          "D": "Không phải thiết bị vào hay ra"
        },
        "correct": "C",
        "timeLimit": 20
      },
      "discussion": {
        "title": "Thực hành kiểm tra thiết bị vào/ra máy trạm",
        "task": "Kiểm tra bàn phím, chuột và màn hình của máy tính nhóm đang ngồi.",
        "placeholder": "# Nhập báo cáo trạng thái máy...",
        "timeLimit": 600
      },
      "stepsEnabled": { "1": true, "2": true, "3": true, "4": true, "5": true }
    },
    "tin7_bai8": {
      "id": "tin7_bai8",
      "title": "Bài 08: Sử dụng các hàm trong bảng tính Excel",
      "grade": "7",
      "objective": "Sử dụng thành thạo các hàm tính toán cơ bản: SUM, AVERAGE, MAX, MIN, COUNT trong bảng tính.",
      "oldLesson": {
        "tool": "wheel",
        "timeLimit": 120,
        "question": "Cú pháp của hàm tính trung bình cộng trong bảng tính là gì?"
      },
      "theoryTask": "Đọc SGK mục các hàm tính toán trong phần mềm bảng tính.",
      "theoryDoc": "SGK Tin học 7 - Bài 8 Trang 36",
      "quiz": {
        "question": "Công thức =SUM(A1:A5) có chức năng gì?",
        "options": {
          "A": "Tính tổng các ô từ A1 đến A5",
          "B": "Tìm giá trị lớn nhất từ A1 đến A5",
          "C": "Tính trung bình cộng từ A1 đến A5",
          "D": "Đếm số ô có dữ liệu"
        },
        "correct": "A",
        "timeLimit": 20
      },
      "discussion": {
        "title": "Thực hành tính điểm trung bình học kỳ",
        "task": "Viết công thức tính điểm trung bình cho cột Toán, Tin, Văn bằng hàm AVERAGE.",
        "placeholder": "# Nhập công thức Excel...",
        "timeLimit": 600
      },
      "stepsEnabled": { "1": true, "2": true, "3": true, "4": true, "5": true }
    },

    // KHỐI 8
    "tin8_bai1": {
      "id": "tin8_bai1",
      "title": "Bài 01: Lịch sử phát triển của máy tính",
      "grade": "8",
      "objective": "Nắm được 5 thế hệ máy tính và sự thu nhỏ kích thước nhưng tăng vọt về tốc độ xử lý.",
      "oldLesson": {
        "tool": "wheel",
        "timeLimit": 120,
        "question": "Thế hệ máy tính thứ nhất sử dụng linh kiện điện tử nào làm nòng cốt?"
      },
      "theoryTask": "Đọc SGK Tin 8 Bài 1 về đèn điện tử chân không, bóng bán dẫn và vi mạch IC.",
      "theoryDoc": "SGK Tin học 8 - Bài 1 Trang 5",
      "quiz": {
        "question": "Máy tính điện tử thế hệ đầu tiên ENIAC sử dụng linh kiện gì?",
        "options": {
          "A": "Đèn điện tử chân không",
          "B": "Bóng bán dẫn (Transistor)",
          "C": "Mạch tích hợp (IC)",
          "D": "Bộ vi xử lý siêu lớn (VLSI)"
        },
        "correct": "A",
        "timeLimit": 20
      },
      "discussion": {
        "title": "Thảo luận về máy tính lượng tử tương lai",
        "task": "Nêu cảm nhận về tốc độ phát triển công nghệ máy tính từ cỗ máy nặng 30 tấn đến điện thoại nhỏ gọn trên tay.",
        "placeholder": "# Nhập cảm nhận nhóm...",
        "timeLimit": 600
      },
      "stepsEnabled": { "1": true, "2": true, "3": true, "4": true, "5": true }
    },
    "tin8_bai11": {
      "id": "tin8_bai11",
      "title": "Bài 11: Lập trình trực quan Scratch và giải quyết vấn đề",
      "grade": "8",
      "objective": "Hiểu cấu trúc lặp, rẽ nhánh và tạo trò chơi hoặc hoạt hình tương tác bằng Scratch.",
      "oldLesson": {
        "tool": "wheel",
        "timeLimit": 120,
        "question": "Khối lệnh 'lặp lại 10 lần' thuộc nhóm lệnh nào trong Scratch?"
      },
      "theoryTask": "Đọc SGK Tin 8 mục cấu trúc lặp và biến số trong Scratch.",
      "theoryDoc": "SGK Tin học 8 - Bài 11 Trang 52",
      "quiz": {
        "question": "Để nhân vật di chuyển liên tục khi chạm vào cạnh sân khấu thì bật lại, dùng khối lệnh nào?",
        "options": {
          "A": "nếu chạm cạnh, bật lại",
          "B": "di chuyển 10 bước",
          "C": "xoay phải 15 độ",
          "D": "dừng lại tất cả"
        },
        "correct": "A",
        "timeLimit": 20
      },
      "discussion": {
        "title": "Thiết kế kịch bản nhân vật di chuyển",
        "task": "Lập trình chú mèo di chuyển theo 4 phím mũi tên trên bàn phím.",
        "placeholder": "# Mô tả kịch bản khối lệnh Scratch...",
        "timeLimit": 600
      },
      "stepsEnabled": { "1": true, "2": true, "3": true, "4": true, "5": true }
    },

    // KHỐI 9
    "tin9_bai1": {
      "id": "tin9_bai1",
      "title": "Bài 01: Thế giới thiết bị số và trí tuệ nhân tạo",
      "grade": "9",
      "objective": "Hiểu sự hiện diện của thiết bị số thông minh và bước đầu làm quen với khái niệm trí tuệ nhân tạo (AI).",
      "oldLesson": {
        "tool": "wheel",
        "timeLimit": 120,
        "question": "Kể tên 3 ứng dụng của Trí tuệ nhân tạo (AI) mà em biết trong cuộc sống?"
      },
      "theoryTask": "Đọc SGK Tin 9 Bài 1 về xe tự lái, trợ lý ảo và nhận diện khuôn mặt.",
      "theoryDoc": "SGK Tin học 9 - Bài 1 Trang 5",
      "quiz": {
        "question": "Ứng dụng nào sau đây sử dụng công nghệ nhận diện giọng nói bằng AI?",
        "options": {
          "A": "Trợ lý ảo Google Assistant / Siri",
          "B": "Phần mềm gõ văn bản Notepad",
          "C": "Bảng tính Calculator",
          "D": "Ứng dụng vẽ Paint"
        },
        "correct": "A",
        "timeLimit": 20
      },
      "discussion": {
        "title": "Thảo luận về ứng dụng AI trong học tập",
        "task": "Thảo luận theo cặp đôi về lợi ích và những lưu ý khi sử dụng AI để hỗ trợ học tập.",
        "placeholder": "# Nhập ý kiến thảo luận...",
        "timeLimit": 600
      },
      "stepsEnabled": { "1": true, "2": true, "3": true, "4": true, "5": true }
    },
    "tin9_bai8": {
      "id": "tin9_bai8",
      "title": "Bài 08: Thực hành phần mềm bảng tính và trình chiếu",
      "grade": "9",
      "objective": "Tạo bài trình chiếu đa phương tiện kết hợp biểu đồ thống kê từ phần mềm bảng tính.",
      "oldLesson": {
        "tool": "wheel",
        "timeLimit": 120,
        "question": "Để tạo biểu đồ hình cột trong Excel, em vào dải lệnh nào?"
      },
      "theoryTask": "Đọc SGK Tin 9 về cách liên kết dữ liệu bảng tính sang trang chiếu.",
      "theoryDoc": "SGK Tin học 9 - Bài 8 Trang 38",
      "quiz": {
        "question": "Phím tắt nào để bắt đầu trình chiếu toàn màn hình từ trang đầu tiên trong PowerPoint?",
        "options": {
          "A": "F5",
          "B": "Shift + F5",
          "C": "F1",
          "D": "Ctrl + P"
        },
        "correct": "A",
        "timeLimit": 20
      },
      "discussion": {
        "title": "Thực hành thiết kế 3 trang slide báo cáo",
        "task": "Thiết kế bài trình chiếu giới thiệu về phòng máy tương tác 18 máy tính của trường.",
        "placeholder": "# Ghi nội dung 3 slide...",
        "timeLimit": 600
      },
      "stepsEnabled": { "1": true, "2": true, "3": true, "4": true, "5": true }
    },
    "tin9_bai12": {
      "id": "tin9_bai12",
      "title": "Bài 12: Làm quen với ngôn ngữ lập trình Python cơ bản",
      "grade": "9",
      "objective": "Làm quen với cú pháp Python, biến, kiểu dữ liệu số và xâu ký tự cơ bản.",
      "oldLesson": {
        "tool": "wheel",
        "timeLimit": 120,
        "question": "Hàm nào trong Python được dùng để in thông tin ra màn hình?"
      },
      "theoryTask": "Đọc SGK Tin 9 Bài 12 về môi trường chạy Python và lệnh print().",
      "theoryDoc": "SGK Tin học 9 - Bài 12 Trang 60",
      "quiz": {
        "question": "Lệnh nào sau đây in ra màn hình dòng chữ 'Xin chao' trong Python?",
        "options": {
          "A": "print(\"Xin chao\")",
          "B": "echo \"Xin chao\"",
          "C": "write(\"Xin chao\")",
          "D": "cout << \"Xin chao\""
        },
        "correct": "A",
        "timeLimit": 20
      },
      "discussion": {
        "title": "Viết chương trình Python tính chu vi hình chữ nhật",
        "task": "Nhập 2 cạnh a, b và in ra chu vi hình chữ nhật (a + b) * 2.",
        "placeholder": "# Viết code Python tại đây:\na = int(input())\nb = int(input())\nprint(\"Chu vi:\", (a + b) * 2)",
        "timeLimit": 600
      },
      "stepsEnabled": { "1": true, "2": true, "3": true, "4": true, "5": true }
    }
  };

  // Tương thích ngược với các ID bài dạy cũ để tránh lỗi cache
  DEFAULT_LESSONS["tin10_bai12"] = DEFAULT_LESSONS["tin6_bai12"];
  DEFAULT_LESSONS["tin10_bai1"] = DEFAULT_LESSONS["tin6_bai1"];
  DEFAULT_LESSONS["tin11_bai1"] = DEFAULT_LESSONS["tin7_bai1"];
  DEFAULT_LESSONS["tin12_bai1"] = DEFAULT_LESSONS["tin9_bai1"];

  let customLessons = {};
  try {
    const savedLessons = localStorage.getItem('lms_custom_lessons');
    if (savedLessons) {
      customLessons = JSON.parse(savedLessons);
    }
  } catch (err) { console.warn("[Handled Error Warning]:", err?.message || err); }

  const EMBEDDED_LESSONS = Object.assign({}, DEFAULT_LESSONS, customLessons);

  // Mật khẩu Giáo viên mã hóa SHA-256 (Chuẩn bảo mật NIST FIPS 180-4, cấm lưu hoặc so sánh chuỗi trần)
  const VALID_PASSWORD_HASHES = [
    "240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9",
    "33c39cf33ac4a48e2fb588c2fbb99092043744f685a6f5c8d91c8f554139604b"
  ];

  function sha256Fallback(ascii) {
    function rightRotate(value, amount) {
      return (value >>> amount) | (value << (32 - amount));
    }
    const mathPow = Math.pow;
    const maxWord = mathPow(2, 32);
    let i, j;
    let result = '';
    const words = [];
    const asciiBitLength = ascii.length * 8;
    let hash = [];
    const k = [];
    let primeCounter = 0;
    const isComposite = {};
    for (let candidate = 2; primeCounter < 64; candidate++) {
      if (!isComposite[candidate]) {
        for (i = candidate * 2; i < 313; i += candidate) {
          isComposite[i] = true;
        }
        hash[primeCounter] = (mathPow(candidate, 0.5) * maxWord) | 0;
        k[primeCounter] = (mathPow(candidate, 1 / 3) * maxWord) | 0;
        primeCounter++;
      }
    }
    hash = hash.slice(0, 8);
    ascii += '\x80';
    while ((ascii.length % 64) - 56) ascii += '\x00';
    for (i = 0; i < ascii.length; i++) {
      j = ascii.charCodeAt(i);
      words[i >> 2] |= j << ((3 - (i % 4)) * 8);
    }
    words[words.length] = (asciiBitLength / maxWord) | 0;
    words[words.length] = asciiBitLength | 0;
    for (j = 0; j < words.length;) {
      const w = words.slice(j, (j += 16));
      const oldHash = hash;
      hash = hash.slice(0, 8);
      for (i = 0; i < 64; i++) {
        const w15 = w[i - 15], w2 = w[i - 2];
        const s0 = rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3);
        const s1 = rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10);
        const ch = (hash[4] & hash[5]) ^ (~hash[4] & hash[6]);
        const maj = (hash[0] & hash[1]) ^ (hash[0] & hash[2]) ^ (hash[1] & hash[2]);
        const s1_ = rightRotate(hash[4], 6) ^ rightRotate(hash[4], 11) ^ rightRotate(hash[4], 25);
        const s0_ = rightRotate(hash[0], 2) ^ rightRotate(hash[0], 13) ^ rightRotate(hash[0], 22);
        const temp1 = hash[7] + s1_ + ch + k[i] + (w[i] = (i < 16) ? (w[i] | 0) : (w[i - 16] + s0 + w[i - 7] + s1) | 0);
        const temp2 = s0_ + maj;
        hash = [(temp1 + temp2) | 0, hash[0], hash[1], hash[2], (hash[3] + temp1) | 0, hash[4], hash[5], hash[6]];
      }
      for (i = 0; i < 8; i++) {
        hash[i] = (hash[i] + oldHash[i]) | 0;
      }
    }
    for (i = 0; i < 8; i++) {
      for (let b = 3; b >= 0; b--) {
        const byte = (hash[i] >> (8 * b)) & 255;
        result += byte.toString(16).padStart(2, '0');
      }
    }
    return result;
  }

  async function sha256Hex(message) {
    if (!message || typeof message !== 'string') return '';
    try {
      if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
        const msgBuffer = new TextEncoder().encode(message);
        const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      }
    } catch (err) { console.warn("[Handled Error Warning]:", err?.message || err); }
    return sha256Fallback(message);
  }

  // Bộ phát âm thanh Web Audio API (Tự tạo sóng âm chân thực, không cần nạp file mp3 ngoài)
  const SOUNDS = {
    ctx: null,
    init() {
      if (!this.ctx && typeof (window.AudioContext || window.webkitAudioContext) !== 'undefined') {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioCtx();
      }
    },
    playTick(freq = 600) {
      try {
        this.init();
        if (!this.ctx) return;
        if (this.ctx.state === 'suspended') this.ctx.resume();
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.04);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.05);
      } catch (err) { console.warn("[Handled Error Warning]:", err?.message || err); }
    },
    playFanfare() {
      try {
        this.init();
        if (!this.ctx) return;
        if (this.ctx.state === 'suspended') this.ctx.resume();
        const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
        notes.forEach((freq, idx) => {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, this.ctx.currentTime + idx * 0.09);
          gain.gain.setValueAtTime(0.18, this.ctx.currentTime + idx * 0.09);
          gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + idx * 0.09 + 0.3);
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(this.ctx.currentTime + idx * 0.09);
          osc.stop(this.ctx.currentTime + idx * 0.09 + 0.35);
        });
      } catch (err) { console.warn("[Handled Error Warning]:", err?.message || err); }
    },
    playChime() {
      try {
        this.init();
        if (!this.ctx) return;
        if (this.ctx.state === 'suspended') this.ctx.resume();
        const notes = [783.99, 1046.50, 1318.51]; // G5, C6, E6
        notes.forEach((freq, idx) => {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, this.ctx.currentTime + idx * 0.12);
          gain.gain.setValueAtTime(0.15, this.ctx.currentTime + idx * 0.12);
          gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + idx * 0.12 + 0.5);
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(this.ctx.currentTime + idx * 0.12);
          osc.stop(this.ctx.currentTime + idx * 0.12 + 0.55);
        });
      } catch (err) { console.warn("[Handled Error Warning]:", err?.message || err); }
    },
    playPop() {
      try {
        this.init();
        if (!this.ctx) return;
        if (this.ctx.state === 'suspended') this.ctx.resume();
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(400, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(800, this.ctx.currentTime + 0.06);
        gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.07);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.08);
      } catch (err) { console.warn("[Handled Error Warning]:", err?.message || err); }
    },
    playClank() {
      try {
        this.init();
        if (!this.ctx) return;
        if (this.ctx.state === 'suspended') this.ctx.resume();
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(260, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(80, this.ctx.currentTime + 0.12);
        gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.18);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.2);
      } catch (err) { console.warn("[Handled Error Warning]:", err?.message || err); }
    }
  };
  const AUDIO = SOUNDS;

  // 2. STORE — QUẢN LÝ TRẠNG THÁI TỔNG THỂ
  const STORE = {
    state: {
      role: 'student',          // 'student' hoặc 'teacher'
      screen: 'lobby',          // 'lobby', 'student', hoặc 'teacher'
      classId: '6A1',          // Lớp hiện tại
      lessonId: 'tin6_bai12',
      lessonData: EMBEDDED_LESSONS['tin6_bai12'],
      fixedMachineId: null,     // Số máy đã lưu cố định trên thiết bị này
      machineId: null,          // Số máy hiện tại đang mở trong phiên
      pendingMachineId: null,   // Số máy đang chờ bấm xác nhận trong modal
      students: [],             // Danh sách 2 bạn tại máy
      occupiedMachines: {},     // Danh sách các máy đã có bạn khác chọn (đồng bộ thời gian thực)
      currentPhase: 'waiting',  // 'waiting', 'old_lesson', 'warmup', 'theory', 'discussion', 'quiz'
      pollSelection: null,
      pollLocked: false,
      pollAnswers: {},          // Bảng lưu lựa chọn Quick Poll thật của các máy
      discStatus: 'working',
      discSubmissionTime: null,
      discussionAnswers: {},    // Bảng lưu bài làm thảo luận/code thật của các máy
      quizSelection: null,
      quizAnswered: false,
      quizAnswers: {},          // Bảng lưu kết quả Live Quiz thật của các máy
      isSos: false,

      // Trạng thái Bước 1: Kiểm tra bài cũ
      oldLesson: {
        timerSeconds: 120,
        timeLeft: 120,
        timerActive: false,
        questionType: 'text',   // 'text' hoặc 'mcq'
        questionText: 'Trong các bộ phận cơ bản của máy tính (CPU, RAM, ROM/Ổ đĩa cứng), thiết bị nào đóng vai trò là "bộ não" điều khiển mọi hoạt động của máy tính?',
        selectedMachine: null,
        selectedStudent: null,
        isLocked: false,
        isRevealed: false,
        studentAnswer: '',
        submissions: {}
      },
      luckyDraw: {
        strategy: 'slot_machine', // 'slot_machine' hoặc 'wheel_fortune'
        isSpinning: false,
        resultMachine: null,
        resultStudent: null
      },

      // Trạng thái Bảng điều khiển Giáo viên
      teacherTab: 'stage',      // 'classes' | 'studio' | 'stage'
      teacherStage: 'hardware', // 'hardware' (Giai đoạn 1) hoặc 'active' (Giai đoạn 2)
      teacherPhase: 'waiting',
      sessionStarted: false,
      unlocked: false,          // Mặc định sảnh chọn máy bị khóa cứng
      grade: '6',              // Khối lớp đang chọn
      countdown: { active: false, title: '', number: 3 },
      timer: { endsAt: 0, paused: false, secondsLeft: 0, totalSeconds: 0, isRunning: false },
      lastFinishedActivity: null,
      hardwareStatus: {
        1: true, 2: true, 3: false, 4: true, 5: true, 6: true,
        7: true, 8: true, 9: true, 10: true, 11: true, 12: true,
        13: true, 14: true, 15: true, 16: true, 17: true, 18: true
      }
    },
    listeners: [],
    subscribe(fn) {
      this.listeners.push(fn);
      return () => { this.listeners = this.listeners.filter(l => l !== fn); };
    },
    setState(updates) {
      this.state = Object.assign({}, this.state, updates);
      this.listeners.forEach(fn => {
        try { fn(this.state); } catch (e) { console.error('[Store Error]:', e); }
      });
    },
    getState() { return this.state; },

    // Khởi tạo và nhận diện token lưu nhớ máy
    loadSavedDeviceToken() {
      try {
        const params = new URLSearchParams(window.location.search);
        const setMachineParam = params.get('machine') || params.get('set_machine');
        if (setMachineParam) {
          const num = parseInt(setMachineParam, 10);
          if (num >= 1 && num <= 18) {
            localStorage.setItem('lms_fixed_machine_id', num.toString());
            this.state.fixedMachineId = num;
            this.state.machineId = num;
            this.state.screen = 'lobby';
            const cData = EMBEDDED_CLASSES[this.state.classId || '6A1'];
            if (cData && cData.seatingPlan && cData.seatingPlan[num]) {
              this.state.students = cData.seatingPlan[num];
            }
            return num;
          }
        }
        const saved = localStorage.getItem('lms_fixed_machine_id');
        if (saved) {
          const num = parseInt(saved, 10);
          if (num >= 1 && num <= 18) {
            this.state.fixedMachineId = num;
            this.state.machineId = num;
            this.state.screen = 'lobby';
            const cData = EMBEDDED_CLASSES[this.state.classId || '6A1'];
            if (cData && cData.seatingPlan && cData.seatingPlan[num]) {
              this.state.students = cData.seatingPlan[num];
            }
            return num;
          }
        }
      } catch (e) {
        console.warn('[LocalStorage] Không truy cập được storage:', e);
      }
      return null;
    },

    checkAdminSession() {
      try {
        const isAdmin = sessionStorage.getItem('lms_admin_logged_in');
        const params = new URLSearchParams(window.location.search);
        if (isAdmin === 'true' || params.get('role') === 'teacher') {
          this.state.role = 'teacher';
          this.state.screen = 'teacher';
          return true;
        }
      } catch (err) { console.warn("[Handled Error Warning]:", err?.message || err); }
      return false;
    }
  };

  // 3. FIREBASE WRAPPER (Tự động thích ứng nếu không có mạng)
  const FIREBASE_CONFIG = {
    apiKey: "AIzaSyCC2tCURXYAMpdN687kcjY537K7zUhh_Fg",
    authDomain: "day-hoc-tuong-tac-7ee69.firebaseapp.com",
    databaseURL: "https://day-hoc-tuong-tac-7ee69-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "day-hoc-tuong-tac-7ee69",
    storageBucket: "day-hoc-tuong-tac-7ee69.firebasestorage.app",
    messagingSenderId: "628267818434",
    appId: "1:628267818434:web:a0b8d1ceda61affea20a5b"
  };

  let db = null;
  function initFirebase() {
    if (typeof firebase !== 'undefined') {
      try {
        if (!firebase.apps || firebase.apps.length === 0) {
          firebase.initializeApp(FIREBASE_CONFIG);
        }
        db = firebase.database();
        if (firebase.auth) {
          if (!firebase.auth().currentUser && !window._fbAuthBlockLogged) {
            firebase.auth().signInAnonymously().then(cred => {
              console.log('[Firebase Auth] Đăng nhập ẩn danh thành công! UID:', cred.user?.uid);
            }).catch(err => {
              window._fbAuthBlockLogged = true;
              console.warn('[Firebase Auth] Lỗi đăng nhập ẩn danh:', err?.message || err);
            });
          }
        }
        console.log('[Firebase] Đã kết nối cơ sở dữ liệu thời gian thực.');
      } catch (e) {
        console.warn('[Firebase] Đang chạy chế độ Local Standalone:', e);
      }
    }
  }

  // Quản trị hàng đợi ngoại tuyến & Tự động thử lại khi gián đoạn mạng (Offline-Resilient Queue & Retry)
  const OFFLINE_QUEUE_KEY = 'cvalms_offline_queue';
  let isFlushingQueue = false;

  function enqueueOfflineAction(op, path, data) {
    try {
      const raw = localStorage.getItem(OFFLINE_QUEUE_KEY);
      let queue = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(queue)) queue = [];

      // Chống trùng lặp (Deduplication): Nếu cùng path và cùng op thì cập nhật data và timestamp
      const existingIdx = queue.findIndex(item => item.path === path && item.op === op);
      const actionItem = {
        id: 'off_' + Date.now() + '_' + Math.random().toString(36).slice(2, 9),
        op: op || 'update', // 'update' | 'set' | 'remove'
        path,
        data,
        timestamp: Date.now()
      };

      if (existingIdx !== -1) {
        queue[existingIdx] = actionItem;
      } else {
        queue.push(actionItem);
      }

      if (queue.length > 100) queue.shift();
      localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
    } catch (err) {
      console.warn('[Offline Queue Enqueue Warning]:', err?.message || err);
    }
  }

  async function flushOfflineQueue() {
    if (!db || !navigator.onLine || isFlushingQueue) return;
    isFlushingQueue = true;
    try {
      const raw = localStorage.getItem(OFFLINE_QUEUE_KEY);
      if (!raw) {
        isFlushingQueue = false;
        return;
      }
      let queue = JSON.parse(raw);
      if (!Array.isArray(queue) || queue.length === 0) {
        isFlushingQueue = false;
        return;
      }

      // Xử lý từng item tuần tự; CHỈ XÓA ITEM KHỎI QUEUE KHI GHI THÀNH CÔNG VÀO CLOUD RTDB
      while (queue.length > 0) {
        const item = queue[0];
        try {
          if (item.op === 'set') {
            await db.ref(item.path).set(item.data);
          } else if (item.op === 'remove') {
            await db.ref(item.path).remove();
          } else {
            await db.ref(item.path).update(item.data);
          }
          // Thành công: Xóa item đã xử lý khỏi localStorage
          queue.shift();
          localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
        } catch (itemErr) {
          console.warn(`[Offline Queue Flush Item Error] Không thể gửi item [${item.path}], tạm dừng flush để bảo toàn dữ liệu:`, itemErr?.message || itemErr);
          break; // Giữ lại các item còn lại, không xóa mất dữ liệu!
        }
      }
    } catch (err) {
      console.warn('[Offline Queue Flush Warning]:', err?.message || err);
    } finally {
      isFlushingQueue = false;
    }
  }

  window.addEventListener('online', () => {
    console.log('[Network] Kết nối Internet/LAN phục hồi, tiến hành đồng bộ hàng đợi ngoại tuyến...');
    flushOfflineQueue();
  });

  // Thực thi thao tác Firebase an toàn với đúng 3 lần thử (1 initial + 2 retries = 3 attempts)
  function safeFirebaseWrite(op, path, data, maxAttempts = 3) {
    if (!db) {
      enqueueOfflineAction(op, path, data);
      return Promise.resolve();
    }

    const executeOp = () => {
      if (op === 'set') return db.ref(path).set(data);
      if (op === 'remove') return db.ref(path).remove();
      return db.ref(path).update(data);
    };

    const attempt = (attemptNumber) => { // attemptNumber: 1, 2, 3
      let authPromise = Promise.resolve();
      if (typeof firebase !== 'undefined' && firebase.auth && !firebase.auth().currentUser && !window._fbAuthBlockLogged) {
        authPromise = firebase.auth().signInAnonymously().catch(err => {
          window._fbAuthBlockLogged = true;
          console.warn('[Firebase Auth Anonymous Warning]:', err?.message || err);
        });
      }
      return authPromise.then(executeOp).catch(err => {
        if (attemptNumber < maxAttempts) {
          const delay = attemptNumber * 350; // Lần 1 fail -> delay 350ms -> thử lần 2. Lần 2 fail -> delay 700ms -> thử lần 3.
          return new Promise((resolve) => setTimeout(resolve, delay)).then(() => attempt(attemptNumber + 1));
        } else {
          console.warn(`[Firebase Sync Error] Thất bại sau đúng ${maxAttempts} lần thử tại node [${path}]. Chuyển vào hàng đợi ngoại tuyến:`, err?.message || err);
          enqueueOfflineAction(op, path, data);
          return Promise.resolve();
        }
      });
    };

    return attempt(1);
  }

  function safeFirebaseUpdate(path, data, maxAttempts = 3) {
    return safeFirebaseWrite('update', path, data, maxAttempts);
  }

  function safeFirebaseSet(path, data, maxAttempts = 3) {
    return safeFirebaseWrite('set', path, data, maxAttempts);
  }

  function safeFirebaseRemove(path, maxAttempts = 3) {
    return safeFirebaseWrite('remove', path, null, maxAttempts);
  }

  if (typeof window !== 'undefined') {
    window.safeFirebaseUpdate = safeFirebaseUpdate;
    window.safeFirebaseSet = safeFirebaseSet;
    window.safeFirebaseRemove = safeFirebaseRemove;
    window.flushOfflineQueue = flushOfflineQueue;
    window.enqueueOfflineAction = enqueueOfflineAction;
  }

  // 3.5. REALTIME SYNC BUS (Đồng bộ tức thì đa tab / đa cửa sổ / PWA)
  const SYNC_BUS = window.SYNC_BUS = {
    channel: (typeof BroadcastChannel !== 'undefined') ? new BroadcastChannel('cvalms_sync_bus') : null,
    init() {
      if (this.channel) {
        this.channel.onmessage = (event) => this.handleMessage(event.data);
      }
      window.addEventListener('storage', (e) => {
        if (e.key === 'cvalms_sync_event' && e.newValue) {
          try {
            const data = JSON.parse(e.newValue);
            this.handleMessage(data);
          } catch (err) { console.warn("[Handled Error Warning]:", err?.message || err); }
        }
      });
      // Khởi tạo trạng thái mới nhất từ storage nếu có
      try {
        const lastSync = localStorage.getItem('cvalms_sync_event');
        if (lastSync) {
          const data = JSON.parse(lastSync);
          if (data && (Date.now() - data.timestamp < 300000)) {
            this.handleMessage(data);
          }
        }
      } catch (err) { console.warn("[Handled Error Warning]:", err?.message || err); }
      // Nếu Firebase sẵn sàng, lắng nghe session từ Firebase
      if (db) {
        try {
          const attachSessionListener = () => {
            // Lắng nghe NTP Time Offset để đồng bộ mili-giây chuẩn tuyệt đối
            db.ref('.info/serverTimeOffset').on('value', (offsetSnap) => {
              window._serverTimeOffset = offsetSnap.val() || 0;
            });

            db.ref('activeSession').on('value', (snap) => {
              const val = snap.val();
              if (!val) return;
              const state = STORE.getState();
              const updates = {};

              // 1. Đồng bộ trạng thái mở khóa chọn máy từ GV
              if (val.unlocked !== undefined && val.unlocked !== state.unlocked) {
                updates.unlocked = val.unlocked;
                if (val.unlocked && state.role === 'student') {
                  AUDIO.playChime();
                }
              }

              // 2. Đồng bộ lớp học & bài dạy được GV kích hoạt
              if (val.classId && val.classId !== state.classId) {
                updates.classId = val.classId;
              }
              if (val.grade && val.grade !== state.grade) {
                updates.grade = val.grade;
              }
              if (val.lessonId && val.lessonId !== state.lessonId) {
                updates.lessonId = val.lessonId;
              }
              if (val.lessonData) {
                const prevLesson = state.lessonData;
                updates.lessonData = val.lessonData;
                EMBEDDED_LESSONS[val.lessonData.id] = val.lessonData;
                if (state.role === 'student') {
                  const prevQuiz = prevLesson ? prevLesson.quiz : null;
                  const nextQuiz = val.lessonData ? val.lessonData.quiz : null;
                  if (JSON.stringify(prevQuiz) !== JSON.stringify(nextQuiz)) {
                    updates.quizAnswered = false;
                    updates.quizSelection = null;
                    updates.studentPacketAnswers = {};
                    updates.quizPacketSubmitted = false;
                  }
                }
              }
              if (val.currentSection !== undefined && val.currentSection !== state.currentSection) {
                updates.currentSection = val.currentSection;
                if (window.APP && window.APP.renderStageSectionNav) {
                  window.APP.renderStageSectionNav(Object.assign({}, state, updates));
                }
              }
              if (val.packetQuizzes !== undefined) {
                updates.packetQuizzes = val.packetQuizzes;
              }

              // 3. Đồng bộ tiến trình sư phạm & Phòng chờ (Nếu đã có máy -> Sảnh chờ Đấu trường cá nhân st-view-waiting như hình)
              if (state.role === 'student' && val.currentPhase !== undefined) {
                if (val.currentPhase !== state.currentPhase) {
                  if (window.APP && window.APP.resetAndCleanActivity) {
                    const cleanUpdates = window.APP.resetAndCleanActivity(val.currentPhase, { cleanAll: (val.currentPhase === 'waiting'), skipSetState: true }) || {};
                    Object.assign(updates, cleanUpdates);
                  }
                }
                let mId = state.machineId || state.fixedMachineId;
                if (!mId) {
                  try {
                    const saved = localStorage.getItem('lms_fixed_machine_id');
                    if (saved) mId = parseInt(saved, 10);
                  } catch (err) { console.warn("[Handled Error Warning]:", err?.message || err); }
                }

                if (val.currentPhase === 'waiting' || val.returnToLobby) {
                  if (mId) {
                    const classData = APP.classes[state.classId] || APP.classes['6A1'];
                    const pair = classData.seatingPlan[mId] || ["Học sinh 1", "Học sinh 2"];
                    updates.screen = 'student';
                    updates.currentPhase = 'waiting';
                    updates.machineId = mId;
                    updates.fixedMachineId = mId;
                    updates.students = pair;
                  } else {
                    updates.screen = 'lobby';
                    updates.currentPhase = 'waiting';
                  }
                  const overlay = document.getElementById('activity-countdown-overlay');
                  if (overlay) overlay.style.display = 'none';
                } else if (val.currentPhase !== 'waiting') {
                  if (mId) {
                    const classData = APP.classes[state.classId] || APP.classes['6A1'];
                    const pair = classData.seatingPlan[mId] || ["Học sinh 1", "Học sinh 2"];
                    updates.screen = 'student';
                    updates.machineId = mId;
                    updates.fixedMachineId = mId;
                    updates.students = pair;
                    const overlay = document.getElementById('activity-countdown-overlay');
                    if (overlay) overlay.style.display = 'none';
                  }
                  updates.currentPhase = val.currentPhase;
                }
              }
              if (val.lastFinishedActivity !== undefined) {
                updates.lastFinishedActivity = val.lastFinishedActivity;
              } else if (val.currentPhase === 'waiting' && !state.lastFinishedActivity && state.sessionStarted) {
                updates.lastFinishedActivity = 'Hoạt động';
              }
              if (val.timer) {
                updates.timer = val.timer;
                const offset = window._serverTimeOffset || 0;
                const nowServer = Date.now() + offset;
                const isTimerAlive = val.timer.isRunning && val.timer.phase !== 'waiting' && (!val.timer.endTime || val.timer.endTime > nowServer);
                if (window.APP) {
                  if (isTimerAlive && window.APP.syncMasterCountdown) {
                    window.APP.syncMasterCountdown(val.timer);
                  } else if (window.APP.updateMasterTimerDisplay) {
                    window.APP.updateMasterTimerDisplay(val.timer.secondsLeft || 0);
                  }
                }
              }
              if (val.sessionStarted !== undefined && val.sessionStarted !== state.sessionStarted) {
                updates.sessionStarted = val.sessionStarted;
              }

              // 4. Đồng bộ Countdown 3-2-1
              if (val.countdown && val.countdown.active) {
                const elapsed = Date.now() - (val.countdown.startedAt || 0);
                if (elapsed < 4200) {
                  APP.handleRemoteCountdown(val.countdown);
                } else {
                  const overlay = document.getElementById('activity-countdown-overlay');
                  if (overlay) overlay.style.display = 'none';
                }
              } else {
                const overlay = document.getElementById('activity-countdown-overlay');
                if (overlay && overlay.style.display !== 'none') {
                  overlay.style.display = 'none';
                }
              }

              // 4b. Đồng bộ hiệu ứng chuyển cảnh sư phạm kết thúc hoạt động 1.5s
              const toast = document.getElementById('activity-finishing-toast');
              if (val.finishingTransition && val.finishingTransition.active) {
                const ft = val.finishingTransition;
                if (Date.now() - (ft.timestamp || 0) < 3500) {
                  const toastTitle = document.getElementById('aft-title');
                  const toastDesc = document.getElementById('aft-desc');
                  if (toast) {
                    if (toastTitle) toastTitle.textContent = `HOÀN THÀNH: ${(ft.actTitle || 'HOẠT ĐỘNG').toUpperCase()}!`;
                    if (toastDesc) toastDesc.textContent = 'Thầy/Cô đang nhận xét và chuyển nhẹ nhàng về phòng chờ...';
                    toast.style.display = 'block';
                  }
                } else if (toast) {
                  toast.style.display = 'none';
                }
              } else if (toast && toast.style.display !== 'none') {
                toast.style.display = 'none';
              }

              // 5. Đồng bộ Reset phòng học (resetAt) cho lớp tiếp theo
              if (val.resetAt && (Date.now() - val.resetAt < 15000)) {
                if (state.role === 'student') {
                  try { localStorage.removeItem('lms_fixed_machine_id'); } catch (err) { console.warn("[Handled Error Warning]:", err?.message || err); }
                  if (window.APP && window.APP.resetAndCleanActivity) {
                    window.APP.resetAndCleanActivity('waiting', { cleanAll: true });
                  }
                  updates.screen = 'lobby';
                  updates.machineId = null;
                  updates.fixedMachineId = null;
                  updates.students = [];
                  updates.unlocked = false;
                  updates.sessionStarted = false;
                  updates.currentPhase = 'waiting';
                  updates.occupiedMachines = {};
                  updates.finishedActivities = {};
                  updates.lastFinishedActivity = null;
                }
              }

              if (val.oldLesson) {
                updates.oldLesson = Object.assign({}, state.oldLesson, val.oldLesson);
              }
              if (val.luckyDraw) {
                updates.luckyDraw = val.luckyDraw;
                if (state.role === 'student') {
                  if (val.luckyDraw.modalOpen) {
                    APP.openLuckyDrawModal(false);
                    if (val.luckyDraw.strategy) {
                      APP.setLuckyDrawStrategy(val.luckyDraw.strategy, false);
                    }
                  } else if (val.luckyDraw.modalOpen === false) {
                    APP.closeLuckyDrawModal(false);
                  }
                  if (val.luckyDraw.payload && val.luckyDraw.spinning) {
                    if (window.APP && window.APP.handleRemoteLuckyDrawSpin) {
                      window.APP.handleRemoteLuckyDrawSpin(val.luckyDraw.payload);
                    }
                  }
                }
              }
              if (val.machines) {
                const occ = Object.assign({}, state.occupiedMachines);
                Object.keys(val.machines).forEach(m => { occ[m] = true; });
                updates.occupiedMachines = occ;
              }
              if (val.pollAnswers !== undefined) {
                updates.pollAnswers = val.pollAnswers || {};
              }
              if (val.pollLocked !== undefined) {
                updates.pollLocked = !!val.pollLocked;
              }
              if (val.discussionAnswers !== undefined) {
                updates.discussionAnswers = val.discussionAnswers || {};
              }
              if (val.quizAnswers !== undefined) {
                updates.quizAnswers = val.quizAnswers || {};
                let curMid = state.machineId || state.fixedMachineId;
                if (!curMid) {
                  try {
                    const s = localStorage.getItem('lms_fixed_machine_id');
                    if (s) curMid = parseInt(s, 10);
                  } catch (err) { console.warn("[Handled Error Warning]:", err?.message || err); }
                }
                if (state.role === 'student' && curMid && (!val.quizAnswers || !val.quizAnswers[curMid])) {
                  updates.quizAnswered = false;
                  updates.quizSelection = null;
                }
              }
              if (val.h4State) {
                const h4 = val.h4State;
                const isLessonMatch = (!h4.lessonId || !state.lessonId || h4.lessonId === state.lessonId);
                const isDuplicate = (h4.activityId && state.lastActivityId === h4.activityId);
                if (isLessonMatch && !isDuplicate) {
                  updates.h4State = Object.assign({}, state.h4State, h4);
                  if (h4.activityId) updates.lastActivityId = h4.activityId;
                  if (state.role === 'student' && h4.quizDelivered && !state.h4State?.quizDelivered) {
                    if (window.APP && window.APP.resetAndCleanActivity) {
                      const cleanUpdates = window.APP.resetAndCleanActivity('quiz', { skipSetState: true }) || {};
                      Object.assign(updates, cleanUpdates);
                    }
                  }
                }
              }
              if (val.finishedActivities !== undefined) {
                updates.finishedActivities = val.finishedActivities || {};
              }
              if (Object.keys(updates).length > 0) {
                STORE.setState(updates);
                if (state.role === 'teacher' && updates.finishedActivities && APP.renderDynamicStagePipeline) {
                  APP.renderDynamicStagePipeline();
                }
              }
            }, (err) => {
              console.warn('[Firebase RTDB Listen Error]:', err);
            });
          };

          if (typeof firebase !== 'undefined' && firebase.auth) {
            firebase.auth().onAuthStateChanged((user) => {
              if (user) {
                console.log('[Firebase] User authenticated, attaching activeSession listener:', user.uid);
                attachSessionListener();
              }
            });
          } else {
            attachSessionListener();
          }
        } catch (err) { console.warn("[Handled Error Warning]:", err?.message || err); }
      }
      // Gửi tín hiệu thông báo máy đang online sau khi tải
      setTimeout(() => {
        const s = STORE.getState();
        if (s.machineId) {
          this.broadcast('MACHINE_JOINED', { machineId: s.machineId, classId: s.classId });
        }
      }, 300);
    },
    broadcast(type, payload) {
      const msg = { type, payload, senderId: Math.random().toString(36).substring(7), timestamp: Date.now() };
      if (this.channel) {
        try { this.channel.postMessage(msg); } catch (err) { console.warn("[Handled Error Warning]:", err?.message || err); }
      }
      try {
        localStorage.setItem('cvalms_sync_event', JSON.stringify(msg));
      } catch (err) { console.warn("[Handled Error Warning]:", err?.message || err); }
    },
    handleMessage(data) {
      if (!data || !data.type) return;
      const state = STORE.getState();
      if (data.type === 'PHASE_CHANGE') {
        if (state.role === 'student' && data.payload && data.payload.phase) {
          const nextPhase = data.payload.phase;
          let cleanUpdates = {};
          if (window.APP && window.APP.resetAndCleanActivity) {
            cleanUpdates = window.APP.resetAndCleanActivity(nextPhase, { cleanAll: (nextPhase === 'waiting'), skipSetState: true }) || {};
          }
          const updates = Object.assign({}, cleanUpdates, {
            currentPhase: nextPhase,
            lastFinishedActivity: data.payload.lastFinished || (nextPhase === 'waiting' ? (state.lastFinishedActivity || (state.sessionStarted ? 'Hoạt động' : null)) : null)
          });
          let mId = state.machineId || state.fixedMachineId;
          if (!mId) {
            try {
              const saved = localStorage.getItem('lms_fixed_machine_id');
              if (saved) mId = parseInt(saved, 10);
            } catch (err) { console.warn("[Handled Error Warning]:", err?.message || err); }
          }

          if (nextPhase === 'waiting' || data.payload.resetByTeacher || data.payload.returnToLobby) {
            if (mId) {
              const classData = APP.classes[state.classId] || APP.classes['6A1'];
              const pair = classData.seatingPlan[mId] || ["Học sinh 1", "Học sinh 2"];
              updates.screen = 'student';
              updates.currentPhase = 'waiting';
              updates.machineId = mId;
              updates.fixedMachineId = mId;
              updates.students = pair;
            } else {
              updates.screen = 'lobby';
              updates.currentPhase = 'waiting';
            }
            const overlay = document.getElementById('activity-countdown-overlay');
            if (overlay) overlay.style.display = 'none';
          } else {
            if (mId) {
              const classData = APP.classes[state.classId] || APP.classes['6A1'];
              const pair = classData.seatingPlan[mId] || ["Học sinh 1", "Học sinh 2"];
              updates.screen = 'student';
              updates.machineId = mId;
              updates.fixedMachineId = mId;
              updates.students = pair;
              const overlay = document.getElementById('activity-countdown-overlay');
              if (overlay) overlay.style.display = 'none';
            }
          }
          STORE.setState(updates);
          if (window.APP && window.APP.renderStudentWorkspace && STORE.getState().role === 'student' && STORE.getState().screen === 'student') {
            window.APP.renderStudentWorkspace(STORE.getState());
          }
        }
      } else if (data.type === 'TIMER_SYNC') {
        if (data.payload) {
          STORE.setState({ timer: data.payload });
          if (window.APP && window.APP.syncMasterCountdown) {
            window.APP.syncMasterCountdown(data.payload);
          }
        }
      } else if (data.type === 'ACTIVITY_FINISHING') {
        const toast = document.getElementById('activity-finishing-toast');
        const toastTitle = document.getElementById('aft-title');
        const toastDesc = document.getElementById('aft-desc');
        const actTitle = (data.payload && data.payload.actTitle) || 'Hoạt động';
        if (toast) {
          if (toastTitle) toastTitle.textContent = `HOÀN THÀNH: ${actTitle.toUpperCase()}!`;
          if (toastDesc) toastDesc.textContent = 'Thầy/Cô đang nhận xét và chuyển nhẹ nhàng về phòng chờ...';
          toast.style.display = 'block';
          setTimeout(() => {
            toast.style.display = 'none';
          }, 1600);
        }
      } else if (data.type === 'START_COUNTDOWN') {
        APP.handleRemoteCountdown(data.payload);
      } else if (data.type === 'LUCKY_DRAW_OPEN') {
        if (state.role === 'student') {
          APP.openLuckyDrawModal(false);
          if (data.payload && data.payload.strategy) {
            APP.setLuckyDrawStrategy(data.payload.strategy, false);
          }
        }
      } else if (data.type === 'LUCKY_DRAW_STRATEGY') {
        if (state.role === 'student' && data.payload && data.payload.strategy) {
          APP.setLuckyDrawStrategy(data.payload.strategy, false);
        }
      } else if (data.type === 'OLD_LESSON_DONE_RETURN_LOBBY') {
        if (state.role === 'student') {
          let mId = state.machineId || state.fixedMachineId;
          if (!mId) {
            try {
              const saved = localStorage.getItem('lms_fixed_machine_id');
              if (saved) mId = parseInt(saved, 10);
            } catch (err) { console.warn("[Handled Error Warning]:", err?.message || err); }
          }
          const classData = APP.classes[state.classId] || APP.classes['6A1'];
          const pair = mId ? (classData.seatingPlan[mId] || ["Học sinh 1", "Học sinh 2"]) : null;

          STORE.setState({
            screen: mId ? 'student' : 'lobby',
            currentPhase: 'waiting',
            machineId: mId,
            fixedMachineId: mId,
            students: pair,
            lastFinishedActivity: data.payload && data.payload.lastFinished ? data.payload.lastFinished : 'Kiểm tra bài cũ'
          });
          const overlay = document.getElementById('activity-countdown-overlay');
          if (overlay) overlay.style.display = 'none';
        }
      } else if (data.type === 'OLD_LESSON_SPOTLIGHT') {
        if (data.payload) {
          const curOld = STORE.getState().oldLesson || {};
          const oldL = Object.assign({}, curOld, {
            selectedMachine: data.payload.selectedMachine,
            selectedStudent: data.payload.selectedStudent,
            questionText: data.payload.questionText || data.payload.question || curOld.questionText,
            questionRevealed: curOld.questionRevealed || false
          });
          STORE.setState({ oldLesson: oldL });
        }
      } else if (data.type === 'MACHINE_JOINED') {
        const mId = data.payload.machineId;
        if (mId) {
          const occ = Object.assign({}, state.occupiedMachines);
          occ[mId] = true;
          STORE.setState({ occupiedMachines: occ });
        }
      } else if (data.type === 'FORCE_RELOAD') {
        if (state.role === 'student') {
          window.location.reload();
        }
      } else if (data.type === 'CLASSES_UPDATED') {
        if (data.payload && data.payload.classes) {
          APP.classes = Object.assign({}, EMBEDDED_CLASSES, data.payload.classes);
          STORE.setState({ classId: STORE.getState().classId });
        }
      } else if (data.type === 'LESSON_UPDATED') {
        if (data.payload && data.payload.lesson) {
          const l = data.payload.lesson;
          EMBEDDED_LESSONS[l.id] = l;
          if (state.lessonId === l.id || !state.lessonData) {
            STORE.setState({
              lessonData: l,
              packetQuizzes: null,
              oldLesson: Object.assign({}, state.oldLesson, {
                questionText: l.oldLesson?.question || l.warmup?.question || state.oldLesson.questionText
              })
            });
            if (window.APP && window.APP.renderStudentWorkspace && STORE.getState().role === 'student' && STORE.getState().screen === 'student') {
              window.APP.renderStudentWorkspace(STORE.getState());
            }
          }
        }
      } else if (data.type === 'OLD_LESSON_START') {
        if (window.APP) {
          window.APP.clearTimer('lucky_draw_end');
          window.APP.clearTimer('lucky_draw_modal_close');
          window.APP.clearTimer('lucky_draw_tick');
        }
        const modal = document.getElementById('modal-lucky-draw');
        if (modal) modal.style.display = 'none';
        const payload = data.payload || {};
        const oldL = Object.assign({}, STORE.getState().oldLesson, {
          timerSeconds: payload.timerSeconds || 120,
          timeLeft: payload.timerSeconds || 120,
          timerActive: true,
          questionRevealed: true,
          questionType: payload.questionType || 'text',
          questionText: payload.questionText || STORE.getState().oldLesson.questionText || '',
          selectedMachine: payload.selectedMachine || STORE.getState().oldLesson.selectedMachine || null,
          selectedStudent: payload.selectedStudent || STORE.getState().oldLesson.selectedStudent || null,
          isLocked: false,
          isRevealed: false
        });
        STORE.setState({ currentPhase: 'old_lesson', teacherPhase: 'old_lesson', oldLesson: oldL });
        APP.startOldLessonCountdown();
        if (window.APP && window.APP.renderStudentWorkspace && STORE.getState().role === 'student') {
          window.APP.renderStudentWorkspace(STORE.getState());
        }
      } else if (data.type === 'LUCKY_DRAW_CLOSE') {
        const modal = document.getElementById('modal-lucky-draw');
        if (modal) modal.style.display = 'none';
      } else if (data.type === 'OLD_LESSON_SUBMIT') {
        const p = data.payload || {};
        if (p.machineId) {
          const subs = Object.assign({}, STORE.getState().oldLesson.submissions);
          subs[p.machineId] = {
            student: p.student,
            answer: p.answer,
            time: p.time
          };
          const oldL = Object.assign({}, STORE.getState().oldLesson, { submissions: subs });
          STORE.setState({ oldLesson: oldL });
        }
      } else if (data.type === 'OLD_LESSON_LOCK') {
        const oldL = Object.assign({}, STORE.getState().oldLesson, { isLocked: true, timerActive: false });
        STORE.setState({ oldLesson: oldL });
      } else if (data.type === 'OLD_LESSON_REVEAL') {
        const oldL = Object.assign({}, STORE.getState().oldLesson, { isRevealed: true });
        STORE.setState({ oldLesson: oldL });
        if (window.APP && window.APP.renderStudentWorkspace && STORE.getState().role === 'student') {
          window.APP.renderStudentWorkspace(STORE.getState());
        }
      } else if (data.type === 'OLD_LESSON_QUESTION_REVEAL') {
        const curState = STORE.getState();
        const qText = (data.payload && data.payload.questionText) || curState.oldLesson?.questionText || '';
        const oldL = Object.assign({}, curState.oldLesson, {
          questionRevealed: true,
          questionText: qText || curState.oldLesson?.questionText
        });
        STORE.setState({ oldLesson: oldL });
        if (window.APP && window.APP.renderStudentWorkspace && STORE.getState().role === 'student') {
          window.APP.renderStudentWorkspace(STORE.getState());
        }
      } else if (data.type === 'LUCKY_DRAW_SPIN') {
        APP.handleRemoteLuckyDrawSpin(data.payload);
      } else if (data.type === 'POLL_ANSWER') {
        if (data.payload && data.payload.machineId) {
          const pa = Object.assign({}, STORE.getState().pollAnswers);
          pa[data.payload.machineId] = data.payload.choice;
          STORE.setState({ pollAnswers: pa });
        }
      } else if (data.type === 'POLL_LOCK_TOGGLE') {
        if (data.payload) {
          STORE.setState({ pollLocked: !!data.payload.locked });
        }
      } else if (data.type === 'DISCUSSION_ANSWER') {
        if (data.payload && data.payload.machineId) {
          const da = Object.assign({}, STORE.getState().discussionAnswers);
          da[data.payload.machineId] = data.payload;
          STORE.setState({ discussionAnswers: da });
        }
      } else if (data.type === 'QUIZ_ANSWER') {
        if (data.payload && data.payload.machineId) {
          const qa = Object.assign({}, STORE.getState().quizAnswers);
          qa[data.payload.machineId] = data.payload;
          STORE.setState({ quizAnswers: qa });
        }
      } else if (data.type === 'H2_TASK_ASSIGN') {
        const p = data.payload || {};
        const h2 = Object.assign({}, STORE.getState().h2State, {
          assigned: true,
          taskText: p.taskText,
          docText: p.docText
        });
        STORE.setState({ h2State: h2 });
        if (window.APP && window.APP.renderStudentWorkspace && STORE.getState().role === 'student') {
          window.APP.renderStudentWorkspace(STORE.getState());
        }
      } else if (data.type === 'H2_START_READING') {
        const p = data.payload || {};
        const h2 = Object.assign({}, STORE.getState().h2State, {
          reading: true,
          timeLeft: p.duration || 300
        });
        STORE.setState({ h2State: h2 });
        if (window.APP && window.APP.renderStudentWorkspace && STORE.getState().role === 'student') {
          window.APP.renderStudentWorkspace(STORE.getState());
        }
      } else if (data.type === 'H2_SUMMARIZE') {
        const h2 = Object.assign({}, STORE.getState().h2State, {
          summarized: true
        });
        STORE.setState({ h2State: h2 });
        if (window.APP && window.APP.renderStudentWorkspace && STORE.getState().role === 'student') {
          window.APP.renderStudentWorkspace(STORE.getState());
        }
      } else if (data.type === 'H3_TASK_DELIVER') {
        const p = data.payload || {};
        const h3 = Object.assign({}, STORE.getState().h3State, {
          taskDelivered: true,
          taskText: p.taskText,
          title: p.title,
          starterCode: p.starterCode
        });
        STORE.setState({ h3State: h3 });
        if (window.APP && window.APP.renderStudentWorkspace && STORE.getState().role === 'student') {
          window.APP.renderStudentWorkspace(STORE.getState());
        }
      } else if (data.type === 'H3_START_CODING') {
        const p = data.payload || {};
        const h3 = Object.assign({}, STORE.getState().h3State, {
          codingStarted: true,
          timeLeft: p.duration || 600
        });
        STORE.setState({ h3State: h3 });
        if (window.APP && window.APP.renderStudentWorkspace && STORE.getState().role === 'student') {
          window.APP.renderStudentWorkspace(STORE.getState());
        }
      } else if (data.type === 'H3_REVEAL_SOLUTION') {
        const p = data.payload || {};
        const h3 = Object.assign({}, STORE.getState().h3State, {
          solutionRevealed: true,
          solutionCode: p.solutionCode
        });
        STORE.setState({ h3State: h3 });
        if (window.APP && window.APP.renderStudentWorkspace && STORE.getState().role === 'student') {
          window.APP.renderStudentWorkspace(STORE.getState());
        }
      } else if (data.type === 'SECTION_CHANGE') {
        if (data.payload && data.payload.currentSection !== undefined) {
          STORE.setState({ currentSection: data.payload.currentSection });
          if (window.APP && window.APP.renderStageSectionNav) {
            window.APP.renderStageSectionNav(STORE.getState());
          }
          if (window.APP && window.APP.renderDynamicStagePipeline) {
            window.APP.renderDynamicStagePipeline(STORE.getState());
          }
        }
      } else if (data.type === 'H4_ARENA_START') {
        const p = data.payload || {};
        const state = STORE.getState();
        if (!p.lessonId || !state.lessonId || p.lessonId !== state.lessonId) {
          console.warn('[SyncBus] Bỏ qua H4_ARENA_START thiếu hoặc sai lessonId:', p.lessonId, 'hiện tại:', state.lessonId);
          return;
        }
        if (p.activityId && state.lastActivityId === p.activityId) {
          console.warn('[SyncBus] Bỏ qua duplicate H4_ARENA_START activityId:', p.activityId);
          return;
        }
        const h4 = Object.assign({}, state.h4State, {
          arenaStarted: true,
          questionText: p.questionText,
          questionType: p.questionType
        });
        const storeUpdates = { h4State: h4, lastActivityId: p.activityId || ('h4_' + Date.now()) };
        if (p.packetQuizzes) {
          storeUpdates.packetQuizzes = p.packetQuizzes;
          storeUpdates.studentQuizIndex = 0;
          storeUpdates.studentPacketAnswers = {};
          storeUpdates.quizPacketSubmitted = false;
        }
        STORE.setState(storeUpdates);
        if (window.APP && window.APP.renderStudentWorkspace && STORE.getState().role === 'student') {
          window.APP.renderStudentWorkspace(STORE.getState());
        }
      } else if (data.type === 'H4_QUIZ_DELIVER') {
        const p = data.payload || {};
        const state = STORE.getState();
        if (!p.lessonId || !state.lessonId || p.lessonId !== state.lessonId) {
          console.warn('[SyncBus] Bỏ qua H4_QUIZ_DELIVER thiếu hoặc sai lessonId:', p.lessonId, 'hiện tại:', state.lessonId);
          return;
        }
        if (p.activityId && state.lastActivityId === p.activityId) {
          console.warn('[SyncBus] Bỏ qua duplicate H4_QUIZ_DELIVER activityId:', p.activityId);
          return;
        }
        const h4 = Object.assign({}, state.h4State, {
          quizDelivered: true,
          timeLeft: p.duration || 20
        });
        STORE.setState({ h4State: h4, lastActivityId: p.activityId || ('h4_deliver_' + Date.now()) });
        if (window.APP && window.APP.renderStudentWorkspace && STORE.getState().role === 'student') {
          window.APP.renderStudentWorkspace(STORE.getState());
        }
      } else if (data.type === 'H4_REVEAL_PODIUM') {
        const h4 = Object.assign({}, STORE.getState().h4State, {
          podiumRevealed: true
        });
        STORE.setState({ h4State: h4 });
        if (window.APP && window.APP.renderStudentWorkspace && STORE.getState().role === 'student') {
          window.APP.renderStudentWorkspace(STORE.getState());
        }
      } else if (data.type === 'SESSION_ACTIVATED') {
        const p = data.payload || {};
        const updates = {
          unlocked: true,
          sessionStarted: false,
          currentPhase: 'waiting'
        };
        if (p.classId) updates.classId = p.classId;
        if (p.grade) updates.grade = p.grade;
        if (p.lessonId) updates.lessonId = p.lessonId;
        if (p.lessonData) {
          updates.lessonData = p.lessonData;
          EMBEDDED_LESSONS[p.lessonData.id] = p.lessonData;
        }
        STORE.setState(updates);
      } else if (data.type === 'SESSION_ENDED') {
        try {
          localStorage.removeItem('lms_fixed_machine_id');
        } catch (err) { console.warn("[Handled Error Warning]:", err?.message || err); }
        if (APP && APP.resetAndCleanActivity) {
          APP.resetAndCleanActivity('waiting', { cleanAll: true });
        }
        STORE.setState({
          screen: 'lobby',
          machineId: null,
          fixedMachineId: null,
          students: [],
          unlocked: false,
          sessionStarted: false,
          currentPhase: 'waiting',
          teacherPhase: 'waiting',
          occupiedMachines: {},
          finishedActivities: {},
          lastFinishedActivity: null
        });
      }
    }
  };

  // 4. BỘ ĐIỀU KHIỂN GIAO DIỆN HỌC SINH (STUDENT CONTROLLER)
  const APP = {
    classes: JSON.parse(JSON.stringify(EMBEDDED_CLASSES)),
    lessons: EMBEDDED_LESSONS,

    // =========================================================================
    // QUẢN LÝ THỜI GIAN KHOA HỌC (SCIENTIFIC LIFECYCLE TIMERS REGISTRY)
    // Ngăn chặn triệt để xung đột timeout, race condition giữa các hoạt động
    // =========================================================================
    _lifecycleTimers: {},
    registerTimer(key, timerId) {
      if (this._lifecycleTimers[key]) {
        clearTimeout(this._lifecycleTimers[key]);
        clearInterval(this._lifecycleTimers[key]);
      }
      this._lifecycleTimers[key] = timerId;
      return timerId;
    },
    clearTimer(key) {
      if (this._lifecycleTimers[key]) {
        clearTimeout(this._lifecycleTimers[key]);
        clearInterval(this._lifecycleTimers[key]);
        delete this._lifecycleTimers[key];
      }
    },
    clearAllTimers() {
      Object.keys(this._lifecycleTimers).forEach(k => {
        clearTimeout(this._lifecycleTimers[k]);
        clearInterval(this._lifecycleTimers[k]);
      });
      this._lifecycleTimers = {};
    },

    init() {
      // Nạp cấu hình các lớp tùy chỉnh từ localStorage nếu có
      try {
        const savedClasses = localStorage.getItem('lms_custom_classes');
        if (savedClasses) {
          const parsed = JSON.parse(savedClasses);
          if (parsed && typeof parsed === 'object') {
            this.classes = Object.assign({}, this.classes, parsed);
          }
        }
      } catch (err) { console.warn("[Handled Error Warning]:", err?.message || err); }

      initFirebase();
      STORE.loadSavedDeviceToken();
      STORE.checkAdminSession();
      STORE.subscribe(state => this.render(state));
      SYNC_BUS.init();
      this.bindEvents();
      this.bindTeacherEvents();
      this.initStudio();
      this.render(STORE.getState());
    },

    bindEvents() {
      // 1. Chọn lớp học tại Sảnh
      const selectClass = document.getElementById('select-lobby-class');
      if (selectClass) {
        selectClass.addEventListener('change', e => {
          const newClass = e.target.value;
          STORE.setState({ classId: newClass });
        });
      }

      // 2. Đặt lại lưu nhớ máy
      const btnResetToken = document.getElementById('btn-reset-device-token');
      if (btnResetToken) {
        btnResetToken.addEventListener('click', () => {
          try {
            localStorage.removeItem('lms_fixed_machine_id');
            STORE.setState({ fixedMachineId: null });
            alert('Đã xóa lưu nhớ máy trên thiết bị này! Giờ bạn có thể chọn bất kỳ máy nào.');
          } catch (err) { console.warn("[Handled Error Warning]:", err?.message || err); }
        });
      }

      // 3. Modal xác nhận vào máy
      const btnModalCancel = document.getElementById('btn-modal-cancel');
      if (btnModalCancel) {
        btnModalCancel.addEventListener('click', () => {
          const modal = document.getElementById('modal-confirm-machine');
          if (modal) modal.style.display = 'none';
        });
      }

      const btnModalConfirm = document.getElementById('btn-modal-confirm');
      if (btnModalConfirm) {
        btnModalConfirm.addEventListener('click', () => {
          const state = STORE.getState();
          const machineId = state.pendingMachineId;
          if (!machineId) return;

          try {
            localStorage.setItem('lms_fixed_machine_id', machineId.toString());
          } catch (err) { console.warn("[Handled Error Warning]:", err?.message || err); }

          const classData = this.classes[state.classId] || this.classes['6A1'];
          const pair = classData.seatingPlan[machineId] || ["Học sinh 1", "Học sinh 2"];

          // Đánh dấu máy này đang active
          const occ = Object.assign({}, state.occupiedMachines);
          occ[machineId] = true;

          STORE.setState({
            fixedMachineId: machineId,
            machineId: machineId,
            students: pair,
            screen: 'student',
            occupiedMachines: occ,
            pendingMachineId: null
          });

          const modal = document.getElementById('modal-confirm-machine');
          if (modal) modal.style.display = 'none';

          // Phát sóng thông báo cho các máy khác và bảng giáo viên
          SYNC_BUS.broadcast('MACHINE_JOINED', { machineId });

          // Đồng bộ Firebase an toàn qua safeFirebaseSet
          safeFirebaseSet(`activeSession/machines/${machineId}`, {
            machineId: machineId,
            classId: state.classId,
            students: pair,
            status: 'active',
            joinedAt: Date.now()
          }).catch(err => console.warn('[Firebase Sync Warning]:', err?.message || err));
        });
      }

      // 4. Modal cảnh báo chọn nhầm máy
      const btnWarningBack = document.getElementById('btn-warning-back');
      if (btnWarningBack) {
        btnWarningBack.addEventListener('click', () => {
          const modal = document.getElementById('modal-token-warning');
          if (modal) modal.style.display = 'none';
        });
      }

      const btnWarningResetForce = document.getElementById('btn-warning-reset-force');
      if (btnWarningResetForce) {
        btnWarningResetForce.addEventListener('click', () => {
          try {
            localStorage.removeItem('lms_fixed_machine_id');
            STORE.setState({ fixedMachineId: null });
            const modal = document.getElementById('modal-token-warning');
            if (modal) modal.style.display = 'none';
            alert('Đã mở khóa thiết bị! Giờ bạn có thể chọn lại vị trí máy.');
          } catch (err) { console.warn("[Handled Error Warning]:", err?.message || err); }
        });
      }

      // 5. Quay lại Sảnh (Đổi máy)
      const btnBackToLobby = document.getElementById('btn-back-to-lobby');
      if (btnBackToLobby) {
        btnBackToLobby.addEventListener('click', () => {
          STORE.setState({ screen: 'lobby' });
        });
      }

      // 6. Nút SOS xin trợ giúp
      const btnSos = document.getElementById('btn-student-sos');
      if (btnSos) {
        btnSos.addEventListener('click', () => {
          const state = STORE.getState();
          const newSos = !state.isSos;
          STORE.setState({ isSos: newSos });
          if (state.machineId) {
            safeFirebaseSet(`activeSession/machines/${state.machineId}/isSos`, newSos).catch(err => console.warn('[Firebase Sync Warning]:', err?.message || err));
          }
        });
      }

      // 7. Chặng 1: Bấm chọn Quick Poll A-B-C-D
      document.querySelectorAll('.poll-opt-btn').forEach(btn => {
        btn.addEventListener('click', e => {
          const choice = e.currentTarget.dataset.choice;
          const state = STORE.getState();
          if (state.pollLocked) {
            alert('Thầy đã khóa lựa chọn Quick Poll!');
            return;
          }
          STORE.setState({ pollSelection: choice });

          if (state.machineId) {
            safeFirebaseSet(`activeSession/pollAnswers/${state.machineId}`, {
              choice: choice,
              timestamp: Date.now()
            }).catch(err => console.warn('[Firebase Sync Warning]:', err?.message || err));
          }
          if (typeof SYNC_BUS !== 'undefined') {
            SYNC_BUS.broadcast('POLL_ANSWER', { machineId: state.machineId || 1, choice });
          }
        });
      });

      // 8. Chặng 3: Nộp bài thảo luận
      const btnSubmitDisc = document.getElementById('btn-submit-discussion');
      if (btnSubmitDisc) {
        btnSubmitDisc.addEventListener('click', () => {
          const textarea = document.getElementById('disc-answer-input');
          const content = textarea ? textarea.value.trim() : '';
          if (!content) {
            alert('Hai em hãy nhập nội dung thảo luận hoặc code Python của máy trước khi nộp bài!');
            return;
          }
          const now = new Date();
          const timeStr = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
          STORE.setState({ discStatus: 'submitted', discSubmissionTime: timeStr });

          const state = STORE.getState();
          const mId = state.machineId || 1;
          const stuList = (state.students && state.students.length > 0) ? state.students : [`Máy ${mId}`];

          if (mId) {
            safeFirebaseSet(`activeSession/discussionAnswers/${mId}`, {
              machineId: mId,
              students: stuList,
              content: content,
              submittedAt: Date.now()
            }).catch(err => console.warn('[Firebase Sync Warning]:', err?.message || err));
          }
          if (typeof SYNC_BUS !== 'undefined') {
            SYNC_BUS.broadcast('DISCUSSION_ANSWER', {
              machineId: mId,
              students: stuList,
              content: content,
              submittedAt: timeStr
            });
          }
          alert('🎉 Nhóm đã nộp bài thành công lên Bảng điều khiển của Thầy!');
        });
      }

      // 9. Chặng 4: Bấm chọn Live Quiz (Ủy quyền sự kiện cho mọi dạng câu hỏi)
      document.addEventListener('click', e => {
        const btn = e.target.closest('.quiz-opt');
        if (!btn || btn.disabled) return;
        const opt = btn.dataset.qopt;
        if (!opt) return;
        const state = STORE.getState();
        if (state.quizAnswered) return;
        const lesson = state.lessonData || EMBEDDED_LESSONS['tin6_bai12'];
        const correct = (lesson && lesson.quiz) ? lesson.quiz.correct : 'B';
        const isCorrect = (opt === correct);
        this.submitQuizAnswer(opt, isCorrect);
      });

      // 10. Bước 1: Học sinh gõ văn bản tự luận ngắn
      const olTextInput = document.getElementById('ol-text-input');
      const olCharCount = document.getElementById('ol-char-count');
      if (olTextInput && olCharCount) {
        olTextInput.addEventListener('input', () => {
          olCharCount.textContent = `${olTextInput.value.length} ký tự`;
        });
      }

      // 11. Bước 1: Học sinh bấm chọn đáp án trắc nghiệm A-B-C-D
      document.querySelectorAll('.ol-mcq-btn').forEach(btn => {
        btn.addEventListener('click', e => {
          const state = STORE.getState();
          if (state.oldLesson && state.oldLesson.isLocked) return;
          const choice = e.currentTarget.dataset.olChoice;
          document.querySelectorAll('.ol-mcq-btn').forEach(b => b.classList.remove('selected'));
          e.currentTarget.classList.add('selected');
          const oldL = Object.assign({}, state.oldLesson, { studentAnswer: choice });
          STORE.setState({ oldLesson: oldL });
        });
      });

      // 12. Bước 1: Học sinh bấm nộp câu trả lời bài cũ
      const btnSubmitOldLesson = document.getElementById('btn-submit-old-lesson');
      if (btnSubmitOldLesson) {
        btnSubmitOldLesson.addEventListener('click', () => {
          const state = STORE.getState();
          if (state.oldLesson && state.oldLesson.isLocked) {
            alert('Đã hết thời gian nộp bài!');
            return;
          }

          let ans = '';
          if (state.oldLesson.questionType === 'mcq') {
            ans = state.oldLesson.studentAnswer || '';
            if (!ans) {
              alert('Nhóm em hãy bấm chọn 1 phương án A, B, C hoặc D trước khi nộp bài!');
              return;
            }
          } else {
            const ta = document.getElementById('ol-text-input');
            ans = ta ? ta.value.trim() : '';
            if (!ans) {
              alert('Nhóm em hãy gõ câu trả lời vào ô văn bản trước khi nộp!');
              return;
            }
          }

          const now = new Date();
          const timeStr = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')}`;
          const mId = state.machineId || 1;
          const stuName = (state.students && state.students.length > 0) ? state.students.join(' & ') : `Máy ${mId}`;

          SYNC_BUS.broadcast('OLD_LESSON_SUBMIT', {
            machineId: mId,
            student: stuName,
            answer: ans,
            time: timeStr
          });

          const statusMsg = document.getElementById('ol-status-msg');
          if (statusMsg) {
            statusMsg.innerHTML = /* sanitize */ `<i class="fas fa-check-circle" style="color:#10b981;"></i> Đã nộp câu trả lời lúc <strong>${timeStr}</strong>: <em>"${ans}"</em>. Đang chờ Thầy chốt đáp án!`;
          }

          alert('🎉 Đã nộp câu trả lời thành công lên Bảng điều khiển của Thầy!');
        });
      }

      // Đóng dropdown khi click ngoài
      document.addEventListener('click', (e) => {
        if (!e.target.closest('.tpb-step-dropdown-wrapper')) {
          this.closeAllTpbMenus();
        }
      });
    },

    bindTeacherEvents() {
      // 0. Tabs chuyển đổi phân hệ Giáo viên
      ['classes', 'studio', 'stage'].forEach(tab => {
        const btn = document.getElementById(`btn-tnav-${tab}`);
        if (btn) {
          btn.addEventListener('click', (e) => {
            e.preventDefault();
            window.teacherSwitchTab(tab);
          });
        }
      });
      // 1. Mở modal đăng nhập Giáo viên
      const btnOpenTeacher = document.getElementById('btn-open-teacher-login');
      if (btnOpenTeacher) {
        btnOpenTeacher.addEventListener('click', () => {
          const modal = document.getElementById('modal-teacher-login');
          if (modal) {
            modal.style.display = 'flex';
            const pwdInput = document.getElementById('teacher-password-input');
            if (pwdInput) {
              pwdInput.value = '';
              pwdInput.focus();
            }
          }
        });
      }

      // 2. Hủy đăng nhập
      const btnCancelLogin = document.getElementById('btn-cancel-teacher-login');
      if (btnCancelLogin) {
        btnCancelLogin.addEventListener('click', () => {
          const modal = document.getElementById('modal-teacher-login');
          if (modal) modal.style.display = 'none';
        });
      }

      // 3. Hiện/Ẩn mật khẩu
      const btnTogglePwd = document.getElementById('btn-toggle-pwd');
      if (btnTogglePwd) {
        btnTogglePwd.addEventListener('click', () => {
          const pwdInput = document.getElementById('teacher-password-input');
          if (pwdInput) {
            const isPwd = (pwdInput.type === 'password');
            pwdInput.type = isPwd ? 'text' : 'password';
            btnTogglePwd.innerHTML = /* sanitize */ isPwd ? '<i class="fas fa-eye-slash"></i>' : '<i class="fas fa-eye"></i>';
          }
        });
      }

      // 4. Lưu lại & Kích hoạt tiết học (Mở khóa máy học sinh & chuyển sang Sân khấu điều khiển)
      const btnStartSession = document.getElementById('btn-start-class-session');
      if (btnStartSession) {
        btnStartSession.addEventListener('click', () => {
          const selGrade = document.getElementById('teacher-select-grade');
          const selClass = document.getElementById('teacher-select-class');
          const selLesson = document.getElementById('teacher-select-lesson');
          const chosenGrade = selGrade ? selGrade.value : '6';
          const chosenClass = selClass ? selClass.value : '6A1';
          const chosenLesson = selLesson ? selLesson.value : 'tin6_bai12';
          const lessonObj = this.getLesson(chosenLesson);

          STORE.setState({
            grade: chosenGrade,
            classId: chosenClass,
            lessonId: chosenLesson,
            lessonData: lessonObj,
            oldLesson: {
              questionText: lessonObj.oldLesson?.question || lessonObj.warmup?.question || '',
              questionRevealed: false,
              isRevealed: false,
              isLocked: false,
              selectedMachine: null,
              selectedStudent: null,
              submissions: {}
            },
            unlocked: true,
            sessionStarted: false,
            teacherStage: 'active',
            currentPhase: 'waiting',
            pollLocked: false,
            pollAnswers: {},
            discussionAnswers: {},
            quizAnswers: {},
            occupiedMachines: {},
            finishedActivities: {},
            lastFinishedActivity: null
          });

          this.updateOldLessonStepButtons();

          safeFirebaseSet('activeSession', {
            grade: chosenGrade,
            classId: chosenClass,
            lessonId: chosenLesson,
            lessonData: lessonObj,
            oldLesson: {
              questionText: lessonObj.oldLesson?.question || lessonObj.warmup?.question || '',
              questionRevealed: false,
              isRevealed: false,
              isLocked: false,
              selectedMachine: null,
              selectedStudent: null,
              submissions: {}
            },
            unlocked: true,
            sessionStarted: false,
            currentPhase: 'waiting',
            pollLocked: false,
            pollAnswers: {},
            discussionAnswers: {},
            quizAnswers: {},
            finishedActivities: {},
            lastFinishedActivity: null,
            activatedAt: Date.now()
          }).catch(err => console.warn('[Firebase Sync Warning]:', err?.message || err));
          SYNC_BUS.broadcast('SESSION_ACTIVATED', {
            grade: chosenGrade,
            classId: chosenClass,
            lessonId: chosenLesson,
            lessonData: lessonObj,
            unlocked: true,
            pollLocked: false
          });

          const qInput = document.getElementById('otc-question-input');
          const lessonQ = lessonObj.oldLesson?.question || lessonObj.warmup?.question;
          if (qInput && lessonQ) {
            qInput.value = lessonQ;
          }

          alert(`🎉 Đã kích hoạt ${chosenClass}! Sơ đồ máy đã mở khóa để các em vào sảnh chờ.`);
        });
      }

      const selLessonEl = document.getElementById('teacher-select-lesson');
      if (selLessonEl) {
        selLessonEl.addEventListener('change', () => {
          const lObj = this.getLesson(selLessonEl.value);
          const qInput = document.getElementById('otc-question-input');
          if (qInput && lObj && lObj.oldLesson?.question) {
            qInput.value = lObj.oldLesson.question;
          }
        });
      }

      // 4.1. Nút Lưu Kịch bản Bài dạy trong Studio Editor
      const btnSaveStudio = document.getElementById('btn-studio-save-lesson');
      if (btnSaveStudio) {
        btnSaveStudio.addEventListener('click', () => {
          this.saveStudioLesson();
        });
      }

      // 4.2. Khóa / Mở khóa bình chọn Quick Poll
      const btnLockPoll = document.getElementById('btn-lock-poll');
      if (btnLockPoll) {
        btnLockPoll.addEventListener('click', () => {
          const s = STORE.getState();
          const newLocked = !s.pollLocked;
          STORE.setState({ pollLocked: newLocked });
          safeFirebaseSet('activeSession/pollLocked', newLocked).catch(err => console.warn('[Firebase Sync Warning]:', err?.message || err));
          SYNC_BUS.broadcast('POLL_LOCK_TOGGLE', { locked: newLocked });
        });
      }

      // 5. Kết thúc tiết học (Lưu và phát tín hiệu resetAt dọn sạch cho lớp sau)
      const btnEndSession = document.getElementById('btn-end-class-session');
      if (btnEndSession) {
        btnEndSession.addEventListener('click', () => {
          if (confirm('Thầy có chắc chắn muốn KẾT THÚC TIẾT HỌC của lớp này? Hệ thống sẽ làm sạch dữ liệu 18 máy con để chuẩn bị cho lớp tiếp theo.')) {
            APP.stopMasterTimer();
            APP.updateMasterTimerDisplay(0);
            if (APP.resetAndCleanActivity) {
              APP.resetAndCleanActivity('waiting', { cleanAll: true });
            }
            STORE.setState({
              sessionStarted: false,
              unlocked: false,
              teacherStage: 'hardware',
              currentPhase: 'waiting',
              teacherPhase: 'waiting',
              occupiedMachines: {},
              finishedActivities: {},
              lastFinishedActivity: null
            });

            SYNC_BUS.broadcast('SESSION_ENDED', {});
            safeFirebaseUpdate('activeSession', {
              unlocked: false,
              sessionStarted: false,
              currentPhase: 'waiting',
              resetAt: Date.now(),
              machines: null,
              finishedActivities: null,
              oldLesson: null,
              pollAnswers: null,
              discussionAnswers: null,
              quizAnswers: null
            }).catch(err => console.warn('[Firebase Sync Warning]:', err?.message || err));
            AUDIO.playChime();
          }
        });
      }

      // 6. Nút Đăng xuất Giáo viên
      const btnLogout = document.getElementById('btn-teacher-logout');
      if (btnLogout) {
        btnLogout.addEventListener('click', () => {
          try { sessionStorage.removeItem('lms_admin_logged_in'); } catch (err) { console.warn("[Handled Error Warning]:", err?.message || err); }
          STORE.setState({ role: 'student', screen: 'lobby' });
        });
      }

      // 7. F5 Cưỡng bức 18 máy
      const btnF5All = document.getElementById('btn-remote-reload-all');
      if (btnF5All) {
        btnF5All.addEventListener('click', () => {
          if (confirm('Gửi lệnh F5 cưỡng bức làm mới bộ nhớ toàn bộ 18 máy học sinh?')) {
            alert('Đã phát tín hiệu F5 cưỡng bức đến 18 máy phòng học!');
            SYNC_BUS.broadcast('FORCE_RELOAD', {});
            safeFirebaseSet('remoteCommand', {
              action: 'forceReload',
              timestamp: Date.now()
            }).catch(err => console.warn('[Firebase Sync Warning]:', err?.message || err));
          }
        });
      }

      // 8. Bốc thăm ngẫu nhiên máy học sinh
      const btnRandom = document.getElementById('btn-random-pick-student');
      if (btnRandom) {
        btnRandom.addEventListener('click', () => {
          const randNum = Math.floor(Math.random() * 18) + 1;
          const state = STORE.getState();
          const classData = this.classes[state.classId] || this.classes['6A1'];
          const pair = classData.seatingPlan[randNum] || ["Học sinh 1", "Học sinh 2"];
          alert('🎲 KẾT QUẢ BỐC THĂM NGẪU NHIÊN:\n\n🖥️ MÁY SỐ ' + String(randNum).padStart(2, '0') + '!\n👥 ' + pair.join(' & '));
        });
      }

      // 9. Mở Modal Cài đặt Lớp & Sơ đồ 18 máy
      const btnOpenSettings = document.getElementById('btn-open-teacher-settings');
      if (btnOpenSettings) {
        btnOpenSettings.addEventListener('click', () => {
          this.openSettingsModal();
        });
      }

      // Đóng modal cài đặt
      const btnCloseSettings = document.getElementById('btn-close-settings');
      if (btnCloseSettings) {
        btnCloseSettings.addEventListener('click', () => {
          this.closeSettingsModal();
        });
      }

      const btnCancelSettings = document.getElementById('btn-cancel-settings');
      if (btnCancelSettings) {
        btnCancelSettings.addEventListener('click', () => {
          this.closeSettingsModal();
        });
      }

      // Đổi lớp trong modal cài đặt
      const selectSettingsCls = document.getElementById('settings-select-class');
      if (selectSettingsCls) {
        selectSettingsCls.addEventListener('change', () => {
          this.renderSettingsSeatingGrid();
        });
      }

      // Thêm lớp mới
      const btnAddClass = document.getElementById('btn-add-new-class-modal');
      if (btnAddClass) {
        btnAddClass.addEventListener('click', () => {
          this.addNewClassModal();
        });
      }

      // Tải file mẫu Excel
      const btnDlTemplate = document.getElementById('btn-download-excel-template');
      if (btnDlTemplate) {
        btnDlTemplate.addEventListener('click', () => {
          this.downloadExcelTemplate();
        });
      }

      // Xuất Excel lớp hiện tại
      const btnExportCur = document.getElementById('btn-export-current-excel');
      if (btnExportCur) {
        btnExportCur.addEventListener('click', () => {
          this.exportCurrentClassExcel();
        });
      }

      // Nhập file Excel / CSV
      const inputExcel = document.getElementById('input-excel-file');
      if (inputExcel) {
        inputExcel.addEventListener('change', (e) => {
          if (e.target.files && e.target.files.length > 0) {
            this.importExcelFile(e.target.files[0]);
            e.target.value = '';
          }
        });
      }

      // Lưu cài đặt
      const btnSaveSettings = document.getElementById('btn-save-settings');
      if (btnSaveSettings) {
        btnSaveSettings.addEventListener('click', () => {
          this.saveSettings();
        });
      }

      // Khôi phục mặc định
      const btnResetDefault = document.getElementById('btn-reset-default-class-data');
      if (btnResetDefault) {
        btnResetDefault.addEventListener('click', () => {
          this.resetDefaultClassData();
        });
      }
    },

    // CÁC HÀM QUẢN LÝ CÀI ĐẶT LỚP HỌC & MAP 18 MÁY (EXCEL)
    openSettingsModal() {
      const state = STORE.getState();
      const selectCls = document.getElementById('settings-select-class');
      if (selectCls) {
        selectCls.value = state.classId || '6A1';
      }
      this.renderSettingsSeatingGrid();
      const modal = document.getElementById('modal-teacher-settings');
      if (modal) modal.style.display = 'flex';
    },

    closeSettingsModal() {
      const modal = document.getElementById('modal-teacher-settings');
      if (modal) modal.style.display = 'none';
    },

    renderSettingsSeatingGrid() {
      const selectCls = document.getElementById('settings-select-class');
      const clsId = selectCls ? selectCls.value : '6A1';
      const classData = this.classes[clsId] || this.classes['6A1'];
      const grid = document.getElementById('settings-seating-grid');
      const badge = document.getElementById('settings-student-count-badge');
      if (!grid) return;

      let totalStudents = 0;
      let html = '';

      for (let i = 1; i <= 18; i++) {
        const students = classData.seatingPlan[i] || [];
        totalStudents += students.length;

        let chipsHtml = '';
        if (students.length === 0) {
          chipsHtml = '<span style="font-size:11px;color:#64748b;font-style:italic;padding:4px 0;">(Chưa có học sinh)</span>';
        } else {
          chipsHtml = students.map((name, idx) => `
            <span class="student-chip">
              <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${name}">${name}</span>
              <button type="button" class="chip-del" onclick="APP.removeStudentFromDesk(${i}, ${idx})" title="Xóa học sinh này">&times;</button>
            </span>
          `).join('');
        }

        html += `
          <div class="settings-desk-card" data-desk="${i}">
            <div class="sdc-header">
              <span class="sdc-num">MÁY ${String(i).padStart(2, '0')}</span>
              <span class="sdc-count">${students.length} bạn</span>
            </div>
            <div class="sdc-students-list">
              ${chipsHtml}
            </div>
            <div class="sdc-add-row">
              <input type="text" class="sdc-input" id="add-student-input-${i}" placeholder="+ Tên học sinh..." onkeydown="if(event.key==='Enter')APP.addStudentToDesk(${i})">
              <button type="button" class="sdc-btn-add" onclick="APP.addStudentToDesk(${i})" title="Thêm học sinh vào máy này">Thêm</button>
            </div>
          </div>
        `;
      }

      grid.innerHTML = /* sanitize */ html;
      if (badge) {
        badge.textContent = `${totalStudents} học sinh / 18 máy`;
      }
    },

    renderClassesSeatingPreview() {
      const selectCls = document.getElementById('classes-select-class');
      const clsId = selectCls ? selectCls.value : (STORE.getState().classId || '6A1');
      const classData = this.classes[clsId] || this.classes['6A1'];
      const preview = document.getElementById('classes-seating-preview');
      if (!preview) return;

      let html = '';
      for (let i = 1; i <= 18; i++) {
        const students = classData.seatingPlan[i] || [];
        let chipsHtml = '';
        if (students.length === 0) {
          chipsHtml = '<span style="font-size:11px;color:#64748b;font-style:italic;padding:4px 0;">(Chưa có học sinh)</span>';
        } else {
          chipsHtml = students.map((name, idx) => `
            <span class="student-chip">
              <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${name}">${name}</span>
              <button type="button" class="chip-del" onclick="APP.removeStudentFromDesk(${i}, ${idx})" title="Xóa học sinh này">&times;</button>
            </span>
          `).join('');
        }

        html += `
          <div class="settings-desk-card" data-desk="${i}">
            <div class="sdc-header">
              <span class="sdc-num">MÁY ${String(i).padStart(2, '0')}</span>
              <span class="sdc-count">${students.length} bạn</span>
            </div>
            <div class="sdc-students-list">
              ${chipsHtml}
            </div>
            <div class="sdc-add-row">
              <input type="text" class="sdc-input" id="classes-add-student-input-${i}" placeholder="+ Tên học sinh..." onkeydown="if(event.key==='Enter')APP.addStudentToDesk(${i})">
              <button type="button" class="sdc-btn-add" onclick="APP.addStudentToDesk(${i})" title="Thêm học sinh vào máy này">Thêm</button>
            </div>
          </div>
        `;
      }
      preview.innerHTML = /* sanitize */ html;
    },

    addStudentToDesk(deskNum) {
      const selectCls = document.getElementById('classes-select-class') || document.getElementById('settings-select-class');
      const clsId = selectCls ? selectCls.value : '6A1';
      const classData = this.classes[clsId] || this.classes['6A1'];
      const input = document.getElementById(`add-student-input-${deskNum}`) || document.getElementById(`classes-add-student-input-${deskNum}`);
      if (!input) return;

      const name = input.value.trim();
      if (!name) return;

      if (!classData.seatingPlan[deskNum]) {
        classData.seatingPlan[deskNum] = [];
      }
      classData.seatingPlan[deskNum].push(name);
      input.value = '';
      this.renderSettingsSeatingGrid();
      this.renderClassesSeatingPreview();
    },

    removeStudentFromDesk(deskNum, idx) {
      const selectCls = document.getElementById('classes-select-class') || document.getElementById('settings-select-class');
      const clsId = selectCls ? selectCls.value : '6A1';
      const classData = this.classes[clsId] || this.classes['6A1'];
      if (classData && classData.seatingPlan[deskNum]) {
        classData.seatingPlan[deskNum].splice(idx, 1);
        this.renderSettingsSeatingGrid();
        this.renderClassesSeatingPreview();
      }
    },

    saveSettings() {
      try {
        localStorage.setItem('lms_custom_classes', JSON.stringify(this.classes));
      } catch (e) {
        console.warn('[Storage] Không lưu được lớp:', e);
      }

      const modal = document.getElementById('modal-teacher-settings');
      if (modal) modal.style.display = 'none';

      const state = STORE.getState();
      STORE.setState({ classId: state.classId });
      SYNC_BUS.broadcast('CLASSES_UPDATED', { classes: this.classes });

      alert('✅ Đã lưu danh sách học sinh và sơ đồ 18 máy thành công!');
    },

    resetDefaultClassData() {
      if (confirm('Khôi phục lại toàn bộ danh sách lớp và 18 máy về mặc định ban đầu?')) {
        try {
          localStorage.removeItem('lms_custom_classes');
        } catch (err) { console.warn("[Handled Error Warning]:", err?.message || err); }
        this.classes = JSON.parse(JSON.stringify(EMBEDDED_CLASSES));
        this.renderSettingsSeatingGrid();
        alert('Đã khôi phục dữ liệu lớp học mặc định thành công!');
      }
    },

    downloadExcelTemplate() {
      const selectCls = document.getElementById('settings-select-class');
      const clsId = selectCls ? selectCls.value : '6A1';
      const classData = this.classes[clsId] || this.classes['6A1'];

      const rows = [
        ["Số máy", "Lớp", "Học sinh 1", "Học sinh 2", "Học sinh 3", "Học sinh 4", "Ghi chú"]
      ];
      for (let i = 1; i <= 18; i++) {
        const p = (classData.seatingPlan[i] || []);
        rows.push([
          i,
          classData.className || clsId,
          p[0] || "",
          p[1] || "",
          p[2] || "",
          p[3] || "",
          `Máy bàn số ${String(i).padStart(2, '0')}`
        ]);
      }

      if (typeof XLSX !== 'undefined') {
        const ws = XLSX.utils.aoa_to_sheet(rows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, clsId);
        XLSX.writeFile(wb, `Mau_Danh_Sach_${clsId}_18_May.xlsx`);
      } else {
        let csvContent = "\uFEFF" + rows.map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\r\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.setAttribute("download", `Mau_Danh_Sach_${clsId}_18_May.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    },

    exportCurrentClassExcel() {
      const selectCls = document.getElementById('settings-select-class');
      const clsId = selectCls ? selectCls.value : '6A1';
      const classData = this.classes[clsId] || this.classes['6A1'];

      const rows = [
        ["Số máy", "Lớp", "Học sinh 1", "Học sinh 2", "Học sinh 3", "Học sinh 4", "Ghi chú"]
      ];
      for (let i = 1; i <= 18; i++) {
        const p = (classData.seatingPlan[i] || []);
        rows.push([
          i,
          classData.className || clsId,
          p[0] || "",
          p[1] || "",
          p[2] || "",
          p[3] || "",
          `${classData.className} - Máy ${String(i).padStart(2, '0')}`
        ]);
      }

      if (typeof XLSX !== 'undefined') {
        const ws = XLSX.utils.aoa_to_sheet(rows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, clsId);
        XLSX.writeFile(wb, `Danh_Sach_${clsId}_18_May.xlsx`);
      } else {
        let csvContent = "\uFEFF" + rows.map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\r\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.setAttribute("download", `Danh_Sach_${clsId}_18_May.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    },

    importExcelFile(file) {
      if (!file) return;
      const selectCls = document.getElementById('settings-select-class');
      const clsId = selectCls ? selectCls.value : '6A1';
      const classData = this.classes[clsId] || this.classes['6A1'];

      const isXlsx = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');

      if (isXlsx && typeof XLSX !== 'undefined') {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
            this.processImportedRows(rows, classData);
          } catch (err) {
            alert('Lỗi đọc file Excel: ' + err.message);
          }
        };
        reader.readAsArrayBuffer(file);
      } else {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const text = e.target.result;
            const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
            const rows = lines.map(line => {
              let delimiter = ',';
              if (line.includes(';') && !line.includes(',')) delimiter = ';';
              else if (line.includes('\t')) delimiter = '\t';
              
              const regex = new RegExp(`(?:^|${delimiter})(?:"([^"]*(?:""[^"]*)*)"|([^"${delimiter}]*))`, 'g');
              let matches = [];
              let match;
              while ((match = regex.exec(line)) !== null) {
                let val = match[1] ? match[1].replace(/""/g, '"') : match[2];
                matches.push(val ? val.trim() : '');
              }
              return matches;
            });
            this.processImportedRows(rows, classData);
          } catch (err) {
            alert('Lỗi đọc file CSV: ' + err.message);
          }
        };
        reader.readAsText(file, 'utf-8');
      }
    },

    processImportedRows(rows, targetClassData) {
      if (!rows || rows.length === 0) {
        alert('File không có dữ liệu!');
        return;
      }

      let classData = targetClassData;
      if (!classData) {
        const selectCls = document.getElementById('settings-select-class');
        const clsId = selectCls ? selectCls.value : '6A1';
        classData = this.classes[clsId] || this.classes['6A1'];
      }

      let importedCount = 0;
      let hasClassCol = false;

      // Kiểm tra dòng tiêu đề xem có cột Lớp không
      if (rows[0]) {
        hasClassCol = rows[0].some(cell => {
          const s = String(cell).toLowerCase();
          return s.includes('lớp') || s.includes('class');
        });
      }

      rows.forEach((row, idx) => {
        if (idx === 0 && (String(row[0]).includes('Số') || String(row[0]).includes('Machine'))) {
          return;
        }

        const rawNum = String(row[0] || '').replace(/[^\d]/g, '');
        const machineNum = parseInt(rawNum, 10);
        if (machineNum >= 1 && machineNum <= 18) {
          const students = [];
          const startCol = hasClassCol ? 2 : 1;
          for (let col = startCol; col <= startCol + 3; col++) {
            const name = String(row[col] || '').trim();
            if (name && name !== 'undefined' && name !== 'null') {
              students.push(name);
            }
          }
          if (students.length > 0) {
            classData.seatingPlan[machineNum] = students;
            importedCount++;
          }
        }
      });

      this.renderSettingsSeatingGrid();
      alert(`🎉 Đã nhập thành công danh sách học sinh cho ${importedCount} máy từ file!\nThầy hãy kiểm tra lại và bấm [LƯU THAY ĐỔI VÀ ĐỒNG BỘ] để áp dụng.`);
    },

    addNewClassModal() {
      const className = prompt('Nhập tên lớp mới (ví dụ: 6A3, 7A1, 8A1, 9A2):', '');
      if (!className || !className.trim()) return;
      const cleanName = className.trim();
      const classId = cleanName.replace(/^(lớp|lop)\s*/i, '').replace(/\s+/g, '');

      if (this.classes[classId]) {
        alert('Lớp này đã tồn tại trong hệ thống!');
        const selectCls = document.getElementById('settings-select-class');
        if (selectCls) selectCls.value = classId;
        this.renderSettingsSeatingGrid();
        return;
      }

      this.classes[classId] = {
        className: 'Lớp ' + classId,
        grade: parseInt(classId.replace(/[^\d]/g, ''), 10) || 6,
        totalStudents: 0,
        seatingPlan: {
          "1": [], "2": [], "3": [], "4": [], "5": [], "6": [],
          "7": [], "8": [], "9": [], "10": [], "11": [], "12": [],
          "13": [], "14": [], "15": [], "16": [], "17": [], "18": []
        }
      };

      this.refreshClassDropdowns(classId);
      this.renderSettingsSeatingGrid();
      alert(`🎉 Đã tạo ${this.classes[classId].className}! Thầy có thể nhập học sinh trực tiếp hoặc tải file mẫu Excel về điền.`);
    },

    refreshClassDropdowns(selectedId) {
      const selects = ['settings-select-class', 'select-lobby-class', 'teacher-select-class'];
      selects.forEach(id => {
        const sel = document.getElementById(id);
        if (!sel) return;
        const currentVal = selectedId || sel.value;
        let html = '';
        Object.keys(this.classes).forEach(cId => {
          const c = this.classes[cId];
          const total = Object.values(c.seatingPlan).reduce((acc, cur) => acc + cur.length, 0);
          html += `<option value="${cId}">${c.className} (${total} học sinh • 18 máy)</option>`;
        });
        sel.innerHTML = /* sanitize */ html;
        if (this.classes[currentVal]) {
          sel.value = currentVal;
        }
      });
    },

    // === CÁC PHƯƠNG THỨC QUẢN LÝ BÀI HỌC & XƯỞNG SOẠN KỊCH BẢN (STUDIO EDITOR) ===
    currentStudioGrade: '6',
    currentStudioLessonId: 'tin6_bai12',

    getAllLessons() {
      return EMBEDDED_LESSONS;
    },

    getLesson(id) {
      return EMBEDDED_LESSONS[id] || EMBEDDED_LESSONS['tin6_bai12'] || DEFAULT_LESSONS['tin6_bai12'];
    },

    getLessonsByGrade(grade) {
      const res = [];
      Object.keys(EMBEDDED_LESSONS).forEach(k => {
        const l = EMBEDDED_LESSONS[k];
        if (String(l.grade) === String(grade)) {
          res.push(l);
        }
      });
      return res;
    },

    updateStageLessonDropdown(grade, selectedId) {
      const sel = document.getElementById('teacher-select-lesson');
      if (!sel) return;
      const lessons = this.getLessonsByGrade(grade);
      const currentVal = selectedId || sel.value;
      if (lessons.length === 0) {
        sel.innerHTML = /* sanitize */ '<option value="">(Chưa có bài dạy cho khối này)</option>';
        return;
      }
      sel.innerHTML = /* sanitize */ lessons.map(l => `
        <option value="${l.id}" ${(l.id === currentVal) ? 'selected' : ''}>${l.title}</option>
      `).join('');
      if (!lessons.some(l => l.id === currentVal)) {
        sel.value = lessons[0].id;
      }
      const activeLesson = this.getLesson(sel.value);
      const qInput = document.getElementById('otc-question-input');
      if (qInput && activeLesson && activeLesson.oldLesson?.question) {
        qInput.value = activeLesson.oldLesson.question;
      }
    },

    initStudio() {
      this.updateStageLessonDropdown(STORE.getState().grade || '6');
      this.renderStudioLessonList(this.currentStudioGrade);
      this.loadLessonToStudio(this.currentStudioLessonId);
    },

    renderStudioLessonList(grade) {
      const listEl = document.getElementById('studio-lesson-list');
      if (!listEl) return;
      const lessons = this.getLessonsByGrade(grade);
      if (lessons.length === 0) {
        listEl.innerHTML = /* sanitize */ '<div style="padding:16px;color:#94a3b8;font-size:13px;text-align:center;">Chưa có bài dạy nào cho Khối ' + grade + '</div>';
        return;
      }
      listEl.innerHTML = /* sanitize */ lessons.map(l => `
        <div class="sb-lesson-item ${l.id === this.currentStudioLessonId ? 'active' : ''}" onclick="window.studioLoadLesson('${l.id}')">
          <div class="sli-title">${l.title}</div>
          <div class="sli-meta">Khối ${l.grade} • 5 bước • Đã lưu</div>
        </div>
      `).join('');
    },

    loadLessonToStudio(lessonId) {
      const lesson = this.getLesson(lessonId);
      this.currentStudioLessonId = lesson.id;
      this.currentStudioGrade = String(lesson.grade || '6');

      document.querySelectorAll('.sg-btn').forEach(b => {
        b.classList.toggle('active', b.textContent.includes(this.currentStudioGrade));
      });
      this.renderStudioLessonList(this.currentStudioGrade);

      // Điền dữ liệu vào form
      const titleInp = document.getElementById('studio-lesson-title-input');
      if (titleInp) titleInp.value = lesson.title || '';

      // Bước 1: Khởi động & Bài cũ
      const tool1 = document.getElementById('step-tool-1');
      if (tool1 && lesson.oldLesson && lesson.oldLesson.tool) tool1.value = lesson.oldLesson.tool;
      const time1 = document.getElementById('step-time-1');
      if (time1 && lesson.oldLesson && lesson.oldLesson.timeLimit) time1.value = String(lesson.oldLesson.timeLimit);
      const q1 = document.getElementById('studio-old-lesson-q');
      if (q1) q1.value = (lesson.oldLesson && lesson.oldLesson.question) || (lesson.warmup && lesson.warmup.question) || '';
      const tog1 = document.getElementById('step-toggle-1');
      if (tog1) tog1.checked = (lesson.stepsEnabled ? lesson.stepsEnabled[1] !== false : true);

      // Bước 2: Khám phá SGK
      const task2 = document.getElementById('studio-theory-task');
      if (task2) task2.value = lesson.theoryTask || (lesson.theory && lesson.theory[0] && lesson.theory[0].summary) || '';
      const doc2 = document.getElementById('studio-theory-doc');
      if (doc2) doc2.value = lesson.theoryDoc || (lesson.theory && lesson.theory[0] && lesson.theory[0].title) || '';
      const time2 = document.getElementById('step-time-2');
      if (time2) time2.value = String(lesson.theoryTimeLimit || 300);
      const tog2 = document.getElementById('step-toggle-2');
      if (tog2) tog2.checked = (lesson.stepsEnabled ? lesson.stepsEnabled[2] !== false : true);

      // Bước 3: Thực hành & Thảo luận (Discussion / Python)
      const dTitle = document.getElementById('studio-disc-title');
      if (dTitle && lesson.discussion) dTitle.value = lesson.discussion.title || '';
      const time3 = document.getElementById('step-time-3');
      if (time3) time3.value = String((lesson.discussion && lesson.discussion.timeLimit) || 600);
      const dTask = document.getElementById('studio-disc-task');
      if (dTask && lesson.discussion) dTask.value = lesson.discussion.task || '';
      const dStart = document.getElementById('studio-disc-starter');
      if (dStart && lesson.discussion) dStart.value = lesson.discussion.placeholder || '';
      const tog3 = document.getElementById('step-toggle-3');
      if (tog3) tog3.checked = (lesson.stepsEnabled ? (lesson.stepsEnabled[3] !== false) : true);

      // Bước 4: Đấu trường Kahoot & Live Quiz
      const quizType = (lesson.quiz && lesson.quiz.type) || 'single_choice';
      const typeSel = document.getElementById('studio-quiz-type');
      if (typeSel) {
        typeSel.value = quizType;
        if (typeof window.studioOnQuizTypeChange === 'function') {
          window.studioOnQuizTypeChange(quizType);
        }
      }
      const togShuffle = document.getElementById('studio-quiz-shuffle');
      if (togShuffle) {
        togShuffle.checked = (lesson.quiz && lesson.quiz.shuffle !== undefined) ? !!lesson.quiz.shuffle : true;
      }
      const time4 = document.getElementById('step-time-4');
      if (time4 && lesson.quiz && lesson.quiz.timeLimit) time4.value = String(lesson.quiz.timeLimit);
      const cor4 = document.getElementById('studio-quiz-correct');
      if (cor4 && lesson.quiz && lesson.quiz.correct) cor4.value = lesson.quiz.correct;
      const q4 = document.getElementById('studio-quiz-q');
      if (q4 && lesson.quiz) q4.value = lesson.quiz.question || '';
      const optA = document.getElementById('studio-quiz-opt-a');
      if (optA && lesson.quiz && lesson.quiz.options) optA.value = lesson.quiz.options.A || '';
      const optB = document.getElementById('studio-quiz-opt-b');
      if (optB && lesson.quiz && lesson.quiz.options) optB.value = lesson.quiz.options.B || '';
      const optC = document.getElementById('studio-quiz-opt-c');
      if (optC && lesson.quiz && lesson.quiz.options) optC.value = lesson.quiz.options.C || '';
      const optD = document.getElementById('studio-quiz-opt-d');
      if (optD && lesson.quiz && lesson.quiz.options) optD.value = lesson.quiz.options.D || '';

      // Mệnh đề Đúng/Sai (True/False)
      if (lesson.quiz && Array.isArray(lesson.quiz.subItems)) {
        ['a', 'b', 'c', 'd'].forEach((k, i) => {
          const item = lesson.quiz.subItems[i];
          if (item) {
            const stmtEl = document.getElementById(`studio-tf-stmt-${k}`);
            if (stmtEl && item.statement) stmtEl.value = item.statement;
            const ansEl = document.getElementById(`studio-tf-ans-${k}`);
            if (ansEl) ansEl.value = item.correct ? 'true' : 'false';
          }
        });
      }
      // Điền kết quả ngắn
      const saEl = document.getElementById('studio-sa-correct');
      if (saEl && lesson.quiz && lesson.quiz.shortAnswer) saEl.value = lesson.quiz.shortAnswer;

      const tog4 = document.getElementById('step-toggle-4');
      if (tog4) tog4.checked = (lesson.stepsEnabled ? (lesson.stepsEnabled[4] !== false) : true);

      // Điền các mục bài học (Sections) nếu có
      const sec2Card = document.getElementById('studio-sec-card-2');
      if (lesson.sections && lesson.sections.length === 1) {
        if (sec2Card) sec2Card.style.display = 'none';
      } else if (sec2Card) {
        sec2Card.style.display = 'block';
      }

      if (lesson.sections && lesson.sections[0]) {
        const s1 = lesson.sections[0];
        const s1TitleEl = document.getElementById('studio-sec1-title');
        if (s1TitleEl && s1.title) s1TitleEl.value = s1.title;
        const s1QuizQEl = document.getElementById('studio-sec1-quiz-q');
        if (s1QuizQEl && s1.quiz && s1.quiz.question) s1QuizQEl.value = s1.quiz.question;
        const s1QuizAnsEl = document.getElementById('studio-sec1-quiz-correct');
        if (s1QuizAnsEl && s1.quiz && s1.quiz.correct) s1QuizAnsEl.value = s1.quiz.correct;
        this.renderStudioSectionQuizzes(1, s1.quizzes || (s1.quiz ? [s1.quiz] : []));

        // Trạng thái bật / tắt hoạt động con Mục 1
        if (s1.theory && s1.theory.enabled === false) {
          if (typeof window.studioRemoveSubActivity === 'function') window.studioRemoveSubActivity(1, 'theory');
        } else {
          if (typeof window.studioRestoreSubActivity === 'function') window.studioRestoreSubActivity(1, 'theory');
        }
        if (s1.quiz && s1.quiz.enabled === false) {
          if (typeof window.studioRemoveSubActivity === 'function') window.studioRemoveSubActivity(1, 'quiz');
        } else {
          if (typeof window.studioRestoreSubActivity === 'function') window.studioRestoreSubActivity(1, 'quiz');
        }
        if (s1.practice && s1.practice.enabled === false) {
          if (typeof window.studioRemoveSubActivity === 'function') window.studioRemoveSubActivity(1, 'practice');
        } else {
          if (typeof window.studioRestoreSubActivity === 'function') window.studioRestoreSubActivity(1, 'practice');
        }
      }

      if (lesson.sections && lesson.sections[1]) {
        const s2 = lesson.sections[1];
        const s2TitleEl = document.getElementById('studio-sec2-title');
        if (s2TitleEl && s2.title) s2TitleEl.value = s2.title;
        const s2TTaskEl = document.getElementById('studio-sec2-theory-task');
        if (s2TTaskEl && s2.theory && s2.theory.task) s2TTaskEl.value = s2.theory.task;
        const s2TDocEl = document.getElementById('studio-sec2-theory-doc');
        if (s2TDocEl && s2.theory && s2.theory.doc) s2TDocEl.value = s2.theory.doc;
        const s2QuizQEl = document.getElementById('studio-sec2-quiz-q');
        if (s2QuizQEl && s2.quiz && s2.quiz.question) s2QuizQEl.value = s2.quiz.question;
        const s2QuizAnsEl = document.getElementById('studio-sec2-quiz-correct');
        if (s2QuizAnsEl && s2.quiz && s2.quiz.correct) s2QuizAnsEl.value = s2.quiz.correct;
        const s2PracTaskEl = document.getElementById('studio-sec2-prac-task');
        if (s2PracTaskEl && s2.practice && s2.practice.task) s2PracTaskEl.value = s2.practice.task;
        this.renderStudioSectionQuizzes(2, s2.quizzes || (s2.quiz ? [s2.quiz] : []));

        // Trạng thái bật / tắt hoạt động con Mục 2
        if (s2.theory && s2.theory.enabled === false) {
          if (typeof window.studioRemoveSubActivity === 'function') window.studioRemoveSubActivity(2, 'theory');
        } else {
          if (typeof window.studioRestoreSubActivity === 'function') window.studioRestoreSubActivity(2, 'theory');
        }
        if (s2.quiz && s2.quiz.enabled === false) {
          if (typeof window.studioRemoveSubActivity === 'function') window.studioRemoveSubActivity(2, 'quiz');
        } else {
          if (typeof window.studioRestoreSubActivity === 'function') window.studioRestoreSubActivity(2, 'quiz');
        }
        if (s2.practice && s2.practice.enabled === false) {
          if (typeof window.studioRemoveSubActivity === 'function') window.studioRemoveSubActivity(2, 'practice');
        } else {
          if (typeof window.studioRestoreSubActivity === 'function') window.studioRestoreSubActivity(2, 'practice');
        }
      }

      // Bước 5: Vinh danh
      const tog5 = document.getElementById('step-toggle-5');
      if (tog5) tog5.checked = (lesson.stepsEnabled ? lesson.stepsEnabled[5] !== false : true);
    },

    renderStudioSectionQuizzes(secId, quizzes) {
      const container = document.getElementById(`sec${secId}-quizzes-container`);
      if (!container) return;
      if (!quizzes || quizzes.length === 0) {
        container.innerHTML = /* sanitize */ `
          <div class="empty-quizzes-notice">
            <i class="fas fa-info-circle"></i> Mục này hiện không có câu hỏi trắc nghiệm nào. Thầy hãy bấm nút <strong>[+ Thêm câu hỏi trắc nghiệm]</strong> bên dưới nếu muốn bổ sung!
          </div>
        `;
        const badge = document.getElementById(`sec${secId}-quiz-count-badge`);
        if (badge) badge.innerHTML = /* sanitize */ `<i class="fas fa-layer-group"></i> Gói 0 câu trắc nghiệm`;
        return;
      }

      const badge = document.getElementById(`sec${secId}-quiz-count-badge`);
      if (badge) badge.innerHTML = /* sanitize */ `<i class="fas fa-layer-group"></i> Gói ${quizzes.length} câu trắc nghiệm`;

      let html = '';
      quizzes.forEach((q, idx) => {
        const isFirst = (idx === 0);
        const qIdAttr = isFirst ? `id="studio-sec${secId}-quiz-q"` : '';
        const corIdAttr = isFirst ? `id="studio-sec${secId}-quiz-correct"` : '';
        const timeIdAttr = isFirst ? `id="studio-sec${secId}-quiz-time"` : '';
        const qType = q.type || 'single_choice';
        const qTime = q.timeLimit || 60;
        const qText = q.question || '';
        const qCor = q.correct || 'A';

        html += `
          <div class="studio-quiz-item-card" data-q-idx="${idx}" style="background:rgba(15,23,42,0.6);border:1px solid rgba(255,255,255,0.08);border-radius:8px;padding:12px;margin-bottom:10px;">
            <div class="sqic-header" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
              <span style="color:#38bdf8;font-weight:700;font-size:12.5px;"><i class="fas fa-question-circle"></i> CÂU HỎI ${idx + 1}:</span>
              <div style="display:flex;gap:8px;align-items:center;">
                <select class="studio-select sqic-type-select" onchange="window.studioChangeQuestionType(this)" style="padding:3px 8px;font-size:12px;width:auto;">
                  <option value="single_choice" ${qType === 'single_choice' ? 'selected' : ''}>4 Lựa chọn (A, B, C, D)</option>
                  <option value="true_false" ${qType === 'true_false' ? 'selected' : ''}>Đúng / Sai 4 mệnh đề</option>
                  <option value="short_answer" ${qType === 'short_answer' ? 'selected' : ''}>Điền kết quả ngắn</option>
                </select>
                <button type="button" class="btn-tool-sm btn-tool-danger" onclick="window.studioRemoveQuizQuestion(this)" style="padding:3px 8px;font-size:11px;border-radius:4px;"><i class="fas fa-trash"></i> Xóa</button>
              </div>
            </div>
            <div class="studio-form-row">
              <div class="studio-form-col" style="flex:2;">
                <label class="studio-field-label"><i class="fas fa-question"></i> Nội dung câu hỏi ${idx + 1}:</label>
                <input type="text" class="studio-input sqic-q-input" ${qIdAttr} value="${qText.replace(/"/g, '&quot;')}" placeholder="Nhập nội dung câu hỏi...">
              </div>
              <div class="studio-form-col sqic-correct-col" style="${qType === 'single_choice' ? '' : 'display:none;'}">
                <label class="studio-field-label"><i class="fas fa-check-circle" style="color:#10b981;"></i> Đáp án đúng:</label>
                <select class="studio-select sqic-correct-select" ${corIdAttr}>
                  <option value="A" ${qCor === 'A' ? 'selected' : ''}>A</option>
                  <option value="B" ${qCor === 'B' ? 'selected' : ''}>B</option>
                  <option value="C" ${qCor === 'C' ? 'selected' : ''}>C</option>
                  <option value="D" ${qCor === 'D' ? 'selected' : ''}>D</option>
                </select>
              </div>
              <div class="studio-form-col">
                <label class="studio-field-label"><i class="fas fa-stopwatch"></i> Thời lượng:</label>
                <select class="studio-select sqic-time-select" ${timeIdAttr}>
                  <option value="30" ${qTime === 30 ? 'selected' : ''}>30 giây</option>
                  <option value="60" ${qTime === 60 ? 'selected' : ''}>1 phút</option>
                  <option value="90" ${qTime === 90 ? 'selected' : ''}>1.5 phút</option>
                  <option value="120" ${qTime === 120 ? 'selected' : ''}>2 phút</option>
                </select>
              </div>
            </div>
            <div class="sqic-tf-wrap" style="${qType === 'true_false' ? '' : 'display:none;'}margin-top:8px;">
              <div style="font-size:12px;color:#94a3b8;margin-bottom:4px;"><i class="fas fa-tasks"></i> 4 Mệnh đề Đúng/Sai:</div>
              ${['a', 'b', 'c', 'd'].map((k, i) => {
                const sub = (q.subItems && q.subItems[i]) || { statement: `Mệnh đề ${k}`, correct: (i % 2 === 0) };
                return `
                  <div style="display:flex;gap:6px;align-items:center;margin-bottom:4px;">
                    <span style="color:#38bdf8;font-weight:700;width:18px;">${k})</span>
                    <input type="text" class="studio-input sqic-tf-stmt-${k}" value="${(sub.statement || '').replace(/"/g, '&quot;')}" style="flex:1;padding:4px 8px;font-size:12px;">
                    <select class="studio-select sqic-tf-ans-${k}" style="width:85px;padding:4px 8px;font-size:12px;">
                      <option value="true" ${sub.correct ? 'selected' : ''}>ĐÚNG</option>
                      <option value="false" ${!sub.correct ? 'selected' : ''}>SAI</option>
                    </select>
                  </div>
                `;
              }).join('')}
            </div>
            <div class="sqic-sa-wrap" style="${qType === 'short_answer' ? '' : 'display:none;'}margin-top:8px;">
              <label class="studio-field-label"><i class="fas fa-keyboard"></i> Kết quả mã code mong đợi:</label>
              <input type="text" class="studio-input sqic-sa-ans" value="${(q.shortAnswer || '').replace(/"/g, '&quot;')}" placeholder="Ví dụ: inH...">
            </div>
          </div>
        `;
      });

      container.innerHTML = /* sanitize */ html;
    },

    readSectionQuizzesFromDOM(secId) {
      const container = document.getElementById(`sec${secId}-quizzes-container`);
      if (!container) return [];

      const cards = container.querySelectorAll('.studio-quiz-item-card');
      if (cards.length === 0) return [];

      const list = [];
      cards.forEach((c, idx) => {
        const type = c.querySelector('.sqic-type-select')?.value || 'single_choice';
        const qInp = c.querySelector('.sqic-q-input');
        const q = (qInp ? qInp.value.trim() : '') || (idx === 0 ? document.getElementById(`studio-sec${secId}-quiz-q`)?.value.trim() : '') || `Câu hỏi ${idx + 1}`;
        const timeSel = c.querySelector('.sqic-time-select');
        const time = parseInt(timeSel?.value || '60', 10);

        if (type === 'single_choice') {
          const corSel = c.querySelector('.sqic-correct-select');
          const cor = corSel?.value || (idx === 0 ? document.getElementById(`studio-sec${secId}-quiz-correct`)?.value : 'A') || 'A';
          list.push({
            id: `q${secId}_${idx + 1}`,
            type: 'single_choice',
            question: q,
            options: { A: 'Phương án A', B: 'Phương án B', C: 'Phương án C', D: 'Phương án D' },
            correct: cor,
            timeLimit: time
          });
        } else if (type === 'true_false') {
          const subItems = ['a', 'b', 'c', 'd'].map(k => {
            return {
              id: k,
              statement: c.querySelector(`.sqic-tf-stmt-${k}`)?.value.trim() || `Mệnh đề ${k}`,
              correct: c.querySelector(`.sqic-tf-ans-${k}`)?.value === 'true'
            };
          });
          list.push({ id: `q${secId}_${idx + 1}`, type: 'true_false', question: q, subItems: subItems, timeLimit: time });
        } else if (type === 'short_answer') {
          const sa = c.querySelector('.sqic-sa-ans')?.value.trim() || '';
          list.push({ id: `q${secId}_${idx + 1}`, type: 'short_answer', question: q, shortAnswer: sa, timeLimit: time });
        }
      });

      return list;
    },

    parseCSV(text) {
      const lines = [];
      let row = [];
      let inQuotes = false;
      let curVal = '';

      for (let i = 0; i < text.length; i++) {
        const char = text[i];
        const nextChar = text[i + 1];

        if (inQuotes) {
          if (char === '"' && nextChar === '"') {
            curVal += '"';
            i++;
          } else if (char === '"') {
            inQuotes = false;
          } else {
            curVal += char;
          }
        } else {
          if (char === '"') {
            inQuotes = true;
          } else if (char === ',') {
            row.push(curVal.trim());
            curVal = '';
          } else if (char === '\r' || char === '\n') {
            row.push(curVal.trim());
            curVal = '';
            if (row.length > 1 || (row.length === 1 && row[0] !== '')) {
              lines.push(row);
            }
            row = [];
            if (char === '\r' && nextChar === '\n') {
              i++;
            }
          } else {
            curVal += char;
          }
        }
      }
      if (curVal || row.length > 0) {
        row.push(curVal.trim());
        if (row.length > 1 || (row.length === 1 && row[0] !== '')) {
          lines.push(row);
        }
      }
      return lines;
    },

    processExcelImportedRows(rows) {
      if (!rows || rows.length < 2) {
        alert('File Excel/CSV không có dữ liệu hợp lệ!');
        return;
      }
      const dataRows = rows.slice(1);
      const sectionsMap = {};

      dataRows.forEach(r => {
        if (!r || r.length < 4) return;
        const secNum = parseInt(r[0], 10) || 1;
        const secTitle = String(r[1] || `Mục ${secNum}`).trim();
        const actType = String(r[2] || '').trim().toLowerCase();
        const qType = String(r[3] || 'single_choice').trim().toLowerCase();
        const content = String(r[4] || '').trim();
        const optA = String(r[5] || '').trim();
        const optB = String(r[6] || '').trim();
        const optC = String(r[7] || '').trim();
        const optD = String(r[8] || '').trim();
        const correct = String(r[9] || 'A').trim();
        const timeLimit = parseInt(r[10], 10) || 60;

        if (!sectionsMap[secNum]) {
          sectionsMap[secNum] = {
            id: secNum,
            title: secTitle,
            theory: { task: '', doc: '', timeLimit: 300 },
            quizzes: [],
            practices: []
          };
        }

        const sec = sectionsMap[secNum];
        if (actType.includes('ly_thuyet') || actType.includes('sgk') || actType.includes('kham_pha')) {
          sec.theory.task = content;
          sec.theory.timeLimit = timeLimit;
        } else if (actType.includes('trac_nghiem') || actType.includes('quiz')) {
          const qObj = {
            id: `q${secNum}_${sec.quizzes.length + 1}`,
            type: qType.includes('true') || qType.includes('tf') ? 'true_false' : (qType.includes('short') || qType.includes('dien') ? 'short_answer' : 'single_choice'),
            question: content,
            timeLimit: timeLimit
          };

          if (qObj.type === 'single_choice') {
            qObj.options = { A: optA || 'Phương án A', B: optB || 'Phương án B', C: optC || 'Phương án C', D: optD || 'Phương án D' };
            qObj.correct = correct.toUpperCase() || 'A';
          } else if (qObj.type === 'true_false') {
            const bools = correct.split(',').map(s => {
              const v = s.trim().toUpperCase();
              return v === 'T' || v === 'TRUE' || v === 'Đ' || v === 'D' || v === '1';
            });
            qObj.subItems = [
              { id: 'a', statement: optA || 'Mệnh đề a', correct: bools[0] !== undefined ? bools[0] : true },
              { id: 'b', statement: optB || 'Mệnh đề b', correct: bools[1] !== undefined ? bools[1] : true },
              { id: 'c', statement: optC || 'Mệnh đề c', correct: bools[2] !== undefined ? bools[2] : false },
              { id: 'd', statement: optD || 'Mệnh đề d', correct: bools[3] !== undefined ? bools[3] : true }
            ];
          } else if (qObj.type === 'short_answer') {
            qObj.shortAnswer = correct;
          }
          sec.quizzes.push(qObj);
        } else if (actType.includes('thuc_hanh') || actType.includes('practice')) {
          sec.practices.push({
            id: `p${secNum}_${sec.practices.length + 1}`,
            title: `Thực hành Mục ${secNum}`,
            task: content,
            timeLimit: timeLimit
          });
        }
      });

      const sections = Object.values(sectionsMap);
      if (sections.length === 0) {
        alert('Không tìm thấy mục bài học nào trong file!');
        return;
      }

      const lessonId = this.currentStudioLessonId || 'tin6_bai12';
      const lesson = this.getLesson(lessonId) || {};
      lesson.sections = sections;

      this.loadLessonToStudio(lesson);
      this.saveStudioLesson();

      const totalQuizzes = sections.reduce((acc, s) => acc + (s.quizzes ? s.quizzes.length : 0), 0);
      alert(`🎉 NHẬP DỮ LIỆU THÀNH CÔNG!\nĐã nạp ${sections.length} mục bài học và ${totalQuizzes} câu hỏi trắc nghiệm từ file vào Xưởng Soạn Kịch Bản.`);
    },

    saveStudioLesson() {
      const lessonId = this.currentStudioLessonId || 'tin6_bai12';
      const existing = this.getLesson(lessonId) || {};

      const title = document.getElementById('studio-lesson-title-input')?.value.trim() || existing.title || 'Bài dạy mới';
      const grade = this.currentStudioGrade || existing.grade || '6';

      const tool1 = document.getElementById('step-tool-1')?.value || 'wheel';
      const time1 = parseInt(document.getElementById('step-time-1')?.value || '120', 10);
      const q1 = document.getElementById('studio-old-lesson-q')?.value.trim() || '';

      const task2 = document.getElementById('studio-theory-task')?.value.trim() || '';
      const doc2 = document.getElementById('studio-theory-doc')?.value.trim() || '';
      const time2 = parseInt(document.getElementById('step-time-2')?.value || '300', 10);

      // Bước 3: Thảo luận & Thực hành Python
      const dTitle = document.getElementById('studio-disc-title')?.value.trim() || 'Nhiệm vụ Thảo luận & Thực hành';
      const time3 = parseInt(document.getElementById('step-time-3')?.value || '600', 10);
      const dTask = document.getElementById('studio-disc-task')?.value.trim() || '';
      const dStart = document.getElementById('studio-disc-starter')?.value || '';

      // Bước 4: Đấu trường Kahoot & Live Quiz
      const quizType = document.getElementById('studio-quiz-type')?.value || 'single_choice';
      const quizShuffle = document.getElementById('studio-quiz-shuffle')?.checked !== false;
      const time4 = parseInt(document.getElementById('step-time-4')?.value || '20', 10);
      const cor4 = document.getElementById('studio-quiz-correct')?.value || 'B';
      const q4 = document.getElementById('studio-quiz-q')?.value.trim() || '';
      const optA = document.getElementById('studio-quiz-opt-a')?.value.trim() || '';
      const optB = document.getElementById('studio-quiz-opt-b')?.value.trim() || '';
      const optC = document.getElementById('studio-quiz-opt-c')?.value.trim() || '';
      const optD = document.getElementById('studio-quiz-opt-d')?.value.trim() || '';

      const subItems = ['a', 'b', 'c', 'd'].map(k => {
        const stmt = document.getElementById(`studio-tf-stmt-${k}`)?.value.trim() || '';
        const isTrue = document.getElementById(`studio-tf-ans-${k}`)?.value === 'true';
        return { id: k, statement: stmt, correct: isTrue };
      });
      const shortAns = document.getElementById('studio-sa-correct')?.value.trim() || '';

      const stepsEnabled = {
        1: document.getElementById('step-toggle-1')?.checked !== false,
        2: document.getElementById('step-toggle-2')?.checked !== false,
        3: document.getElementById('step-toggle-3')?.checked !== false,
        4: document.getElementById('step-toggle-4')?.checked !== false,
        5: document.getElementById('step-toggle-5')?.checked !== false
      };

      // Quét động danh sách các Mục bài học (Sections) trong Studio
      const secCards = document.querySelectorAll('#studio-sections-container .studio-section-card');
      const dynamicSections = [];

      secCards.forEach((card, idx) => {
        if (card.style.display === 'none') return;
        const secId = parseInt(card.getAttribute('data-sec') || (idx + 1), 10);
        const secTitle = document.getElementById(`studio-sec${secId}-title`)?.value.trim() || `Mục ${idx + 1}`;

        const thCard = document.getElementById(`sub-act-${secId}-1`);
        const qCard = document.getElementById(`sub-act-${secId}-2`);
        const prCard = document.getElementById(`sub-act-${secId}-3`);

        const isThEnabled = thCard ? thCard.style.display !== 'none' : true;
        const isQEnabled = qCard ? qCard.style.display !== 'none' : true;
        const isPrEnabled = prCard ? prCard.style.display !== 'none' : true;

        const secThTask = (secId === 1) ? task2 : (document.getElementById(`studio-sec${secId}-theory-task`)?.value.trim() || '');
        const secThDoc = (secId === 1) ? doc2 : (document.getElementById(`studio-sec${secId}-theory-doc`)?.value.trim() || '');
        const secThTime = (secId === 1) ? time2 : parseInt(document.getElementById(`studio-sec${secId}-theory-time`)?.value || '300', 10);

        const secQuizzes = isQEnabled ? this.readSectionQuizzesFromDOM(secId) : [];
        if (secId === 1 && secQuizzes.length > 0) {
          secQuizzes[0].type = quizType;
          if (q4) secQuizzes[0].question = q4;
          secQuizzes[0].options = { A: optA, B: optB, C: optC, D: optD };
          secQuizzes[0].correct = cor4;
          secQuizzes[0].subItems = subItems;
          secQuizzes[0].shortAnswer = shortAns;
          secQuizzes[0].timeLimit = time4;
        }
        const sec1QuizItem = {
          id: 'q1_1',
          type: quizType,
          question: q4,
          options: { A: optA, B: optB, C: optC, D: optD },
          correct: cor4,
          subItems: subItems,
          shortAnswer: shortAns,
          timeLimit: time4
        };
        const finalSecQuizzes = (secQuizzes.length > 0) ? secQuizzes : (secId === 1 && q4 ? [sec1QuizItem] : []);
        const firstQ = finalSecQuizzes[0] || {};

        const secPrTitle = (secId === 1) ? dTitle : `Thực hành Mục ${secId}`;
        const secPrTask = (secId === 1) ? dTask : (document.getElementById(`studio-sec${secId}-prac-task`)?.value.trim() || '');
        const secPrStart = (secId === 1) ? dStart : '';
        const secPrTime = (secId === 1) ? time3 : 600;

        dynamicSections.push({
          id: secId,
          title: secTitle,
          theory: isThEnabled ? { enabled: true, task: secThTask, doc: secThDoc, timeLimit: secThTime } : { enabled: false },
          quiz: isQEnabled ? {
            enabled: true,
            type: (secId === 1) ? quizType : (firstQ.type || 'single_choice'),
            question: (secId === 1) ? (q4 || firstQ.question || '') : (firstQ.question || ''),
            options: (secId === 1) ? { A: optA, B: optB, C: optC, D: optD } : (firstQ.options || { A: optA, B: optB, C: optC, D: optD }),
            correct: (secId === 1) ? cor4 : (firstQ.correct || 'A'),
            subItems: (secId === 1) ? subItems : (firstQ.subItems || []),
            shortAnswer: (secId === 1) ? shortAns : (firstQ.shortAnswer || ''),
            timeLimit: (secId === 1) ? time4 : (firstQ.timeLimit || 60)
          } : { enabled: false },
          quizzes: finalSecQuizzes,
          practice: isPrEnabled ? { enabled: true, title: secPrTitle, task: secPrTask, placeholder: secPrStart, timeLimit: secPrTime } : { enabled: false }
        });
      });

      const updatedLesson = {
        id: lessonId,
        title: title,
        grade: grade,
        oldLesson: {
          tool: tool1,
          timeLimit: time1,
          question: q1
        },
        theoryTask: task2,
        theoryDoc: doc2,
        theoryTimeLimit: time2,
        theory: (existing.theory && existing.theory.length) ? existing.theory.map((t, idx) => {
          if (idx === 0) return Object.assign({}, t, { summary: task2, title: doc2 || t.title });
          return t;
        }) : [{ id: 'card-1', title: doc2 || 'Lý thuyết', summary: task2, code: '' }],
        discussion: {
          title: dTitle,
          task: dTask,
          placeholder: dStart,
          timeLimit: time3
        },
        quiz: {
          type: quizType,
          shuffle: quizShuffle,
          timeLimit: time4,
          correct: cor4,
          question: q4,
          options: {
            A: optA,
            B: optB,
            C: optC,
            D: optD
          },
          subItems: subItems,
          shortAnswer: shortAns
        },
        sections: dynamicSections.length > 0 ? dynamicSections : [
          {
            id: 1,
            title: 'Mục 1',
            theory: { enabled: true, task: task2, doc: doc2, timeLimit: time2 },
            quiz: { enabled: true, question: '', correct: 'A', timeLimit: 60 },
            quizzes: [],
            practice: { enabled: true, title: dTitle, task: dTask, placeholder: dStart, timeLimit: time3 }
          }
        ],
        stepsEnabled: stepsEnabled
      };

      // Lưu vào bộ nhớ cục bộ
      EMBEDDED_LESSONS[lessonId] = updatedLesson;
      customLessons[lessonId] = updatedLesson;
      try {
        localStorage.setItem('lms_custom_lessons', JSON.stringify(customLessons));
      } catch (err) { console.warn("[Handled Error Warning]:", err?.message || err); }

      // Cập nhật STORE nếu đang dùng bài học này
      const state = STORE.getState();
      if (state.lessonId === lessonId || !state.lessonData) {
        STORE.setState({
          lessonData: updatedLesson,
          oldLesson: Object.assign({}, state.oldLesson, {
            questionText: q1,
            timerSeconds: time1,
            timeLeft: time1
          })
        });
      }

      // Cập nhật Stage 1 dropdown & Studio list
      this.updateStageLessonDropdown(grade, lessonId);
      this.renderStudioLessonList(grade);

      // Đồng bộ SYNC_BUS và Firebase an toàn
      SYNC_BUS.broadcast('LESSON_UPDATED', { lesson: updatedLesson });
      safeFirebaseSet(`lessons/${lessonId}`, updatedLesson).catch(err => console.warn('[Firebase Sync Warning]:', err?.message || err));
      if (state.lessonId === lessonId) {
        safeFirebaseSet('activeSession/lessonData', updatedLesson).catch(err => console.warn('[Firebase Sync Warning]:', err?.message || err));
        safeFirebaseSet('activeSession/oldLesson/questionText', q1).catch(err => console.warn('[Firebase Sync Warning]:', err?.message || err));
        safeFirebaseRemove('activeSession/quizAnswers').catch(err => console.warn('[Firebase Sync Warning]:', err?.message || err));
      }

      alert(`💾 ĐÃ LƯU THÀNH CÔNG!\nKịch bản "${title}" đã sẵn sàng cho 18 máy phòng thực hành.`);
    },

    studioCreateNewLesson() {
      const title = prompt('Nhập tên bài dạy mới:', 'Bài mới: ');
      if (!title || !title.trim()) return;
      const grade = this.currentStudioGrade || '6';
      const id = `lesson_${grade}_${Date.now()}`;
      const newLesson = {
        id: id,
        title: title.trim(),
        grade: grade,
        oldLesson: {
          tool: 'wheel',
          timeLimit: 120,
          question: 'Câu hỏi kiểm tra bài cũ...'
        },
        theoryTask: 'Nhiệm vụ học tập / Đọc SGK...',
        theoryDoc: `SGK Tin học ${grade}`,
        theory: [{ id: 'card-1', title: `SGK Tin học ${grade}`, summary: 'Nhiệm vụ học tập...', code: '' }],
        quiz: {
          timeLimit: 20,
          correct: 'A',
          question: 'Nội dung câu hỏi trắc nghiệm...',
          options: {
            A: 'Phương án A (Đỏ)',
            B: 'Phương án B (Lam)',
            C: 'Phương án C (Vàng)',
            D: 'Phương án D (Lục)'
          }
        },
        discussion: {
          title: 'Nhiệm vụ Thảo luận & Thực hành',
          task: 'Yêu cầu thực hành trên máy tính...',
          placeholder: '# Gõ mã lệnh hoặc kết quả thảo luận tại đây...',
          timeLimit: 720
        },
        stepsEnabled: { 1: true, 2: true, 3: true, 4: true, 5: true }
      };
      EMBEDDED_LESSONS[id] = newLesson;
      customLessons[id] = newLesson;
      try {
        localStorage.setItem('lms_custom_lessons', JSON.stringify(customLessons));
      } catch (err) { console.warn("[Handled Error Warning]:", err?.message || err); }
      this.loadLessonToStudio(id);
      this.updateStageLessonDropdown(grade, id);
      alert(`🎉 Đã tạo bài dạy mới "${title.trim()}" cho Khối ${grade}! Thầy hãy chỉnh sửa nội dung và bấm [LƯU KỊCH BẢN].`);
    },

    studioPreviewLesson() {
      const lessonId = this.currentStudioLessonId || 'tin6_bai12';
      const l = this.getLesson(lessonId) || {};
      const titleInp = document.getElementById('studio-lesson-title-input');
      const title = (titleInp && titleInp.value.trim()) || l.title || 'Bài dạy thực hành';

      const modal = document.getElementById('modal-studio-preview');
      const titleEl = document.getElementById('bp-modal-title');
      const container = document.getElementById('blueprint-table-container');
      const summaryTags = document.getElementById('bp-summary-tags');
      if (!modal || !container) return;

      if (titleEl) titleEl.textContent = title;

      // Đọc các giá trị từ form Studio hiện thời
      const oldLessonQ = document.getElementById('studio-old-lesson-q')?.value.trim() || l.oldLesson?.question || 'Chưa đặt';
      const oldLessonTime = document.getElementById('step-time-1')?.value || '120';

      const sec1TheoryTask = document.getElementById('studio-theory-task')?.value.trim() || l.theoryTask || 'Đọc SGK mục 1';
      const sec1TheoryDoc = document.getElementById('studio-theory-doc')?.value.trim() || l.theoryDoc || 'SGK Tin học';
      const sec1TheoryTime = document.getElementById('step-time-2')?.value || '300';
      const sec1PracTitle = document.getElementById('studio-disc-title')?.value.trim() || l.discussion?.title || 'Nhiệm vụ Thảo luận & Thực hành';
      const sec1PracTask = document.getElementById('studio-disc-task')?.value.trim() || l.discussion?.task || 'Yêu cầu thực hành';
      const sec1PracTime = document.getElementById('step-time-3')?.value || '600';

      const quizQ = document.getElementById('studio-quiz-q')?.value.trim() || l.quiz?.question || 'Câu hỏi trắc nghiệm Đấu trường';
      const quizType = document.getElementById('studio-quiz-type')?.value || l.quiz?.type || 'single_choice';
      const quizTime = document.getElementById('step-time-4')?.value || '20';

      const formatTime = (sec) => {
        const s = parseInt(sec, 10);
        if (s < 60) return `${s} giây`;
        return `${Math.round(s / 60)} phút`;
      };

      // Quét động các Mục (Sections) và Hoạt động con trong Studio
      const secCards = Array.from(document.querySelectorAll('#studio-sections-container .studio-section-card'))
        .filter(c => c.style.display !== 'none');

      let totalActivities = 1; // Khởi động & Bài cũ
      let totalSeconds = parseInt(oldLessonTime, 10) || 120;

      let sectionsTableHtml = '';

      secCards.forEach((card, sIdx) => {
        const secId = parseInt(card.getAttribute('data-sec') || (sIdx + 1), 10);
        const secTitle = document.getElementById(`studio-sec${secId}-title`)?.value.trim() || `Mục ${sIdx + 1}`;

        const thCard = document.getElementById(`sub-act-${secId}-1`);
        const qCard = document.getElementById(`sub-act-${secId}-2`);
        const prCard = document.getElementById(`sub-act-${secId}-3`);

        const isThEnabled = thCard ? thCard.style.display !== 'none' : true;
        const isQEnabled = qCard ? qCard.style.display !== 'none' : true;
        const isPrEnabled = prCard ? prCard.style.display !== 'none' : true;

        const subActs = [];

        if (isThEnabled) {
          const task = (secId === 1) ? sec1TheoryTask : (document.getElementById(`studio-sec${secId}-theory-task`)?.value.trim() || l.sections?.[sIdx]?.theoryTask || `Đọc SGK Tin học THCS Mục ${sIdx + 1}`);
          const doc = (secId === 1) ? sec1TheoryDoc : (document.getElementById(`studio-sec${secId}-theory-doc`)?.value.trim() || l.sections?.[sIdx]?.theoryDoc || `SGK Tin học THCS - Mục ${sIdx + 1}`);
          const time = (secId === 1) ? parseInt(sec1TheoryTime, 10) : parseInt(document.getElementById(`studio-sec${secId}-theory-time`)?.value || l.sections?.[sIdx]?.theoryTime || '300', 10);
          totalActivities++;
          totalSeconds += time;
          subActs.push({
            icon: 'fa-book-reader',
            iconColor: '#38bdf8',
            title: `HĐ ${sIdx + 1}.1: Khám phá SGK & Thẻ Tri Thức`,
            contentHtml: `
              <div style="font-size:13px;color:#cbd5e1;">${task}</div>
              <div style="font-size:11.5px;color:#38bdf8;margin-top:3px;"><i class="fas fa-bookmark"></i> ${doc}</div>
            `,
            timeStr: formatTime(time),
            chips: ['1. Giao nhiệm vụ', '2. Bắt đầu đọc', '3. Chốt kiến thức', '4. Sảnh chờ']
          });
        }

        if (isQEnabled) {
          let secQuizzes = this.readSectionQuizzesFromDOM(secId);
          if (secQuizzes.length === 0 && l.sections?.[sIdx]?.quizzes?.length > 0) {
            secQuizzes = l.sections[sIdx].quizzes;
          }
          const firstTime = secQuizzes[0]?.timeLimit || 60;
          totalActivities++;
          totalSeconds += firstTime;

          let qContentHtml = '';
          if (secQuizzes.length > 1) {
            qContentHtml = `<div style="font-size:12.5px;color:#38bdf8;font-weight:700;margin-bottom:4px;"><i class="fas fa-layer-group"></i> Gói ${secQuizzes.length} câu trắc nghiệm:</div>`;
            secQuizzes.forEach((q, i) => {
              const tName = q.type === 'true_false' ? 'Đúng/Sai' : (q.type === 'short_answer' ? 'Điền code' : '4 Lựa chọn');
              qContentHtml += `<div style="font-size:12px;color:#cbd5e1;margin-bottom:3px;"><span style="color:#10b981;font-weight:700;">${i + 1}. [${tName}]</span> ${q.question}</div>`;
            });
          } else if (secQuizzes.length === 1) {
            qContentHtml = `
              <div style="font-size:13px;color:#cbd5e1;">${secQuizzes[0].question}</div>
              <div style="font-size:11.5px;color:#10b981;margin-top:3px;"><i class="fas fa-check-circle"></i> Đáp án: <strong>${secQuizzes[0].correct || 'A'}</strong></div>
            `;
          } else {
            qContentHtml = `<div style="font-size:12.5px;color:#94a3b8;font-style:italic;"><i class="fas fa-info-circle"></i> (Chưa có câu hỏi trắc nghiệm)</div>`;
          }

          subActs.push({
            icon: 'fa-check-double',
            iconColor: '#10b981',
            title: `HĐ ${sIdx + 1}.2: Trắc nghiệm củng cố`,
            contentHtml: qContentHtml,
            timeStr: formatTime(firstTime),
            chips: ['1. Chuẩn bị', '2. Phát đề', '3. Công bố Đ/A', '4. Sảnh chờ']
          });
        }

        if (isPrEnabled) {
          const prTitle = (secId === 1) ? sec1PracTitle : (document.getElementById(`studio-sec${secId}-prac-title`)?.value.trim() || l.sections?.[sIdx]?.discussion?.title || `Thực hành Tin học THCS Mục ${sIdx + 1}`);
          const prTask = (secId === 1) ? sec1PracTask : (document.getElementById(`studio-sec${secId}-prac-task`)?.value.trim() || l.sections?.[sIdx]?.discussion?.task || `Thực hành thao tác trên máy tính Mục ${sIdx + 1} theo hướng dẫn SGK Tin học THCS.`);
          const prTime = (secId === 1) ? parseInt(sec1PracTime, 10) : parseInt(document.getElementById(`studio-sec${secId}-prac-time`)?.value || l.sections?.[sIdx]?.discussion?.timeLimit || '600', 10);
          totalActivities++;
          totalSeconds += prTime;

          subActs.push({
            icon: 'fa-laptop-code',
            iconColor: '#a855f7',
            title: `HĐ ${sIdx + 1}.3: ${prTitle}`,
            contentHtml: `
              <div style="font-size:13px;color:#cbd5e1;font-weight:600;">${prTitle}</div>
              <div style="font-size:12px;color:#94a3b8;white-space:pre-line;margin-top:2px;">${prTask}</div>
            `,
            timeStr: formatTime(prTime),
            chips: ['1. Giao đề bài', '2. Mở code', '3. Thu bài & Mẫu', '4. Sảnh chờ']
          });
        }

        if (subActs.length === 0) {
          sectionsTableHtml += `
            <tr>
              <td style="background:rgba(2,132,199,0.06);border-right:1px solid rgba(56,189,248,0.2);">
                <span class="bp-stage-badge bp-stage-blue">🔷 ${secTitle}</span>
              </td>
              <td colspan="4" style="color:#94a3b8;font-style:italic;padding:12px 16px;">
                <i class="fas fa-info-circle"></i> (Mục này hiện đã tắt toàn bộ các hoạt động con)
              </td>
            </tr>
          `;
        } else {
          subActs.forEach((act, actIdx) => {
            sectionsTableHtml += `
              <tr>
                ${actIdx === 0 ? `
                  <td rowspan="${subActs.length}" style="background:rgba(2,132,199,0.06);border-right:1px solid rgba(56,189,248,0.2);">
                    <span class="bp-stage-badge bp-stage-blue">🔷 ${secTitle}</span>
                  </td>
                ` : ''}
                <td><i class="fas ${act.icon}" style="color:${act.iconColor};"></i> <strong>${act.title}</strong></td>
                <td>${act.contentHtml}</td>
                <td><span class="bp-time-tag"><i class="fas fa-stopwatch"></i> ${act.timeStr}</span></td>
                <td>
                  <div class="bp-seq-table-flow">
                    <span class="bp-seq-chip c1">${act.chips[0]}</span> <i class="fas fa-chevron-right" style="font-size:9px;color:#64748b;"></i>
                    <span class="bp-seq-chip c2">${act.chips[1]}</span> <i class="fas fa-chevron-right" style="font-size:9px;color:#64748b;"></i>
                    <span class="bp-seq-chip c3">${act.chips[2]}</span> <i class="fas fa-chevron-right" style="font-size:9px;color:#64748b;"></i>
                    <span class="bp-seq-chip c4">${act.chips[3]}</span>
                  </div>
                </td>
              </tr>
            `;
          });
        }
      });

      // Thêm hoạt động Tổng kết Kahoot
      totalActivities++; // Kahoot
      totalSeconds += parseInt(quizTime, 10) || 20;

      if (summaryTags) {
        summaryTags.innerHTML = /* sanitize */ `
          <span class="bp-stage-badge bp-stage-blue"><i class="fas fa-layer-group"></i> ${secCards.length} Mục bài học</span>
          <span class="bp-stage-badge bp-stage-gold"><i class="fas fa-tasks"></i> ${totalActivities} Hoạt động</span>
          <span class="bp-stage-badge bp-stage-red"><i class="fas fa-stopwatch"></i> Tổng ~${Math.round(totalSeconds / 60)} phút</span>
        `;
      }

      const tableHtml = `
        <table class="blueprint-table">
          <thead>
            <tr>
              <th style="width:220px;"><i class="fas fa-stream"></i> Tiến trình / Mục bài học</th>
              <th style="width:160px;"><i class="fas fa-flag"></i> Hoạt động</th>
              <th><i class="fas fa-file-alt"></i> Nội dung tác nghiệp trọng tâm</th>
              <th style="width:110px;"><i class="fas fa-clock"></i> Thời lượng</th>
              <th style="width:330px;"><i class="fas fa-sliders-h"></i> Chu trình 4 Nút Tuần Tự Chuẩn</th>
            </tr>
          </thead>
          <tbody>
            <!-- KHỞI ĐỘNG & BÀI CŨ -->
            <tr>
              <td>
                <span class="bp-stage-badge bp-stage-red">🔴 KHỞI ĐỘNG & BÀI CŨ</span>
              </td>
              <td><strong>Kiểm tra bài cũ</strong></td>
              <td>
                <div style="font-size:13px;color:#cbd5e1;font-weight:600;">${oldLessonQ}</div>
                <div style="font-size:11.5px;color:#94a3b8;margin-top:4px;"><i class="fas fa-dice"></i> Bốc thăm gọi ngẫu nhiên học sinh trả lời miệng/trên máy</div>
              </td>
              <td><span class="bp-time-tag"><i class="fas fa-stopwatch"></i> ${formatTime(oldLessonTime)}</span></td>
              <td>
                <div class="bp-seq-table-flow">
                  <span class="bp-seq-chip c1">1. Bốc thăm</span> <i class="fas fa-chevron-right" style="font-size:9px;color:#64748b;"></i>
                  <span class="bp-seq-chip c2">2. Câu hỏi</span> <i class="fas fa-chevron-right" style="font-size:9px;color:#64748b;"></i>
                  <span class="bp-seq-chip c3">3. Đáp án</span> <i class="fas fa-chevron-right" style="font-size:9px;color:#64748b;"></i>
                  <span class="bp-seq-chip c4">4. Sảnh chờ</span>
                </div>
              </td>
            </tr>

            <!-- CÁC MỤC BÀI HỌC ĐỘNG -->
            ${sectionsTableHtml}

            <!-- TỔNG KẾT: KAHOOT & PODIUM -->
            <tr>
              <td>
                <span class="bp-stage-badge bp-stage-gold">🏆 TỔNG KẾT</span>
              </td>
              <td><strong>Đấu trường Kahoot & Podium</strong></td>
              <td>
                <div style="font-size:13px;color:#cbd5e1;font-weight:600;">${quizQ}</div>
                <div style="font-size:11.5px;color:#fbbf24;margin-top:4px;">
                  <i class="fas fa-shield-alt"></i> Tự động đảo đáp án 18 máy chống nhìn bài • Dạng: ${quizType === 'single_choice' ? '4 màu Kahoot' : (quizType === 'true_false' ? 'Đúng/Sai 4 ý' : 'Điền kết quả')}
                </div>
              </td>
              <td><span class="bp-time-tag"><i class="fas fa-stopwatch"></i> ${formatTime(quizTime)}</span></td>
              <td>
                <div class="bp-seq-table-flow">
                  <span class="bp-seq-chip c1">1. Khởi động</span> <i class="fas fa-chevron-right" style="font-size:9px;color:#64748b;"></i>
                  <span class="bp-seq-chip c2">2. Phát đề</span> <i class="fas fa-chevron-right" style="font-size:9px;color:#64748b;"></i>
                  <span class="bp-seq-chip c3">3. Bục vinh danh</span> <i class="fas fa-chevron-right" style="font-size:9px;color:#64748b;"></i>
                  <span class="bp-seq-chip c4">4. Tổng kết</span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      `;

      container.innerHTML = /* sanitize */ tableHtml;
      modal.style.display = 'flex';
    },

    // Xử lý nộp form đăng nhập Admin
    async handleTeacherLoginSubmit() {
      const pwdInput = document.getElementById('teacher-password-input');
      const errorMsg = document.getElementById('auth-error-msg');
      const modal = document.getElementById('modal-teacher-login');

      if (!pwdInput) return;
      const pass = pwdInput.value.trim();
      const hash = await sha256Hex(pass);

      const isValid = Boolean(hash && VALID_PASSWORD_HASHES.includes(hash));

      if (isValid) {
        try { sessionStorage.setItem('lms_admin_logged_in', 'true'); } catch (err) { console.warn("[Handled Error Warning]:", err?.message || err); }
        if (errorMsg) errorMsg.style.display = 'none';
        if (modal) modal.style.display = 'none';

        const state = STORE.getState();
        STORE.setState({
          role: 'teacher',
          screen: 'teacher',
          teacherStage: state.sessionStarted ? 'active' : 'hardware'
        });
      } else {
        if (errorMsg) errorMsg.style.display = 'flex';
      }
    },

    // Hàm mở modal khi click vào máy tính tại Sảnh
    onSelectMachine(num) {
      const state = STORE.getState();
      const fixedId = state.fixedMachineId;

      // 0. Kiểm tra khóa sơ đồ phòng máy: Nếu chưa được GV kích hoạt thì cấm chọn
      if (!state.unlocked) {
        alert('Phòng máy đang được khóa để Thầy/Cô kích hoạt tiết học! Em vui lòng chờ Thầy/Cô bấm kích hoạt bài học.');
        return;
      }

      // 0.1. Chống vào đột ngột: Nếu tiết học đang diễn ra hoạt động thì cấm học sinh vào ngang
      if (state.sessionStarted && state.currentPhase !== 'waiting') {
        alert('⚠️ Hoạt động lớp học đang diễn ra. Em vui lòng giữ trật tự và chờ Thầy/Cô chuyển hoạt động tiếp theo!');
        return;
      }

      // 1. Kiểm tra Token Guard chống bấm nhầm
      if (fixedId && fixedId !== num) {
        const warningModal = document.getElementById('modal-token-warning');
        const warningText = document.getElementById('warning-text-content');
        if (warningText) {
          warningText.innerHTML = /* sanitize */ `Thiết bị này đã được lưu định danh là <strong>MÁY ${String(fixedId).padStart(2,'0')}</strong>.<br>Bạn không thể chọn <strong>MÁY ${String(num).padStart(2,'0')}</strong> để tránh trùng lặp chỗ ngồi của nhóm bạn khác!`;
        }
        if (warningModal) warningModal.style.display = 'flex';
        return;
      }

      // 2. Nếu máy đã có bạn khác vào và không phải máy của mình
      if (state.occupiedMachines[num] && fixedId !== num) {
        alert(`Máy ${num} đã được nhóm bạn khác xác nhận vào lớp. Em hãy chọn đúng máy của mình!`);
        return;
      }

      // 3. Mở Modal xác nhận máy
      const classData = this.classes[state.classId] || this.classes['6A1'];
      const pair = classData.seatingPlan[num] || ["Học sinh 1", "Học sinh 2"];

      STORE.setState({ pendingMachineId: num });

      const modalTitle = document.getElementById('modal-machine-title');
      const modalClass = document.getElementById('modal-class-name');
      const modalTags = document.getElementById('modal-pair-tags');

      if (modalTitle) modalTitle.textContent = `XÁC NHẬN MÁY BÀN SỐ ${String(num).padStart(2,'0')}`;
      if (modalClass) modalClass.textContent = classData.className;
      if (modalTags) {
        modalTags.innerHTML = /* sanitize */ pair.map((name, idx) => `
          <div class="pair-tag"><i class="fas fa-user-graduate"></i> ${idx + 1}. ${name}</div>
        `).join('');
      }

      const confirmModal = document.getElementById('modal-confirm-machine');
      if (confirmModal) confirmModal.style.display = 'flex';
    },

    render(state) {
      // 0. Cập nhật huy hiệu PWA trên Topbar cho mọi màn hình
      const pwaBadge = document.getElementById('device-pwa-badge');
      if (pwaBadge) {
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
        const modeText = isStandalone ? 'PWA Standalone' : 'Browser';
        const fixedId = state.fixedMachineId;
        if (fixedId) {
          pwaBadge.innerHTML = /* sanitize */ '<i class="fas fa-desktop"></i> Thiết bị này: <strong>MÁY ' + String(fixedId).padStart(2, '0') + '</strong> <span style="font-size:11px;opacity:0.85;background:rgba(0,0,0,0.3);padding:2px 6px;border-radius:4px;margin-left:4px;">' + modeText + '</span>';
        } else {
          pwaBadge.innerHTML = /* sanitize */ '<i class="fas fa-desktop"></i> Thiết bị: <span style="color:#cbd5e1">Chưa gán</span> <span style="font-size:11px;opacity:0.85;background:rgba(0,0,0,0.3);padding:2px 6px;border-radius:4px;margin-left:4px;">' + modeText + '</span>';
        }
      }

      // 1. Chuyển đổi màn hình: Sảnh (Lobby), Học sinh (Student), hoặc Giáo viên (Teacher)
      const screenLobby = document.getElementById('screen-lobby');
      const screenStudent = document.getElementById('screen-student');
      const screenTeacher = document.getElementById('screen-teacher');

      if (screenLobby && screenStudent && screenTeacher) {
        screenLobby.classList.remove('active');
        screenStudent.classList.remove('active');
        screenTeacher.classList.remove('active');

        if (state.screen === 'teacher') {
          screenTeacher.classList.add('active');
          this.renderTeacherDashboard(state);
        } else if (state.screen === 'student') {
          screenStudent.classList.add('active');
          this.renderStudentWorkspace(state);
        } else {
          screenLobby.classList.add('active');
          this.renderLobby(state);
        }
      }
    },

    // RENDER BẢNG ĐIỀU KHIỂN GIÁO VIÊN
    renderTeacherDashboard(state) {
      const stageHw = document.getElementById('teacher-stage-hardware');
      const stageActive = document.getElementById('teacher-stage-active');

      if (state.teacherStage === 'active') {
        if (stageHw) stageHw.classList.remove('active');
        if (stageActive) stageActive.classList.add('active');
        this.renderTeacherActiveSession(state);
      } else {
        if (stageHw) stageHw.classList.add('active');
        if (stageActive) stageActive.classList.remove('active');
        this.renderTeacherHardwareStage(state);
      }
    },

    // GIAI ĐOẠN 1: KIỂM TRA PHẦN CỨNG 18 MÁY (CHƯA CHỌN LỚP)
    renderTeacherHardwareStage(state) {
      const grid = document.getElementById('hardware-grid-18');
      if (!grid) return;

      let html = '';
      let onlineCount = 0;

      for (let i = 1; i <= 18; i++) {
        const isOnline = state.hardwareStatus[i] !== false;
        if (isOnline) onlineCount++;

        const cardClass = isOnline ? 'hardware-card online' : 'hardware-card offline';
        const statusClass = isOnline ? 'hwc-status-row online' : 'hwc-status-row offline';
        const statusText = isOnline ? '<i class="fas fa-check-circle" style="margin-right:4px;"></i> Thiết bị PWA Online' : '<i class="fas fa-times-circle" style="margin-right:4px;"></i> Chưa bật máy';

        html += '<div class="' + cardClass + '">' +
                  '<div class="hwc-header">' +
                    '<span class="hwc-num">MÁY ' + String(i).padStart(2, '0') + '</span>' +
                    '<span class="hwc-icon"><i class="fas fa-desktop"></i></span>' +
                  '</div>' +
                  '<div class="' + statusClass + '">' + statusText + '</div>' +
                '</div>';
      }

      grid.innerHTML = /* sanitize */ html;

      const summary = document.getElementById('hardware-status-summary');
      if (summary) {
        summary.textContent = onlineCount + '/18 máy sẵn sàng kết nối';
      }
    },

    getLessonActivities(lesson) {
      if (!lesson) lesson = this.getLesson(STORE.getState().lessonId) || {};
      const se = lesson.stepsEnabled || {};
      const list = [];
      let idx = 1;

      // 1. Khởi động & Kiểm tra bài cũ
      if (se['1'] !== false && (lesson.oldLesson || lesson.warmup)) {
        list.push({
          key: 'old_lesson',
          index: idx++,
          title: 'Khởi động & Kiểm tra bài cũ',
          duration: (lesson.oldLesson && lesson.oldLesson.timeLimit) ? lesson.oldLesson.timeLimit : 120,
          icon: 'fa-dice',
          panelId: 'tw-panel-old-lesson'
        });
      }

      // 2. Khám phá kiến thức mới (SGK)
      if (se['2'] !== false && (lesson.theory || lesson.theoryTask || lesson.warmup)) {
        list.push({
          key: 'warmup',
          index: idx++,
          title: 'Khám phá kiến thức mới (SGK)',
          duration: lesson.theoryTimeLimit || 300,
          icon: 'fa-book-open',
          panelId: 'tw-panel-warmup'
        });
      }

      // 3. Thực hành & Thảo luận (Python / Nhóm đôi)
      if (se['3'] !== false && lesson.discussion) {
        list.push({
          key: 'discussion',
          index: idx++,
          title: 'Thực hành & Thảo luận',
          duration: (lesson.discussion && lesson.discussion.timeLimit) ? lesson.discussion.timeLimit : 600,
          icon: 'fa-laptop-code',
          panelId: 'tw-panel-discussion'
        });
      }

      // 4. Đấu trường Kahoot & Vinh danh Podium
      if (se['4'] !== false && lesson.quiz) {
        list.push({
          key: 'quiz',
          index: idx++,
          title: 'Đấu trường Kahoot & Vinh danh',
          duration: (lesson.quiz && lesson.quiz.timeLimit) ? lesson.quiz.timeLimit : 20,
          icon: 'fa-trophy',
          panelId: 'tw-panel-quiz'
        });
      }

      // Mặc định ít nhất có 1 hoạt động nếu chưa bật gì
      if (list.length === 0) {
        list.push({
          key: 'old_lesson',
          index: 1,
          title: 'Khởi động & Kiểm tra bài cũ',
          duration: 120,
          icon: 'fa-dice',
          panelId: 'tw-panel-old-lesson'
        });
      }

      return list;
    },

    checkWaitingRoomReadiness() {
      const state = STORE.getState();
      const occ = state.occupiedMachines || {};
      const occupiedCount = Object.keys(occ).length;
      const missingDesks = [];
      for (let i = 1; i <= 18; i++) {
        if (!occ[i]) missingDesks.push(i);
      }
      return {
        isReady: missingDesks.length === 0,
        occupiedCount,
        missingDesks
      };
    },

    renderDynamicStagePipeline(state) {
      state = state || STORE.getState();
      const container = document.getElementById('teacher-dynamic-pipeline');
      if (!container) return;

      const lesson = state.lessonData || this.getLesson(state.lessonId);
      const titleEl = document.getElementById('tdch-lesson-name');
      if (titleEl && lesson) titleEl.textContent = lesson.title || 'Bài dạy Tin học';

      // Sĩ số phòng chờ
      const occCount = Object.keys(state.occupiedMachines || {}).length;
      const waitingBadge = document.getElementById('tdch-waiting-badge');
      const waitingCount = document.getElementById('tdch-waiting-count');
      if (waitingCount) waitingCount.textContent = 'Phòng chờ: ' + occCount + '/18 máy';
      if (waitingBadge) waitingBadge.classList.toggle('warning', occCount < 18);

      const activities = this.getLessonActivities(lesson);
      const finishedActs = state.finishedActivities || {};
      const currentPhase = state.currentPhase;

      let html = '';
      activities.forEach(act => {
        let status = 'ready';
        let statusText = 'SẴN SÀNG KÍCH HOẠT';
        let btnHtml = '';

        if (finishedActs[act.key]) {
          status = 'finished';
          statusText = '✔ ĐÃ HOÀN THÀNH';
          btnHtml = '<button type="button" class="btn-pac-action btn-pac-disabled" disabled><i class="fas fa-check"></i> ĐÃ HOÀN THÀNH</button>';
        } else if (currentPhase === act.key) {
          status = 'running';
          statusText = '⚡ ĐANG DIỄN RA';
          btnHtml = '<button type="button" class="btn-pac-action btn-pac-finish" onclick="window.handleFinishActivity(\'' + act.key + '\')"><i class="fas fa-stop-circle"></i> KẾT THÚC HOẠT ĐỘNG</button>';
        } else {
          status = 'ready';
          statusText = 'CHỜ BẮT ĐẦU';
          btnHtml = '<button type="button" class="btn-pac-action btn-pac-start" onclick="window.handleStartActivity(\'' + act.key + '\')"><i class="fas fa-play"></i> BẮT ĐẦU HOẠT ĐỘNG</button>';
        }

        html += '<div class="pipeline-activity-card ' + status + '" id="pac-' + act.key + '" data-act-key="' + act.key + '">' +
                  '<div class="pac-header">' +
                    '<div class="pac-index-tag">' + act.index + '</div>' +
                    '<div class="pac-title-wrap">' +
                      '<span class="pac-title"><i class="fas ' + (act.icon || 'fa-tasks') + '" style="margin-right:6px;opacity:0.85;"></i> ' + act.title + '</span>' +
                      '<span class="pac-status-label">' + statusText + '</span>' +
                    '</div>' +
                  '</div>' +
                  '<div class="pac-actions">' +
                    btnHtml +
                  '</div>' +
                '</div>';
      });

      container.innerHTML = /* sanitize */ html;

      // Đồng bộ nội dung nút Hero dưới sảnh chờ theo hoạt động tiếp theo
      const heroBtn = document.getElementById('btn-start-lesson-hero');
      if (heroBtn) {
        const nextAct = activities.find(a => !finishedActs[a.key]);
        if (!nextAct) {
          heroBtn.innerHTML = /* sanitize */ '<i class="fas fa-flag-checkered"></i> ĐÃ HOÀN THÀNH TẤT CẢ HOẠT ĐỘNG TIẾT HỌC — TỔNG KẾT';
          heroBtn.style.background = 'linear-gradient(135deg, #059669, #047857)';
          heroBtn.disabled = true;
          heroBtn.style.cursor = 'default';
        } else if (finishedActs['old_lesson']) {
          heroBtn.innerHTML = /* sanitize */ `<i class="fas fa-arrow-right"></i> TIẾP TỤC TIẾT HỌC — CHUYỂN SANG BƯỚC ${nextAct.index}: ${nextAct.title.toUpperCase()}`;
          heroBtn.style.background = 'linear-gradient(135deg, #0284c7, #6366f1)';
          heroBtn.disabled = false;
          heroBtn.style.cursor = 'pointer';
        } else {
          heroBtn.innerHTML = /* sanitize */ '<i class="fas fa-rocket"></i> ĐIỂM DANH XONG — BẮT ĐẦU BÀI HỌC (CHUYỂN SANG BƯỚC 1: KIỂM TRA BÀI CŨ)';
          heroBtn.style.background = '';
          heroBtn.disabled = false;
          heroBtn.style.cursor = 'pointer';
        }
      }
    },

    renderStageSectionNav(state) {
      state = state || STORE.getState();
      const nav = document.getElementById('stage-section-navigator');
      if (!nav) return;

      const lesson = state.lessonData || this.getLesson(state.lessonId) || {};
      const currentSec = (state.currentSection !== undefined) ? state.currentSection : 1;

      const tabs = [];
      tabs.push({ id: 0, label: 'Khởi động & Bài cũ', icon: 'fa-dice', color: '#ef4444' });

      if (lesson.sections && lesson.sections.length > 0) {
        lesson.sections.forEach((sec, idx) => {
          const num = idx + 1;
          const qCount = (sec.quizzes && sec.quizzes.length > 0) ? sec.quizzes.length : (sec.quiz ? 1 : 0);
          const qBadge = qCount > 1 ? ` (${qCount} câu)` : '';
          tabs.push({
            id: num,
            label: sec.title ? `${sec.title}${qBadge}` : `Mục ${num}: Nội dung ${num}${qBadge}`,
            icon: 'fa-layer-group',
            color: num === 1 ? '#38bdf8' : '#10b981'
          });
        });
      } else {
        tabs.push({ id: 1, label: 'Mục 1: Khởi tạo Xâu Ký Tự', icon: 'fa-book-open', color: '#38bdf8' });
        tabs.push({ id: 2, label: 'Mục 2: Cắt Xâu (Slicing)', icon: 'fa-code-branch', color: '#10b981' });
      }

      tabs.push({ id: 99, label: 'Tổng kết & Podium', icon: 'fa-trophy', color: '#f59e0b' });

      let html = '';
      tabs.forEach(t => {
        const isActive = (currentSec === t.id);
        html += `
          <button type="button" class="stage-sec-tab ${isActive ? 'active' : ''}" onclick="window.stageSelectSection(${t.id})">
            <i class="fas ${t.icon}" style="color:${t.color};"></i> ${t.label}
          </button>
        `;
      });

      nav.innerHTML = /* sanitize */ html;
    },

    executeStartActivity(actKey) {
      const lesson = STORE.getState().lessonData || this.getLesson(STORE.getState().lessonId);
      const activities = this.getLessonActivities(lesson);
      const act = activities.find(a => a.key === actKey) || { duration: 120, title: 'Hoạt động' };

      // Đếm ngược 3-2-1 đồng bộ
      const now = Date.now();
      SYNC_BUS.broadcast('START_COUNTDOWN', { active: true, title: act.title.toUpperCase(), startedAt: now });
      safeFirebaseUpdate('activeSession', {
        countdown: { active: true, title: act.title.toUpperCase(), startedAt: now },
        returnToLobby: false
      }).catch(err => console.warn('[Firebase Sync Warning]:', err?.message || err));
      this.handleRemoteCountdown({ active: true, title: act.title.toUpperCase(), startedAt: now });

      setTimeout(() => {
        // Chuyển phase
        window.teacherSetPhase(actKey);

        // Chuyển panel làm việc bên dưới
        document.querySelectorAll('.tw-panel').forEach(p => p.classList.remove('active'));
        const targetPanel = document.getElementById('tw-panel-' + actKey.replace('_', '-'));
        if (targetPanel) targetPanel.classList.add('active');

        // TẤT CẢ HOẠT ĐỘNG: ĐỒNG HỒ ĐỨNG YÊN (CHƯA ĐẾM GIỜ), THẦY LÀM CHỦ NHỊP ĐIỆU BẰNG BỘ 4 NÚT TUẦN TỰ
        this.stopMasterTimer();
        this.updateMasterTimerDisplay(act.duration);

        if (actKey === 'old_lesson') {
          STORE.setState({
            oldLesson: Object.assign({}, STORE.getState().oldLesson, {
              questionRevealed: false,
              selectedMachine: null,
              selectedStudent: null,
              timerSeconds: act.duration,
              timeLeft: act.duration
            })
          });
          this.updateOldLessonStepButtons();
        } else if (actKey === 'warmup' || actKey === 'theory') {
          STORE.setState({
            h2State: {
              assigned: false,
              reading: false,
              summarized: false,
              timeLeft: act.duration
            }
          });
          this.updateH2StepButtons();
          this.renderH2PreviewGrid();
        } else if (actKey === 'discussion') {
          STORE.setState({
            h3State: {
              taskDelivered: false,
              codingStarted: false,
              solutionRevealed: false,
              timeLeft: act.duration
            }
          });
          this.updateH3StepButtons();
        } else if (actKey === 'quiz') {
          STORE.setState({
            h4State: {
              arenaStarted: false,
              quizDelivered: false,
              podiumRevealed: false,
              timeLeft: act.duration
            }
          });
          this.updateH4StepButtons();
        }

        this.renderDynamicStagePipeline();
      }, 3500);
    },

    // GIAI ĐOẠN 2: TIẾT HỌC CHÍNH THỨC ĐIỂM DANH & 4 CHẶNG
    renderTeacherActiveSession(state) {
      const classData = this.classes[state.classId] || this.classes['6A1'];
      const sessionTitle = document.getElementById('th-session-title');
      if (sessionTitle) {
        sessionTitle.textContent = classData.className + ' • ' + (state.lessonData ? state.lessonData.title : 'Môn Tin học');
      }

      // Cập nhật Thanh điều hướng phân tầng mục bài học
      this.renderStageSectionNav(state);

      // Cập nhật Sân khấu hoạt động động theo Xưởng soạn
      this.renderDynamicStagePipeline(state);

      // Render 18 máy có tên học sinh theo sơ đồ lớp
      const matrixGrid = document.getElementById('active-session-grid-18');
      if (matrixGrid) {
        let html = '';
        let checkedInCount = 0;

        for (let i = 1; i <= 18; i++) {
          const pair = classData.seatingPlan[i] || ["Học sinh 1", "Học sinh 2"];
          const isCheckedIn = !!state.occupiedMachines[i];
          if (isCheckedIn) checkedInCount++;

          const cardClass = isCheckedIn ? 'asm-card checked-in' : 'asm-card';
          const pillClass = isCheckedIn ? 'online' : 'offline';
          const pillText = isCheckedIn ? 'Đã vào' : 'Chờ...';
          const studentsDisplay = pair.join(' • ');
          const fullTitle = 'MÁY ' + String(i).padStart(2, '0') + ': ' + pair.join(', ');

          html += '<div class="' + cardClass + '" title="' + fullTitle + '">' +
                    '<div class="asm-top">' +
                      '<div class="asm-id">' +
                        '<i class="fas fa-desktop"></i> ' +
                        '<span class="asm-num">MÁY ' + String(i).padStart(2, '0') + '</span>' +
                      '</div>' +
                      '<div class="asm-status-pill ' + pillClass + '">' +
                        '<span class="asm-status-dot"></span>' +
                        '<span class="asm-status-text">' + pillText + '</span>' +
                      '</div>' +
                    '</div>' +
                    '<div class="asm-students-row">' +
                      '<i class="fas fa-user-friends asm-stu-icon"></i>' +
                      '<span class="asm-stu-names">' + studentsDisplay + '</span>' +
                    '</div>' +
                  '</div>';
        }
        matrixGrid.innerHTML = /* sanitize */ html;

        const countBadge = document.getElementById('tcm-checkin-count');
        if (countBadge) countBadge.textContent = 'Đã vào: ' + checkedInCount + '/18 máy';

        const statIn = document.getElementById('stat-checkedin');
        const statMiss = document.getElementById('stat-missing');
        if (statIn) statIn.textContent = checkedInCount;
        if (statMiss) statMiss.textContent = (18 - checkedInCount);
      }

      // Chuyển panel tác nghiệp bên phải
      const panels = {
        'waiting': document.getElementById('tw-panel-waiting'),
        'old_lesson': document.getElementById('tw-panel-old-lesson'),
        'warmup': document.getElementById('tw-panel-warmup'),
        'theory': document.getElementById('tw-panel-theory'),
        'discussion': document.getElementById('tw-panel-discussion'),
        'quiz': document.getElementById('tw-panel-quiz')
      };

      Object.keys(panels).forEach(key => {
        const p = panels[key];
        if (p) p.classList.toggle('active', key === state.currentPhase);
      });

      // Nếu ở Bước 1: Kiểm tra bài cũ phía Giáo viên
      if (state.currentPhase === 'old_lesson') {
        this.updateOldLessonStepButtons();
        const hasQuestion = !!(state.oldLesson && state.oldLesson.questionRevealed);

        const studentSpotlight = document.getElementById('ots-student-name');
        if (studentSpotlight) {
          if (state.oldLesson && state.oldLesson.selectedStudent) {
            studentSpotlight.innerHTML = /* sanitize */ `<span style="color:#38bdf8;font-weight:800;">MÁY ${String(state.oldLesson.selectedMachine).padStart(2,'0')}:</span> <span style="color:#f59e0b;font-weight:800;">${state.oldLesson.selectedStudent}</span>`;
          } else {
            studentSpotlight.textContent = 'Chưa bốc thăm (Bấm nút [1. 🎲 BỐC THĂM] để chọn ngẫu nhiên)';
          }
        }
        const timerDisplay = document.getElementById('ots-timer-display');
        if (timerDisplay) {
          if (!hasQuestion) {
            timerDisplay.textContent = '02:00';
          } else if (state.oldLesson) {
            const mins = Math.floor((state.oldLesson.timeLeft || 0) / 60);
            const secs = (state.oldLesson.timeLeft || 0) % 60;
            timerDisplay.textContent = `${String(mins).padStart(2,'0')}:${String(secs).padStart(2,'0')}`;
          }
        }
        const subList = document.getElementById('ol-submissions-list');
        const subCount = document.getElementById('ol-submitted-count');
        if (subList && subCount && state.oldLesson) {
          const subs = state.oldLesson.submissions || {};
          const subKeys = Object.keys(subs);
          subCount.textContent = `Đã nộp: ${subKeys.length}/18 máy`;

          let html = '';
          for (let i = 1; i <= 18; i++) {
            const item = subs[i];
            const pair = classData.seatingPlan[i] || [`Máy ${i}`];
            const stuNames = pair.join(' • ');
            if (item) {
              html += `<div class="osb-card submitted">
                <div class="osb-card-top">
                  <span class="osb-badge-m">MÁY ${String(i).padStart(2,'0')}</span>
                  <span class="osb-badge-status success"><i class="fas fa-check"></i> Đã nộp (${item.time || ''})</span>
                </div>
                <div class="osb-card-names"><i class="fas fa-user-friends"></i> ${item.student || stuNames}</div>
                <div class="osb-card-ans"><i class="fas fa-comment-dots"></i> <strong>Đáp án:</strong> "${item.answer || ''}"</div>
              </div>`;
            } else {
              html += `<div class="osb-card">
                <div class="osb-card-top">
                  <span class="osb-badge-m">MÁY ${String(i).padStart(2,'0')}</span>
                  <span class="osb-badge-status pending"><i class="fas fa-hourglass-half"></i> Đang làm...</span>
                </div>
                <div class="osb-card-names"><i class="fas fa-user-friends"></i> ${stuNames}</div>
                <div class="osb-card-ans empty">Chưa gửi câu trả lời</div>
              </div>`;
            }
          }
          subList.innerHTML = /* sanitize */ html;
        }
      }

      // Nếu ở Chặng 1: Vẽ biểu đồ phân tích Quick Poll theo dữ liệu thật
      if (state.currentPhase === 'warmup') {
        const pollChart = document.getElementById('poll-live-chart');
        const btnLock = document.getElementById('btn-lock-poll');
        if (btnLock) {
          btnLock.innerHTML = /* sanitize */ state.pollLocked
            ? '<i class="fas fa-unlock"></i> Mở khóa chọn'
            : '<i class="fas fa-lock"></i> Khóa chọn';
        }
        if (pollChart) {
          const pollAns = state.pollAnswers || {};
          const counts = { A: 0, B: 0, C: 0, D: 0 };
          let total = 0;
          Object.values(pollAns).forEach(ans => {
            const c = (typeof ans === 'object' && ans.choice) ? ans.choice : ans;
            if (counts[c] !== undefined) {
              counts[c]++;
              total++;
            }
          });

          const colors = { A: '#ef4444', B: '#3b82f6', C: '#f59e0b', D: '#10b981' };
          const lesson = state.lessonData || EMBEDDED_LESSONS['tin6_bai12'];
          const warmupOptions = (lesson && lesson.warmup && lesson.warmup.options) ? lesson.warmup.options : {
            A: 'Phương án A', B: 'Phương án B', C: 'Phương án C', D: 'Phương án D'
          };

          let chartHtml = '<div style="display:flex;flex-direction:column;gap:12px;margin-top:10px;">';
          chartHtml += `<div style="font-size:12px;color:#94a3b8;margin-bottom:4px;">Tổng số máy đã bình chọn: <strong style="color:#38bdf8;">${total}/18 máy</strong> ${state.pollLocked ? '<span style="color:#ef4444;font-weight:700;margin-left:6px;">(Đã khóa chọn)</span>' : ''}</div>`;

          ['A', 'B', 'C', 'D'].forEach(opt => {
            const cnt = counts[opt] || 0;
            const pct = total > 0 ? Math.round((cnt / total) * 100) : 0;
            const optLabel = warmupOptions[opt] || `Phương án ${opt}`;
            chartHtml += `
              <div>
                <div style="font-size:13px;display:flex;justify-content:space-between;margin-bottom:4px;">
                  <span><strong style="color:${colors[opt]};">${opt}:</strong> ${optLabel}</span>
                  <strong>${pct}% (${cnt} máy)</strong>
                </div>
                <div style="background:#1e293b;height:12px;border-radius:6px;overflow:hidden;">
                  <div style="width:${pct}%;background:${colors[opt]};height:100%;transition:width 0.4s ease;"></div>
                </div>
              </div>
            `;
          });
          chartHtml += '</div>';
          pollChart.innerHTML = /* sanitize */ chartHtml;
        }
      }

      // Nếu ở Chặng 4: Render danh sách bài làm thảo luận & thực hành của 18 máy
      if (state.currentPhase === 'discussion') {
        const discList = document.getElementById('disc-submissions-list');
        const discCount = document.getElementById('disc-submitted-count');
        const answers = state.discussionAnswers || {};
        const submittedKeys = Object.keys(answers);

        if (discCount) {
          discCount.textContent = `Đã nộp: ${submittedKeys.length}/18 máy`;
        }

        if (discList) {
          let html = '';
          for (let i = 1; i <= 18; i++) {
            const item = answers[i];
            const pair = classData.seatingPlan[i] || [`Máy ${i}`];
            const stuNames = pair.join(' • ');

            if (item) {
              const content = typeof item === 'object' ? item.content : item;
              const safeContent = String(content || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
              const timeStr = (typeof item === 'object' && item.submittedAt)
                ? (typeof item.submittedAt === 'number' ? new Date(item.submittedAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : item.submittedAt)
                : '';
              const stu = (typeof item === 'object' && item.students && item.students.length > 0) ? item.students.join(' • ') : stuNames;

              html += `
                <div class="osb-card submitted" style="margin-bottom:10px;background:#0f172a;border:1px solid #334155;border-radius:8px;padding:12px;">
                  <div class="osb-card-top" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
                    <span class="osb-badge-m" style="font-weight:700;color:#38bdf8;"><i class="fas fa-desktop"></i> MÁY ${String(i).padStart(2,'0')}</span>
                    <span class="osb-badge-status success" style="color:#34d399;font-size:12px;"><i class="fas fa-check-circle"></i> Đã nộp ${timeStr ? `(${timeStr})` : ''}</span>
                  </div>
                  <div class="osb-card-names" style="font-size:13px;color:#cbd5e1;margin-bottom:6px;"><i class="fas fa-user-friends"></i> ${stu}</div>
                  <div class="osb-card-ans" style="background:#1e293b;padding:8px 12px;border-radius:6px;font-family:Consolas,monospace;font-size:13px;color:#f8fafc;white-space:pre-wrap;max-height:120px;overflow-y:auto;">${safeContent}</div>
                </div>
              `;
            } else {
              html += `
                <div class="osb-card" style="margin-bottom:10px;background:rgba(15,23,42,0.5);border:1px dashed #334155;border-radius:8px;padding:10px;opacity:0.7;">
                  <div class="osb-card-top" style="display:flex;justify-content:space-between;align-items:center;">
                    <span class="osb-badge-m" style="color:#64748b;"><i class="fas fa-desktop"></i> MÁY ${String(i).padStart(2,'0')}</span>
                    <span class="osb-badge-status pending" style="color:#94a3b8;font-size:12px;"><i class="fas fa-hourglass-half"></i> Đang thực hành...</span>
                  </div>
                  <div class="osb-card-names" style="font-size:12px;color:#64748b;margin-top:4px;"><i class="fas fa-user-friends"></i> ${stuNames}</div>
                </div>
              `;
            }
          }
          discList.innerHTML = /* sanitize */ html;
        }
      }

      // Nếu ở Chặng 5: Render bảng xếp hạng Live Quiz Leaderboard
      if (state.currentPhase === 'quiz') {
        const qBoard = document.getElementById('quiz-leaderboard');
        if (qBoard) {
          const qAnswers = state.quizAnswers || {};
          const entries = [];
          Object.keys(qAnswers).forEach(mId => {
            const ans = qAnswers[mId];
            if (ans) {
              const pair = classData.seatingPlan[mId] || [`Máy ${mId}`];
              const stuNames = (typeof ans === 'object' && ans.students && ans.students.length > 0)
                ? ans.students.join(' • ')
                : pair.join(' • ');
              const isCorr = typeof ans === 'object' ? !!ans.isCorrect : false;
              const choice = typeof ans === 'object' ? ans.choice : ans;
              const ts = (typeof ans === 'object' && ans.timestamp) ? ans.timestamp : 0;
              entries.push({
                machineId: parseInt(mId, 10),
                students: stuNames,
                isCorrect: isCorr,
                choice: choice,
                timestamp: ts
              });
            }
          });

          // Sắp xếp: Đúng lên đầu, rồi tới timestamp sớm nhất
          entries.sort((a, b) => {
            if (a.isCorrect !== b.isCorrect) return a.isCorrect ? -1 : 1;
            return a.timestamp - b.timestamp;
          });

          let boardHtml = `
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
              <span style="font-size:13px;color:#94a3b8;">Tổng số máy đã nộp trắc nghiệm: <strong style="color:#38bdf8;">${entries.length}/18 máy</strong></span>
            </div>
          `;

          if (entries.length === 0) {
            boardHtml += '<div style="text-align:center;padding:30px;color:#64748b;"><i class="fas fa-clock" style="font-size:24px;margin-bottom:8px;display:block;"></i>Đang chờ học sinh các máy gửi phương án trắc nghiệm...</div>';
          } else {
            // Hiển thị Podium Top 3 nếu có
            if (entries.length >= 1) {
              boardHtml += '<div style="display:flex;justify-content:center;align-items:flex-end;gap:12px;margin-bottom:20px;padding:10px 0;">';
              const topRank = [entries[1], entries[0], entries[2]]; // 2nd, 1st, 3rd
              const heights = ['90px', '120px', '70px'];
              const podiumColors = ['#94a3b8', '#f59e0b', '#b45309'];
              const medals = ['🥈 Hạng 2', '🥇 Hạng 1', '🥉 Hạng 3'];

              topRank.forEach((e, idx) => {
                if (e) {
                  boardHtml += `
                    <div style="display:flex;flex-direction:column;align-items:center;flex:1;max-width:140px;">
                      <div style="font-size:11px;font-weight:700;color:${podiumColors[idx]};margin-bottom:4px;">${medals[idx]}</div>
                      <div style="font-size:12px;font-weight:800;color:#f8fafc;text-align:center;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;width:100%;" title="${e.students}">Máy ${String(e.machineId).padStart(2,'0')}</div>
                      <div style="width:100%;height:${heights[idx]};background:linear-gradient(180deg, ${podiumColors[idx]}44, ${podiumColors[idx]}11);border:1px solid ${podiumColors[idx]};border-radius:8px 8px 0 0;display:flex;flex-direction:column;justify-content:center;align-items:center;">
                        <span style="font-size:18px;font-weight:900;color:${podiumColors[idx]};">${idx === 1 ? '1' : (idx === 0 ? '2' : '3')}</span>
                        <span style="font-size:11px;color:${e.isCorrect ? '#34d399' : '#ef4444'};">${e.isCorrect ? 'Đúng' : 'Sai'} (${e.choice})</span>
                      </div>
                    </div>
                  `;
                }
              });
              boardHtml += '</div>';
            }

            // Bảng danh sách tất cả các máy
            boardHtml += '<div style="display:flex;flex-direction:column;gap:8px;">';
            entries.forEach((e, idx) => {
              const rankColor = idx === 0 ? '#f59e0b' : (idx === 1 ? '#94a3b8' : (idx === 2 ? '#b45309' : '#64748b'));
              boardHtml += `
                <div style="display:flex;justify-content:space-between;align-items:center;background:#0f172a;border:1px solid #334155;border-radius:8px;padding:8px 12px;">
                  <div style="display:flex;align-items:center;gap:10px;">
                    <span style="font-weight:800;font-size:13px;width:24px;color:${rankColor};">#${idx + 1}</span>
                    <span style="font-weight:700;color:#38bdf8;">MÁY ${String(e.machineId).padStart(2,'0')}</span>
                    <span style="font-size:13px;color:#cbd5e1;">${e.students}</span>
                  </div>
                  <div style="display:flex;align-items:center;gap:10px;">
                    <span style="font-size:12px;color:#94a3b8;">Chọn: <strong>${e.choice}</strong></span>
                    <span style="font-size:12px;font-weight:700;padding:2px 8px;border-radius:4px;background:${e.isCorrect ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'};color:${e.isCorrect ? '#34d399' : '#ef4444'};">
                      ${e.isCorrect ? '<i class="fas fa-check"></i> Đúng' : '<i class="fas fa-times"></i> Sai'}
                    </span>
                  </div>
                </div>
              `;
            });
            boardHtml += '</div>';
          }
          qBoard.innerHTML = /* sanitize */ boardHtml;
        }
      }
    },

    renderLobby(state) {
      const classData = this.classes[state.classId] || this.classes['6A1'];
      const grid = document.getElementById('computers-grid');
      const banner = document.getElementById('lobby-status-banner');
      const icon = document.getElementById('lsb-icon');
      const title = document.getElementById('lsb-title');
      const desc = document.getElementById('lsb-desc');

      if (banner) {
        if (!state.unlocked) {
          banner.className = 'lobby-banner locked';
          if (icon) icon.className = 'fas fa-lock';
          if (title) title.innerHTML = /* sanitize */ '<i class="fas fa-desktop"></i> PHÒNG MÁY ĐANG CHỜ GIÁO VIÊN KÍCH HOẠT TIẾT HỌC';
          if (desc) desc.textContent = 'Học sinh vui lòng ngồi ổn định tại chỗ. Sơ đồ đang được khóa để Thầy/Cô chọn lớp và kích hoạt bài học.';
          if (grid) grid.classList.add('locked-state');
        } else if (state.lastFinishedActivity) {
          banner.className = 'lobby-banner unlocked';
          if (icon) icon.className = 'fas fa-flag-checkered';
          if (title) title.innerHTML = /* sanitize */ `<i class="fas fa-flag-checkered"></i> ĐÃ HOÀN THÀNH: ${state.lastFinishedActivity.toUpperCase()} — SẴN SÀNG HOẠT ĐỘNG TIẾP`;
          if (desc) desc.textContent = 'Các em hãy hướng mắt lên bảng nghe Thầy/Cô nhận xét. Khi Thầy kích hoạt hoạt động mới, máy tính sẽ tự động vào bài!';
          if (grid) grid.classList.remove('locked-state');
        } else {
          banner.className = 'lobby-banner unlocked';
          if (icon) icon.className = 'fas fa-unlock-alt';
          if (title) title.innerHTML = /* sanitize */ `<i class="fas fa-check-circle"></i> THẦY/CÔ ĐÃ KÍCH HOẠT ${classData.className} — MỜI BẤM CHỌN MÁY`;
          if (desc) desc.textContent = 'Em hãy nhấp vào đúng số máy em đang ngồi để vào Sảnh chờ Đấu trường!';
          if (grid) grid.classList.remove('locked-state');
        }
      }

      if (!grid) return;

      const fixedId = state.fixedMachineId;
      let html = '';

      for (let i = 1; i <= 18; i++) {
        const pair = classData.seatingPlan[i] || ["Chưa xếp", "Chưa xếp"];
        const isMyMachine = (fixedId === i);
        const isOccupied = (!isMyMachine && state.occupiedMachines[i]);

        let cardClasses = 'computer-card';
        let statusBadge = '';

        if (isMyMachine) {
          cardClasses += ' my-saved-machine';
          statusBadge = `<div class="card-status-bar status-mine"><i class="fas fa-star" style="margin-right:4px;"></i> Máy của bạn</div>`;
        } else if (isOccupied) {
          cardClasses += ' locked';
          statusBadge = `<div class="card-status-bar status-occupied"><i class="fas fa-lock" style="margin-right:4px;"></i> Đang học</div>`;
        } else {
          statusBadge = `<div class="card-status-bar status-free"><i class="fas fa-check" style="margin-right:4px;"></i> Sẵn sàng chọn</div>`;
        }

        html += `
          <div class="${cardClasses}" onclick="window.onSelectDesk(${i})">
            <div class="card-top">
              <span class="machine-id-tag">MÁY ${String(i).padStart(2,'0')}</span>
              <span class="card-icon"><i class="fas fa-desktop"></i></span>
            </div>
            <div class="card-pair-list">
              ${pair.map(name => `<div class="student-row" title="${name}"><i class="fas fa-user"></i> ${name}</div>`).join('')}
            </div>
            ${statusBadge}
          </div>
        `;
      }

      grid.innerHTML = /* sanitize */ html;

            // Cập nhật huy hiệu PWA trên Topbar
      const pwaBadge = document.getElementById('device-pwa-badge');
      if (pwaBadge) {
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
        const modeText = isStandalone ? 'PWA Standalone' : 'Browser';
        if (fixedId) {
          pwaBadge.innerHTML = /* sanitize */ '<i class="fas fa-desktop"></i> Thiết bị này: <strong>MÁY ' + String(fixedId).padStart(2, '0') + '</strong> <span style="font-size:11px;opacity:0.85;background:rgba(0,0,0,0.3);padding:2px 6px;border-radius:4px;margin-left:4px;">' + modeText + '</span>';
        } else {
          pwaBadge.innerHTML = /* sanitize */ '<i class="fas fa-desktop"></i> Thiết bị: <span style="color:#cbd5e1">Chưa gán</span> <span style="font-size:11px;opacity:0.85;background:rgba(0,0,0,0.3);padding:2px 6px;border-radius:4px;margin-left:4px;">' + modeText + '</span>';
        }
      }

      // Cập nhật thông tin token lưu nhớ
      const tokenStatus = document.getElementById('device-token-status');
      if (tokenStatus) {
        if (fixedId) {
          tokenStatus.innerHTML = /* sanitize */ `<i class="fas fa-check-circle" style="color:var(--warning)"></i> Thiết bị này đã được lưu định danh là <strong>MÁY ${String(fixedId).padStart(2,'0')}</strong>`;
        } else {
          tokenStatus.innerHTML = /* sanitize */ `<i class="fas fa-info-circle"></i> Chưa gán cố định số máy cho thiết bị này. Nhấp vào máy để đăng ký.`;
        }
      }
    },

    renderNeonLuckyCard(targetMachine, targetStudent, isRevealed = false) {
      const neonCard = document.getElementById('neon-lucky-card');
      const deskText = document.getElementById('nlc-desk-text');
      const studentName = document.getElementById('nlc-student-name');
      const statusText = document.getElementById('nlc-status-text');

      if (!neonCard) return;

      if (targetMachine && targetStudent) {
        neonCard.style.display = 'block';
        if (deskText) deskText.textContent = `Máy bàn số ${String(targetMachine).padStart(2, '0')}`;
        // LƯU Ý SƯ PHẠM: CHỈ HIỂN THỊ TÊN DUY NHẤT 1 HỌC SINH ĐƯỢC GỌI (CẤM GHÉP CẶP &)
        if (studentName) studentName.textContent = targetStudent;
        if (statusText) {
          statusText.textContent = isRevealed
            ? 'ĐÃ PHÁT ĐỀ — ĐANG TÍNH GIỜ LÀM BÀI'
            : 'ĐÃ ĐƯỢC CHỈ ĐỊNH — CHỜ THẦY PHÁT ĐỀ';
        }
      } else {
        neonCard.style.display = 'none';
      }
    },

    renderStudentWorkspace(state) {
      const { machineId, students, isSos, currentPhase, lessonData } = state;

      // Header
      const badge = document.getElementById('sh-machine-badge');
      if (badge) badge.textContent = machineId ? `MÁY ${String(machineId).padStart(2,'0')}` : 'MÁY --';

      const studentsLabel = document.getElementById('sh-students-label');
      if (studentsLabel) {
        studentsLabel.textContent = students && students.length > 0 ? students.join(' & ') : 'Chưa điểm danh';
      }

      const classLabel = document.getElementById('sh-class-label');
      if (classLabel) {
        const c = this.classes[state.classId];
        classLabel.textContent = `${c ? c.className : 'Lớp 6A1'} • Môn Tin học THCS`;
      }

      const sosBtn = document.getElementById('btn-student-sos');
      if (sosBtn) {
        sosBtn.classList.toggle('active', isSos);
        sosBtn.innerHTML = /* sanitize */ isSos ? '<i class="fas fa-hand-paper"></i> Đã gọi Thầy' : '<i class="fas fa-hand-paper"></i> Cần trợ giúp';
      }

      // Khóa kỷ luật phòng máy: Học sinh KHÔNG ĐƯỢC thoát ra sảnh khi tiết học đã bắt đầu
      const btnBackLobby = document.getElementById('btn-back-to-lobby');
      if (btnBackLobby) {
        const isLocked = (state.sessionStarted || (currentPhase && currentPhase !== 'waiting'));
        btnBackLobby.style.display = isLocked ? 'none' : 'inline-flex';
      }

      // Thanh tiến trình sư phạm (Pace Navigator)
      document.querySelectorAll('.pn-item').forEach(item => {
        item.classList.toggle('active', item.dataset.phase === currentPhase);
      });

      // Chuyển view nội dung
      const views = {
        'waiting': document.getElementById('st-view-waiting'),
        'old_lesson': document.getElementById('st-view-old-lesson'),
        'warmup': document.getElementById('st-view-warmup'),
        'theory': document.getElementById('st-view-theory'),
        'discussion': document.getElementById('st-view-discussion'),
        'quiz': document.getElementById('st-view-quiz')
      };

      Object.keys(views).forEach(key => {
        const el = views[key];
        if (el) el.classList.toggle('active', key === currentPhase);
      });

      // Render chi tiết từng view
      if (currentPhase === 'waiting') {
        const titleEl = document.getElementById('waiting-lesson-title');
        const subEl = document.getElementById('waiting-lesson-sub');
        const instrEl = document.getElementById('waiting-instruction-text');
        if (state.lessonData && titleEl) {
          titleEl.textContent = state.lessonData.title || 'Bài học tương tác';
        }
        const finishedAct = state.lastFinishedActivity || (state.sessionStarted ? 'Hoạt động' : null);
        if (finishedAct) {
          if (subEl) subEl.innerHTML = /* sanitize */ `<span style="color:#fbbf24;font-weight:700;"><i class="fas fa-check-circle"></i> Đã hoàn thành: ${finishedAct}</span>`;
          if (instrEl) instrEl.innerHTML = /* sanitize */ 'Các em hãy hướng mắt lên bảng. Thầy/Cô đang nhận xét và chuẩn bị hoạt động tiếp theo. ⏳';
        } else {
          if (subEl) subEl.textContent = 'Môn Tin học • Thầy đang kiểm tra sĩ số và chuẩn bị phát lệnh bắt đầu';
          if (instrEl) instrEl.innerHTML = /* sanitize */ 'Các em hãy hướng mắt lên bảng. Bài học sẽ mở màn với đếm ngược <strong>3... 2... 1... 🚀</strong>';
        }
      }

      if (currentPhase === 'old_lesson') {
        const ol = state.oldLesson || {};
        const timerEl = document.getElementById('ol-timer');
        if (timerEl) {
          if (!ol.questionRevealed) {
            timerEl.innerHTML = /* sanitize */ '<i class="fas fa-stopwatch"></i> 02:00';
          } else {
            const mins = Math.floor((ol.timeLeft || 0) / 60);
            const secs = (ol.timeLeft || 0) % 60;
            timerEl.innerHTML = /* sanitize */ `<i class="fas fa-stopwatch"></i> ${String(mins).padStart(2,'0')}:${String(secs).padStart(2,'0')}`;
          }
        }

        // Cập nhật hộp thoại Neon vinh danh duy nhất 1 em học sinh (Chuẩn ảnh mẫu Thầy giao)
        this.renderNeonLuckyCard(ol.selectedMachine, ol.selectedStudent, ol.questionRevealed);

        const stageContainer = document.querySelector('.old-lesson-container');
        if (stageContainer) {
          stageContainer.classList.toggle('stage-winner-active', !!(ol.selectedMachine && ol.selectedMachine === machineId));
        }

        const qText = document.getElementById('ol-question-text');
        const standbyBanner = document.getElementById('ol-question-standby-banner');
        if (ol.questionRevealed) {
          if (standbyBanner) standbyBanner.style.display = 'none';
          if (qText) {
            qText.style.display = 'block';
            if (ol.questionText) qText.textContent = ol.questionText;
          }
        } else {
          if (standbyBanner) standbyBanner.style.display = 'block';
          if (qText) qText.style.display = 'none';
        }

        const qTypeBadge = document.getElementById('ol-q-type-badge');
        if (qTypeBadge) qTypeBadge.innerHTML = /* sanitize */ '<i class="fas fa-comment-dots"></i> Trả lời miệng tại chỗ';

        const revealBox = document.getElementById('ol-reveal-box');
        if (revealBox) {
          revealBox.style.display = ol.isRevealed ? 'block' : 'none';
        }
      }

      if (currentPhase === 'waiting') {
        const deskInfo = document.getElementById('waiting-desk-info');
        if (deskInfo) deskInfo.textContent = `Máy bàn số ${String(machineId || 4).padStart(2,'0')}`;

        const pairInfo = document.getElementById('waiting-pair-info');
        if (pairInfo) pairInfo.textContent = students && students.length > 0 ? students.join(' & ') : 'Đang cập nhật';

        // Render Classroom Radar 18 máy thu nhỏ
        const radarGrid = document.getElementById('radar-grid');
        const radarCountLabel = document.getElementById('radar-count-label');
        if (radarGrid) {
          let radarHtml = '';
          let connectedCount = 0;
          for (let i = 1; i <= 18; i++) {
            const isThis = (i === machineId);
            const isAct = isThis || !!state.occupiedMachines[i];
            if (isAct) connectedCount++;

            let cellClass = 'radar-cell';
            if (isThis) cellClass += ' this-machine active-desk';
            else if (isAct) cellClass += ' active-desk';

            radarHtml += `
              <div class="${cellClass}" title="Máy ${String(i).padStart(2,'0')}: ${isThis ? 'Máy hiện tại của bạn (Trực tuyến)' : (isAct ? 'Đang trực tuyến' : 'Chưa vào')}">
                <span class="rc-num">${String(i).padStart(2,'0')}</span>
                <span class="rc-dot"></span>
              </div>
            `;
          }
          radarGrid.innerHTML = /* sanitize */ radarHtml;
          if (radarCountLabel) {
            radarCountLabel.textContent = `${connectedCount}/18 máy đang kết nối`;
          }
        }
      }

      if (currentPhase === 'warmup') {
        const lesson = lessonData || EMBEDDED_LESSONS[state.lessonId] || EMBEDDED_LESSONS['tin6_bai12'];
        if (lesson && lesson.warmup) {
          const qEl = document.getElementById('poll-question-text');
          if (qEl && lesson.warmup.question) qEl.textContent = lesson.warmup.question;
          const codeEl = document.getElementById('poll-code-snippet');
          if (codeEl) {
            if (lesson.warmup.code) {
              codeEl.textContent = lesson.warmup.code;
              if (codeEl.parentElement) codeEl.parentElement.style.display = 'block';
            } else if (codeEl.parentElement) {
              codeEl.parentElement.style.display = 'none';
            }
          }
          if (lesson.warmup.options) {
            ['A', 'B', 'C', 'D'].forEach(opt => {
              const labelEl = document.querySelector(`.poll-opt-btn[data-choice="${opt}"] .poll-label`);
              if (labelEl && lesson.warmup.options[opt]) {
                labelEl.textContent = lesson.warmup.options[opt];
              }
            });
          }
        }

        const choice = state.pollSelection;
        document.querySelectorAll('.poll-opt-btn').forEach(btn => {
          btn.classList.toggle('selected', btn.dataset.choice === choice);
          btn.disabled = !!state.pollLocked;
          btn.classList.toggle('locked-poll', !!state.pollLocked);
        });

        const statusMsg = document.getElementById('poll-status-msg');
        if (statusMsg) {
          if (state.pollLocked) {
            statusMsg.innerHTML = /* sanitize */ `<i class="fas fa-lock" style="color:#ef4444"></i> <strong style="color:#ef4444">Thầy đã khóa lựa chọn!</strong> ${choice ? `Nhóm bạn đã chốt phương án: <strong>${choice}</strong>.` : 'Đã hết thời gian bình chọn.'}`;
          } else if (choice) {
            statusMsg.innerHTML = /* sanitize */ `<i class="fas fa-check-circle" style="color:var(--success)"></i> Nhóm bạn đã chọn phương án <strong>${choice}</strong>. Đang chờ Thầy tổng kết và chiếu kết quả...`;
          } else {
            statusMsg.innerHTML = /* sanitize */ `<i class="fas fa-comments"></i> Hai em hãy trao đổi nhanh và bấm chọn 1 phương án chung của máy mình:`;
          }
        }
      }

      if (currentPhase === 'theory') {
        const container = document.getElementById('theory-cards-container');
        if (container && lessonData && lessonData.theory) {
          container.innerHTML = /* sanitize */ lessonData.theory.map(card => `
            <div class="theory-card">
              <h3 class="tc-title">${card.title}</h3>
              <div class="tc-summary">${card.summary}</div>
              <pre class="tc-code"><code>${card.code}</code></pre>
              <div class="tc-note"><i class="fas fa-lightbulb"></i> ${card.note}</div>
            </div>
          `).join('');
        }
      }

      if (currentPhase === 'discussion') {
        const lesson = lessonData || EMBEDDED_LESSONS[state.lessonId] || EMBEDDED_LESSONS['tin6_bai12'];
        if (lesson && lesson.discussion) {
          const titleEl = document.getElementById('disc-task-title');
          if (titleEl && lesson.discussion.title) titleEl.textContent = lesson.discussion.title;
          const taskEl = document.getElementById('disc-task-text');
          if (taskEl && lesson.discussion.task) taskEl.textContent = lesson.discussion.task;
          const inputEl = document.getElementById('disc-answer-input');
          if (inputEl && lesson.discussion.placeholder) inputEl.placeholder = lesson.discussion.placeholder;
        }

        // Cột trái tra cứu
        const refContainer = document.getElementById('disc-theory-reference');
        if (refContainer && lesson && lesson.theory) {
          refContainer.innerHTML = /* sanitize */ lesson.theory.map(c => `
            <div class="ref-mini-card">
              <div class="ref-mini-title">${c.title}</div>
              <div class="ref-mini-text">${c.summary}</div>
            </div>
          `).join('');
        }

        // Trạng thái nộp bài
        const statusBox = document.getElementById('disc-submission-status');
        if (statusBox) {
          if (state.discStatus === 'submitted') {
            statusBox.innerHTML = /* sanitize */ `<span class="badge-status-submitted"><i class="fas fa-check-circle"></i> Đã nộp bài lúc ${state.discSubmissionTime}</span>`;
          } else {
            statusBox.innerHTML = /* sanitize */ `<span class="badge-status-working"><i class="fas fa-pencil-alt"></i> Đang làm bài...</span>`;
          }
        }
      }

      if (currentPhase === 'quiz') {
        const lesson = lessonData || EMBEDDED_LESSONS[state.lessonId] || EMBEDDED_LESSONS['tin6_bai12'];
        const curSec = state.currentSection || 1;

        // Xác định danh sách gói câu hỏi
        let quizzesList = state.packetQuizzes;
        if (!quizzesList || quizzesList.length === 0) {
          if (lesson && lesson.sections && lesson.sections[curSec - 1]) {
            const secObj = lesson.sections[curSec - 1];
            if (secObj.quizzes && secObj.quizzes.length > 0) quizzesList = secObj.quizzes;
            else if (secObj.quiz && (secObj.quiz.question || secObj.quiz.type)) quizzesList = [secObj.quiz];
          }
          if (!quizzesList || quizzesList.length === 0) {
            if (lesson && lesson.quizzes && lesson.quizzes.length > 0) quizzesList = lesson.quizzes;
            else if (lesson && lesson.quiz && (lesson.quiz.question || lesson.quiz.type)) quizzesList = [lesson.quiz];
          }
        }
        if (!quizzesList || quizzesList.length === 0) {
          quizzesList = [{
            type: 'single_choice',
            question: 'Trong Python, xâu ký tự có tính chất bất biến (immutable). Điều này có nghĩa là gì?',
            options: {
              A: 'Không thể truy cập các ký tự qua chỉ số index',
              B: 'Không thể gán thay đổi trực tiếp từng ký tự trong xâu đã tạo',
              C: 'Không thể dùng hàm len() để tính độ dài xâu',
              D: 'Xâu chỉ chứa được chữ số, không chứa được chữ cái'
            },
            correct: 'B'
          }];
        }

        const isPacket = (quizzesList.length > 1);
        const qIdx = Math.min(Math.max(0, state.studentQuizIndex || 0), quizzesList.length - 1);
        const quiz = quizzesList[qIdx] || quizzesList[0];
        const qType = quiz.type || 'single_choice';
        const qShuffle = quiz.shuffle !== false;
        const mId = state.machineId || 1;

        // Cập nhật số thứ tự câu hỏi và Stepper Pills
        const qNumEl = document.getElementById('quiz-q-num');
        if (qNumEl) {
          qNumEl.textContent = isPacket ? `Câu hỏi ${qIdx + 1} / ${quizzesList.length}` : `Câu hỏi 1 / 1`;
        }

        const navPills = document.getElementById('quiz-nav-pills');
        if (navPills) {
          if (isPacket) {
            let pillsHtml = '';
            quizzesList.forEach((_, pIdx) => {
              const hasAns = state.studentPacketAnswers && (state.studentPacketAnswers[pIdx] !== undefined);
              const isCurrent = (pIdx === qIdx);
              let pillCls = 'qsb-pill';
              if (isCurrent) pillCls += ' active';
              if (hasAns) pillCls += ' answered';
              pillsHtml += `<button type="button" class="${pillCls}" onclick="window.studentQuizGoTo(${pIdx})">${pIdx + 1}</button>`;
            });
            navPills.innerHTML = /* sanitize */ pillsHtml;
            navPills.style.display = 'flex';
          } else {
            navPills.innerHTML = /* sanitize */ '';
            navPills.style.display = 'none';
          }
        }

        // Cập nhật câu hỏi
        const qText = document.getElementById('quiz-question-text');
        if (qText && quiz.question) qText.textContent = quiz.question;

        const dynBody = document.getElementById('quiz-dynamic-body');
        const packetAns = state.studentPacketAnswers || {};
        const choice = isPacket ? packetAns[qIdx] : state.quizSelection;
        const isAnswered = isPacket ? !!state.quizPacketSubmitted : !!state.quizAnswered;

        if (dynBody) {
          if (qType === 'single_choice' || !qType) {
            const correct = quiz.correct || 'B';
            const shuffledItems = this.getShuffledOptions(quiz.options, mId, qIdx, qShuffle);

            let optsHtml = '<div class="quiz-options-grid" id="quiz-options-grid">';
            shuffledItems.forEach((item, slotIdx) => {
              const isSel = (choice === item.key);
              const isCorr = (isAnswered && item.key === correct);
              const isWrong = (isAnswered && isSel && !isCorr);
              const slotClass = 'opt-slot-' + slotIdx;
              const statusClass = isCorr ? 'correct' : (isWrong ? 'wrong' : (isSel ? 'selected' : ''));
              optsHtml += `<button type="button" class="quiz-opt ${slotClass} ${statusClass}" data-qopt="${item.key}" ${isAnswered ? 'disabled' : ''}>
                <span class="qo-key">${item.key}</span>
                <span class="qo-label">${item.text || ''}</span>
              </button>`;
            });
            optsHtml += '</div>';
            dynBody.innerHTML = /* sanitize */ optsHtml;

            if (!isAnswered) {
              dynBody.querySelectorAll('.quiz-opt').forEach(btn => {
                btn.addEventListener('click', (e) => {
                  const opt = e.currentTarget.dataset.qopt;
                  if (isPacket) {
                    const newPacketAns = Object.assign({}, STORE.getState().studentPacketAnswers || {}, { [qIdx]: opt });
                    STORE.setState({ studentPacketAnswers: newPacketAns });
                    this.renderStudentWorkspace(STORE.getState());
                  } else {
                    const isCorrect = (opt === correct);
                    this.submitQuizAnswer(opt, isCorrect);
                  }
                });
              });
            }
          } else if (qType === 'true_false') {
            const subItems = quiz.subItems || [
              { id: 'a', statement: 'Mệnh đề a', correct: true },
              { id: 'b', statement: 'Mệnh đề b', correct: false },
              { id: 'c', statement: 'Mệnh đề c', correct: true },
              { id: 'd', statement: 'Mệnh đề d', correct: false }
            ];

            let tfHtml = '<div class="quiz-tf-table" id="quiz-tf-table">';
            subItems.forEach((sub, sIdx) => {
              const rowKey = sub.id || String.fromCharCode(97 + sIdx);
              tfHtml += `
                <div class="quiz-tf-row" data-row-key="${rowKey}">
                  <div class="quiz-tf-stmt"><strong style="color:#38bdf8;">${rowKey})</strong> ${sub.statement}</div>
                  <div class="quiz-tf-btn-group">
                    <button type="button" class="btn-tf-toggle btn-true" data-tf="true" ${isAnswered ? 'disabled' : ''}>ĐÚNG</button>
                    <button type="button" class="btn-tf-toggle btn-false" data-tf="false" ${isAnswered ? 'disabled' : ''}>SAI</button>
                  </div>
                </div>
              `;
            });
            if (!isAnswered && !isPacket) {
              tfHtml += `
                <div style="margin-top:14px;display:flex;justify-content:flex-end;">
                  <button type="button" class="btn-submit-short" id="btn-submit-tf">
                    <i class="fas fa-paper-plane"></i> NỘP CÂU TRẢ LỜI ĐÚNG / SAI
                  </button>
                </div>
              `;
            }
            tfHtml += '</div>';
            dynBody.innerHTML = /* sanitize */ tfHtml;

            // Highlight previous choices if any
            if (choice) {
              const parts = String(choice).split(', ');
              parts.forEach(p => {
                const [rKey, valStr] = p.split(':');
                const row = dynBody.querySelector(`.quiz-tf-row[data-row-key="${rKey}"]`);
                if (row) {
                  if (valStr === 'Đ') row.querySelector('.btn-true')?.classList.add('selected');
                  if (valStr === 'S') row.querySelector('.btn-false')?.classList.add('selected');
                }
              });
            }

            if (!isAnswered) {
              const currentTfAnswers = {};
              if (choice) {
                const parts = String(choice).split(', ');
                parts.forEach(p => {
                  const [rKey, valStr] = p.split(':');
                  if (rKey) currentTfAnswers[rKey] = (valStr === 'Đ');
                });
              }

              dynBody.querySelectorAll('.quiz-tf-row').forEach(row => {
                const rKey = row.dataset.rowKey;
                const btnTrue = row.querySelector('.btn-true');
                const btnFalse = row.querySelector('.btn-false');
                btnTrue.addEventListener('click', () => {
                  currentTfAnswers[rKey] = true;
                  btnTrue.classList.add('selected');
                  btnFalse.classList.remove('selected');
                  if (isPacket) {
                    const choiceArr = [];
                    subItems.forEach((sub, sIdx) => {
                      const k = sub.id || String.fromCharCode(97 + sIdx);
                      if (currentTfAnswers[k] !== undefined) {
                        choiceArr.push(`${k}:${currentTfAnswers[k] ? 'Đ' : 'S'}`);
                      }
                    });
                    const newPacketAns = Object.assign({}, STORE.getState().studentPacketAnswers || {}, { [qIdx]: choiceArr.join(', ') });
                    STORE.setState({ studentPacketAnswers: newPacketAns });
                  }
                });
                btnFalse.addEventListener('click', () => {
                  currentTfAnswers[rKey] = false;
                  btnFalse.classList.add('selected');
                  btnTrue.classList.remove('selected');
                  if (isPacket) {
                    const choiceArr = [];
                    subItems.forEach((sub, sIdx) => {
                      const k = sub.id || String.fromCharCode(97 + sIdx);
                      if (currentTfAnswers[k] !== undefined) {
                        choiceArr.push(`${k}:${currentTfAnswers[k] ? 'Đ' : 'S'}`);
                      }
                    });
                    const newPacketAns = Object.assign({}, STORE.getState().studentPacketAnswers || {}, { [qIdx]: choiceArr.join(', ') });
                    STORE.setState({ studentPacketAnswers: newPacketAns });
                  }
                });
              });

              if (!isPacket) {
                const btnSubmitTf = document.getElementById('btn-submit-tf');
                if (btnSubmitTf) {
                  btnSubmitTf.addEventListener('click', () => {
                    if (Object.keys(currentTfAnswers).length < subItems.length) {
                      alert('Hai em hãy chọn ĐÚNG hoặc SAI cho tất cả các mệnh đề trước khi nộp bài!');
                      return;
                    }
                    let allCorrect = true;
                    const choiceArr = [];
                    subItems.forEach((sub, sIdx) => {
                      const rKey = sub.id || String.fromCharCode(97 + sIdx);
                      const userVal = !!currentTfAnswers[rKey];
                      const expVal = !!sub.correct;
                      if (userVal !== expVal) allCorrect = false;
                      choiceArr.push(`${rKey}:${userVal ? 'Đ' : 'S'}`);
                    });
                    this.submitQuizAnswer(choiceArr.join(', '), allCorrect);
                  });
                }
              }
            }
          } else if (qType === 'short_answer') {
            const expAnswer = (quiz.shortAnswer || '').trim();
            const saHtml = `
              <div class="quiz-short-wrap">
                <input type="text" id="quiz-short-input" class="quiz-short-input" placeholder="Gõ câu trả lời kết quả vào đây..." value="${choice || ''}" ${isAnswered ? 'disabled' : ''}>
                ${(!isAnswered && !isPacket) ? `
                  <button type="button" class="btn-submit-short" id="btn-submit-short">
                    <i class="fas fa-paper-plane"></i> NỘP KẾT QUẢ
                  </button>
                ` : ''}
              </div>
            `;
            dynBody.innerHTML = /* sanitize */ saHtml;

            if (!isAnswered) {
              const saInp = document.getElementById('quiz-short-input');
              if (isPacket) {
                if (saInp) {
                  saInp.addEventListener('input', (e) => {
                    const val = e.target.value;
                    const newPacketAns = Object.assign({}, STORE.getState().studentPacketAnswers || {}, { [qIdx]: val });
                    STORE.setState({ studentPacketAnswers: newPacketAns });
                  });
                }
              } else {
                const btnSa = document.getElementById('btn-submit-short');
                const doSubmitSa = () => {
                  const val = (saInp ? saInp.value : '').trim();
                  if (!val) {
                    alert('Hai em hãy gõ kết quả câu trả lời vào ô trống trước khi bấm nộp!');
                    return;
                  }
                  const isCorrect = (val.toLowerCase() === expAnswer.toLowerCase());
                  this.submitQuizAnswer(val, isCorrect);
                };
                if (btnSa) btnSa.addEventListener('click', doSubmitSa);
                if (saInp) {
                  saInp.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter') doSubmitSa();
                  });
                }
              }
            }
          }
        }

        // Cập nhật các nút điều hướng phía dưới (Student Stepper Nav)
        const btnPrev = document.getElementById('btn-quiz-prev');
        const btnNext = document.getElementById('btn-quiz-next');
        const btnSubmitPacket = document.getElementById('btn-quiz-packet-submit');

        if (isPacket && !isAnswered) {
          if (btnPrev) btnPrev.style.display = (qIdx > 0) ? 'inline-flex' : 'none';
          if (btnNext) btnNext.style.display = (qIdx < quizzesList.length - 1) ? 'inline-flex' : 'none';
          if (btnSubmitPacket) {
            btnSubmitPacket.style.display = (qIdx === quizzesList.length - 1 || Object.keys(packetAns).length >= quizzesList.length) ? 'inline-flex' : 'none';
          }
        } else {
          if (btnPrev) btnPrev.style.display = 'none';
          if (btnNext) btnNext.style.display = 'none';
          if (btnSubmitPacket) btnSubmitPacket.style.display = 'none';
        }

        // Feedback box
        const feedback = document.getElementById('quiz-feedback-box');
        if (feedback) {
          if (isAnswered) {
            feedback.style.display = 'block';
            if (isPacket) {
              const myAns = (state.quizAnswers && state.quizAnswers[mId]) || {};
              const isCorrect = !!myAns.isCorrect;
              const totCorr = myAns.totalCorrect !== undefined ? myAns.totalCorrect : (isCorrect ? quizzesList.length : 0);
              if (isCorrect) {
                feedback.className = 'quiz-feedback success';
                feedback.innerHTML = /* sanitize */ `<i class="fas fa-star" style="color:#fbbf24"></i> <strong>XUẤT SẮC!</strong> Nhóm bạn đã trả lời đúng trọn vẹn <strong>${totCorr}/${quizzesList.length} câu hỏi</strong> của gói trắc nghiệm.`;
              } else {
                feedback.className = 'quiz-feedback';
                feedback.style.backgroundColor = 'rgba(239, 68, 68, 0.15)';
                feedback.style.color = '#fca5a5';
                feedback.style.border = '1px solid rgba(239, 68, 68, 0.4)';
                feedback.innerHTML = /* sanitize */ `<i class="fas fa-info-circle"></i> Kết quả: Đúng <strong>${totCorr}/${quizzesList.length} câu</strong>. Hãy cùng Thầy và cả lớp lắng nghe phần giải thích đáp án trên màn hình sân khấu!`;
              }
            } else {
              const isCorrect = (state.quizAnswers && state.quizAnswers[mId])
                ? state.quizAnswers[mId].isCorrect
                : (qType === 'single_choice' ? choice === (quiz.correct || 'B') : false);

              if (isCorrect) {
                feedback.className = 'quiz-feedback success';
                feedback.innerHTML = /* sanitize */ `<i class="fas fa-star" style="color:#fbbf24"></i> <strong>Chính xác!</strong> Nhóm bạn đã nhận trọn vẹn điểm thưởng của Đấu trường tương tác.`;
              } else {
                feedback.className = 'quiz-feedback';
                feedback.style.backgroundColor = 'rgba(239, 68, 68, 0.15)';
                feedback.style.color = '#fca5a5';
                feedback.style.border = '1px solid rgba(239, 68, 68, 0.4)';
                let correctInfo = '';
                if (qType === 'single_choice') {
                  const cor = quiz.correct || 'B';
                  const correctLabel = (quiz.options && quiz.options[cor]) ? quiz.options[cor] : '';
                  correctInfo = `Đáp án đúng là <strong>${cor}</strong>: ${correctLabel}`;
                } else if (qType === 'true_false') {
                  const subItems = quiz.subItems || [];
                  correctInfo = 'Đáp án đúng: ' + subItems.map(s => `<strong>${s.id})</strong> ${s.correct ? 'ĐÚNG' : 'SAI'}`).join(' • ');
                } else if (qType === 'short_answer') {
                  correctInfo = `Đáp án đúng là: <strong>${quiz.shortAnswer || ''}</strong>`;
                }
                feedback.innerHTML = /* sanitize */ `<i class="fas fa-info-circle"></i> Chưa chính xác. ${correctInfo}`;
              }
            }
          } else {
            feedback.style.display = 'none';
          }
        }
      }
    },

    getShuffledOptions(optionsObj, machineId, qIndex, shuffle) {
      const keys = ['A', 'B', 'C', 'D'];
      const items = keys.map(k => ({
        key: k,
        text: (optionsObj && optionsObj[k]) ? optionsObj[k] : ''
      }));
      if (shuffle === false) return items;

      const mId = parseInt(machineId, 10) || 1;
      const qIdx = parseInt(qIndex, 10) || 0;
      let seed = (Math.imul(mId, 1597334677) ^ Math.imul(qIdx + 1, 3812015801)) >>> 0;
      function nextRnd() {
        seed = (seed * 1664525 + 1013904223) >>> 0;
        return (seed >>> 8) / 16777216;
      }

      // Fisher-Yates / Knuth shuffle
      for (let i = items.length - 1; i > 0; i--) {
        const j = Math.floor(nextRnd() * (i + 1));
        const temp = items[i];
        items[i] = items[j];
        items[j] = temp;
      }
      return items;
    },

    submitQuizAnswer(choice, isCorrect) {
      const state = STORE.getState();
      if (state.quizAnswered) return;
      const mId = state.machineId || 1;
      const stuList = (state.students && state.students.length > 0) ? state.students : [`Máy ${mId}`];
      const nowTs = Date.now();

      const newAnswers = Object.assign({}, state.quizAnswers || {});
      newAnswers[mId] = {
        machineId: mId,
        students: stuList,
        choice: choice,
        isCorrect: isCorrect,
        timestamp: nowTs
      };

      STORE.setState({
        quizSelection: choice,
        quizAnswered: true,
        quizAnswers: newAnswers
      });

      if (mId) {
        safeFirebaseSet(`activeSession/quizAnswers/${mId}`, {
          machineId: mId,
          students: stuList,
          choice: choice,
          isCorrect: isCorrect,
          timestamp: nowTs
        }).catch(err => console.warn('[Firebase Sync Warning]:', err?.message || err));
      }
      if (typeof SYNC_BUS !== 'undefined') {
        SYNC_BUS.broadcast('QUIZ_ANSWER', {
          machineId: mId,
          students: stuList,
          choice: choice,
          isCorrect: isCorrect,
          timestamp: nowTs
        });
      }

      if (isCorrect && typeof confetti === 'function') {
        try {
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 }
          });
        } catch (err) { console.warn("[Handled Error Warning]:", err?.message || err); }
      }

      this.renderStudentWorkspace(STORE.getState());
    },

    // -------------------------------------------------------------
    // TÍNH NĂNG 1: BƯỚC KIỂM TRA BÀI CŨ & BỐC THĂM KỊCH TÍNH 2 TẦNG
    // -------------------------------------------------------------
    toggleOldLessonMenu() {
      const menu = document.getElementById('tpb-menu-old-lesson');
      if (menu) {
        const isVisible = menu.style.display !== 'none';
        menu.style.display = isVisible ? 'none' : 'block';
      }
    },

    closeAllTpbMenus() {
      const menu = document.getElementById('tpb-menu-old-lesson');
      if (menu) menu.style.display = 'none';
    },

    setOldLessonTimer(sec) {
      const state = STORE.getState();
      const oldL = Object.assign({}, state.oldLesson, {
        timerSeconds: sec,
        timeLeft: sec
      });
      STORE.setState({ oldLesson: oldL });
      document.querySelectorAll('.tdm-timer-btn').forEach(btn => {
        btn.classList.toggle('active', parseInt(btn.dataset.sec, 10) === sec);
      });
    },

    setOldLessonQType(type) {
      const state = STORE.getState();
      const oldL = Object.assign({}, state.oldLesson, { questionType: type });
      STORE.setState({ oldLesson: oldL });
      document.querySelectorAll('.tdm-type-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.qtype === type);
      });
    },

    broadcastOldLessonStart() {
      const state = STORE.getState();
      if (!state.oldLesson || !state.oldLesson.selectedStudent) {
        alert('⚠️ Thầy chưa bốc thăm gọi học sinh! Vui lòng bấm nút [1. 🎲 BỐC THĂM] trước khi phát đề.');
        return;
      }

      // 1. Quản lý thời gian khoa học: Hủy triệt để mọi timer dở dang của bốc thăm để chống race condition
      this.clearTimer('lucky_draw_end');
      this.clearTimer('lucky_draw_modal_close');
      this.clearTimer('lucky_draw_tick');

      const modal = document.getElementById('modal-lucky-draw');
      if (modal) modal.style.display = 'none';

      const qInput = document.getElementById('otc-question-input');
      const qText = qInput ? qInput.value.trim() : '';
      const sec = (state.oldLesson && state.oldLesson.timerSeconds) || 120;

      const oldL = Object.assign({}, state.oldLesson, {
        questionText: qText || state.oldLesson.questionText,
        questionRevealed: true,
        timeLeft: sec,
        timerActive: true,
        isLocked: false,
        isRevealed: false
      });

      STORE.setState({
        currentPhase: 'old_lesson',
        teacherPhase: 'old_lesson',
        oldLesson: oldL
      });

      SYNC_BUS.broadcast('OLD_LESSON_START', {
        timerSeconds: sec,
        questionType: state.oldLesson.questionType,
        questionText: oldL.questionText,
        questionRevealed: true,
        selectedMachine: state.oldLesson.selectedMachine,
        selectedStudent: state.oldLesson.selectedStudent
      });
      SYNC_BUS.broadcast('OLD_LESSON_QUESTION_REVEAL', {
        questionText: oldL.questionText
      });

      safeFirebaseUpdate('activeSession/oldLesson', oldL).catch(err => console.warn('[Firebase Sync Warning]:', err?.message || err));

      // BẮT ĐẦU TÍNH GIỜ CHO HOẠT ĐỘNG BÀI CŨ
      this.startMasterCountdown(sec, 'old_lesson');
      this.updateOldLessonStepButtons();
    },

    teacherLockOldLesson() {
      const state = STORE.getState();
      const oldL = Object.assign({}, state.oldLesson, { isLocked: true, timerActive: false });
      STORE.setState({ oldLesson: oldL });
      SYNC_BUS.broadcast('OLD_LESSON_LOCK', {});
      safeFirebaseSet('activeSession/oldLesson/isLocked', true).catch(err => console.warn('[Firebase Sync Warning]:', err?.message || err));
    },

    teacherRevealOldLesson() {
      const state = STORE.getState();
      if (!state.oldLesson || !state.oldLesson.questionRevealed) {
        alert('⚠️ Thầy chưa phát câu hỏi kiểm tra bài cũ! Vui lòng bấm nút [2. 🚀 CÂU HỎI] trước khi công bố đáp án.');
        return;
      }

      const oldL = Object.assign({}, state.oldLesson, { isRevealed: true });
      STORE.setState({ oldLesson: oldL });
      this.updateOldLessonStepButtons();
      SYNC_BUS.broadcast('OLD_LESSON_REVEAL', {});
      safeFirebaseSet('activeSession/oldLesson/isRevealed', true).catch(err => console.warn('[Firebase Sync Warning]:', err?.message || err));
    },

    syncTimerInterval: null,

    // Cập nhật tất cả các vị trí hiển thị đồng hồ trên giao diện (GV & HS)
    updateMasterTimerDisplay(sec) {
      const safeSec = Math.max(0, Math.floor(sec || 0));
      const mins = Math.floor(safeSec / 60);
      const secs = safeSec % 60;
      const formatted = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

      const masterDisplay = document.getElementById('master-timer-display');
      const otsDisplay = document.getElementById('ots-timer-display');
      const olTimer = document.getElementById('ol-timer');
      const pollTimer = document.getElementById('poll-timer');
      const h2Timer = document.getElementById('h2-timer-display');
      const h3Timer = document.getElementById('h3-timer-display');
      const h4Timer = document.getElementById('h4-timer-display');
      const stH2Timer = document.getElementById('student-h2-timer');

      const s = STORE.getState();
      const isOldLessonStandingBy = (s.currentPhase === 'old_lesson' && (!s.oldLesson || !s.oldLesson.questionRevealed));
      const isH2StandingBy = ((s.currentPhase === 'warmup' || s.currentPhase === 'theory') && (!s.h2State || !s.h2State.reading));
      const isH3StandingBy = (s.currentPhase === 'discussion' && (!s.h3State || !s.h3State.codingStarted));
      const isH4StandingBy = (s.currentPhase === 'quiz' && (!s.h4State || !s.h4State.quizDelivered));

      if (masterDisplay) {
        masterDisplay.textContent = formatted;
        masterDisplay.classList.toggle('tmc-timer-warning', safeSec <= 30 && safeSec > 0);
      }
      if (otsDisplay && !isOldLessonStandingBy) otsDisplay.textContent = formatted;
      if (olTimer && !isOldLessonStandingBy) olTimer.innerHTML = /* sanitize */ `<i class="fas fa-stopwatch"></i> ${formatted}`;
      if (pollTimer) pollTimer.innerHTML = /* sanitize */ `<i class="fas fa-clock"></i> ${safeSec > 60 ? formatted : safeSec + 's'}`;

      if (h2Timer && !isH2StandingBy) h2Timer.textContent = formatted;
      if (stH2Timer && !isH2StandingBy) stH2Timer.innerHTML = /* sanitize */ `<i class="fas fa-stopwatch"></i> ${formatted}`;
      if (h3Timer && !isH3StandingBy) h3Timer.textContent = formatted;
      if (h4Timer && !isH4StandingBy) h4Timer.textContent = formatted;
    },

    // Đồng bộ đồng hồ nhịp nhàng từng giây theo mốc NTP chung (Lockstep Sync)
    syncMasterCountdown(timerData, onExpire) {
      if (this.syncTimerInterval) {
        clearInterval(this.syncTimerInterval);
        this.syncTimerInterval = null;
      }
      const offset = window._serverTimeOffset || 0;
      const nowServer = Date.now() + offset;
      const isExpired = (timerData && timerData.secondsLeft !== undefined && timerData.secondsLeft <= 0) ||
                        (timerData && timerData.endTime && timerData.endTime <= nowServer);

      if (!timerData || !timerData.isRunning || timerData.phase === 'waiting' || isExpired) {
        const sec = isExpired ? 0 : (timerData ? (timerData.secondsLeft || 0) : 0);
        this.updateMasterTimerDisplay(sec);
        return;
      }

      const updateTick = () => {
        const currentOffset = window._serverTimeOffset || 0;
        const currentNowServer = Date.now() + currentOffset;
        let remaining = 0;

        if (timerData.paused) {
          remaining = Math.max(0, Math.floor(timerData.secondsLeft || 0));
        } else if (timerData.endTime) {
          remaining = Math.max(0, Math.ceil((timerData.endTime - currentNowServer) / 1000));
        } else {
          remaining = Math.max(0, Math.floor(timerData.secondsLeft || 0));
        }

        this.updateMasterTimerDisplay(remaining);
        const curPhase = STORE.getState().currentPhase;
        const timerUpdates = {
          timer: Object.assign({}, timerData, { secondsLeft: remaining })
        };
        if (curPhase === 'old_lesson') {
          timerUpdates.oldLesson = Object.assign({}, STORE.getState().oldLesson, { timeLeft: remaining });
        }
        STORE.setState(timerUpdates);

        if (remaining <= 0 && !timerData.paused) {
          clearInterval(this.syncTimerInterval);
          this.syncTimerInterval = null;
          this.updateMasterTimerDisplay(0);
          AUDIO.playFanfare();
          if (curPhase === 'old_lesson') {
            STORE.setState({
              oldLesson: Object.assign({}, STORE.getState().oldLesson, { isLocked: true, timerActive: false })
            });
          }
          // LƯU Ý SƯ PHẠM: HẾT GIỜ ĐỒNG HỒ DỪNG Ở 00:00, GIỮ NGUYÊN MÀN HÌNH ĐỂ THẦY NHẬN XÉT & CÔNG BỐ ĐÁP ÁN.
          // CẤM TUYỆT ĐỐI TỰ ĐỘNG THOÁT VỀ PHÒNG CHỜ!
          if (typeof onExpire === 'function') {
            onExpire();
          }
        }
      };

      updateTick();
      this.syncTimerInterval = setInterval(updateTick, 1000);
    },

    startMasterCountdown(seconds, phaseName, onExpire) {
      if (this.syncTimerInterval) {
        clearInterval(this.syncTimerInterval);
        this.syncTimerInterval = null;
      }
      const initialSec = (typeof seconds === 'number' && seconds > 0) ? seconds : 120;
      const offset = window._serverTimeOffset || 0;
      const nowServer = Date.now() + offset;
      const endTime = nowServer + (initialSec * 1000);

      const timerObj = {
        secondsLeft: initialSec,
        totalSeconds: initialSec,
        isRunning: true,
        paused: false,
        phase: phaseName || STORE.getState().currentPhase || 'waiting',
        startedAt: nowServer,
        endTime: endTime
      };

      STORE.setState({ timer: timerObj });
      this.updateMasterTimerDisplay(initialSec);

      const btnPause = document.getElementById('btn-master-pause-timer');
      if (btnPause) btnPause.innerHTML = /* sanitize */ '<i class="fas fa-pause"></i> Tạm dừng';

      SYNC_BUS.broadcast('TIMER_SYNC', timerObj);
      safeFirebaseUpdate('activeSession/timer', timerObj).catch(err => console.warn('[Firebase Sync Warning]:', err?.message || err));

      this.syncMasterCountdown(timerObj, () => {
        if (typeof onExpire === 'function') {
          onExpire();
        }
      });
    },

    stopMasterTimer() {
      if (this.syncTimerInterval) {
        clearInterval(this.syncTimerInterval);
        this.syncTimerInterval = null;
      }
      const s = STORE.getState();
      const stoppedTimer = Object.assign({}, s.timer, { isRunning: false, paused: false, secondsLeft: 0 });
      STORE.setState({ timer: stoppedTimer });
      this.updateMasterTimerDisplay(0);

      const btnPause = document.getElementById('btn-master-pause-timer');
      if (btnPause) btnPause.innerHTML = /* sanitize */ '<i class="fas fa-pause"></i> Tạm dừng';

      SYNC_BUS.broadcast('TIMER_SYNC', stoppedTimer);
      safeFirebaseUpdate('activeSession/timer', stoppedTimer).catch(err => console.warn('[Firebase Sync Warning]:', err?.message || err));
    },

    // Xóa sạch dữ liệu bài làm, lựa chọn cũ, modal nổi khi chuyển hoạt động hoặc về phòng chờ
    resetAndCleanActivity(targetPhase, options = {}) {
      const state = STORE.getState();
      const cleanAll = !!options.cleanAll;
      const storeUpdates = {};

      // 0. Quản lý thời gian khoa học: Hủy sạch các timers đang chạy dở khi về sảnh chờ hoặc reset toàn bộ
      if (cleanAll || targetPhase === 'waiting') {
        this.clearAllTimers();
      }

      // 1. Luôn đóng tất cả modals & overlays nổi
      const modalsToClose = [
        'modal-lucky-draw',
        'modal-confirm-machine',
        'modal-token-warning',
        'activity-countdown-overlay',
        'modal-quiz-leaderboard',
        'quiz-podium-modal'
      ];
      modalsToClose.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
      });

      // 2. Làm sạch Kiểm tra bài cũ (Chỉ khi cleanAll HOẶC chuyển hẳn về sảnh chờ waiting hoặc sang phase khác)
      if (cleanAll || targetPhase === 'waiting' || (targetPhase && targetPhase !== 'old_lesson')) {
        const defaultOldL = {
          timerSeconds: 120,
          timeLeft: 120,
          timerActive: false,
          questionRevealed: false,
          questionType: 'text',
          questionText: 'Trong các bộ phận cơ bản của máy tính (CPU, RAM, ROM/Ổ đĩa cứng), thiết bị nào đóng vai trò là "bộ não" điều khiển mọi hoạt động của máy tính?',
          selectedMachine: null,
          selectedStudent: null,
          isLocked: false,
          isRevealed: false,
          studentAnswer: '',
          submissions: {}
        };
        const defaultLucky = {
          strategy: 'wheel_fortune',
          isSpinning: false,
          resultMachine: null,
          resultStudent: null,
          completed: false,
          modalOpen: false
        };
        storeUpdates.oldLesson = Object.assign({}, state.oldLesson, defaultOldL);
        storeUpdates.luckyDraw = Object.assign({}, state.luckyDraw, defaultLucky);

        const neonCard = document.getElementById('neon-lucky-card');
        if (neonCard) neonCard.style.display = 'none';
        const standbyBanner = document.getElementById('ol-question-standby-banner');
        if (standbyBanner) standbyBanner.style.display = 'block';
        const qText = document.getElementById('ol-question-text');
        if (qText) qText.style.display = 'none';

        const canvas = document.getElementById('wheel-canvas');
        if (canvas) {
          canvas.style.transition = 'none';
          canvas.style.transform = 'rotate(0deg)';
          this.wheelCurrentRotation = 0;
        }
        const spotlight = document.getElementById('ol-caller-spotlight');
        if (spotlight) spotlight.classList.remove('highlighted', 'winner-gold-spotlight');
        const stageContainer = document.querySelector('.old-lesson-container');
        if (stageContainer) stageContainer.classList.remove('stage-winner-active');
        const callerInfo = document.getElementById('ol-caller-info');
        if (callerInfo) callerInfo.innerHTML = /* sanitize */ '<span class="waiting-spin-badge"><i class="fas fa-hourglass-half"></i> Đang chờ Thầy bốc thăm gọi học sinh...</span>';
        const revealBox = document.getElementById('ol-reveal-box');
        if (revealBox) revealBox.style.display = 'none';
        const subCount = document.getElementById('ol-submitted-count');
        if (subCount) subCount.textContent = 'Đã nộp: 0/18 máy';
        const subList = document.getElementById('ol-submissions-list');
        if (subList) subList.innerHTML = /* sanitize */ '';
        const ansInput = document.getElementById('ol-student-answer-input');
        if (ansInput) ansInput.value = '';
        const banner = document.getElementById('ld-result-banner');
        if (banner) banner.style.display = 'none';
        const spinBtn = document.getElementById('btn-trigger-spin');
        if (spinBtn) spinBtn.disabled = false;
        const otsStudent = document.getElementById('ots-student-name');
        if (otsStudent) otsStudent.textContent = 'Chưa bốc thăm (Bấm nút [Bốc thăm] để chọn ngẫu nhiên)';
      }

      // 3. Làm sạch Khởi động (Quick Poll)
      if (cleanAll || !targetPhase || targetPhase === 'waiting' || targetPhase === 'warmup') {
        storeUpdates.pollSelection = null;
        storeUpdates.pollLocked = false;
        storeUpdates.pollAnswers = {};

        document.querySelectorAll('.poll-opt-btn').forEach(btn => {
          btn.classList.remove('selected', 'locked-poll');
          btn.disabled = false;
        });
        const statusMsg = document.getElementById('poll-status-msg');
        if (statusMsg) {
          statusMsg.innerHTML = /* sanitize */ '<i class="fas fa-comments"></i> Hai em hãy trao đổi nhanh và bấm chọn 1 phương án chung của máy mình:';
        }
        const pollChart = document.getElementById('poll-live-chart');
        if (pollChart) pollChart.innerHTML = /* sanitize */ '';
        const btnLockPoll = document.getElementById('btn-lock-poll');
        if (btnLockPoll) btnLockPoll.innerHTML = /* sanitize */ '<i class="fas fa-lock"></i> Khóa chọn';
      }

      // 4. Làm sạch Khám phá SGK
      if (cleanAll || !targetPhase || targetPhase === 'waiting' || targetPhase === 'theory') {
        const theoryContainer = document.getElementById('theory-cards-container');
        if (theoryContainer) theoryContainer.scrollTop = 0;
      }

      // 5. Làm sạch Thực hành - Thảo luận (Discussion / Code)
      if (cleanAll || !targetPhase || targetPhase === 'waiting' || targetPhase === 'discussion') {
        storeUpdates.discStatus = 'working';
        storeUpdates.discSubmissionTime = null;
        storeUpdates.discussionAnswers = {};

        const discInput = document.getElementById('disc-answer-input');
        if (discInput) discInput.value = '';
        const discStatus = document.getElementById('disc-submission-status');
        if (discStatus) {
          discStatus.innerHTML = /* sanitize */ '<span class="badge-status-working"><i class="fas fa-pencil-alt"></i> Đang làm bài...</span>';
        }
        const btnSubmitDisc = document.getElementById('btn-submit-discussion');
        if (btnSubmitDisc) {
          btnSubmitDisc.disabled = false;
          btnSubmitDisc.innerHTML = /* sanitize */ '<i class="fas fa-paper-plane"></i> NỘP BÀI THẢO LUẬN';
        }
        const discSubList = document.getElementById('disc-submissions-list');
        if (discSubList) discSubList.innerHTML = /* sanitize */ '';
        const discSubCount = document.getElementById('disc-submitted-count');
        if (discSubCount) discSubCount.textContent = 'Đã nộp: 0/18 máy';
      }

      // 6. Làm sạch Live Quiz
      if (cleanAll || !targetPhase || targetPhase === 'waiting' || targetPhase === 'quiz') {
        storeUpdates.quizSelection = null;
        storeUpdates.quizAnswered = false;
        storeUpdates.quizAnswers = {};
        storeUpdates.studentQuizIndex = 0;
        storeUpdates.studentPacketAnswers = {};
        storeUpdates.quizPacketSubmitted = false;
        storeUpdates.packetQuizzes = null;

        document.querySelectorAll('.quiz-opt').forEach(btn => {
          btn.classList.remove('selected', 'correct', 'wrong');
          btn.disabled = false;
        });
        const feedback = document.getElementById('quiz-feedback-box');
        if (feedback) {
          feedback.style.display = 'none';
          feedback.className = 'quiz-feedback';
          feedback.innerHTML = /* sanitize */ '';
        }
      }

      if (!options.skipSetState && Object.keys(storeUpdates).length > 0) {
        STORE.setState(storeUpdates);
      }
      return storeUpdates;
    },

    onActivityAutoFinished() {
      const state = STORE.getState();
      if (state.currentPhase === 'waiting' || state.role !== 'teacher') {
        return;
      }
      if (this.syncTimerInterval) {
        clearInterval(this.syncTimerInterval);
        this.syncTimerInterval = null;
      }
      const currentP = state.currentPhase;
      const phaseNames = {
        'old_lesson': 'Bước 1: Kiểm tra bài cũ',
        'warmup': 'Bước 2: Khởi động',
        'theory': 'Bước 3: Khám phá SGK',
        'discussion': 'Bước 4: Thực hành',
        'quiz': 'Bước 5: Live Quiz'
      };
      const finishedName = phaseNames[currentP] || 'Hoạt động';
      AUDIO.playFanfare();
      console.log(`[LMS] Hết thời gian: ${finishedName}. Tự động đưa 18 máy về phòng chờ.`);
      
      this.resetAndCleanActivity('waiting', { cleanAll: true });

      const curFinished = Object.assign({}, state.finishedActivities || {}, { [currentP]: true });
      STORE.setState({
        finishedActivities: curFinished,
        lastFinishedActivity: finishedName,
        currentPhase: 'waiting',
        timer: { isRunning: false, paused: false, secondsLeft: 0, phase: 'waiting', endTime: 0 }
      });
      this.updateMasterTimerDisplay(0);
      this.renderDynamicStagePipeline();

      SYNC_BUS.broadcast('PHASE_CHANGE', { phase: 'waiting', returnToLobby: true, lastFinished: finishedName });
      safeFirebaseUpdate('activeSession', {
        currentPhase: 'waiting',
        returnToLobby: true,
        lastFinishedActivity: finishedName,
        timer: { isRunning: false, paused: false, secondsLeft: 0, phase: 'waiting', endTime: 0 },
        countdown: { active: false, startedAt: 0 },
        pollLocked: false,
        pollAnswers: null,
        discussionAnswers: null,
        quizAnswers: null,
        oldLesson: { selectedMachine: null, selectedStudent: null, isRevealed: false, isLocked: false, submissions: null },
        luckyDraw: { spinning: false, modalOpen: false, resultMachine: null, resultStudent: null },
        lastUpdated: Date.now()
      }).catch(err => console.warn('[Firebase] onActivityAutoFinished error:', err));
    },

    oldLessonTimerInterval: null,
    startOldLessonCountdown() {
      if (this.oldLessonTimerInterval) {
        clearInterval(this.oldLessonTimerInterval);
        this.oldLessonTimerInterval = null;
      }

      this.oldLessonTimerInterval = setInterval(() => {
        const state = STORE.getState();
        const oldL = state.oldLesson;
        if (!oldL.timerActive || oldL.timeLeft <= 0) {
          clearInterval(this.oldLessonTimerInterval);
          this.oldLessonTimerInterval = null;
          if (oldL.timeLeft <= 0 && !oldL.isLocked) {
            STORE.setState({
              oldLesson: Object.assign({}, oldL, { isLocked: true, timerActive: false })
            });
          }
          return;
        }

        const newTime = oldL.timeLeft - 1;
        STORE.setState({
          oldLesson: Object.assign({}, oldL, { timeLeft: newTime })
        });
      }, 1000);
    },

    // BỐC THĂM KỊCH TÍNH (LUCKY DRAW 2 TẦNG)
    openLuckyDrawModal(broadcast = true) {
      const modal = document.getElementById('modal-lucky-draw');
      if (modal) modal.style.display = 'flex';
      const state = STORE.getState();
      const isStudent = (state.role === 'student');
      const closeBtn = document.getElementById('btn-close-lucky-draw');
      const cancelBtn = document.getElementById('btn-cancel-lucky-draw');
      const spinBtn = document.getElementById('btn-trigger-spin');
      const stratSelector = document.querySelector('.ld-strategy-selector');
      const studentBadge = document.getElementById('ld-student-badge-view');

      if (closeBtn) closeBtn.style.display = isStudent ? 'none' : 'inline-flex';
      if (cancelBtn) cancelBtn.style.display = isStudent ? 'none' : 'inline-flex';
      if (spinBtn) spinBtn.style.display = isStudent ? 'none' : 'inline-flex';
      if (stratSelector) stratSelector.style.display = isStudent ? 'none' : 'flex';
      if (studentBadge) studentBadge.style.display = isStudent ? 'inline-block' : 'none';

      const banner = document.getElementById('ld-result-banner');
      if (banner) banner.style.display = 'none';
      if (spinBtn) spinBtn.disabled = false;

      this.initLuckyDrawViews();

      if (broadcast && state.role === 'teacher') {
        const curStrat = (state.luckyDraw && state.luckyDraw.strategy) ? state.luckyDraw.strategy : 'slot_machine';
        SYNC_BUS.broadcast('LUCKY_DRAW_OPEN', { strategy: curStrat });
        safeFirebaseUpdate('activeSession/luckyDraw', {
          modalOpen: true,
          strategy: curStrat,
          spinning: false,
          timestamp: Date.now()
        }).catch(err => console.warn('[Firebase Sync Warning]:', err?.message || err));
      }
    },

    closeLuckyDrawModal(broadcast = true) {
      const modal = document.getElementById('modal-lucky-draw');
      if (modal) modal.style.display = 'none';
      if (broadcast && STORE.getState().role === 'teacher') {
        SYNC_BUS.broadcast('LUCKY_DRAW_CLOSE', {});
        safeFirebaseUpdate('activeSession/luckyDraw', {
          modalOpen: false,
          spinning: false
        }).catch(err => console.warn('[Firebase Sync Warning]:', err?.message || err));
      }
    },

    setLuckyDrawStrategy(strat, broadcast = true) {
      const state = STORE.getState();
      const ld = Object.assign({}, state.luckyDraw, { strategy: strat });
      STORE.setState({ luckyDraw: ld });

      const btnSlot = document.getElementById('btn-strat-slot');
      const btnWheel = document.getElementById('btn-strat-wheel');
      const viewSlot = document.getElementById('ld-view-slot');
      const viewWheel = document.getElementById('ld-view-wheel');

      if (btnSlot) btnSlot.classList.toggle('active', strat === 'slot_machine');
      if (btnWheel) btnWheel.classList.toggle('active', strat === 'wheel_fortune');
      if (viewSlot) viewSlot.style.display = (strat === 'slot_machine') ? 'block' : 'none';
      if (viewWheel) viewWheel.style.display = (strat === 'wheel_fortune') ? 'block' : 'none';

      this.initLuckyDrawViews();

      if (broadcast && state.role === 'teacher') {
        SYNC_BUS.broadcast('LUCKY_DRAW_STRATEGY', { strategy: strat });
        safeFirebaseUpdate('activeSession/luckyDraw', {
          strategy: strat,
          timestamp: Date.now()
        }).catch(err => console.warn('[Firebase Sync Warning]:', err?.message || err));
      }
    },

    updateOldLessonStepButtons() {
      const state = STORE.getState();
      const btn1 = document.getElementById('btn-ol-step-1-draw');
      const btn2 = document.getElementById('btn-ol-step-2-question');
      const btn3 = document.getElementById('btn-ol-step-3-answer');
      const btn4 = document.getElementById('btn-ol-step-4-waiting');
      if (!btn1 || !btn2 || !btn3 || !btn4) return;

      const ol = state.oldLesson || {};
      const hasDrawn = !!(ol.selectedMachine && ol.selectedStudent);
      const hasQuestion = !!ol.questionRevealed;
      const hasAnswer = !!ol.isRevealed;

      // Xóa tất cả class trạng thái cũ
      [btn1, btn2, btn3, btn4].forEach(b => {
        b.classList.remove('step-completed', 'step-active-pulse', 'disabled');
      });

      // BƯỚC 1: BỐC THĂM
      if (hasDrawn) {
        btn1.disabled = true;
        btn1.classList.add('step-completed');
        btn1.innerHTML = /* sanitize */ '<i class="fas fa-check-circle" style="color:#10b981;"></i> [ ✓ ĐÃ BỐC THĂM ]';
      } else {
        btn1.disabled = false;
        btn1.classList.add('step-active-pulse');
        btn1.innerHTML = /* sanitize */ '<i class="fas fa-dice"></i> 1. BỐC THĂM';
      }

      // BƯỚC 2: CÂU HỎI
      if (hasQuestion) {
        btn2.disabled = true;
        btn2.classList.add('step-completed');
        btn2.innerHTML = /* sanitize */ '<i class="fas fa-check-circle" style="color:#10b981;"></i> [ ✓ ĐÃ PHÁT ĐỀ ]';
      } else if (hasDrawn) {
        btn2.disabled = false;
        btn2.classList.add('step-active-pulse');
        btn2.innerHTML = /* sanitize */ '<i class="fas fa-paper-plane"></i> 2. CÂU HỎI';
      } else {
        btn2.disabled = true;
        btn2.classList.add('disabled');
        btn2.innerHTML = /* sanitize */ '<i class="fas fa-paper-plane"></i> 2. CÂU HỎI';
      }

      // BƯỚC 3: ĐÁP ÁN
      if (hasAnswer) {
        btn3.disabled = true;
        btn3.classList.add('step-completed');
        btn3.innerHTML = /* sanitize */ '<i class="fas fa-check-circle" style="color:#10b981;"></i> [ ✓ ĐÃ CÔNG BỐ ]';
      } else if (hasQuestion) {
        btn3.disabled = false;
        btn3.classList.add('step-active-pulse');
        btn3.innerHTML = /* sanitize */ '<i class="fas fa-bullhorn"></i> 3. ĐÁP ÁN';
      } else {
        btn3.disabled = true;
        btn3.classList.add('disabled');
        btn3.innerHTML = /* sanitize */ '<i class="fas fa-bullhorn"></i> 3. ĐÁP ÁN';
      }

      // BƯỚC 4: PHÒNG CHỜ (Luôn khả dụng)
      btn4.disabled = false;
      if (hasAnswer) {
        btn4.classList.add('step-active-pulse');
      }
      btn4.innerHTML = /* sanitize */ '<i class="fas fa-undo"></i> 4. PHÒNG CHỜ';
    },

    // ==========================================================
    // HOẠT ĐỘNG 2: KHÁM PHÁ KIẾN THỨC SGK (4 NÚT TUẦN TỰ)
    // ==========================================================
    updateH2StepButtons() {
      const state = STORE.getState();
      const btn1 = document.getElementById('btn-h2-step-1-task');
      const btn2 = document.getElementById('btn-h2-step-2-timer');
      const btn3 = document.getElementById('btn-h2-step-3-summary');
      const btn4 = document.getElementById('btn-h2-step-4-waiting');
      if (!btn1 || !btn2 || !btn3 || !btn4) return;

      const h2 = state.h2State || {};
      const hasAssigned = !!h2.assigned;
      const hasStarted = !!h2.reading;
      const hasSummarized = !!h2.summarized;

      [btn1, btn2, btn3, btn4].forEach(b => {
        b.classList.remove('step-completed', 'step-active-pulse', 'disabled');
      });

      // BƯỚC 1: GIAO NHIỆM VỤ
      if (hasAssigned) {
        btn1.disabled = true;
        btn1.classList.add('step-completed');
        btn1.innerHTML = /* sanitize */ '<i class="fas fa-check-circle" style="color:#10b981;"></i> [ ✓ ĐÃ GIAO NHIỆM VỤ ]';
      } else {
        btn1.disabled = false;
        btn1.classList.add('step-active-pulse');
        btn1.innerHTML = /* sanitize */ '<i class="fas fa-clipboard-list"></i> 1. GIAO NHIỆM VỤ';
      }

      // BƯỚC 2: BẮT ĐẦU ĐỌC & TÍNH GIỜ
      if (hasStarted) {
        btn2.disabled = true;
        btn2.classList.add('step-completed');
        btn2.innerHTML = /* sanitize */ '<i class="fas fa-check-circle" style="color:#10b981;"></i> [ ✓ ĐANG ĐỌC & TÍNH GIỜ ]';
      } else if (hasAssigned) {
        btn2.disabled = false;
        btn2.classList.add('step-active-pulse');
        btn2.innerHTML = /* sanitize */ '<i class="fas fa-stopwatch"></i> 2. BẮT ĐẦU ĐỌC & TÍNH GIỜ';
      } else {
        btn2.disabled = true;
        btn2.classList.add('disabled');
        btn2.innerHTML = /* sanitize */ '<i class="fas fa-stopwatch"></i> 2. BẮT ĐẦU ĐỌC & TÍNH GIỜ';
      }

      // BƯỚC 3: CHỐT KIẾN THỨC
      if (hasSummarized) {
        btn3.disabled = true;
        btn3.classList.add('step-completed');
        btn3.innerHTML = /* sanitize */ '<i class="fas fa-check-circle" style="color:#10b981;"></i> [ ✓ ĐÃ CHỐT KIẾN THỨC ]';
      } else if (hasStarted) {
        btn3.disabled = false;
        btn3.classList.add('step-active-pulse');
        btn3.innerHTML = /* sanitize */ '<i class="fas fa-lightbulb"></i> 3. CHỐT KIẾN THỨC';
      } else {
        btn3.disabled = true;
        btn3.classList.add('disabled');
        btn3.innerHTML = /* sanitize */ '<i class="fas fa-lightbulb"></i> 3. CHỐT KIẾN THỨC';
      }

      // BƯỚC 4: PHÒNG CHỜ
      btn4.disabled = false;
      if (hasSummarized) {
        btn4.classList.add('step-active-pulse');
      }
      btn4.innerHTML = /* sanitize */ '<i class="fas fa-undo"></i> 4. PHÒNG CHỜ';
    },

    renderH2PreviewGrid() {
      const container = document.getElementById('h2-theory-preview-grid');
      if (!container) return;
      const lesson = STORE.getState().lessonData || this.getLesson(STORE.getState().lessonId) || EMBEDDED_LESSONS['tin6_bai12'] || {};
      const theory = lesson.theory || [
        { title: "1. Khái niệm kiểu xâu", summary: "Xâu ký tự (str) là tập hợp các ký tự trong bảng mã Unicode, đặt trong dấu ngoặc kép hoặc đơn.", code: "s = \"Hello 2026\"\nprint(type(s))", note: "Xâu là kiểu bất biến (immutable)" },
        { title: "2. Đánh chỉ số xâu (Index)", summary: "Chỉ số dương từ 0 đến len(s)-1. Chỉ số âm từ -1 ngược về -len(s).", code: "s = \"Python\"\nprint(s[0])   # 'P'\nprint(s[-1])  # 'n'", note: "Cấm gán s[0] = 'J' (Báo lỗi TypeError)" },
        { title: "3. Phép cắt xâu (Slicing)", summary: "Cú pháp: s[start : stop : step]. Cắt từ start đến stop-1.", code: "s = \"Tin hoc 10\"\nprint(s[4:7])  # 'hoc'", note: "Nếu bỏ trống start -> mặc định từ 0" }
      ];

      container.innerHTML = /* sanitize */ theory.map(item => `
        <div class="h2-theory-preview-card">
          <div class="h2-tpc-title"><i class="fas fa-bookmark"></i> ${item.title}</div>
          <div class="h2-tpc-summary">${item.summary}</div>
          ${item.code ? `<pre class="h2-tpc-code"><code>${item.code}</code></pre>` : ''}
          ${item.note ? `<div class="h2-tpc-note"><i class="fas fa-lightbulb"></i> ${item.note}</div>` : ''}
        </div>
      `).join('');
    },

    h2AssignTask() {
      const lesson = STORE.getState().lessonData || this.getLesson(STORE.getState().lessonId) || {};
      const taskInput = document.getElementById('studio-theory-task');
      const docInput = document.getElementById('studio-theory-doc');
      const taskText = (taskInput && taskInput.value.trim()) || lesson.theoryTask || 'Đọc SGK mục 1 (trang 92-93), thảo luận theo cặp đôi về khái niệm xâu ký tự và quy tắc đánh chỉ số index trong Python.';
      const docText = (docInput && docInput.value.trim()) || lesson.theoryDoc || 'SGK Tin học 10 Cánh Diều - Mục 1 Trang 92';

      const taskDisp = document.getElementById('h2-theory-task-display');
      if (taskDisp) taskDisp.textContent = taskText;
      const docDisp = document.getElementById('h2-theory-doc-display');
      if (docDisp) docDisp.innerHTML = /* sanitize */ `<i class="fas fa-bookmark" style="margin-right:6px;"></i> Tài liệu: ${docText}`;

      const h2State = Object.assign({}, STORE.getState().h2State, {
        assigned: true,
        reading: false,
        summarized: false,
        taskText: taskText,
        docText: docText
      });
      STORE.setState({ h2State });
      this.updateH2StepButtons();
      this.renderH2PreviewGrid();

      SYNC_BUS.broadcast('H2_TASK_ASSIGN', { taskText, docText });
      safeFirebaseUpdate('activeSession/h2State', h2State).catch(err => console.warn('[Firebase Sync Warning]:', err?.message || err));
    },

    h2StartReading() {
      const state = STORE.getState();
      if (!state.h2State || !state.h2State.assigned) {
        alert('⚠️ Thầy chưa giao nhiệm vụ đọc SGK! Vui lòng bấm [1. 📋 GIAO NHIỆM VỤ] trước.');
        return;
      }
      const lesson = state.lessonData || this.getLesson(state.lessonId) || {};
      const sec = lesson.theoryTimeLimit || 300;
      const h2State = Object.assign({}, state.h2State, {
        reading: true,
        timeLeft: sec
      });
      STORE.setState({ h2State });
      this.updateH2StepButtons();

      this.startMasterCountdown(sec, 'warmup');
      SYNC_BUS.broadcast('H2_START_READING', { duration: sec });
      safeFirebaseUpdate('activeSession/h2State', h2State).catch(err => console.warn('[Firebase Sync Warning]:', err?.message || err));
    },

    h2Summarize() {
      const state = STORE.getState();
      if (!state.h2State || !state.h2State.reading) {
        alert('⚠️ Chưa bắt đầu đếm giờ đọc! Vui lòng bấm [2. ⏱️ BẮT ĐẦU ĐỌC & TÍNH GIỜ] trước.');
        return;
      }
      const h2State = Object.assign({}, state.h2State, {
        summarized: true
      });
      STORE.setState({ h2State });
      this.updateH2StepButtons();

      SYNC_BUS.broadcast('H2_SUMMARIZE', {});
      safeFirebaseUpdate('activeSession/h2State', h2State).catch(err => console.warn('[Firebase Sync Warning]:', err?.message || err));
    },

    h2FinishToLobby() {
      if (window.handleFinishActivity) {
        window.handleFinishActivity('warmup');
      }
    },

    // ==========================================================
    // HOẠT ĐỘNG 3: THỰC HÀNH & THẢO LUẬN (4 NÚT TUẦN TỰ)
    // ==========================================================
    updateH3StepButtons() {
      const state = STORE.getState();
      const btn1 = document.getElementById('btn-h3-step-1-task');
      const btn2 = document.getElementById('btn-h3-step-2-timer');
      const btn3 = document.getElementById('btn-h3-step-3-solution');
      const btn4 = document.getElementById('btn-h3-step-4-waiting');
      if (!btn1 || !btn2 || !btn3 || !btn4) return;

      const h3 = state.h3State || {};
      const hasDelivered = !!h3.taskDelivered;
      const hasStarted = !!h3.codingStarted;
      const hasSolution = !!h3.solutionRevealed;

      [btn1, btn2, btn3, btn4].forEach(b => {
        b.classList.remove('step-completed', 'step-active-pulse', 'disabled');
      });

      // BƯỚC 1: PHÁT ĐỀ BÀI
      if (hasDelivered) {
        btn1.disabled = true;
        btn1.classList.add('step-completed');
        btn1.innerHTML = /* sanitize */ '<i class="fas fa-check-circle" style="color:#10b981;"></i> [ ✓ ĐÃ PHÁT ĐỀ BÀI ]';
      } else {
        btn1.disabled = false;
        btn1.classList.add('step-active-pulse');
        btn1.innerHTML = /* sanitize */ '<i class="fas fa-scroll"></i> 1. PHÁT ĐỀ BÀI';
      }

      // BƯỚC 2: MỞ KHUNG LÀM BÀI & TÍNH GIỜ
      if (hasStarted) {
        btn2.disabled = true;
        btn2.classList.add('step-completed');
        btn2.innerHTML = /* sanitize */ '<i class="fas fa-check-circle" style="color:#10b981;"></i> [ ✓ ĐANG LÀM BÀI ]';
      } else if (hasDelivered) {
        btn2.disabled = false;
        btn2.classList.add('step-active-pulse');
        btn2.innerHTML = /* sanitize */ '<i class="fas fa-code"></i> 2. MỞ KHUNG LÀM BÀI & TÍNH GIỜ';
      } else {
        btn2.disabled = true;
        btn2.classList.add('disabled');
        btn2.innerHTML = /* sanitize */ '<i class="fas fa-code"></i> 2. MỞ KHUNG LÀM BÀI & TÍNH GIỜ';
      }

      // BƯỚC 3: THU BÀI & CÔNG BỐ CODE MẪU
      if (hasSolution) {
        btn3.disabled = true;
        btn3.classList.add('step-completed');
        btn3.innerHTML = /* sanitize */ '<i class="fas fa-check-circle" style="color:#10b981;"></i> [ ✓ ĐÃ THU BÀI & CÔNG BỐ ]';
      } else if (hasStarted) {
        btn3.disabled = false;
        btn3.classList.add('step-active-pulse');
        btn3.innerHTML = /* sanitize */ '<i class="fas fa-bullseye"></i> 3. THU BÀI & CÔNG BỐ CODE MẪU';
      } else {
        btn3.disabled = true;
        btn3.classList.add('disabled');
        btn3.innerHTML = /* sanitize */ '<i class="fas fa-bullseye"></i> 3. THU BÀI & CÔNG BỐ CODE MẪU';
      }

      // BƯỚC 4: PHÒNG CHỜ
      btn4.disabled = false;
      if (hasSolution) {
        btn4.classList.add('step-active-pulse');
      }
      btn4.innerHTML = /* sanitize */ '<i class="fas fa-undo"></i> 4. PHÒNG CHỜ';
    },

    h3DeliverTask() {
      const lesson = STORE.getState().lessonData || this.getLesson(STORE.getState().lessonId) || {};
      const disc = lesson.discussion || {};
      const taskInput = document.getElementById('studio-disc-task');
      const titleInput = document.getElementById('studio-disc-title');
      const starterInput = document.getElementById('studio-disc-starter');

      const taskText = (taskInput && taskInput.value.trim()) || disc.task || 'Thực hành lập trình Python';
      const title = (titleInput && titleInput.value.trim()) || disc.title || 'Nhiệm vụ Thảo luận & Thực hành Nhóm đôi';
      const starterCode = (starterInput && starterInput.value.trim()) || disc.starterCode || '';

      const taskDisp = document.getElementById('h3-disc-task-display');
      if (taskDisp) taskDisp.textContent = title;

      const h3State = Object.assign({}, STORE.getState().h3State, {
        taskDelivered: true,
        codingStarted: false,
        solutionRevealed: false,
        taskText,
        title,
        starterCode
      });
      STORE.setState({ h3State });
      this.updateH3StepButtons();

      SYNC_BUS.broadcast('H3_TASK_DELIVER', { taskText, title, starterCode });
      safeFirebaseUpdate('activeSession/h3State', h3State).catch(err => console.warn('[Firebase Sync Warning]:', err?.message || err));
    },

    h3StartCoding() {
      const state = STORE.getState();
      if (!state.h3State || !state.h3State.taskDelivered) {
        alert('⚠️ Thầy chưa phát đề bài thực hành! Vui lòng bấm [1. 📜 PHÁT ĐỀ BÀI] trước.');
        return;
      }
      const lesson = state.lessonData || this.getLesson(state.lessonId) || {};
      const sec = (lesson.discussion && lesson.discussion.timeLimit) ? lesson.discussion.timeLimit : 600;

      const h3State = Object.assign({}, state.h3State, {
        codingStarted: true,
        timeLeft: sec
      });
      STORE.setState({ h3State });
      this.updateH3StepButtons();

      this.startMasterCountdown(sec, 'discussion');
      SYNC_BUS.broadcast('H3_START_CODING', { duration: sec });
      safeFirebaseUpdate('activeSession/h3State', h3State).catch(err => console.warn('[Firebase Sync Warning]:', err?.message || err));
    },

    h3RevealSolution() {
      const state = STORE.getState();
      if (!state.h3State || !state.h3State.codingStarted) {
        alert('⚠️ Chưa bắt đầu làm bài! Vui lòng bấm [2. 💻 MỞ KHUNG LÀM BÀI & TÍNH GIỜ] trước.');
        return;
      }
      const lesson = state.lessonData || this.getLesson(state.lessonId) || {};
      const starter = (document.getElementById('studio-disc-starter') && document.getElementById('studio-disc-starter').value) || (lesson.discussion && lesson.discussion.starterCode) || '# Lời giải mẫu của Thầy:\ns = "chuc mung nam moi 2026"\nprint("1. Do dai:", len(s))\nprint("2. Cat xau:", s[10:17])\nprint("3. Khoang trang:", s.count(" "))';

      const h3State = Object.assign({}, state.h3State, {
        solutionRevealed: true,
        solutionCode: starter
      });
      STORE.setState({ h3State });
      this.updateH3StepButtons();

      SYNC_BUS.broadcast('H3_REVEAL_SOLUTION', { solutionCode: starter });
      safeFirebaseUpdate('activeSession/h3State', h3State).catch(err => console.warn('[Firebase Sync Warning]:', err?.message || err));
    },

    h3FinishToLobby() {
      if (window.handleFinishActivity) {
        window.handleFinishActivity('discussion');
      }
    },

    // ==========================================================
    // HOẠT ĐỘNG 4: ĐẤU TRƯỜNG KAHOOT (4 NÚT TUẦN TỰ)
    // ==========================================================
    updateH4StepButtons() {
      const state = STORE.getState();
      const btn1 = document.getElementById('btn-h4-step-1-start');
      const btn2 = document.getElementById('btn-h4-step-2-timer');
      const btn3 = document.getElementById('btn-h4-step-3-podium');
      const btn4 = document.getElementById('btn-h4-step-4-waiting');
      if (!btn1 || !btn2 || !btn3 || !btn4) return;

      const h4 = state.h4State || {};
      const hasStarted = !!h4.arenaStarted;
      const hasDelivered = !!h4.quizDelivered;
      const hasPodium = !!h4.podiumRevealed;

      [btn1, btn2, btn3, btn4].forEach(b => {
        b.classList.remove('step-completed', 'step-active-pulse', 'disabled');
      });

      // BƯỚC 1: KHỞI ĐỘNG ĐẤU TRƯỜNG
      if (hasStarted) {
        btn1.disabled = true;
        btn1.classList.add('step-completed');
        btn1.innerHTML = /* sanitize */ '<i class="fas fa-check-circle" style="color:#10b981;"></i> [ ✓ ĐÃ KHỞI ĐỘNG ]';
      } else {
        btn1.disabled = false;
        btn1.classList.add('step-active-pulse');
        btn1.innerHTML = /* sanitize */ '<i class="fas fa-shield-alt"></i> 1. KHỞI ĐỘNG ĐẤU TRƯỜNG';
      }

      // BƯỚC 2: PHÁT ĐỀ & TÍNH GIỜ
      if (hasDelivered) {
        btn2.disabled = true;
        btn2.classList.add('step-completed');
        btn2.innerHTML = /* sanitize */ '<i class="fas fa-check-circle" style="color:#10b981;"></i> [ ✓ ĐANG THI ĐẤU ]';
      } else if (hasStarted) {
        btn2.disabled = false;
        btn2.classList.add('step-active-pulse');
        btn2.innerHTML = /* sanitize */ '<i class="fas fa-paper-plane"></i> 2. PHÁT ĐỀ & TÍNH GIỜ';
      } else {
        btn2.disabled = true;
        btn2.classList.add('disabled');
        btn2.innerHTML = /* sanitize */ '<i class="fas fa-paper-plane"></i> 2. PHÁT ĐỀ & TÍNH GIỜ';
      }

      // BƯỚC 3: CÔNG BỐ & BỤC VINH DANH
      if (hasPodium) {
        btn3.disabled = true;
        btn3.classList.add('step-completed');
        btn3.innerHTML = /* sanitize */ '<i class="fas fa-check-circle" style="color:#10b981;"></i> [ ✓ ĐÃ VINH DANH PODIUM ]';
      } else if (hasDelivered) {
        btn3.disabled = false;
        btn3.classList.add('step-active-pulse');
        btn3.innerHTML = /* sanitize */ '<i class="fas fa-trophy"></i> 3. CÔNG BỐ & BỤC VINH DANH';
      } else {
        btn3.disabled = true;
        btn3.classList.add('disabled');
        btn3.innerHTML = /* sanitize */ '<i class="fas fa-trophy"></i> 3. CÔNG BỐ & BỤC VINH DANH';
      }

      // BƯỚC 4: TỔNG KẾT TIẾT HỌC
      btn4.disabled = false;
      if (hasPodium) {
        btn4.classList.add('step-active-pulse');
      }
      btn4.innerHTML = /* sanitize */ '<i class="fas fa-flag-checkered"></i> 4. TỔNG KẾT TIẾT HỌC';
    },

    h4StartArena() {
      const state = STORE.getState();
      const lesson = state.lessonData || this.getLesson(state.lessonId) || {};
      const curSec = state.currentSection || 1;
      let packetQuizzes = null;
      if (lesson && lesson.sections && lesson.sections[curSec - 1]) {
        const secObj = lesson.sections[curSec - 1];
        if (secObj.quizzes && secObj.quizzes.length > 0) packetQuizzes = secObj.quizzes;
        else if (secObj.quiz && (secObj.quiz.question || secObj.quiz.type)) packetQuizzes = [secObj.quiz];
      }
      if (!packetQuizzes || packetQuizzes.length === 0) {
        if (lesson && lesson.quizzes && lesson.quizzes.length > 0) packetQuizzes = lesson.quizzes;
        else if (lesson && lesson.quiz && (lesson.quiz.question || lesson.quiz.type)) packetQuizzes = [lesson.quiz];
      }

      const qInput = document.getElementById('studio-quiz-q');
      const qTypeInput = document.getElementById('studio-quiz-type');
      const qText = (packetQuizzes && packetQuizzes[0] && packetQuizzes[0].question) || (qInput && qInput.value.trim()) || (lesson.quiz && lesson.quiz.question) || 'Trong Python, xâu ký tự có tính chất bất biến (immutable). Điều này có nghĩa là gì?';
      const qType = (packetQuizzes && packetQuizzes[0] && packetQuizzes[0].type) || (qTypeInput && qTypeInput.value) || (lesson.quiz && lesson.quiz.type) || 'single_choice';

      const qDisp = document.getElementById('h4-quiz-q-display');
      if (qDisp) {
        if (packetQuizzes && packetQuizzes.length > 1) {
          qDisp.innerHTML = /* sanitize */ `<span style="color:#38bdf8;font-weight:700;">[GÓI ${packetQuizzes.length} CÂU HỎI TRẮC NGHIỆM]</span> ${qText}`;
        } else {
          qDisp.textContent = qText;
        }
      }

      const arenaActivityId = 'h4_arena_' + Date.now();
      const h4State = Object.assign({}, state.h4State, {
        arenaStarted: true,
        quizDelivered: false,
        podiumRevealed: false,
        questionText: qText,
        questionType: qType,
        packetQuizzes: packetQuizzes,
        lessonId: state.lessonId,
        activityId: arenaActivityId
      });
      STORE.setState({
        h4State,
        packetQuizzes: packetQuizzes,
        studentQuizIndex: 0,
        studentPacketAnswers: {},
        quizPacketSubmitted: false
      });
      this.updateH4StepButtons();

      SYNC_BUS.broadcast('H4_ARENA_START', {
        lessonId: state.lessonId,
        activityId: arenaActivityId,
        questionText: qText,
        questionType: qType,
        packetQuizzes: packetQuizzes
      });
      safeFirebaseUpdate('activeSession/h4State', h4State).catch(err => console.warn('[Firebase Sync Warning]:', err?.message || err));
      if (packetQuizzes) {
        safeFirebaseUpdate('activeSession/packetQuizzes', packetQuizzes).catch(err => console.warn('[Firebase Sync Warning]:', err?.message || err));
      }
    },

    h4DeliverQuiz() {
      const state = STORE.getState();
      if (!state.h4State || !state.h4State.arenaStarted) {
        alert('⚠️ Thầy chưa khởi động đấu trường! Vui lòng bấm [1. ⚔️ KHỞI ĐỘNG ĐẤU TRƯỜNG] trước.');
        return;
      }
      const lesson = state.lessonData || this.getLesson(state.lessonId) || {};
      const quizzesList = state.packetQuizzes;
      let sec = 20;
      if (quizzesList && quizzesList.length > 0) {
        sec = quizzesList.reduce((acc, q) => acc + (q.timeLimit || 60), 0);
      } else if (lesson.quiz && lesson.quiz.timeLimit) {
        sec = lesson.quiz.timeLimit;
      }

      const deliverActivityId = 'h4_deliver_' + Date.now();
      const h4State = Object.assign({}, state.h4State, {
        quizDelivered: true,
        timeLeft: sec,
        lessonId: state.lessonId,
        activityId: deliverActivityId
      });
      STORE.setState({ h4State });
      this.updateH4StepButtons();

      this.startMasterCountdown(sec, 'quiz');
      SYNC_BUS.broadcast('H4_QUIZ_DELIVER', {
        lessonId: state.lessonId,
        activityId: deliverActivityId,
        duration: sec
      });
      safeFirebaseUpdate('activeSession/h4State', h4State).catch(err => console.warn('[Firebase Sync Warning]:', err?.message || err));
    },

    h4RevealPodium() {
      const state = STORE.getState();
      if (!state.h4State || !state.h4State.quizDelivered) {
        alert('⚠️ Chưa phát đề đấu trường! Vui lòng bấm [2. 🎯 PHÁT ĐỀ & TÍNH GIỜ] trước.');
        return;
      }
      const podiumActivityId = 'h4_podium_' + Date.now();
      const h4State = Object.assign({}, state.h4State, {
        podiumRevealed: true,
        lessonId: state.lessonId,
        activityId: podiumActivityId
      });
      STORE.setState({ h4State });
      this.updateH4StepButtons();

      SYNC_BUS.broadcast('H4_REVEAL_PODIUM', {
        lessonId: state.lessonId,
        activityId: podiumActivityId
      });
      safeFirebaseUpdate('activeSession/h4State', h4State).catch(err => console.warn('[Firebase Sync Warning]:', err?.message || err));
    },

    h4FinishSession() {
      if (window.handleFinishActivity) {
        window.handleFinishActivity('quiz');
      }
    },

    initLuckyDrawViews() {
      const state = STORE.getState();
      const strat = (state.luckyDraw && state.luckyDraw.strategy) ? state.luckyDraw.strategy : 'slot_machine';
      const classData = this.classes[state.classId] || this.classes['6A1'];

      if (strat === 'slot_machine') {
        const reelM = document.getElementById('slot-reel-machine');
        const reelS = document.getElementById('slot-reel-student');
        const colM = document.querySelector('.slot-col-machine');
        if (colM) colM.classList.remove('slot-locked-gold');

        if (reelM) {
          reelM.style.transform = 'translateY(0px)';
          reelM.style.transition = 'none';
          reelM.classList.remove('reel-spinning');
          let html = '';
          for (let r = 0; r < 5; r++) {
            for (let i = 1; i <= 18; i++) {
              html += `
                <div class="slot-item">
                  <span class="sim-badge"><i class="fas fa-desktop"></i> MÁY ${String(i).padStart(2,'0')}</span>
                </div>`;
            }
          }
          reelM.innerHTML = /* sanitize */ html;
        }

        if (reelS) {
          reelS.style.transform = 'translateY(0px)';
          reelS.style.transition = 'none';
          reelS.classList.remove('reel-spinning');
          let sHtml = '';
          for (let r = 0; r < 5; r++) {
            for (let i = 1; i <= 18; i++) {
              const pair = classData.seatingPlan[i] || [`Học sinh ${i}`];
              pair.forEach(stuName => {
                sHtml += `
                  <div class="slot-item">
                    <span class="sis-badge"><i class="fas fa-user-graduate"></i> ${stuName}</span>
                    <span class="sis-desk"><i class="fas fa-desktop"></i> MÁY ${String(i).padStart(2,'0')}</span>
                  </div>`;
              });
            }
          }
          reelS.innerHTML = /* sanitize */ sHtml;
        }
      } else if (strat === 'wheel_fortune') {
        this.drawWheelCanvas();
        const deskText = document.getElementById('wlt-desk-text');
        const stuText = document.getElementById('wlt-student-text');
        if (deskText) deskText.textContent = 'MÁY 01';
        if (stuText) {
          const p1 = (classData.seatingPlan[1] || []).join(' & ');
          stuText.textContent = p1 || 'Sẵn sàng quay 18 máy...';
        }
      }
    },

    drawWheelCanvas() {
      const canvas = document.getElementById('wheel-canvas');
      if (!canvas || !canvas.getContext) return;
      const ctx = canvas.getContext('2d');
      const state = STORE.getState();
      const classData = this.classes[state.classId] || this.classes['6A1'];

      const totalSlices = 18;
      const sliceAngle = (2 * Math.PI) / totalSlices;
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      const radius = cx - 14;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // 6 dải màu game-show tương phản cao, chuyển sắc rực rỡ
      const colors = [
        '#0284c7', // Sapphire
        '#059669', // Emerald
        '#7c3aed', // Purple
        '#d97706', // Amber
        '#e11d48', // Ruby
        '#0d9488'  // Teal
      ];

      for (let i = 0; i < totalSlices; i++) {
        const angle = i * sliceAngle;
        const deskNum = i + 1;
        const pair = classData.seatingPlan[deskNum] || [`HS ${deskNum}`];

        // 1. Vẽ Nan quạt (Slice)
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, radius, angle, angle + sliceAngle);
        ctx.closePath();
        ctx.fillStyle = colors[i % colors.length];
        ctx.fill();

        // Viền nan quạt
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = '#0f172a';
        ctx.stroke();

        // 2. Tự động bù góc chữ Typography (Auto-orient Text Flipping - chống ngược chữ 100%)
        const midAngle = angle + sliceAngle / 2;
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(midAngle);

        const isBottom = (midAngle > Math.PI / 2 && midAngle < (3 * Math.PI) / 2);
        if (isBottom) {
          ctx.rotate(Math.PI);
          ctx.textAlign = 'left';

          // Số máy (Vành ngoài)
          ctx.fillStyle = '#ffffff';
          ctx.font = '900 13px "Fira Code", monospace';
          ctx.fillText(`M${String(deskNum).padStart(2,'0')}`, -(radius - 12), 4);

          // Tên viết gọn của học sinh
          const shortNames = pair.map(n => n.split(' ').pop()).join(' • ');
          ctx.fillStyle = '#fbbf24';
          ctx.font = '700 10.5px Inter, sans-serif';
          ctx.fillText(shortNames, -(radius - 48), 4);
        } else {
          ctx.textAlign = 'right';

          // Số máy (Vành ngoài)
          ctx.fillStyle = '#ffffff';
          ctx.font = '900 13px "Fira Code", monospace';
          ctx.fillText(`M${String(deskNum).padStart(2,'0')}`, radius - 12, 4);

          // Tên viết gọn của học sinh
          const shortNames = pair.map(n => n.split(' ').pop()).join(' • ');
          ctx.fillStyle = '#fbbf24';
          ctx.font = '700 10.5px Inter, sans-serif';
          ctx.fillText(shortNames, radius - 48, 4);
        }
        ctx.restore();

        // 3. Vẽ 18 Chốt kim loại mạ vàng (Brass Pegs) quanh vành
        const pegAngle = angle;
        const pegX = cx + (radius + 2) * Math.cos(pegAngle);
        const pegY = cy + (radius + 2) * Math.sin(pegAngle);

        ctx.beginPath();
        ctx.arc(pegX, pegY, 3.5, 0, 2 * Math.PI);
        ctx.fillStyle = '#fbbf24';
        ctx.fill();
        ctx.lineWidth = 1;
        ctx.strokeStyle = '#78350f';
        ctx.stroke();
      }

      // 4. Vòng tròn tâm kim loại mạ vàng (Gold Center Hub)
      ctx.beginPath();
      ctx.arc(cx, cy, 34, 0, 2 * Math.PI);
      ctx.fillStyle = '#0f172a';
      ctx.fill();
      ctx.lineWidth = 4;
      ctx.strokeStyle = '#fbbf24';
      ctx.stroke();

      ctx.fillStyle = '#fbbf24';
      ctx.font = '900 13px "Fira Code", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('18 MÁY', cx, cy + 4);
    },

    startLuckyDrawSpin() {
      const state = STORE.getState();
      const classData = this.classes[state.classId] || this.classes['6A1'];

      // Chọn ngẫu nhiên máy từ 1..18
      const targetMachine = Math.floor(Math.random() * 18) + 1;
      const pair = classData.seatingPlan[targetMachine] || ["Học sinh A", "Học sinh B"];
      // Chọn ngẫu nhiên đích danh 1 học sinh tại máy đó
      const targetStudent = pair[Math.floor(Math.random() * pair.length)];

      const spinBtn = document.getElementById('btn-trigger-spin');
      if (spinBtn) spinBtn.disabled = true;

      const strat = state.luckyDraw.strategy || 'slot_machine';
      const drawDuration = (strat === 'wheel_fortune') ? 7000 : 3800;

      const payload = {
        strategy: strat,
        targetMachine: targetMachine,
        targetStudent: targetStudent,
        studentsList: pair,
        duration: drawDuration
      };

      // Phát lệnh đồng bộ xuống toàn bộ 18 máy học sinh
      SYNC_BUS.broadcast('LUCKY_DRAW_SPIN', payload);
      safeFirebaseSet('activeSession/luckyDraw', {
        payload: payload,
        spinning: true,
        modalOpen: true,
        timestamp: Date.now()
      }).catch(err => console.warn('[Firebase Sync Warning]:', err?.message || err));

      this.executeLuckyDrawAnimation(payload, true);
    },

    handleRemoteLuckyDrawSpin(payload) {
      if (!payload) return;
      this.openLuckyDrawModal();
      this.setLuckyDrawStrategy(payload.strategy || 'slot_machine');
      const spinBtn = document.getElementById('btn-trigger-spin');
      if (spinBtn) spinBtn.disabled = true;

      this.executeLuckyDrawAnimation(payload, false);
    },

    executeLuckyDrawAnimation(payload, isInitiator) {
      const { strategy, targetMachine, targetStudent, duration } = payload;
      const studentsList = Array.isArray(payload.studentsList) ? payload.studentsList : [];
      const banner = document.getElementById('ld-result-banner');
      if (banner) banner.style.display = 'none';

      SOUNDS.init();
      const state = STORE.getState();
      const classData = this.classes[state.classId] || this.classes['6A1'];

      if (strategy === 'slot_machine') {
        const reelM = document.getElementById('slot-reel-machine');
        const reelS = document.getElementById('slot-reel-student');
        const colM = document.querySelector('.slot-col-machine');

        if (colM) colM.classList.remove('slot-locked-gold');

        if (reelM) {
          reelM.classList.add('reel-spinning');
          const targetItemIdx = 18 * 2 + (targetMachine - 1);
          reelM.style.transition = `transform 2200ms cubic-bezier(0.16, 0.85, 0.3, 1.05)`;
          reelM.style.transform = `translateY(-${targetItemIdx * 120}px)`;

          setTimeout(() => {
            reelM.classList.remove('reel-spinning');
            SOUNDS.playClank();
            if (colM) colM.classList.add('slot-locked-gold');
          }, 2200);
        }

        if (reelS) {
          reelS.classList.add('reel-spinning');
          // Xây dựng danh sách phẳng 18 máy x học sinh (ưu tiên studentsList nếu được truyền)
          let flatItems = [];
          if (studentsList.length > 0) {
            for (let r = 0; r < 5; r++) {
              studentsList.forEach(item => {
                flatItems.push(typeof item === 'object' ? item : { machine: targetMachine, name: item });
              });
            }
          } else {
            for (let r = 0; r < 5; r++) {
              for (let i = 1; i <= 18; i++) {
                const pair = classData.seatingPlan[i] || [`Học sinh ${i}`];
                pair.forEach(stuName => {
                  flatItems.push({ machine: i, name: stuName });
                });
              }
            }
          }
          // Tìm index của targetStudent tại targetMachine ở chu kỳ 2
          let sTargetIdx = -1;
          for (let idx = 18 * 2; idx < flatItems.length; idx++) {
            if (flatItems[idx].machine === targetMachine && flatItems[idx].name === targetStudent) {
              sTargetIdx = idx;
              break;
            }
          }
          if (sTargetIdx === -1) sTargetIdx = 36;

          // Reel 2 tiếp tục quay thêm 1.4s tạo kịch tính
          setTimeout(() => {
            reelS.style.transition = `transform 2400ms cubic-bezier(0.12, 0.89, 0.32, 1.15)`;
            reelS.style.transform = `translateY(-${sTargetIdx * 120}px)`;
            setTimeout(() => {
              reelS.classList.remove('reel-spinning');
              SOUNDS.playClank();
            }, 2400);
          }, 1200);
        }

        // Tích tắc âm thanh cơ học
        let tickCount = 0;
        const tickInterval = setInterval(() => {
          SOUNDS.playTick(500 + (tickCount % 6) * 50);
          tickCount++;
          if (tickCount > 28) clearInterval(tickInterval);
        }, 120);

      } else if (strategy === 'wheel_fortune') {
        const canvas = document.getElementById('wheel-canvas');
        const pointer = document.getElementById('wheel-pointer-arrow');
        const deskText = document.getElementById('wlt-desk-text');
        const stuText = document.getElementById('wlt-student-text');

        if (canvas) {
          const totalSlices = 18;
          const sliceAngle = 360 / totalSlices;
          const targetSliceMid = (targetMachine - 1) * sliceAngle + sliceAngle / 2;
          
          let targetDeg = (270 - targetSliceMid) % 360;
          if (targetDeg < 0) targetDeg += 360;

          const currentRotMod = (this.wheelCurrentRotation || 0) % 360;
          let delta = targetDeg - currentRotMod;
          if (delta <= 0) delta += 360;

          const extraRounds = 360 * 9;
          const startRot = this.wheelCurrentRotation || 0;
          const endRot = startRot + extraRounds + delta;
          this.wheelCurrentRotation = endRot;

          // Animation thời gian thực bằng requestAnimationFrame để cập nhật HUD & Gảy kim
          const startTime = performance.now();
          const animDuration = duration || 7000;
          let lastSlice = -1;

          const step = (now) => {
            const elapsed = now - startTime;
            const progress = Math.min(1, elapsed / animDuration);
            // Chuẩn Game Show Chiếc Nón Kỳ Diệu: Ban đầu vút cực nhanh (9 vòng xé gió), sau đó giảm tốc mượt mà,
            // 2.5s cuối cùng bò chậm từng nấc hồi hộp (Suspense Crawl) trước khi dừng đúng máy đích
            const ease = 1 - Math.pow(1 - progress, 4.5);
            const currentDeg = startRot + (endRot - startRot) * ease;

            canvas.style.transform = `rotate(${currentDeg}deg)`;

            // Tính toán lát cắt đang nằm dưới kim chỉ 12 giờ (270 deg)
            const degMod = ((270 - (currentDeg % 360)) % 360 + 360) % 360;
            const sliceIdx = Math.floor(degMod / sliceAngle);
            const curDesk = sliceIdx + 1;

            if (curDesk !== lastSlice && curDesk >= 1 && curDesk <= 18) {
              lastSlice = curDesk;
              // Gảy kim chỉ sang trái rồi nảy về
              if (pointer) {
                pointer.style.transform = 'translateX(-50%) rotate(-24deg)';
                setTimeout(() => {
                  if (pointer) pointer.style.transform = 'translateX(-50%) rotate(0deg)';
                }, 45);
              }
              SOUNDS.playTick(450 + (curDesk * 20));

              // Cập nhật HUD quét 18 máy theo thời gian thực
              if (deskText) deskText.textContent = `MÁY ${String(curDesk).padStart(2,'0')}`;
              if (stuText) {
                const pair = classData.seatingPlan[curDesk] || [`Học sinh ${curDesk}`];
                stuText.textContent = pair.join(' & ');
              }
            }

            if (progress < 1) {
              requestAnimationFrame(step);
            } else {
              // Chốt đúng máy đích
              if (deskText) deskText.textContent = `MÁY ${String(targetMachine).padStart(2,'0')}`;
              if (stuText) stuText.textContent = targetStudent;
              SOUNDS.playClank();
            }
          };

          requestAnimationFrame(step);
        }
      }

      // Kết thúc bốc thăm
      APP.registerTimer('lucky_draw_end', setTimeout(() => {
        SOUNDS.playFanfare();

        if (typeof confetti === 'function') {
          confetti({
            particleCount: 120,
            spread: 90,
            origin: { y: 0.55 }
          });
        }

        if (banner) {
          banner.style.display = 'block';
          const mText = document.getElementById('lrb-machine-text');
          const sText = document.getElementById('lrb-student-text');
          if (mText) mText.textContent = `MÁY ${String(targetMachine).padStart(2,'0')}`;
          if (sText) sText.textContent = `Em: ${targetStudent}`;
        }

        // Cập nhật vào Store
        const state = STORE.getState();
        const curQ = (state.oldLesson && (state.oldLesson.questionText || state.oldLesson.question)) ||
                     (document.getElementById('otc-question-input') ? document.getElementById('otc-question-input').value.trim() : '') ||
                     "Trong các bộ phận cơ bản của máy tính (CPU, RAM, ROM/Ổ đĩa cứng), thiết bị nào đóng vai trò là 'bộ não' điều khiển mọi hoạt động của máy tính?";

        const oldL = Object.assign({}, state.oldLesson, {
          selectedMachine: targetMachine,
          selectedStudent: targetStudent,
          questionText: curQ,
          isActive: true
        });
        STORE.setState({ oldLesson: oldL });

        // Cập nhật trạng thái 4 nút tuần tự ngay sau khi bốc thăm
        APP.updateOldLessonStepButtons();

        if (isInitiator) {
          SYNC_BUS.broadcast('OLD_LESSON_SPOTLIGHT', {
            selectedMachine: targetMachine,
            selectedStudent: targetStudent,
            questionText: curQ
          });
          const updateData = { isActive: true };
          if (targetMachine !== undefined && targetMachine !== null) updateData.selectedMachine = targetMachine;
          if (targetStudent !== undefined && targetStudent !== null) updateData.selectedStudent = targetStudent;
          if (curQ !== undefined && curQ !== null) updateData.questionText = curQ;
          safeFirebaseUpdate('activeSession/oldLesson', updateData).catch(err => console.warn('[Firebase Sync Warning]:', err?.message || err));
          safeFirebaseUpdate('activeSession/luckyDraw', {
            spinning: false,
            completed: true,
            modalOpen: false
          }).catch(err => console.warn('[Firebase Sync Warning]:', err?.message || err));
        }

        const spinBtn = document.getElementById('btn-trigger-spin');
        if (spinBtn) spinBtn.disabled = false;

        // Đóng modal bốc thăm sau 2.5s trên mọi máy để hiển thị hộp thoại neon vinh danh 1 học sinh được gọi
        APP.registerTimer('lucky_draw_modal_close', setTimeout(() => {
          const modal = document.getElementById('modal-lucky-draw');
          if (modal) modal.style.display = 'none';

          const curState = STORE.getState();
          const isQRevealed = !!(curState.oldLesson && curState.oldLesson.questionRevealed);

          // Hiển thị hộp thoại Neon vinh danh duy nhất 1 em học sinh và số máy bàn (giữ nguyên trạng thái câu hỏi)
          APP.renderNeonLuckyCard(targetMachine, targetStudent, isQRevealed);

          STORE.setState({
            oldLesson: Object.assign({}, curState.oldLesson, {
              selectedMachine: targetMachine,
              selectedStudent: targetStudent
            })
          });
          APP.updateOldLessonStepButtons();
        }, 2500));
      }, duration + 300));
    }
  };

  // Expose global methods for HTML onclick handlers
  window.APP = APP;
  window.STORE = STORE;
  window.onSelectDesk = function(deskNum) {
    APP.onSelectMachine(deskNum);
  };

  window.switchStudentPhase = function(phase) {
    STORE.setState({ currentPhase: phase });
  };

  window.submitTeacherLogin = function() {
    APP.handleTeacherLoginSubmit();
  };

  window.openLuckyDrawModal = function() { APP.openLuckyDrawModal(); };
  window.closeLuckyDrawModal = function(b) { APP.closeLuckyDrawModal(b); };
  window.setLuckyDrawStrategy = function(s) { APP.setLuckyDrawStrategy(s); };
  window.startLuckyDrawSpin = function() { APP.startLuckyDrawSpin(); };
  window.setOldLessonTimer = function(sec) { APP.setOldLessonTimer(sec); };
  window.setOldLessonQType = function(t) { APP.setOldLessonQType(t); };
  window.broadcastOldLessonStart = function() { APP.broadcastOldLessonStart(); };
  window.toggleOldLessonMenu = function() { APP.toggleOldLessonMenu(); };
  window.teacherRevealOldLesson = function() { APP.teacherRevealOldLesson(); };

  // EXPORTS BÀN ĐIỀU KHIỂN 4 BƯỚC TUẦN TỰ HOẠT ĐỘNG 2, 3, 4
  window.h2AssignTask = function() { APP.h2AssignTask(); };
  window.h2StartReading = function() { APP.h2StartReading(); };
  window.h2Summarize = function() { APP.h2Summarize(); };
  window.h2FinishToLobby = function() { APP.h2FinishToLobby(); };

  window.h3DeliverTask = function() { APP.h3DeliverTask(); };
  window.h3StartCoding = function() { APP.h3StartCoding(); };
  window.h3RevealSolution = function() { APP.h3RevealSolution(); };
  window.h3FinishToLobby = function() { APP.h3FinishToLobby(); };

  window.h4StartArena = function() { APP.h4StartArena(); };
  window.h4DeliverQuiz = function() { APP.h4DeliverQuiz(); };
  window.h4RevealPodium = function() { APP.h4RevealPodium(); };
  window.h4FinishSession = function() { APP.h4FinishSession(); };

  window.teacherFinishOldLessonToLobby = function() {
    APP.stopMasterTimer();
    APP.updateMasterTimerDisplay(0);
    const lastFinished = 'Kiểm tra bài cũ';

    if (APP.resetAndCleanActivity) {
      APP.resetAndCleanActivity('waiting', { cleanAll: true });
    }

    const state = STORE.getState();
    const curFinished = Object.assign({}, state.finishedActivities || {}, { old_lesson: true });

    STORE.setState({
      currentPhase: 'waiting',
      teacherPhase: 'waiting',
      lastFinishedActivity: lastFinished,
      finishedActivities: curFinished
    });

    APP.renderDynamicStagePipeline();

    SYNC_BUS.broadcast('OLD_LESSON_DONE_RETURN_LOBBY', {
      phase: 'waiting',
      returnToLobby: true,
      lastFinished: lastFinished,
      finishedActivities: curFinished
    });
    SYNC_BUS.broadcast('PHASE_CHANGE', {
      phase: 'waiting',
      returnToLobby: true,
      lastFinished: lastFinished,
      finishedActivities: curFinished
    });

    safeFirebaseUpdate('activeSession', {
      currentPhase: 'waiting',
      returnToLobby: true,
      lastFinishedActivity: lastFinished,
      finishedActivities: curFinished,
      countdown: { active: false, startedAt: 0 },
      pollLocked: false,
      pollAnswers: null,
      discussionAnswers: null,
      quizAnswers: null,
      oldLesson: { selectedMachine: null, selectedStudent: null, isRevealed: false, isLocked: false, submissions: null },
      luckyDraw: { spinning: false, modalOpen: false, resultMachine: null, resultStudent: null },
      lastUpdated: Date.now()
    }).then(() => {
      console.log('[Firebase] Đã chốt bài cũ, lưu finishedActivities và đưa 18 máy về sảnh chờ thành công!');
    }).catch(err => {
      console.warn('[Firebase] teacherFinishOldLessonToLobby error:', err);
    });
  };

  window.teacherSetPhase = function(phase) {
    const s = STORE.getState();
    const isStarted = (phase === 'old_lesson') ? true : s.sessionStarted;

    const phaseNames = {
      'old_lesson': 'Kiểm tra bài cũ',
      'warmup': 'Khởi động',
      'theory': 'Khám phá SGK',
      'discussion': 'Thực hành - Thảo luận',
      'quiz': 'Live Quiz'
    };

    let lastFinished = s.lastFinishedActivity;
    if (s.currentPhase && s.currentPhase !== 'waiting' && phaseNames[s.currentPhase]) {
      lastFinished = phaseNames[s.currentPhase];
    } else if (!lastFinished) {
      lastFinished = 'Hoạt động';
    }

    // Làm sạch triệt để dữ liệu tránh tình trạng hiển thị lại
    if (APP.resetAndCleanActivity) {
      APP.resetAndCleanActivity(phase, { cleanAll: (phase === 'waiting') });
    }

    // Xác định thời lượng cho bước này từ kịch bản xưởng soạn
    const lesson = s.lessonData || EMBEDDED_LESSONS[s.lessonId] || {};
    let duration = 120;
    if (phase === 'old_lesson') {
      duration = (lesson.oldLesson && lesson.oldLesson.timeLimit) ? lesson.oldLesson.timeLimit : 120;
    } else if (phase === 'warmup' || phase === 'theory') {
      duration = lesson.theoryTimeLimit || 300;
    } else if (phase === 'discussion') {
      duration = (lesson.discussion && lesson.discussion.timeLimit) ? lesson.discussion.timeLimit : 600;
    } else if (phase === 'quiz') {
      duration = (lesson.quiz && lesson.quiz.timeLimit) ? lesson.quiz.timeLimit : 20;
    }

    if (phase === 'waiting') {
      APP.stopMasterTimer();
      APP.updateMasterTimerDisplay(0);
      STORE.setState({
        currentPhase: 'waiting',
        teacherPhase: 'waiting',
        sessionStarted: isStarted,
        lastFinishedActivity: lastFinished
      });
      SYNC_BUS.broadcast('PHASE_CHANGE', { phase: 'waiting', returnToLobby: true, lastFinished: lastFinished });
      const fbData = {
        currentPhase: 'waiting',
        sessionStarted: isStarted,
        returnToLobby: true,
        lastFinishedActivity: lastFinished,
        lastUpdated: Date.now(),
        countdown: { active: false, startedAt: 0 },
        pollLocked: false,
        pollAnswers: null,
        discussionAnswers: null,
        quizAnswers: null,
        oldLesson: { selectedMachine: null, selectedStudent: null, questionRevealed: false, isRevealed: false, isLocked: false, submissions: null },
        luckyDraw: { spinning: false, modalOpen: false, resultMachine: null, resultStudent: null }
      };
      safeFirebaseUpdate('activeSession', fbData).then(() => {
        console.log('[Firebase] Đã đưa 18 máy về sảnh chờ thành công!');
      }).catch(err => {
        console.warn('[Firebase] teacherSetPhase waiting error:', err);
      });
    } else {
      STORE.setState({ currentPhase: phase, teacherPhase: phase, sessionStarted: isStarted });
      SYNC_BUS.broadcast('PHASE_CHANGE', { phase, returnToLobby: false });
      const fbData = {
        currentPhase: phase,
        sessionStarted: isStarted,
        returnToLobby: false,
        lastUpdated: Date.now(),
        countdown: { active: false, startedAt: 0 }
      };
      if (phase === 'old_lesson') {
        fbData.oldLesson = STORE.getState().oldLesson || {};
      } else if (phase === 'quiz') {
        fbData.quizAnswers = null;
      }
      safeFirebaseUpdate('activeSession', fbData).then(() => {
        console.log('[Firebase] Đã cập nhật activeSession phase:', phase);
      }).catch(err => {
        console.warn('[Firebase] teacherSetPhase error:', err);
      });

      // TẤT CẢ CÁC HOẠT ĐỘNG: ĐỒNG HỒ ĐỨNG YÊN TẠI MỨC CÀI ĐẶT, THẦY LÀM CHỦ BẰNG BỘ 4 NÚT TUẦN TỰ
      APP.stopMasterTimer();
      APP.updateMasterTimerDisplay(duration);
    }
  };

  // 3-2-1 Countdown Handler đồng bộ toàn phòng máy (Chuẩn Kahoot, có Failsafe chống kẹt số 3)
  APP.handleRemoteCountdown = function(cd) {
    const overlay = document.getElementById('activity-countdown-overlay');
    if (!cd || !cd.active) {
      if (overlay) overlay.style.display = 'none';
      return;
    }

    // Nếu countdown đã bắt đầu từ trước quá 4.2 giây -> Không mở lại và đóng ngay overlay
    if (cd.startedAt && (Date.now() - cd.startedAt > 4200)) {
      if (overlay) overlay.style.display = 'none';
      return;
    }

    // Chống loop: Nếu cùng 1 startedAt đang đếm ngược dở -> không reset lại từ 3
    if (cd.startedAt && window._currentCountdownStartedAt === cd.startedAt && window._countdownTimerRunning) {
      return;
    }
    window._currentCountdownStartedAt = cd.startedAt || Date.now();
    window._countdownTimerRunning = true;

    const nameEl = document.getElementById('acd-activity-name');
    const numEl = document.getElementById('acd-number');
    if (!overlay || !numEl) return;

    if (nameEl) nameEl.textContent = cd.title || 'BƯỚC 1: KIỂM TRA BÀI CŨ';
    overlay.style.display = 'flex';

    // Failsafe 100%: Sau tối đa 4.2 giây, BẮT BUỘC ẩn overlay dù có bất cứ điều gì xảy ra
    clearTimeout(window._countdownFailsafeTimeout);
    window._countdownFailsafeTimeout = setTimeout(() => {
      window._countdownTimerRunning = false;
      if (overlay) overlay.style.display = 'none';
      const curState = STORE.getState();
      if (curState.role === 'student' && curState.screen === 'lobby') {
        let mId = curState.machineId || curState.fixedMachineId;
        if (!mId) {
          try {
            const saved = localStorage.getItem('lms_fixed_machine_id');
            if (saved) mId = parseInt(saved, 10);
          } catch (err) { console.warn("[Handled Error Warning]:", err?.message || err); }
        }
        if (mId) {
          const classData = APP.classes[curState.classId] || APP.classes['6A1'];
          const pair = classData.seatingPlan[mId] || ["Học sinh 1", "Học sinh 2"];
          STORE.setState({
            screen: 'student',
            machineId: mId,
            fixedMachineId: mId,
            students: pair,
            currentPhase: curState.currentPhase || 'old_lesson'
          });
        }
      }
    }, 4200);

    let count = 3;
    numEl.textContent = count;
    try { AUDIO.playTick(500); } catch (err) { console.warn("[Handled Error Warning]:", err?.message || err); }

    clearInterval(window._countdownTimerInterval);
    window._countdownTimerInterval = setInterval(() => {
      count--;
      if (count > 0) {
        numEl.textContent = count;
        try { AUDIO.playTick(500 + (3 - count) * 150); } catch (err) { console.warn("[Handled Error Warning]:", err?.message || err); }
      } else {
        numEl.textContent = '🚀';
        try { AUDIO.playFanfare(); } catch (err) { console.warn("[Handled Error Warning]:", err?.message || err); }
        clearInterval(window._countdownTimerInterval);
        window._countdownTimerRunning = false;

        // Học sinh từ sảnh chờ tự động vào giao diện của mình (mỗi máy 1 giao diện)
        const curState = STORE.getState();
        if (curState.role === 'student' && curState.screen === 'lobby') {
          let mId = curState.machineId || curState.fixedMachineId;
          if (!mId) {
            try {
              const saved = localStorage.getItem('lms_fixed_machine_id');
              if (saved) mId = parseInt(saved, 10);
            } catch (err) { console.warn("[Handled Error Warning]:", err?.message || err); }
          }
          if (mId) {
            const classData = APP.classes[curState.classId] || APP.classes['6A1'];
            const pair = classData.seatingPlan[mId] || ["Học sinh 1", "Học sinh 2"];
            STORE.setState({
              screen: 'student',
              machineId: mId,
              fixedMachineId: mId,
              students: pair,
              currentPhase: 'old_lesson'
            });
          }
        }

        setTimeout(() => {
          overlay.style.display = 'none';
        }, 800);
      }
    }, 1000);
  };

  // Quản lý Tab Giáo viên (1. Lớp học, 2. Xưởng soạn bài, 3. Sân khấu)
  window._impl_teacherSwitchTab = window.teacherSwitchTab = function(tab) {
    STORE.setState({ teacherTab: tab });
    document.querySelectorAll('.tnt-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.teacher-panel').forEach(p => p.style.display = 'none');

    const activeBtn = document.getElementById(`btn-tnav-${tab}`);
    if (activeBtn) activeBtn.classList.add('active');

    const activePanel = document.getElementById(`teacher-panel-${tab}`);
    if (activePanel) activePanel.style.display = 'block';

    if (tab === 'classes') {
      APP.renderSettingsSeatingGrid();
      APP.renderClassesSeatingPreview();
    } else if (tab === 'studio') {
      APP.loadLessonToStudio(APP.currentStudioLessonId || STORE.getState().lessonId || 'tin6_bai12');
    } else if (tab === 'stage') {
      APP.renderDynamicStagePipeline();
    } else if (tab === 'monitor') {
      if (window.LIVE_MONITOR && typeof window.LIVE_MONITOR.onTabOpen === 'function') {
        window.LIVE_MONITOR.onTabOpen();
      }
    }
  };

  window.teacherOnGradeChange = function(grade) {
    if (!grade) {
      const gSel = document.getElementById('teacher-select-grade');
      grade = gSel ? gSel.value : (STORE.getState().grade || '6');
    }
    grade = String(grade);
    STORE.setState({ grade });
    const classSel = document.getElementById('teacher-select-class');
    if (classSel) {
      if (grade === '7') {
        classSel.innerHTML = /* sanitize */ '<option value="7A1">Lớp 7A1 (36 học sinh • 18 máy)</option><option value="7A2">Lớp 7A2 (35 học sinh • 18 máy)</option>';
      } else if (grade === '8') {
        classSel.innerHTML = /* sanitize */ '<option value="8A1">Lớp 8A1 (38 học sinh • 18 máy)</option><option value="8A2">Lớp 8A2 (37 học sinh • 18 máy)</option>';
      } else if (grade === '9') {
        classSel.innerHTML = /* sanitize */ '<option value="9A1">Lớp 9A1 (36 học sinh • 18 máy)</option><option value="9A2">Lớp 9A2 (35 học sinh • 18 máy)</option>';
      } else {
        classSel.innerHTML = /* sanitize */ '<option value="6A1">Lớp 6A1 (35 học sinh • 18 máy)</option><option value="6A2">Lớp 6A2 (36 học sinh • 18 máy)</option><option value="6A3">Lớp 6A3 (34 học sinh • 18 máy)</option>';
      }
    }
    // Cập nhật danh sách bài dạy theo khối đã chọn
    if (APP && APP.updateStageLessonDropdown) {
      APP.updateStageLessonDropdown(grade);
    }
  };

  // Bắt đầu hoặc tiếp tục tiết học: Kích hoạt hoạt động tiếp theo trong chu trình bài dạy
  window._impl_teacherStartLesson = window.teacherStartLesson = function() {
    const s = STORE.getState();
    const checkedInCount = Object.keys(s.occupiedMachines || {}).length;
    if (checkedInCount === 0) {
      const modal = document.getElementById('modal-zero-student-alert');
      if (modal) modal.style.display = 'flex';
      return;
    }

    const lesson = s.lessonData || APP.getLesson(s.lessonId);
    const activities = APP.getLessonActivities(lesson);
    const finishedActs = s.finishedActivities || {};
    const nextAct = activities.find(a => !finishedActs[a.key]) || activities[0];

    if (nextAct) {
      window.handleStartActivity(nextAct.key);
    }
  };

  // Master Timer Controls với Lockstep NTP Sync
  window.masterPauseTimer = function() {
    const s = STORE.getState();
    const t = s.timer || {};
    const isPaused = !t.paused;
    const offset = window._serverTimeOffset || 0;
    const nowServer = Date.now() + offset;

    let updatedTimer;
    if (isPaused) {
      const remaining = Math.max(0, Math.ceil(((t.endTime || (nowServer + (t.secondsLeft || 0) * 1000)) - nowServer) / 1000));
      updatedTimer = Object.assign({}, t, {
        paused: true,
        secondsLeft: remaining
      });
    } else {
      const remaining = Math.max(0, t.secondsLeft || 0);
      updatedTimer = Object.assign({}, t, {
        paused: false,
        endTime: nowServer + (remaining * 1000)
      });
    }

    STORE.setState({ timer: updatedTimer });
    const btn = document.getElementById('btn-master-pause-timer');
    if (btn) btn.innerHTML = /* sanitize */ isPaused ? '<i class="fas fa-play"></i> Tiếp tục' : '<i class="fas fa-pause"></i> Tạm dừng';

    APP.syncMasterCountdown(updatedTimer, () => APP.onActivityAutoFinished());
    SYNC_BUS.broadcast('TIMER_SYNC', updatedTimer);
    safeFirebaseUpdate('activeSession/timer', updatedTimer).catch(err => console.warn('[Firebase Sync Warning]:', err?.message || err));
  };

  window.masterAddTime = function(sec = 30) {
    const s = STORE.getState();
    const t = s.timer || {};
    const offset = window._serverTimeOffset || 0;
    const nowServer = Date.now() + offset;

    const currentLeft = t.secondsLeft || 0;
    const newSecondsLeft = currentLeft + sec;
    const newTotal = (t.totalSeconds || currentLeft) + sec;
    const newEndTime = (t.endTime || (nowServer + currentLeft * 1000)) + (sec * 1000);

    const updatedTimer = Object.assign({}, t, {
      secondsLeft: newSecondsLeft,
      totalSeconds: newTotal,
      endTime: newEndTime
    });

    STORE.setState({ timer: updatedTimer });
    APP.updateMasterTimerDisplay(newSecondsLeft);

    APP.syncMasterCountdown(updatedTimer, () => APP.onActivityAutoFinished());
    SYNC_BUS.broadcast('TIMER_SYNC', updatedTimer);
    safeFirebaseUpdate('activeSession/timer', updatedTimer).catch(err => console.warn('[Firebase Sync Warning]:', err?.message || err));
  };

  // Nút RESET VỀ PHÒNG CHỜ từ Giáo viên
  window.teacherResetAllToLobby = function() {
    APP.stopMasterTimer();
    APP.updateMasterTimerDisplay(0);
    if (APP.resetAndCleanActivity) {
      APP.resetAndCleanActivity('waiting', { cleanAll: true });
    }
    STORE.setState({
      currentPhase: 'waiting',
      teacherPhase: 'waiting',
      lastFinishedActivity: null,
      pollLocked: false,
      occupiedMachines: {}
    });
    SYNC_BUS.broadcast('PHASE_CHANGE', { phase: 'waiting', resetByTeacher: true, returnToLobby: true });
    safeFirebaseUpdate('activeSession', {
      currentPhase: 'waiting',
      returnToLobby: true,
      lastFinishedActivity: null,
      pollLocked: false,
      pollAnswers: null,
      discussionAnswers: null,
      quizAnswers: null,
      machines: null,
      oldLesson: { selectedMachine: null, selectedStudent: null, isRevealed: false, isLocked: false, submissions: null },
      luckyDraw: { spinning: false, modalOpen: false, resultMachine: null, resultStudent: null },
      countdown: { active: false, startedAt: 0 },
      lastUpdated: Date.now()
    }).then(() => {
      console.log('[Firebase] Đã reset toàn bộ 18 máy về phòng chờ thành công!');
    }).catch(err => console.warn('[Firebase] teacherResetAllToLobby error:', err));
    AUDIO.playChime();
    console.log('[LMS] Giáo viên đã kích hoạt nút RESET VỀ PHÒNG CHỜ cho 18 máy.');
  };

  window.masterSkipStep = function() {
    const s = STORE.getState();
    const phases = ['waiting', 'old_lesson', 'warmup', 'theory', 'discussion', 'quiz'];
    const curIdx = phases.indexOf(s.currentPhase);
    if (curIdx >= 0 && curIdx < phases.length - 1) {
      const nextPhase = phases[curIdx + 1];
      window.teacherSetPhase(nextPhase);
    }
  };

  window._impl_teacherEndSession = window.teacherEndSession = function() {
    const btn = document.getElementById('btn-end-class-session');
    if (btn) btn.click();
  };

  window.studioSelectGrade = function(grade) {
    if (typeof APP.studioSelectGrade === 'function') {
      APP.studioSelectGrade(grade);
    } else {
      APP.currentStudioGrade = grade;
      document.querySelectorAll('.sg-btn').forEach(b => b.classList.toggle('active', b.textContent.includes(grade)));
      const lessons = APP.getLessonsByGrade(grade);
      if (lessons.length > 0) {
        APP.loadLessonToStudio(lessons[0].id);
      } else {
        APP.renderStudioLessonList(grade);
      }
    }
  };

  window.studioLoadLesson = function(lessonId) {
    APP.loadLessonToStudio(lessonId);
  };

  window.studioCreateNewLesson = function() {
    APP.studioCreateNewLesson();
  };

  window.studioPreviewLesson = function() {
    APP.studioPreviewLesson();
  };

  window.closeStudioPreviewModal = function() {
    const modal = document.getElementById('modal-studio-preview');
    if (modal) modal.style.display = 'none';
  };

  window.studioSaveFromPreview = function() {
    APP.saveStudioLesson();
    const modal = document.getElementById('modal-studio-preview');
    if (modal) modal.style.display = 'none';
  };

  window.studioAddNewSection = function() {
    const container = document.getElementById('studio-sections-container');
    if (!container) return;
    const nextIdx = container.querySelectorAll('.studio-section-card').length + 1;
    const card = document.createElement('div');
    card.className = 'studio-section-card';
    card.id = `studio-sec-card-${nextIdx}`;
    card.setAttribute('data-sec', String(nextIdx));
    card.innerHTML = /* sanitize */ `
      <div class="section-card-header">
        <div class="section-header-title">
          <div class="section-diamond-tag">🔷 ${nextIdx}</div>
          <input type="text" class="section-title-input" id="studio-sec${nextIdx}-title" value="Mục ${nextIdx}: Nội dung bài học mới" placeholder="Tên mục ${nextIdx}...">
        </div>
        <button type="button" class="btn-tool-sm btn-tool-danger" onclick="this.closest('.studio-section-card').remove()" style="padding:4px 10px;font-size:12px;border-radius:6px;"><i class="fas fa-trash"></i> Xóa mục</button>
      </div>
      <div class="section-sub-activities">
        <div class="sub-activity-card">
          <div class="sub-activity-header">
            <div class="sub-act-title"><i class="fas fa-book-open" style="color:#38bdf8;"></i> HĐ ${nextIdx}.1: Khám phá SGK & Thẻ Tri Thức</div>
            <div class="seq-badge-flow"><span class="seq-chip">1. Giao nhiệm vụ</span> <i class="fas fa-arrow-right seq-arrow"></i> <span class="seq-chip">2. Bắt đầu đọc</span> <i class="fas fa-arrow-right seq-arrow"></i> <span class="seq-chip">3. Chốt kiến thức</span> <i class="fas fa-arrow-right seq-arrow"></i> <span class="seq-chip">4. Sảnh chờ</span></div>
          </div>
          <textarea class="studio-textarea" rows="2" placeholder="Nhiệm vụ đọc SGK mục ${nextIdx}..."></textarea>
        </div>
        <div class="sub-activity-card">
          <div class="sub-activity-header">
            <div class="sub-act-title"><i class="fas fa-check-double" style="color:#10b981;"></i> HĐ ${nextIdx}.2: Trắc nghiệm nhanh củng cố</div>
            <div class="seq-badge-flow"><span class="seq-chip">1. Chuẩn bị</span> <i class="fas fa-arrow-right seq-arrow"></i> <span class="seq-chip">2. Phát đề</span> <i class="fas fa-arrow-right seq-arrow"></i> <span class="seq-chip">3. Công bố Đ/A</span> <i class="fas fa-arrow-right seq-arrow"></i> <span class="seq-chip">4. Sảnh chờ</span></div>
          </div>
          <input type="text" class="studio-input" placeholder="Câu hỏi trắc nghiệm nhanh mục ${nextIdx}...">
        </div>
      </div>
    `;
    container.appendChild(card);
  };

  window.studioSaveLesson = function() {
    APP.saveStudioLesson();
  };

  window.studioOnQuizTypeChange = function(type) {
    const singleWrap = document.getElementById('studio-quiz-single-wrap');
    const tfWrap = document.getElementById('studio-quiz-tf-wrap');
    const saWrap = document.getElementById('studio-quiz-sa-wrap');
    if (singleWrap) singleWrap.style.display = (type === 'single_choice' || !type) ? 'block' : 'none';
    if (tfWrap) tfWrap.style.display = (type === 'true_false') ? 'block' : 'none';
    if (saWrap) saWrap.style.display = (type === 'short_answer') ? 'block' : 'none';
  };

  window.filterClassesByGrade = function(g) {
    const sel = document.getElementById('classes-select-class');
    if (!sel) return;
    if (g === '7') {
      sel.innerHTML = /* sanitize */ '<option value="7A1">Lớp 7A1 (36 học sinh)</option><option value="7A2">Lớp 7A2 (35 học sinh)</option>';
    } else if (g === '8') {
      sel.innerHTML = /* sanitize */ '<option value="8A1">Lớp 8A1 (38 học sinh)</option><option value="8A2">Lớp 8A2 (37 học sinh)</option>';
    } else if (g === '9') {
      sel.innerHTML = /* sanitize */ '<option value="9A1">Lớp 9A1 (36 học sinh)</option><option value="9A2">Lớp 9A2 (35 học sinh)</option>';
    } else {
      sel.innerHTML = /* sanitize */ '<option value="6A1">Lớp 6A1 (35 học sinh)</option><option value="6A2">Lớp 6A2 (36 học sinh)</option><option value="6A3">Lớp 6A3 (34 học sinh)</option>';
    }
    const currentCls = sel.value;
    STORE.setState({ classId: currentCls });
    APP.renderClassesSeatingPreview();
  };

  window.teacherSelectClassForEdit = function(c) {
    if (c) STORE.setState({ classId: c });
    APP.renderSettingsSeatingGrid();
    APP.renderClassesSeatingPreview();
    if (window.LIVE_MONITOR && typeof window.LIVE_MONITOR.refreshStudents === 'function') {
      window.LIVE_MONITOR.refreshStudents();
    }
  };

  // ĐIỀU KHIỂN HOẠT ĐỘNG SÂN KHẤU ĐỘNG (DYNAMIC STAGE ACTIVITY CONTROLS)
  window.handleStartActivity = function(actKey) {
    const s = STORE.getState();
    const checkedInCount = Object.keys(s.occupiedMachines || {}).length;
    // Chặn cứng tuyệt đối khi phòng chờ chưa có học sinh nào (0/18 máy)
    if (checkedInCount === 0) {
      const zeroModal = document.getElementById('modal-zero-student-alert');
      if (zeroModal) zeroModal.style.display = 'flex';
      return;
    }

    // 1. Kiểm tra sĩ số phòng chờ nếu còn thiếu một số máy (nhưng > 0)
    const readiness = APP.checkWaitingRoomReadiness();
    if (!readiness.isReady) {
      window._pendingStartActivityKey = actKey;
      const modal = document.getElementById('modal-waiting-room-alert');
      const missingCountEl = document.getElementById('wra-missing-count');
      const missingListEl = document.getElementById('wra-missing-list');
      if (missingCountEl) missingCountEl.textContent = readiness.missingDesks.length;
      if (missingListEl) {
        missingListEl.innerHTML = /* sanitize */ readiness.missingDesks.map(d =>
          '<span class="missing-desk-chip"><i class="fas fa-desktop"></i> Máy ' + String(d).padStart(2, '0') + '</span>'
        ).join('');
      }
      if (modal) modal.style.display = 'flex';
      return;
    }

    APP.executeStartActivity(actKey);
  };

  window.closeZeroStudentAlert = function() {
    const zeroModal = document.getElementById('modal-zero-student-alert');
    if (zeroModal) zeroModal.style.display = 'none';
  };

  window.closeWaitingRoomAlert = function(proceed) {
    const modal = document.getElementById('modal-waiting-room-alert');
    if (modal) modal.style.display = 'none';
    if (proceed && window._pendingStartActivityKey) {
      const actKey = window._pendingStartActivityKey;
      window._pendingStartActivityKey = null;
      APP.executeStartActivity(actKey);
    } else {
      window._pendingStartActivityKey = null;
    }
  };

  window.handleFinishActivity = function(actKey) {
    const toast = document.getElementById('activity-finishing-toast');
    const toastTitle = document.getElementById('aft-title');
    const toastDesc = document.getElementById('aft-desc');
    const phaseNames = {
      'old_lesson': 'Kiểm tra bài cũ',
      'warmup': 'Khởi động & Khám phá',
      'theory': 'Khám phá SGK',
      'discussion': 'Thực hành - Thảo luận',
      'quiz': 'Đấu trường Live Quiz'
    };
    const actTitle = phaseNames[actKey] || 'Hoạt động';

    if (toast) {
      if (toastTitle) toastTitle.textContent = `HOÀN THÀNH: ${actTitle.toUpperCase()}!`;
      if (toastDesc) toastDesc.textContent = 'Đang lưu dữ liệu và chuyển nhẹ nhàng về phòng chờ...';
      toast.style.display = 'block';
    }

    AUDIO.playChime();
    SYNC_BUS.broadcast('ACTIVITY_FINISHING', { actKey, actTitle });
    safeFirebaseUpdate('activeSession/finishingTransition', {
      active: true,
      actKey: actKey,
      actTitle: actTitle,
      timestamp: Date.now()
    }).catch(err => console.warn('[Firebase Sync Warning]:', err?.message || err));

    // Độ trễ sư phạm 1500ms (1.5 giây) giúp chuyển cảnh mượt mà, tránh quay về đột ngột gây sốc thị giác
    setTimeout(() => {
      if (toast) toast.style.display = 'none';

      const state = STORE.getState();
      const curFinished = Object.assign({}, state.finishedActivities || {}, { [actKey]: true });
      STORE.setState({ finishedActivities: curFinished });

      // Đưa 18 máy về phòng chờ
      window.teacherSetPhase('waiting');

      // Render lại pipeline thẻ
      APP.renderDynamicStagePipeline();

      safeFirebaseUpdate('activeSession', {
        finishedActivities: curFinished,
        lastUpdated: Date.now()
      }).catch(err => console.warn('[Firebase Sync Warning]:', err?.message || err));

      safeFirebaseUpdate('activeSession/finishingTransition', {
        active: false,
        timestamp: Date.now()
      }).catch(err => console.warn('[Firebase Sync Warning]:', err?.message || err));
    }, 1500);
  };

  // -------------------------------------------------------------
  // XỬ LÝ NHẬP XUẤT EXCEL & SOẠN CÂU HỎI ĐỘNG (STUDIO EXCEL & DYNAMIC QUIZ)
  // -------------------------------------------------------------
  window.studioDownloadExcelTemplate = function() {
    const headers = [
      "Mục",
      "Tên mục bài học",
      "Loại hoạt động",
      "Dạng trắc nghiệm",
      "Nội dung / Câu hỏi",
      "Phương án A / Mệnh đề a",
      "Phương án B / Mệnh đề b",
      "Phương án C / Mệnh đề c",
      "Phương án D / Mệnh đề d",
      "Đáp án đúng",
      "Thời lượng (giây)"
    ];

    const rows = [
      [1, "Mục 1: Khái niệm & Khởi tạo Xâu Ký Tự", "kham_pha", "", "Đọc SGK Tin 10 trang 90 tìm hiểu cách khởi tạo biến xâu và chỉ số index", "", "", "", "", "", 300],
      [1, "Mục 1: Khái niệm & Khởi tạo Xâu Ký Tự", "trac_nghiem", "single_choice", "Trong Python, chỉ số (index) của phần tử đầu tiên trong xâu ký tự được đánh số bắt đầu từ mấy?", "Chỉ số 0", "Chỉ số 1", "Chỉ số -1", "Tùy chọn", "A", 60],
      [1, "Mục 1: Khái niệm & Khởi tạo Xâu Ký Tự", "trac_nghiem", "true_false", "Các mệnh đề sau về xâu ký tự trong Python là Đúng hay Sai?", "Xâu có thể chứa đồng thời chữ cái, chữ số và ký tự đặc biệt", "Có thể gán thay đổi trực tiếp một ký tự trong xâu qua cú pháp s[0] = 'a'", "Hàm len(s) trả về tổng số ký tự có trong xâu s", "Chỉ số âm s[-1] dùng để truy cập phần tử cuối cùng của xâu", "a:Đ, b:S, c:Đ, d:Đ", 90],
      [1, "Mục 1: Khái niệm & Khởi tạo Xâu Ký Tự", "trac_nghiem", "short_answer", "Cho s = 'TinHoc10'. Lệnh len(s) sẽ trả về kết quả là bao nhiêu?", "", "", "", "", "8", 60],
      [1, "Mục 1: Khái niệm & Khởi tạo Xâu Ký Tự", "thuc_hanh", "", "Viết chương trình nhập vào họ tên học sinh và in ra độ dài cùng ký tự đầu tiên", "", "", "", "", "", 600],
      [2, "Mục 2: Phép Cắt Xâu Ký Tự (Slicing)", "kham_pha", "", "Tìm hiểu cú pháp cắt xâu s[start:end] và bước nhảy step trong SGK trang 92", "", "", "", "", "", 300],
      [2, "Mục 2: Phép Cắt Xâu Ký Tự (Slicing)", "trac_nghiem", "single_choice", "Cho xâu s = 'VIETNAM'. Kết quả của biểu thức s[0:4] là gì?", "'VIET'", "'VIETN'", "'VIE'", "'ETNA'", "A", 60],
      [2, "Mục 2: Phép Cắt Xâu Ký Tự (Slicing)", "trac_nghiem", "short_answer", "Cho xâu s = 'TIN HOC 10'. Kết quả của s[4:7] là gì?", "", "", "", "", "HOC", 60],
      [2, "Mục 2: Phép Cắt Xâu Ký Tự (Slicing)", "thuc_hanh", "", "Thực hành cắt lấy từ đầu tiên và từ cuối cùng của một chuỗi họ và tên", "", "", "", "", "", 600]
    ];

    if (typeof XLSX !== 'undefined') {
      try {
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
        XLSX.utils.book_append_sheet(wb, ws, "KichBanBaiHoc");
        XLSX.writeFile(wb, "Mau_Kich_Ban_Bai_Hoc_LMS.xlsx");
        return;
      } catch (e) {
        console.warn("SheetJS write failed, falling back to CSV:", e);
      }
    }

    // Fallback CSV with UTF-8 BOM
    let csvContent = "\uFEFF";
    const allRows = [headers, ...rows];
    allRows.forEach(r => {
      const rowStr = r.map(cell => `"${String(cell !== undefined && cell !== null ? cell : '').replace(/"/g, '""')}"`).join(",");
      csvContent += rowStr + "\r\n";
    });

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "Mau_Kich_Ban_Bai_Hoc_LMS.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  window.studioHandleExcelImport = function(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    const fileName = file.name.toLowerCase();
    const isExcel = fileName.endsWith('.xlsx') || fileName.endsWith('.xls');

    if (isExcel && typeof XLSX !== 'undefined') {
      const reader = new FileReader();
      reader.onload = function(e) {
        try {
          const data = new Uint8Array(e.target.result);
          const wb = XLSX.read(data, { type: 'array' });
          const firstSheetName = wb.SheetNames[0];
          const sheet = wb.Sheets[firstSheetName];
          const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
          APP.processExcelImportedRows(rows);
        } catch (err) {
          console.error("Lỗi đọc file Excel:", err);
          alert("Lỗi đọc file Excel: " + err.message);
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      // CSV or fallback
      const reader = new FileReader();
      reader.onload = function(e) {
        try {
          const text = e.target.result;
          const rows = APP.parseCSV(text);
          APP.processExcelImportedRows(rows);
        } catch (err) {
          console.error("Lỗi đọc file CSV:", err);
          alert("Lỗi đọc file CSV: " + err.message);
        }
      };
      reader.readAsText(file, 'UTF-8');
    }

    event.target.value = '';
  };

  window.studioAddQuizQuestion = function(secId) {
    const container = document.getElementById(`sec${secId}-quizzes-container`);
    if (!container) return;

    // Xóa empty notice nếu đang có
    const emptyNotice = container.querySelector('.empty-quizzes-notice');
    if (emptyNotice) emptyNotice.remove();

    const currentCards = container.querySelectorAll('.studio-quiz-item-card');
    const nextIdx = currentCards.length;
    const card = document.createElement('div');
    card.className = 'studio-quiz-item-card';
    card.setAttribute('data-q-idx', String(nextIdx));
    card.style.cssText = 'background:rgba(15,23,42,0.6);border:1px solid rgba(255,255,255,0.08);border-radius:8px;padding:12px;margin-bottom:10px;';
    
    card.innerHTML = /* sanitize */ `
      <div class="sqic-header" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
        <span style="color:#38bdf8;font-weight:700;font-size:12.5px;"><i class="fas fa-question-circle"></i> CÂU HỎI ${nextIdx + 1}:</span>
        <div style="display:flex;gap:8px;align-items:center;">
          <select class="studio-select sqic-type-select" onchange="window.studioChangeQuestionType(this)" style="padding:3px 8px;font-size:12px;width:auto;">
            <option value="single_choice" selected>4 Lựa chọn (A, B, C, D)</option>
            <option value="true_false">Đúng / Sai 4 mệnh đề</option>
            <option value="short_answer">Điền kết quả ngắn</option>
          </select>
          <button type="button" class="btn-tool-sm btn-tool-danger" onclick="window.studioRemoveQuizQuestion(this)" style="padding:3px 8px;font-size:11px;border-radius:4px;"><i class="fas fa-trash"></i> Xóa</button>
        </div>
      </div>
      <div class="studio-form-row">
        <div class="studio-form-col" style="flex:2;">
          <label class="studio-field-label"><i class="fas fa-question"></i> Nội dung câu hỏi ${nextIdx + 1}:</label>
          <input type="text" class="studio-input sqic-q-input" placeholder="Nhập nội dung câu hỏi...">
        </div>
        <div class="studio-form-col sqic-correct-col">
          <label class="studio-field-label"><i class="fas fa-check-circle" style="color:#10b981;"></i> Đáp án đúng:</label>
          <select class="studio-select sqic-correct-select">
            <option value="A" selected>A</option>
            <option value="B">B</option>
            <option value="C">C</option>
            <option value="D">D</option>
          </select>
        </div>
        <div class="studio-form-col">
          <label class="studio-field-label"><i class="fas fa-stopwatch"></i> Thời lượng:</label>
          <select class="studio-select sqic-time-select">
            <option value="30">30 giây</option>
            <option value="60" selected>1 phút</option>
            <option value="90">1.5 phút</option>
            <option value="120">2 phút</option>
          </select>
        </div>
      </div>
      <div class="sqic-tf-wrap" style="display:none;margin-top:8px;">
        <div style="font-size:12px;color:#94a3b8;margin-bottom:4px;"><i class="fas fa-tasks"></i> 4 Mệnh đề Đúng/Sai:</div>
        ${['a', 'b', 'c', 'd'].map((k, i) => `
          <div style="display:flex;gap:6px;align-items:center;margin-bottom:4px;">
            <span style="color:#38bdf8;font-weight:700;width:18px;">${k})</span>
            <input type="text" class="studio-input sqic-tf-stmt-${k}" value="Mệnh đề ${k}" style="flex:1;padding:4px 8px;font-size:12px;">
            <select class="studio-select sqic-tf-ans-${k}" style="width:85px;padding:4px 8px;font-size:12px;">
              <option value="true" ${i % 2 === 0 ? 'selected' : ''}>ĐÚNG</option>
              <option value="false" ${i % 2 !== 0 ? 'selected' : ''}>SAI</option>
            </select>
          </div>
        `).join('')}
      </div>
      <div class="sqic-sa-wrap" style="display:none;margin-top:8px;">
        <label class="studio-field-label"><i class="fas fa-keyboard"></i> Kết quả mã code mong đợi:</label>
        <input type="text" class="studio-input sqic-sa-ans" placeholder="Ví dụ: inH...">
      </div>
    `;
    container.appendChild(card);

    const total = container.querySelectorAll('.studio-quiz-item-card').length;
    const badge = document.getElementById(`sec${secId}-quiz-count-badge`);
    if (badge) badge.innerHTML = /* sanitize */ `<i class="fas fa-layer-group"></i> Gói ${total} câu trắc nghiệm`;
  };

  window.studioRemoveQuizQuestion = function(btn) {
    const card = btn.closest('.studio-quiz-item-card');
    if (!card) return;
    const container = card.closest('.studio-quizzes-wrapper') || card.parentElement;
    card.remove();

    if (container) {
      const secId = container.id.includes('sec1') ? 1 : 2;
      const cards = container.querySelectorAll('.studio-quiz-item-card');
      if (cards.length === 0) {
        container.innerHTML = /* sanitize */ `
          <div class="empty-quizzes-notice">
            <i class="fas fa-info-circle"></i> Mục này hiện không có câu hỏi trắc nghiệm nào. Thầy hãy bấm nút <strong>[+ Thêm câu hỏi trắc nghiệm]</strong> bên dưới nếu muốn bổ sung!
          </div>
        `;
        const badge = document.getElementById(`sec${secId}-quiz-count-badge`);
        if (badge) badge.innerHTML = /* sanitize */ `<i class="fas fa-layer-group"></i> Gói 0 câu trắc nghiệm`;
      } else {
        cards.forEach((c, idx) => {
          c.setAttribute('data-q-idx', String(idx));
          const titleSpan = c.querySelector('.sqic-header span');
          if (titleSpan) titleSpan.innerHTML = /* sanitize */ `<i class="fas fa-question-circle"></i> CÂU HỎI ${idx + 1}:`;
          const qLabel = c.querySelector('.studio-form-col:first-child .studio-field-label');
          if (qLabel) qLabel.innerHTML = /* sanitize */ `<i class="fas fa-question"></i> Nội dung câu hỏi ${idx + 1}:`;
        });
        const badge = document.getElementById(`sec${secId}-quiz-count-badge`);
        if (badge) badge.innerHTML = /* sanitize */ `<i class="fas fa-layer-group"></i> Gói ${cards.length} câu trắc nghiệm`;
      }
    }
  };

  // -------------------------------------------------------------
  // XÓA / BẬT-TẮT HOẠT ĐỘNG CON VÀ XÓA MỤC BÀI HỌC
  // -------------------------------------------------------------
  window.studioRemoveSubActivity = function(secId, actType) {
    const actNum = actType === 'theory' ? '1' : (actType === 'quiz' ? '2' : '3');
    const card = document.getElementById(`sub-act-${secId}-${actNum}`);
    const placeholder = document.getElementById(`sub-act-placeholder-${secId}-${actType}`);
    if (card) card.style.display = 'none';
    if (placeholder) placeholder.style.display = 'flex';

    const secCard = document.getElementById(`studio-sec-card-${secId}`);
    if (secCard) {
      const activeCount = secCard.querySelectorAll('.sub-activity-card:not([style*="display: none"]):not([style*="display:none"])').length;
      const tag = secCard.querySelector('.sec-act-count-tag');
      if (tag) tag.textContent = `${activeCount} Hoạt động con`;
    }
  };

  window.studioRestoreSubActivity = function(secId, actType) {
    const actNum = actType === 'theory' ? '1' : (actType === 'quiz' ? '2' : '3');
    const card = document.getElementById(`sub-act-${secId}-${actNum}`);
    const placeholder = document.getElementById(`sub-act-placeholder-${secId}-${actType}`);
    if (card) card.style.display = 'block';
    if (placeholder) placeholder.style.display = 'none';

    const secCard = document.getElementById(`studio-sec-card-${secId}`);
    if (secCard) {
      const activeCount = secCard.querySelectorAll('.sub-activity-card:not([style*="display: none"]):not([style*="display:none"])').length;
      const tag = secCard.querySelector('.sec-act-count-tag');
      if (tag) tag.textContent = `${activeCount} Hoạt động con`;
    }
  };

  window.studioRemoveSection = function(btn) {
    const card = btn.closest('.studio-section-card');
    if (!card) return;
    const container = document.getElementById('studio-sections-container');
    const totalSecs = container ? Array.from(container.querySelectorAll('.studio-section-card')).filter(c => c.style.display !== 'none').length : 1;
    if (totalSecs <= 1) {
      alert('⚠️ Bài dạy cần có ít nhất 1 Mục nội dung. Thầy không thể xóa hết toàn bộ các mục!');
      return;
    }
    if (confirm('Thầy có chắc chắn muốn XÓA TOÀN BỘ Mục này cùng các hoạt động bên trong?')) {
      card.remove();
      if (container) {
        const remaining = Array.from(container.querySelectorAll('.studio-section-card')).filter(c => c.style.display !== 'none');
        remaining.forEach((c, idx) => {
          const num = idx + 1;
          const tag = c.querySelector('.section-diamond-tag');
          if (tag) tag.textContent = `🔷 ${num}`;
        });
      }
    }
  };

  window.studioChangeQuestionType = function(selectEl) {
    const card = selectEl.closest('.studio-quiz-item-card');
    if (!card) return;
    const type = selectEl.value;
    const corCol = card.querySelector('.sqic-correct-col');
    const tfWrap = card.querySelector('.sqic-tf-wrap');
    const saWrap = card.querySelector('.sqic-sa-wrap');

    if (corCol) corCol.style.display = (type === 'single_choice') ? '' : 'none';
    if (tfWrap) tfWrap.style.display = (type === 'true_false') ? 'block' : 'none';
    if (saWrap) saWrap.style.display = (type === 'short_answer') ? 'block' : 'none';
  };

  // -------------------------------------------------------------
  // ĐIỀU HƯỚNG MỤC SÂN KHẤU & GÓI ĐỀ HỌC SINH (STAGE SECTION & STUDENT STEPPER)
  // -------------------------------------------------------------
  window.stageSelectSection = function(secNum) {
    STORE.setState({ currentSection: secNum });
    if (APP.renderStageSectionNav) APP.renderStageSectionNav();
    if (APP.renderDynamicStagePipeline) APP.renderDynamicStagePipeline();
    SYNC_BUS.broadcast('SECTION_CHANGE', { currentSection: secNum });
    safeFirebaseUpdate('activeSession', { currentSection: secNum }).catch(err => console.warn('[Firebase Sync Warning]:', err?.message || err));
  };

  window.studentQuizGoTo = function(idx) {
    STORE.setState({ studentQuizIndex: idx });
    APP.renderStudentWorkspace(STORE.getState());
  };

  window.studentQuizNext = function() {
    const s = STORE.getState();
    const curIdx = s.studentQuizIndex || 0;
    window.studentQuizGoTo(curIdx + 1);
  };

  window.studentQuizPrev = function() {
    const s = STORE.getState();
    const curIdx = s.studentQuizIndex || 0;
    window.studentQuizGoTo(Math.max(0, curIdx - 1));
  };

  window.studentQuizSubmitPacket = function() {
    const s = STORE.getState();
    if (s.quizPacketSubmitted) return;

    const lesson = s.lessonData || APP.getLesson(s.lessonId) || {};
    const curSec = s.currentSection || 1;
    let quizzesList = s.packetQuizzes;
    if (!quizzesList || quizzesList.length === 0) {
      if (lesson && lesson.sections && lesson.sections[curSec - 1]) {
        const secObj = lesson.sections[curSec - 1];
        if (secObj.quizzes && secObj.quizzes.length > 0) quizzesList = secObj.quizzes;
        else if (secObj.quiz) quizzesList = [secObj.quiz];
      }
      if (!quizzesList || quizzesList.length === 0) {
        if (lesson && lesson.quizzes) quizzesList = lesson.quizzes;
        else if (lesson && lesson.quiz) quizzesList = [lesson.quiz];
      }
    }
    if (!quizzesList || quizzesList.length === 0) return;

    const packetAns = s.studentPacketAnswers || {};
    const answeredCount = Object.keys(packetAns).length;
    const total = quizzesList.length;

    if (answeredCount < total) {
      const cfm = confirm(`Hai em mới trả lời ${answeredCount}/${total} câu hỏi. Có chắc chắn muốn nộp bài gói trắc nghiệm ngay bây giờ không?`);
      if (!cfm) return;
    }

    // Chấm điểm từng câu
    let correctCount = 0;
    quizzesList.forEach((q, idx) => {
      const userAns = packetAns[idx];
      const qType = q.type || 'single_choice';
      if (qType === 'single_choice') {
        if (userAns === (q.correct || 'B')) correctCount++;
      } else if (qType === 'short_answer') {
        if (userAns && String(userAns).trim().toLowerCase() === String(q.shortAnswer || '').trim().toLowerCase()) correctCount++;
      } else if (qType === 'true_false') {
        if (userAns && q.subItems) {
          let allOk = true;
          const parts = String(userAns).split(', ');
          parts.forEach(p => {
            const [rKey, valStr] = p.split(':');
            const sub = q.subItems.find(it => it.id === rKey);
            if (sub) {
              const exp = sub.correct ? 'Đ' : 'S';
              if (valStr !== exp) allOk = false;
            }
          });
          if (allOk && parts.length === q.subItems.length) correctCount++;
        }
      }
    });

    const isAllCorrect = (correctCount === total);
    const mId = s.machineId || 1;
    const stuList = (s.students && s.students.length > 0) ? s.students : [`Máy ${mId}`];
    const nowTs = Date.now();
    const summaryStr = `Đúng ${correctCount}/${total} câu`;

    const newAnswers = Object.assign({}, s.quizAnswers || {});
    newAnswers[mId] = {
      machineId: mId,
      students: stuList,
      choice: summaryStr,
      isCorrect: isAllCorrect,
      totalCorrect: correctCount,
      totalQuestions: total,
      packetAnswers: packetAns,
      timestamp: nowTs
    };

    STORE.setState({
      quizPacketSubmitted: true,
      quizAnswered: true,
      quizSelection: summaryStr,
      quizAnswers: newAnswers
    });

    if (mId) {
      safeFirebaseSet(`activeSession/quizAnswers/${mId}`, {
        machineId: mId,
        students: stuList,
        choice: summaryStr,
        isCorrect: isAllCorrect,
        totalCorrect: correctCount,
        totalQuestions: total,
        timestamp: nowTs
      }).catch(err => console.warn('[Firebase Sync Warning]:', err?.message || err));
    }

    SYNC_BUS.broadcast('QUIZ_ANSWER', {
      machineId: mId,
      students: stuList,
      choice: summaryStr,
      isCorrect: isAllCorrect,
      totalCorrect: correctCount,
      totalQuestions: total,
      timestamp: nowTs
    });

    if (isAllCorrect && typeof confetti === 'function') {
      try { confetti({ particleCount: 100, spread: 80, origin: { y: 0.6 } }); } catch (err) { console.warn("[Handled Error Warning]:", err?.message || err); }
    }

    APP.renderStudentWorkspace(STORE.getState());
  };

  window.onSelectDesk = window.onSelectMachine = function(num) {
    APP.onSelectMachine(num);
  };

  // Khởi động ứng dụng khi DOM sẵn sàng
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => APP.init());
  } else {
    APP.init();
  }

})();


