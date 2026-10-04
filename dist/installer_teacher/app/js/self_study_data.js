/**
 * CVALMS PRO - BUILT-IN OFFLINE/STATIC LESSONS DATABASE
 * Automatically provides fallback when fetch() is blocked by CORS (file://) or CDN issues.
 */
(function() {
  'use strict';
  window.CVALMS_EMBEDDED_MANIFEST = {
  "version": "1.0.0",
  "updatedAt": "2026-10-04T10:00:00Z",
  "grades": [
    {
      "grade": "6",
      "gradeTitle": "Tin học 6 (Kết nối tri thức)",
      "lessons": [
        {
          "id": "tin6_bai12",
          "unit": "Chủ đề E: Ứng dụng tin học",
          "title": "Bài 12: Thuật toán và Sơ đồ khối",
          "duration": "35 phút",
          "file": "tin6_bai12.json"
        }
      ]
    },
    {
      "grade": "7",
      "gradeTitle": "Tin học 7 (Kết nối tri thức)",
      "lessons": [
        {
          "id": "tin7_bai3",
          "unit": "Chủ đề A: Máy tính và cộng đồng",
          "title": "Bài 3: Quản lý tệp và thư mục trong máy tính",
          "duration": "35 phút",
          "file": "tin7_bai3.json"
        }
      ]
    },
    {
      "grade": "8",
      "gradeTitle": "Tin học 8 (Kết nối tri thức)",
      "lessons": [
        {
          "id": "tin8_bai2",
          "unit": "Chủ đề F: Giải quyết vấn đề với sự trợ giúp của máy tính",
          "title": "Bài 2: Cấu trúc lặp và vòng lặp trong thuật toán",
          "duration": "40 phút",
          "file": "tin8_bai2.json"
        }
      ]
    },
    {
      "grade": "9",
      "gradeTitle": "Tin học 9 (Kết nối tri thức)",
      "lessons": [
        {
          "id": "tin9_bai1",
          "unit": "Chủ đề A: Máy tính và xã hội tri thức",
          "title": "Bài 1: Mạng máy tính và dịch vụ Internet",
          "duration": "40 phút",
          "file": "tin9_bai1.json"
        }
      ]
    }
  ]
};

  window.CVALMS_EMBEDDED_LESSONS = {
  "tin6_bai12": {
    "id": "tin6_bai12",
    "grade": 6,
    "unit": "Chủ đề E: Ứng dụng tin học",
    "title": "Bài 12: Thuật toán và Sơ đồ khối",
    "duration": "35 phút",
    "step1_objectives": {
      "title": "Mục Tiêu Bài Học & Yêu Cầu Cần Đạt",
      "items": [
        "Nêu được khái niệm thuật toán là một dãy các chỉ dẫn từng bước rõ ràng.",
        "Mô tả được thuật toán đơn giản bằng cách liệt kê các bước hoặc vẽ sơ đồ khối.",
        "Nhận biết được ý nghĩa của các hình khối quy ước: Bắt đầu/Kết thúc, Thao tác, Điều kiện rẽ nhánh.",
        "Phát hiện và sửa được lỗi sai trong một quy trình thuật toán quen thuộc."
      ]
    },
    "step2_theory": {
      "title": "Khám Phá Kiến Thức Trọng Tâm (Theo SGK)",
      "media": {
        "type": "video",
        "url": "https://www.youtube.com/watch?v=k4S_f3p82kM",
        "caption": "Video bài giảng: Khái niệm thuật toán và Sơ đồ khối (Tin học 6 - Kết nối tri thức)"
      },
      "sections": [
        {
          "heading": "1. Khái niệm thuật toán",
          "content": "Thuật toán là một dãy các chỉ dẫn rõ ràng, có thứ tự, nhằm giải quyết một vấn đề hay nhiệm vụ cụ thể. Khi thực hiện đầy đủ các chỉ dẫn đó theo đúng trình tự từ đầu vào (Input), ta sẽ luôn thu được kết quả đầu ra (Output) mong muốn.",
          "infographicCards": [
            {
              "title": "Tính dừng",
              "desc": "Thuật toán bắt buộc phải kết thúc sau một số hữu hạn bước, không bao giờ lặp vô tận.",
              "color": "#38bdf8"
            },
            {
              "title": "Tính rõ ràng",
              "desc": "Mỗi bước chỉ dẫn phải đơn nghĩa, chính xác, máy tính hay con người đều hiểu duy nhất một nghĩa.",
              "color": "#10b981"
            },
            {
              "title": "Tính đúng đắn",
              "desc": "Khi cung cấp dữ liệu đầu vào hợp lệ, thuật toán luôn cho ra kết quả chuẩn xác theo yêu cầu.",
              "color": "#f59e0b"
            }
          ]
        },
        {
          "heading": "2. Hai cách mô tả thuật toán phổ biến",
          "content": "Trong thực tế và lập trình, người ta dùng 2 cách chính để diễn đạt thuật toán:\n- **Liệt kê từng bước**: Dùng ngôn ngữ tự nhiên để trình bày tuần tự các thao tác (Bước 1, Bước 2, Bước 3...).\n- **Sơ đồ khối (Flowchart)**: Dùng các hình khối đồ họa chuẩn quốc tế kèm các mũi tên chỉ hướng đi của dữ liệu. Cách này giúp người xem nhìn tổng quan trực quan và phát hiện lỗi logic nhanh chóng."
        },
        {
          "heading": "3. Quy ước các hình khối trong Sơ đồ khối",
          "content": "- **Hình Elip (Oval)**: Đánh dấu điểm **BẮT ĐẦU** hoặc **KẾT THÚC** của thuật toán.\n- **Hình Chữ nhật**: Biểu diễn một **THAO TÁC XỬ LÝ** (tính toán, gán giá trị, hành động thực thi).\n- **Hình Thoi**: Biểu diễn việc **KIỂM TRA ĐIỀU KIỆN** (cho ra 2 nhánh: ĐÚNG hoặc SAI).\n- **Hình Bình hành**: Dùng cho thao tác **NHẬP DỮ LIỆU (Input)** hoặc **XUẤT KẾT QUẢ (Output)**.\n- **Mũi tên**: Chỉ hướng thực hiện tiếp theo giữa các khối."
        }
      ]
    },
    "step3_notebook": {
      "title": "Kiến Thức Cốt Lõi Em Ghi Vào Vở",
      "points": [
        "1. Thuật toán là một dãy các chỉ dẫn rõ ràng, tuần tự để giải quyết một nhiệm vụ cụ thể từ Input ra Output.",
        "2. Hai cách mô tả: Liệt kê các bước bằng ngôn ngữ tự nhiên hoặc Vẽ Sơ đồ khối.",
        "3. Ba tính chất cốt lõi: Tính dừng, Tính rõ ràng, Tính đúng đắn.",
        "4. Quy ước sơ đồ khối: Hình Elip (Bắt đầu/Kết thúc), Hình chữ nhật (Xử lý/Tính toán), Hình thoi (Điều kiện rẽ nhánh), Hình bình hành (Vào/Ra dữ liệu)."
      ]
    },
    "step4_practice": {
      "title": "Thử Thách Luyện Tập & Chốt Kiến Thức",
      "cloze": {
        "text": "Thuật toán là một dãy các chỉ dẫn",
        "blank": "từng bước rõ ràng",
        "options": [
          "tùy hứng ngẫu nhiên",
          "từng bước rõ ràng",
          "phức tạp khó hiểu",
          "không có thứ tự"
        ],
        "explanation": "Chính xác! Thuật toán bắt buộc phải gồm các chỉ dẫn từng bước rõ ràng để máy tính hoặc con người có thể thực thi chính xác."
      },
      "quizzes": [
        {
          "type": "single_choice",
          "question": "Trong sơ đồ khối, hình chữ nhật biểu thị thao tác nào?",
          "options": [
            "A. Bắt đầu hoặc kết thúc thuật toán",
            "B. Thực hiện một phép tính hoặc thao tác xử lý",
            "C. Kiểm tra điều kiện so sánh để rẽ nhánh",
            "D. Nhập dữ liệu từ bàn phím"
          ],
          "correctIndex": 1,
          "explanation": "Đúng! Hình chữ nhật quy ước cho các lệnh xử lý, tính toán hoặc gán giá trị."
        },
        {
          "type": "single_choice",
          "question": "Tính chất nào sau đây đảm bảo thuật toán không bị lặp vô tận?",
          "options": [
            "A. Tính rõ ràng",
            "B. Tính dừng",
            "C. Tính khả thi",
            "D. Tính thẩm mỹ"
          ],
          "correctIndex": 1,
          "explanation": "Chính xác! Tính dừng đảm bảo thuật toán phải kết thúc sau một số bước hữu hạn."
        }
      ]
    }
  },
  "tin7_bai3": {
    "id": "tin7_bai3",
    "grade": 7,
    "unit": "Chủ đề 2: Tổ chức lưu trữ, tìm kiếm và trao đổi thông tin",
    "title": "Bài 3: Quản lý tệp và thư mục trong máy tính",
    "duration": "35 phút",
    "step1_objectives": {
      "title": "Mục Tiêu Bài Học & Yêu Cầu Cần Đạt",
      "items": [
        "Giải thích được cấu trúc hình cây của hệ thống tệp và thư mục.",
        "Phân biệt được đường dẫn tương đối và đường dẫn tuyệt đối.",
        "Thực hiện thành thạo các thao tác tạo mới, đổi tên, sao chép, di chuyển và xóa tệp/thư mục an toàn."
      ]
    },
    "step2_theory": {
      "title": "Khám Phá Kiến Thức Trọng Tâm (Theo SGK)",
      "media": {
        "type": "video",
        "url": "https://www.youtube.com/watch?v=L2GjH-m8_nU",
        "caption": "Video bài giảng: Quản lý tệp và thư mục trong hệ thống máy tính (Tin học 7)"
      },
      "sections": [
        {
          "heading": "1. Cấu trúc cây thư mục (Directory Tree)",
          "content": "Hệ điều hành tổ chức lưu trữ thông tin trên đĩa dưới dạng **cây phân cấp**. Gốc của cây là các ổ đĩa (C:, D:...). Trong ổ đĩa có thể chứa các tệp và thư mục con. Thư mục con lại có thể chứa tiếp các thư mục và tệp khác.",
          "infographicCards": [
            {
              "title": "Thư mục gốc (Root)",
              "desc": "Là vị trí cao nhất trong phân cấp ổ đĩa (Ví dụ C:\\ hoặc D:\\).",
              "color": "#38bdf8"
            },
            {
              "title": "Thư mục con (Subfolder)",
              "desc": "Thư mục nằm bên trong một thư mục khác, giúp phân loại dữ liệu khoa học.",
              "color": "#10b981"
            },
            {
              "title": "Tệp tin (File)",
              "desc": "Đơn vị lưu trữ cơ bản gồm Tên tệp và Phần mở rộng (Ví dụ: baihoc.docx, video.mp4).",
              "color": "#f59e0b"
            }
          ]
        },
        {
          "heading": "2. Đường dẫn (Path)",
          "content": "Đường dẫn là dãy tên các thư mục lồng nhau cách nhau bởi dấu gạch chéo ngược (\\), bắt đầu từ thư mục gốc cho đến tệp/thư mục đích. Ví dụ: D:\\HocTap\\TinHoc7\\Bai3.docx."
        }
      ]
    },
    "step3_notebook": {
      "title": "Kiến Thức Cốt Lõi Em Ghi Vào Vở",
      "points": [
        "1. Tệp tin gồm 2 phần: Tên tệp và Phần mở rộng (đuôi tệp), ngăn cách nhau bởi dấu chấm.",
        "2. Hệ điều hành quản lý tệp và thư mục theo cấu trúc hình cây phân cấp.",
        "3. Đường dẫn chỉ ra lộ trình định vị chính xác vị trí của tệp trên ổ đĩa máy tính.",
        "4. Cần đặt tên tệp/thư mục ngắn gọn, gợi nhớ, không dùng các ký tự đặc biệt bị cấm: \\ / : * ? \" < > |"
      ]
    },
    "step4_practice": {
      "title": "Thử Thách Luyện Tập & Chốt Kiến Thức",
      "cloze": {
        "text": "Hệ điều hành quản lý dữ liệu trên đĩa theo cấu trúc",
        "blank": "hình cây phân cấp",
        "options": [
          "hình cây phân cấp",
          "hỗn loạn ngẫu nhiên",
          "vòng tròn khép kín",
          "đường thẳng một chiều"
        ],
        "explanation": "Chính xác! Cấu trúc cây giúp quản lý hàng triệu tệp tin một cách ngăn nắp và truy xuất nhanh chóng."
      },
      "quizzes": [
        {
          "type": "single_choice",
          "question": "Phần mở rộng (đuôi tệp) của tệp tin dùng để làm gì?",
          "options": [
            "A. Giúp hệ điều hành nhận biết kiểu tệp và chọn phần mềm mở thích hợp",
            "B. Quy định dung lượng của tệp tin",
            "C. Xác định ngày tạo của tệp tin",
            "D. Để làm cho tên tệp dài hơn"
          ],
          "correctIndex": 0,
          "explanation": "Đúng! Phần mở rộng (như .docx, .xlsx, .mp4, .png) báo cho HĐH biết định dạng dữ liệu."
        },
        {
          "type": "single_choice",
          "question": "Ký tự nào sau đây KHÔNG ĐƯỢC PHÉP xuất hiện trong tên tệp trên hệ điều hành Windows?",
          "options": [
            "A. Dấu gạch ngang (-)",
            "B. Dấu gạch dưới (_)",
            "C. Dấu hai chấm (:)",
            "D. Dấu chấm (.)"
          ],
          "correctIndex": 2,
          "explanation": "Chính xác! Windows cấm các ký tự đặc biệt hệ thống: \\ / : * ? \" < > |"
        }
      ]
    }
  },
  "tin8_bai2": {
    "id": "tin8_bai2",
    "grade": 8,
    "unit": "Chủ đề F: Giải quyết vấn đề với sự trợ giúp của máy tính",
    "title": "Bài 2: Cấu trúc lặp và vòng lặp trong thuật toán",
    "duration": "40 phút",
    "step1_objectives": {
      "title": "Mục Tiêu Bài Học & Yêu Cầu Cần Đạt",
      "items": [
        "Nhận biết được câu lệnh lặp với số lần biết trước và lặp với số lần chưa biết trước.",
        "Mô tả được hoạt động của lệnh lặp qua sơ đồ khối và đoạn mã trực quan.",
        "Viết được thuật toán lặp giải quyết bài toán tính tổng, đếm số trong thực tế."
      ]
    },
    "step2_theory": {
      "title": "Khám Phá Kiến Thức Trọng Tâm (Theo SGK)",
      "media": {
        "type": "video",
        "url": "https://www.youtube.com/watch?v=wXhLpD71m94",
        "caption": "Video bài giảng: Cấu trúc lặp và vòng lặp trong lập trình (Tin học 8)"
      },
      "sections": [
        {
          "heading": "1. Cấu trúc lặp trong cuộc sống và máy tính",
          "content": "Trong đời sống, nhiều hành động được lặp lại: kim đồng hồ quay, học sinh đi học mỗi ngày... Trong tin học, **cấu trúc lặp** là cấu trúc điều khiển cho phép thực hiện lặp đi lặp lại một nhóm thao tác nhất định.",
          "infographicCards": [
            {
              "title": "Lặp biết trước số lần",
              "desc": "Số lần lặp được xác định cụ thể trước khi thực hiện (Ví dụ: Chạy 5 vòng sân, tính tổng 100 số).",
              "color": "#38bdf8"
            },
            {
              "title": "Lặp chưa biết trước",
              "desc": "Số lần lặp phụ thuộc vào một điều kiện. Thao tác tiếp tục lặp khi điều kiện còn đúng và dừng khi điều kiện sai.",
              "color": "#10b981"
            }
          ]
        }
      ]
    },
    "step3_notebook": {
      "title": "Kiến Thức Cốt Lõi Em Ghi Vào Vở",
      "points": [
        "1. Vòng lặp giúp ngắn gọn mã nguồn, tối ưu hóa thuật toán và tự động hóa các thao tác lặp lại.",
        "2. Có 2 dạng lặp cơ bản: Lặp với số lần biết trước (For/Repeat n) và Lặp với số lần chưa biết trước (While)."
      ]
    },
    "step4_practice": {
      "title": "Thử Thách Luyện Tập & Chốt Kiến Thức",
      "cloze": {
        "text": "Vòng lặp chưa biết trước số lần sẽ tiếp tục thực hiện khi",
        "blank": "điều kiện lặp còn đúng",
        "options": [
          "điều kiện lặp còn đúng",
          "máy tính hết pin",
          "người dùng nhấn phím tắt",
          "sau đúng 10 vòng"
        ],
        "explanation": "Chính xác! Khi điều kiện kiểm tra không còn thỏa mãn (Sai), vòng lặp sẽ lập tức kết thúc."
      },
      "quizzes": [
        {
          "type": "single_choice",
          "question": "Trường hợp nào sau đây là cấu trúc lặp với số lần BIẾT TRƯỚC?",
          "options": [
            "A. Học từ vựng cho đến khi thuộc lòng",
            "B. Đếm từ 1 đến 100 và in ra các số chẵn",
            "C. Đạp xe cho đến khi trời đổ mưa",
            "D. Chờ đến khi có tin nhắn mới"
          ],
          "correctIndex": 1,
          "explanation": "Đúng! Đếm từ 1 đến 100 là vòng lặp có số lần xác định trước chính xác là 100 lần."
        }
      ]
    }
  },
  "tin9_bai1": {
    "id": "tin9_bai1",
    "grade": 9,
    "unit": "Chủ đề A: Máy tính và xã hội tri thức",
    "title": "Bài 1: Mạng máy tính và dịch vụ Internet",
    "duration": "40 phút",
    "step1_objectives": {
      "title": "Mục Tiêu Bài Học & Yêu Cầu Cần Đạt",
      "items": [
        "Hiểu được các thành phần chính của mạng máy tính (thiết bị đầu cuối, thiết bị kết nối, đường truyền).",
        "Phân biệt được mạng cục bộ (LAN) và mạng diện rộng (WAN).",
        "Nêu được lợi ích to lớn của việc kết nối mạng và chia sẻ tài nguyên trong phòng máy nhà trường."
      ]
    },
    "step2_theory": {
      "title": "Khám Phá Kiến Thức Trọng Tâm (Theo SGK)",
      "media": {
        "type": "video",
        "url": "https://www.youtube.com/watch?v=7_LPdttKXPc",
        "caption": "Video bài giảng: Tổng quan mạng máy tính và xa lộ thông tin Internet (Tin học 9)"
      },
      "sections": [
        {
          "heading": "1. Mạng máy tính là gì?",
          "content": "Mạng máy tính là tập hợp các máy tính và thiết bị được kết nối với nhau theo một phương thức nào đó nhằm trao đổi dữ liệu và chia sẻ tài nguyên phần cứng (máy in, ổ cứng) cũng như tài nguyên phần mềm.",
          "infographicCards": [
            {
              "title": "Thiết bị đầu cuối",
              "desc": "Máy tính bàn, Laptop, Điện thoại, Máy in mạng gửi và nhận dữ liệu.",
              "color": "#38bdf8"
            },
            {
              "title": "Thiết bị kết nối",
              "desc": "Switch, Router, Access Point (Wifi), Modem điều phối đường truyền.",
              "color": "#10b981"
            },
            {
              "title": "Đường truyền dữ liệu",
              "desc": "Cáp xoắn đôi (Cáp LAN UTP), Cáp quang, Sóng vô tuyến (Wifi, 4G/5G).",
              "color": "#f59e0b"
            }
          ]
        }
      ]
    },
    "step3_notebook": {
      "title": "Kiến Thức Cốt Lõi Em Ghi Vào Vở",
      "points": [
        "1. Mạng LAN (Local Area Network): Mạng cục bộ phạm vi hẹp như phòng máy trường học, văn phòng.",
        "2. Mạng WAN (Wide Area Network): Mạng diện rộng kết nối các mạng LAN trên phạm vi toàn cầu (Internet).",
        "3. Ba thành phần mạng: Thiết bị đầu cuối, Thiết bị kết nối trung gian, và Môi trường truyền dẫn."
      ]
    },
    "step4_practice": {
      "title": "Thử Thách Luyện Tập & Chốt Kiến Thức",
      "cloze": {
        "text": "Mạng máy tính trong phòng thực hành Tin học của trường em là mạng",
        "blank": "cục bộ LAN",
        "options": [
          "cục bộ LAN",
          "diện rộng WAN",
          "toàn cầu Internet",
          "vệ tinh không gian"
        ],
        "explanation": "Chính xác! Phòng máy thực hành nhà trường kết nối trong phạm vi một phòng học nên là mạng LAN."
      },
      "quizzes": [
        {
          "type": "single_choice",
          "question": "Thiết bị nào sau đây đóng vai trò trung tâm kết nối các máy tính trong phòng máy LAN qua cáp mạng?",
          "options": [
            "A. Switch (Bộ chuyển mạch)",
            "B. Chuột máy tính",
            "C. Máy quét Scanner",
            "D. Màn hình máy tính"
          ],
          "correctIndex": 0,
          "explanation": "Đúng! Switch là thiết bị chuyển mạch trung tâm kết nối các máy tính trạm với nhau."
        }
      ]
    }
  }
};
})();
