# backend/knowledge_base.py
"""
Knowledge Base toàn diện cho LaptopStore chatbot.
Bao gồm: thông tin cửa hàng, chính sách, tư vấn kỹ thuật, so sánh hãng...
"""

KNOWLEDGE_BASE = [

    # ══════════════════════════════════════════
    # THÔNG TIN CỬA HÀNG
    # ══════════════════════════════════════════
    {
        "id": "shop_intro",
        "topic": "giới thiệu cửa hàng laptopstore",
        "content": """LaptopStore là hệ thống bán laptop chính hãng uy tín hàng đầu Việt Nam.
- Hơn 500+ sản phẩm từ các thương hiệu hàng đầu thế giới
- Hơn 10.000 khách hàng hài lòng
- Cam kết hàng chính hãng 100%, có tem phân phối chính thức
- Hỗ trợ kỹ thuật 24/7
- Hotline: 1800-1234 (miễn phí)
- Email: support@laptopstore.vn
- Địa chỉ: Hà Nội, Việt Nam
- Giờ làm việc: 8:00 - 21:00 (Thứ 2 - Chủ nhật)"""
    },

    # ══════════════════════════════════════════
    # CHÍNH SÁCH
    # ══════════════════════════════════════════
    {
        "id": "policy_warranty",
        "topic": "bảo hành chính sách bảo hành thời gian bảo hành",
        "content": """Chính sách bảo hành LaptopStore:
- Bảo hành chính hãng theo hãng: 12-24 tháng tùy sản phẩm
- Apple MacBook: 12 tháng chính hãng Apple VN/A
- ASUS, Dell, HP, Lenovo: 12-24 tháng
- MSI Gaming: 24 tháng
- Bảo hành tại nhà trong vòng 24h (nội thành Hà Nội)
- Hỗ trợ kỹ thuật 24/7 qua hotline 1800-1234
- Mang máy đến cửa hàng hoặc gọi hotline để được hỗ trợ
- Bảo hành không áp dụng: vỡ màn, ngấm nước, tự ý sửa chữa ngoài"""
    },
    {
        "id": "policy_return",
        "topic": "đổi trả hoàn tiền trả hàng lỗi",
        "content": """Chính sách đổi trả LaptopStore:
- 7 ngày đổi trả miễn phí nếu sản phẩm có lỗi nhà sản xuất
- 30 ngày đổi sang sản phẩm tương đương nếu lỗi phần cứng
- Hoàn tiền 100% nếu hết hàng hoặc không có hàng thay thế
- Điều kiện đổi trả: còn nguyên hộp, phụ kiện đầy đủ, không có vết xước
- Liên hệ hotline 1800-1234 hoặc email để được hướng dẫn
- Phí vận chuyển đổi trả: LaptopStore chịu nếu lỗi từ cửa hàng"""
    },
    {
        "id": "policy_shipping",
        "topic": "giao hàng vận chuyển ship phí ship thời gian giao",
        "content": """Chính sách giao hàng LaptopStore:
- Miễn phí giao hàng toàn quốc cho đơn từ 5 triệu đồng
- Đơn dưới 5 triệu: phí ship 30.000đ - 50.000đ tùy khu vực
- Nội thành Hà Nội: giao trong ngày (đặt trước 14:00)
- Toàn quốc: 1-3 ngày làm việc
- Tỉnh vùng sâu: 3-5 ngày
- Có thể theo dõi đơn hàng qua mục "Đơn hàng" trên website
- Đối tác vận chuyển: GHN, GHTK, Viettel Post"""
    },
    {
        "id": "policy_payment",
        "topic": "thanh toán trả góp phương thức thanh toán cod chuyển khoản",
        "content": """Phương thức thanh toán tại LaptopStore:
- COD: thanh toán tiền mặt khi nhận hàng
- Chuyển khoản ngân hàng: Vietcombank, Techcombank, MB Bank
- Ví điện tử: MoMo, ZaloPay, VNPay
- Thẻ tín dụng/ghi nợ: Visa, Mastercard, JCB
- Trả góp 0% lãi suất: VIB, TPBank, Sacombank, Shinhan Bank
  + Kỳ hạn: 6, 9, 12, 18, 24 tháng
  + Điều kiện: đơn từ 3 triệu, có CCCD và thẻ tín dụng
- Trả góp qua Home Credit, FE Credit (không cần thẻ tín dụng)"""
    },
    {
        "id": "policy_buy",
        "topic": "cách mua hàng đặt hàng hướng dẫn mua",
        "content": """Hướng dẫn mua hàng tại LaptopStore:
1. Chọn sản phẩm: Duyệt danh mục hoặc dùng thanh tìm kiếm
2. Xem chi tiết: đọc thông số, đánh giá của khách hàng
3. Thêm vào giỏ hàng: nhấn nút "Thêm vào giỏ"
4. Kiểm tra giỏ hàng: chỉnh số lượng nếu cần
5. Nhập thông tin: họ tên, số điện thoại, địa chỉ giao hàng
6. Chọn phương thức thanh toán
7. Đặt hàng: nhấn xác nhận và chờ email/SMS xác nhận
- Có thể đặt hàng không cần tài khoản
- Đăng ký tài khoản để theo dõi đơn hàng và nhận ưu đãi"""
    },
    {
        "id": "policy_promo",
        "topic": "khuyến mãi ưu đãi giảm giá voucher coupon",
        "content": """Chương trình ưu đãi tại LaptopStore:
- Flash Sale hàng ngày: giảm đến 30% sản phẩm chọn lọc
- Thành viên mới: giảm 200.000đ đơn đầu tiên khi đăng ký
- Giới thiệu bạn bè: tặng 100.000đ mỗi lần giới thiệu thành công
- Sinh nhật: voucher 5% cho thành viên
- Mua combo laptop + phụ kiện: giảm thêm 3-5%
- Tặng kèm: túi chống sốc, chuột không dây khi mua laptop
- Theo dõi fanpage Facebook để cập nhật deal mới nhất"""
    },

    # ══════════════════════════════════════════
    # TƯ VẤN KỸ THUẬT - CPU
    # ══════════════════════════════════════════
    {
        "id": "tech_cpu_intel",
        "topic": "CPU Intel Core i3 i5 i7 i9 chip xử lý bộ vi xử lý",
        "content": """Hướng dẫn chọn CPU Intel cho laptop:
- Core i3 (thế hệ 12-13): phù hợp văn phòng cơ bản, lướt web, xem phim. Giá từ 8-12 triệu
- Core i5 (thế hệ 12-13): cân bằng tốt, dùng cho hầu hết nhu cầu. Giá 12-20 triệu
- Core i7 (thế hệ 12-13): hiệu năng cao, đa nhiệm tốt, gaming nhẹ đến trung. Giá 18-30 triệu
- Core i9 (thế hệ 12-13): cao cấp nhất, render video, gaming AAA. Giá 30 triệu+
- Thế hệ mới hơn = hiệu năng tốt hơn, tiết kiệm pin hơn
- Nên chọn ít nhất i5 thế hệ 12 trở lên cho trải nghiệm tốt"""
    },
    {
        "id": "tech_cpu_amd",
        "topic": "CPU AMD Ryzen 5 7 chip AMD",
        "content": """Hướng dẫn chọn CPU AMD Ryzen cho laptop:
- Ryzen 3: tương đương Core i3, phù hợp dùng cơ bản
- Ryzen 5 (5000/6000/7000 series): cạnh tranh với Core i5, rất tốt cho tiền
- Ryzen 7: tương đương Core i7, đa nhiệm mạnh, gaming tốt
- Ryzen 9: hiệu năng đỉnh cao, render, AI, gaming AAA
- AMD Ryzen 7000 series: kiến trúc mới nhất, tiết kiệm pin tốt
- So với Intel: AMD thường cho hiệu năng/giá tốt hơn
- AMD có GPU tích hợp Radeon mạnh hơn Intel Iris"""
    },
    {
        "id": "tech_cpu_apple",
        "topic": "chip Apple M1 M2 M3 MacBook",
        "content": """Chip Apple Silicon cho MacBook:
- M1: ra mắt 2020, hiệu năng vượt trội so với Intel, pin 15-18h
- M2: cải tiến 18-20% so với M1, ra mắt 2022
- M3: chip 3nm mới nhất (2023), nhanh hơn M2 khoảng 20-35%
- M1 Pro/Max/Ultra: dành cho MacBook Pro, hiệu năng GPU rất mạnh
- Điểm mạnh: pin cực trâu, không nóng, không quạt (Air), hiệu năng/watt tốt nhất
- Hạn chế: không chạy game Windows native, RAM/SSD không nâng cấp được
- Phù hợp: lập trình, video editing, thiết kế, văn phòng cao cấp"""
    },

    # ══════════════════════════════════════════
    # TƯ VẤN KỸ THUẬT - RAM
    # ══════════════════════════════════════════
    {
        "id": "tech_ram",
        "topic": "RAM bộ nhớ 8GB 16GB 32GB DDR4 DDR5",
        "content": """Hướng dẫn chọn RAM cho laptop:
- 8GB: đủ dùng cho văn phòng, lướt web, xem phim. Tối thiểu năm 2024
- 16GB: khuyến nghị cho đa nhiệm, lập trình, gaming nhẹ-trung
- 32GB: cần thiết cho video editing 4K, render 3D, máy ảo, gaming AAA
- 64GB+: chuyên nghiệp cao cấp, data science, streaming
- DDR4: phổ biến, ổn định, giá rẻ hơn
- DDR5: thế hệ mới, nhanh hơn 40-50%, tiêu thụ điện ít hơn
- Lưu ý: nhiều laptop hàn chết RAM, không nâng cấp được - nên chọn đủ ngay từ đầu
- RAM dual channel (2 thanh) nhanh hơn single channel ~15-20%"""
    },

    # ══════════════════════════════════════════
    # TƯ VẤN KỸ THUẬT - MÀN HÌNH
    # ══════════════════════════════════════════
    {
        "id": "tech_display",
        "topic": "màn hình display IPS OLED 144Hz 60Hz độ phân giải FHD 2K 4K",
        "content": """Hướng dẫn chọn màn hình laptop:
ĐỘ PHÂN GIẢI:
- FHD (1920x1080): phổ biến, đủ dùng, tiết kiệm pin
- 2K/QHD (2560x1440): sắc nét hơn, tốt cho thiết kế
- 4K (3840x2160): cực sắc nét nhưng hao pin và giá cao

TẦN SỐ QUÉT:
- 60Hz: đủ cho văn phòng, xem phim
- 120-144Hz: gaming mượt mà, chuyển động mượt
- 165-360Hz: pro gaming, cần GPU mạnh

CÔNG NGHỆ TẤM NỀN:
- IPS: màu sắc tốt, góc nhìn rộng - phổ biến nhất
- OLED: màu đen sâu, màu sắc rực rỡ nhất, nhưng giá cao
- TN: phản hồi nhanh cho gaming nhưng màu kém
- VA: tương phản cao, màu tốt hơn TN

ĐỘ PHỦ MÀU:
- sRGB 100%: tiêu chuẩn tốt cho thiết kế cơ bản
- DCI-P3 90%+: cần cho đồ họa chuyên nghiệp, video editing"""
    },

    # ══════════════════════════════════════════
    # TƯ VẤN KỸ THUẬT - GPU/CARD ĐỒ HỌA
    # ══════════════════════════════════════════
    {
        "id": "tech_gpu",
        "topic": "card đồ họa GPU RTX GTX NVIDIA AMD Radeon",
        "content": """Hướng dẫn chọn GPU cho laptop:
GPU TÍCH HỢP (không cần chơi game):
- Intel Iris Xe: đủ cho văn phòng, video HD
- AMD Radeon Vega/RDNA: mạnh hơn Intel, xử lý được game nhẹ
- Apple GPU (M1/M2/M3): rất mạnh, không cần GPU rời

GPU RỜI NVIDIA (gaming/đồ họa):
- RTX 3050/4050: gaming tầm trung, game AAA 1080p ổn
- RTX 3060/4060: gaming tốt, stream, render nhẹ
- RTX 3070/4070: gaming cao, video editing 4K
- RTX 3080/4080/4090: pro gaming, AI, render chuyên nghiệp

GPU RỜI AMD:
- RX 6600M/6700M: cạnh tranh với RTX 3060/3070
- Ưu điểm: giá rẻ hơn, hỗ trợ FreeSync

LƯU Ý:
- TDP (watts) ảnh hưởng lớn đến hiệu năng thực tế
- Cùng card RTX 4060 nhưng TDP 80W yếu hơn 140W rất nhiều"""
    },

    # ══════════════════════════════════════════
    # TƯ VẤN KỸ THUẬT - PIN
    # ══════════════════════════════════════════
    {
        "id": "tech_battery",
        "topic": "pin battery thời lượng pin sạc nhanh",
        "content": """Hướng dẫn về pin laptop:
THỜI LƯỢNG PIN THỰC TẾ:
- Laptop gaming: 2-4 giờ khi chơi game (có GPU rời)
- Laptop văn phòng: 6-10 giờ làm việc bình thường
- MacBook Air M2/M3: 15-18 giờ
- Ultrabook mỏng nhẹ: 8-12 giờ

YẾU TỐ ẢNH HƯỞNG PIN:
- Độ sáng màn hình (giảm 50% sáng = tăng 30% pin)
- WiFi và Bluetooth bật liên tục
- Ứng dụng nặng chạy ngầm
- Nhiệt độ môi trường

SẠC NHANH:
- USB-C PD: sạc nhanh và tiện lợi
- 65W-140W: sạc nhanh hơn cho laptop gaming
- Nên dùng sạc chính hãng để bảo vệ pin

BẢO QUẢN PIN:
- Không để pin xuống 0% hoặc sạc đầy 100% thường xuyên
- Lý tưởng duy trì 20-80%
- Tuổi thọ pin: 500-1000 chu kỳ"""
    },

    # ══════════════════════════════════════════
    # TƯ VẤN KỸ THUẬT - SSD/HDD
    # ══════════════════════════════════════════
    {
        "id": "tech_storage",
        "topic": "ổ cứng SSD NVMe HDD dung lượng 256GB 512GB 1TB",
        "content": """Hướng dẫn chọn ổ cứng laptop:
LOẠI Ổ CỨNG:
- HDD: rẻ, dung lượng lớn nhưng chậm, dễ hỏng - KHÔNG nên chọn
- SSD SATA: nhanh hơn HDD 5-10 lần, đủ dùng
- SSD NVMe PCIe 3.0: nhanh gấp 3-5 lần SATA
- SSD NVMe PCIe 4.0: nhanh nhất hiện tại, tốc độ đọc 5000-7000MB/s

DUNG LƯỢNG NÊN CHỌN:
- 256GB: quá ít, chỉ đủ hệ điều hành + vài app
- 512GB: đủ cho văn phòng, học tập cơ bản
- 1TB: khuyến nghị cho hầu hết người dùng
- 2TB+: lưu trữ nhiều, content creator, game thủ

LƯU Ý:
- Windows chiếm ~50-60GB sau khi cài đặt
- Nhiều laptop có slot M.2 trống để nâng cấp thêm
- Nên chọn ít nhất 512GB NVMe để trải nghiệm tốt"""
    },

    # ══════════════════════════════════════════
    # TƯ VẤN THEO NHU CẦU
    # ══════════════════════════════════════════
    {
        "id": "use_gaming",
        "topic": "laptop gaming chơi game game thủ",
        "content": """Tư vấn laptop gaming:
CẤU HÌNH TỐI THIỂU CHO GAMING:
- CPU: Core i5 thế hệ 12+ hoặc Ryzen 5 5000+
- GPU: RTX 3050 trở lên
- RAM: 16GB (dual channel)
- Màn hình: 144Hz FHD tối thiểu
- SSD: 512GB NVMe

PHÂN KHÚC GIÁ:
- 15-20 triệu: ASUS TUF/Vivobook Gaming, HP Victus, Lenovo IdeaPad Gaming
  → Game AAA 1080p medium-high settings
- 20-30 triệu: ASUS ROG Strix, Acer Nitro 5/Predator, MSI Katana
  → Game AAA 1080p high-ultra settings
- 30-50 triệu: ASUS ROG Zephyrus, MSI Raider, Alienware
  → Game AAA 1440p/4K ultra
- 50 triệu+: ROG Mothership, Alienware m18
  → Pro gaming, streaming, không giới hạn

THƯƠNG HIỆU UY TÍN CHO GAMING:
- ASUS ROG/TUF: tản nhiệt tốt, đáng tin cậy
- MSI: hiệu năng cao, gaming chuyên nghiệp
- Acer Predator/Nitro: giá tốt cho hiệu năng
- HP Victus: cân bằng giá-hiệu năng"""
    },
    {
        "id": "use_office",
        "topic": "laptop văn phòng làm việc công việc doanh nghiệp",
        "content": """Tư vấn laptop văn phòng:
CẤU HÌNH ĐỀ XUẤT:
- CPU: Core i5/Ryzen 5 thế hệ mới
- RAM: 8-16GB
- SSD: 512GB
- Pin: 8 giờ+ (quan trọng)
- Trọng lượng: dưới 1.8kg lý tưởng
- Màn hình: FHD IPS chống chói

PHÂN KHÚC GIÁ:
- 10-15 triệu: Acer Aspire, ASUS VivoBook, Lenovo IdeaPad
- 15-25 triệu: Dell Inspiron, HP Pavilion, ASUS ZenBook
- 25-40 triệu: Dell XPS, HP Spectre, Lenovo ThinkPad X1 Carbon
- 30 triệu+: MacBook Air M2/M3, ThinkPad X1

THƯƠNG HIỆU TỐT CHO VĂN PHÒNG:
- Lenovo ThinkPad: bàn phím tốt nhất, bền, bảo mật
- Dell XPS: thiết kế đẹp, màn hình chất lượng
- HP EliteBook: doanh nghiệp, bảo mật tốt
- Apple MacBook: hệ sinh thái tốt, pin trâu"""
    },
    {
        "id": "use_student",
        "topic": "laptop sinh viên học sinh học tập giá rẻ",
        "content": """Tư vấn laptop sinh viên:
TIÊU CHÍ CHỌN:
- Giá hợp lý (8-15 triệu)
- Pin trâu (8 giờ+)
- Nhẹ dưới 2kg
- Đủ dùng cho Word, Excel, PowerPoint, lướt web

THEO NGÀNH HỌC:
- Kinh tế/Luật/Văn: Core i3-i5, 8GB RAM, bất kỳ hãng nào
- Công nghệ thông tin: Core i5-i7, 16GB RAM, SSD 512GB+
- Đồ họa/Kiến trúc: Core i7+, GPU rời, màn hình màu tốt (16tr+)
- Y/Dược: Core i5, 8GB RAM đủ dùng

GỢI Ý CỤ THỂ:
- 8-12 triệu: Acer Aspire 3/5, ASUS VivoBook 15, Lenovo IdeaPad Slim 3
- 12-18 triệu: ASUS VivoBook 15 OLED, HP Laptop 15s, Dell Inspiron 15
- Tiết kiệm hơn: xem thêm laptop cũ/refurbished tại cửa hàng"""
    },
    {
        "id": "use_graphics",
        "topic": "laptop đồ họa thiết kế photoshop illustrator after effects premiere render 3D",
        "content": """Tư vấn laptop đồ họa/thiết kế:
CẤU HÌNH CẦN THIẾT:
- CPU: Core i7/i9 hoặc Ryzen 7/9 (đa nhân mạnh)
- GPU: RTX 3060+ hoặc Quadro/AMD Pro (render chuyên nghiệp)
- RAM: 16GB tối thiểu, 32GB lý tưởng
- Màn hình: sRGB 100%, Delta E < 2, IPS hoặc OLED
- SSD: 1TB NVMe (file đồ họa rất nặng)

PHÂN KHÚC:
- 20-30 triệu: ASUS VivoBook Pro, Dell Inspiron 16 Plus
- 30-45 triệu: ASUS ProArt Studiobook, MSI Creator
- 35 triệu+: MacBook Pro M2/M3 Pro (tốt nhất cho designer)

PHẦN MỀM & TƯƠNG THÍCH:
- Adobe Photoshop/Illustrator: Core i5+ là đủ
- After Effects/Premiere: cần i7+, 32GB RAM, GPU tốt
- Blender/Cinema 4D: GPU mạnh quan trọng nhất
- DaVinci Resolve: cần GPU NVIDIA hoặc AMD mạnh"""
    },
    {
        "id": "use_programming",
        "topic": "laptop lập trình code developer kỹ sư phần mềm",
        "content": """Tư vấn laptop cho lập trình viên:
CẤU HÌNH KHUYẾN NGHỊ:
- CPU: Core i5/i7 hoặc Ryzen 5/7 (đa nhân quan trọng)
- RAM: 16GB tối thiểu, 32GB cho chạy máy ảo/Docker
- SSD: 512GB-1TB NVMe (tốc độ build code nhanh hơn)
- Màn hình: FHD/2K, chống chói (ngồi lâu)
- Pin: 8 giờ+ (làm việc không cần cắm sạc)

THEO STACK:
- Web/Mobile (React, Flutter): Core i5, 16GB đủ
- Backend/DevOps (Docker, K8s): 32GB RAM cần thiết
- AI/ML/Data Science: GPU NVIDIA (CUDA), 32GB+
- iOS/macOS dev: BẮT BUỘC phải dùng MacBook

GỢI Ý:
- MacBook Air M2/M3 (25-30tr): tốt nhất cho đa số lập trình viên
- Dell XPS 15 (30-40tr): Windows, màn hình đẹp
- ThinkPad X1 Carbon (30-40tr): bàn phím tốt, bền
- ASUS ZenBook 14 (20-25tr): tầm trung tốt"""
    },
    {
        "id": "use_content_creator",
        "topic": "làm youtube video content creator quay phim chụp ảnh edit video",
        "content": """Tư vấn laptop cho Content Creator/YouTuber:
YÊU CẦU:
- CPU: Core i7/i9 - đa nhân render nhanh
- GPU: RTX 3060+ cho hardware acceleration
- RAM: 32GB (timeline nhiều track)
- Màn hình: 4K hoặc 2K, màu chuẩn
- SSD: 1-2TB (video 4K rất nặng, 1 phút ≈ 3-8GB)
- Kết nối: SD card slot, nhiều USB, Thunderbolt

PHẦN MỀM PHỔ BIẾN:
- Premiere Pro/After Effects: cần GPU NVIDIA mạnh
- DaVinci Resolve: GPU mạnh, RAM nhiều
- Final Cut Pro: CHỈ trên MacBook, tối ưu cho M-chip

GỢI Ý:
- MacBook Pro M2 Pro/Max (40-60tr): tốt nhất cho Final Cut
- ASUS ProArt Studiobook (35-50tr): màn hình chuyên nghiệp
- Dell XPS 15 4K (35-45tr): màn hình đẹp, build quality tốt"""
    },

    # ══════════════════════════════════════════
    # SO SÁNH THƯƠNG HIỆU
    # ══════════════════════════════════════════
    {
        "id": "brand_asus",
        "topic": "ASUS laptop ASUS đánh giá thương hiệu",
        "content": """Đánh giá thương hiệu ASUS:
ĐIỂM MẠNH:
- Đa dạng sản phẩm từ phổ thông đến cao cấp
- ROG/TUF: dòng gaming mạnh, tản nhiệt tốt
- ZenBook: mỏng nhẹ, thiết kế đẹp
- VivoBook: giá hợp lý, nhiều tính năng
- Bảo hành 12-24 tháng, trung tâm BH rộng khắp
- Giá cạnh tranh tốt

ĐIỂM YẾU:
- Một số model mid-range build chất lượng vừa phải
- Bàn phím số (numpad) trên laptop nhỏ đôi khi bất tiện

PHÙ HỢP: Gaming (ROG/TUF), sinh viên (VivoBook), ultrabook (ZenBook)"""
    },
    {
        "id": "brand_dell",
        "topic": "Dell laptop Dell XPS Inspiron đánh giá",
        "content": """Đánh giá thương hiệu Dell:
ĐIỂM MẠNH:
- XPS: thiết kế premium, màn hình đẹp nhất phân khúc
- Inspiron: phổ thông chắc chắn, giá hợp lý
- Latitude/Precision: doanh nghiệp, bền bỉ
- Chất lượng build tốt, màn hình IPS chất lượng cao
- Hỗ trợ kỹ thuật tốt, linh kiện dễ tìm

ĐIỂM YẾU:
- Giá thường cao hơn so với cùng cấu hình
- Tản nhiệt gaming không bằng ASUS/MSI

PHÙ HỢP: Văn phòng cao cấp (XPS), phổ thông (Inspiron), doanh nghiệp (Latitude)"""
    },
    {
        "id": "brand_hp",
        "topic": "HP laptop HP Pavilion Spectre Victus đánh giá",
        "content": """Đánh giá thương hiệu HP:
ĐIỂM MẠNH:
- Spectre: cao cấp, thiết kế sang trọng
- Pavilion: phổ thông đáng tin cậy
- Victus: gaming giá tốt
- Envy: tầm trung, thiết kế đẹp
- Chất lượng xây dựng ổn định

ĐIỂM YẾU:
- Bloatware (phần mềm rác) cài sẵn nhiều
- Tản nhiệt gaming Victus không xuất sắc

PHÙ HỢP: Văn phòng (Pavilion/Envy), cao cấp (Spectre), gaming tầm trung (Victus)"""
    },
    {
        "id": "brand_lenovo",
        "topic": "Lenovo ThinkPad IdeaPad Legion đánh giá",
        "content": """Đánh giá thương hiệu Lenovo:
ĐIỂM MẠNH:
- ThinkPad: bàn phím tốt nhất thị trường, bền nhất, bảo mật cao
- Legion: gaming mạnh, tản nhiệt xuất sắc
- IdeaPad: phổ thông giá rẻ
- Yoga: 2-in-1 linh hoạt, thiết kế cao cấp
- Hỗ trợ nâng cấp RAM/SSD tốt nhất trong các hãng

ĐIỂM YẾU:
- Một số model IdeaPad cấp thấp build chất vừa
- ThinkPad thiết kế không bắt mắt (đen đơn giản)

PHÙ HỢP: Doanh nghiệp (ThinkPad), gaming (Legion), phổ thông (IdeaPad)"""
    },
    {
        "id": "brand_apple",
        "topic": "Apple MacBook Air Pro đánh giá",
        "content": """Đánh giá thương hiệu Apple MacBook:
ĐIỂM MẠNH:
- Hiệu năng/watt tốt nhất thị trường (chip M-series)
- Pin cực trâu (15-18 giờ thực tế)
- macOS ổn định, ít virus, cập nhật lâu dài
- Màn hình Retina cực đẹp
- Build quality tốt nhất thị trường (nhôm nguyên khối)
- Bàn phím tốt, trackpad tốt nhất thế giới
- Hệ sinh thái iPhone/iPad/Apple Watch tích hợp tốt

ĐIỂM YẾU:
- Giá cao (25-70 triệu)
- Không chơi được game Windows native
- RAM/SSD hàn chết, không nâng cấp
- Ít cổng kết nối (cần hub)
- Final Cut Pro, Logic Pro chỉ có trên Mac

PHÙ HỢP: Lập trình viên, designer, content creator, dùng hệ sinh thái Apple"""
    },
    {
        "id": "brand_msi",
        "topic": "MSI laptop MSI gaming Raider Katana đánh giá",
        "content": """Đánh giá thương hiệu MSI:
ĐIỂM MẠNH:
- Chuyên gaming và workstation
- Tản nhiệt xuất sắc (Cooler Boost)
- Màn hình tần số cao (144-360Hz)
- Raider/GT series: gaming flagship mạnh nhất
- Creator series: dành cho đồ họa chuyên nghiệp

ĐIỂM YẾU:
- Giá cao hơn so với cùng cấu hình ở hãng khác
- Thiết kế gaming khá to, nặng
- Không có nhiều lựa chọn cho văn phòng

PHÙ HỢP: Gaming chuyên nghiệp, content creator, workstation"""
    },

    # ══════════════════════════════════════════
    # TƯ VẤN THEO NGÂN SÁCH
    # ══════════════════════════════════════════
    {
        "id": "budget_under10",
        "topic": "dưới 10 triệu ngân sách thấp laptop rẻ",
        "content": """Laptop tốt nhất dưới 10 triệu:
CẦN BIẾT TRƯỚC:
- Phân khúc này chủ yếu Core i3/Celeron hoặc AMD Ryzen 3
- Không phù hợp gaming, đồ họa nặng
- Đủ dùng: Word, Excel, Chrome, Zoom, xem phim

GỢI Ý:
- Acer Aspire 3 (i3/Ryzen 3): ~8-9 triệu, bền, ổn định
- ASUS VivoBook 15 (Ryzen 3/5): ~9-10 triệu, màn hình đẹp
- Lenovo IdeaPad Slim 3: ~8-9 triệu, nhẹ, pin tốt
- HP Laptop 15s: ~9 triệu, phổ thông đáng tin

LỜI KHUYÊN: Nếu được, nên cố 2-3 triệu thêm để lên tầm 12-13 triệu
sẽ có Core i5 và trải nghiệm tốt hơn nhiều."""
    },
    {
        "id": "budget_10_20",
        "topic": "10 đến 20 triệu tầm trung ngân sách vừa",
        "content": """Laptop tốt nhất tầm 10-20 triệu:
ĐÂY LÀ PHÂN KHÚC TỐT NHẤT:
- Có Core i5/i7 hoặc Ryzen 5/7
- Pin 8 giờ+, SSD nhanh
- Đủ cho hầu hết nhu cầu

GỢI Ý THEO NHU CẦU:
Văn phòng/Học tập:
- ASUS VivoBook 15 OLED (13-15tr): màn OLED đẹp
- Lenovo IdeaPad Slim 5 (14-16tr): mỏng nhẹ, pin trâu
- Dell Inspiron 15 (15-18tr): build tốt, màn sắc nét

Gaming nhẹ:
- ASUS TUF A15/A17 (15-19tr): RTX 3050, 144Hz
- HP Victus 15 (16-19tr): gaming vừa, di động được
- Lenovo IdeaPad Gaming 3 (14-18tr): giá tốt cho hiệu năng"""
    },
    {
        "id": "budget_20_35",
        "topic": "20 đến 35 triệu cao cấp hiệu năng cao",
        "content": """Laptop cao cấp tầm 20-35 triệu:
PHÂN KHÚC NÀY CÓ:
- CPU Core i7/i9 hoặc Ryzen 7/9
- GPU RTX 3060-4070 (cho gaming/đồ họa)
- Màn hình 2K/4K hoặc OLED
- Thiết kế premium, build chất lượng cao

GỢI Ý:
Gaming:
- ASUS ROG Strix G16 (25-30tr): i7+RTX4060, 165Hz
- MSI Katana/Raider (22-30tr): gaming mạnh
- Acer Predator Helios 16 (28-35tr): tản nhiệt tốt

Đồ họa/Văn phòng cao cấp:
- Dell XPS 15 (30-35tr): màn OLED 3.5K, thiết kế đẹp
- ASUS ZenBook Pro 14 (25-30tr): màn 2.8K OLED
- MacBook Air M2 15" (29-33tr): pin 18h, không quạt"""
    },
    {
        "id": "budget_over35",
        "topic": "trên 35 triệu flagship cao cấp nhất",
        "content": """Laptop flagship trên 35 triệu:
TỐIT ĐỈNh THỊ TRƯỜNG:
Gaming flagship:
- ASUS ROG Zephyrus G14/G16 (35-45tr): mỏng nhẹ gaming
- MSI Raider GE78 (45-65tr): RTX 4080/4090
- Alienware m16/m18 (50-80tr): gaming không giới hạn

Workstation/Creator:
- MacBook Pro M3 Pro (45-55tr): tốt nhất cho creator
- MacBook Pro M3 Max (65-80tr): đỉnh cao hiệu năng
- ASUS ProArt Studiobook (40-60tr): màn chuyên nghiệp
- Dell XPS 15/17 4K (40-55tr): thiết kế đẳng cấp

Doanh nghiệp:
- ThinkPad X1 Carbon (35-50tr): bền nhất, bảo mật cao
- HP Spectre x360 (35-45tr): 2-in-1 cao cấp"""
    },

    # ══════════════════════════════════════════
    # SO SÁNH PHỔ BIẾN
    # ══════════════════════════════════════════
    {
        "id": "compare_mac_win",
        "topic": "macbook vs windows so sánh mac windows",
        "content": """So sánh MacBook vs Laptop Windows:
CHỌN MACBOOK NẾU:
✅ Dùng iPhone/iPad (hệ sinh thái liền mạch)
✅ Làm video/nhạc (Final Cut Pro, Logic Pro)
✅ Lập trình web/iOS/macOS
✅ Cần pin cực trâu (15-18 giờ)
✅ Không muốn lo virus/update Windows
✅ Thiết kế, văn phòng cao cấp

CHỌN WINDOWS NẾU:
✅ Chơi game (Windows có 95%+ game)
✅ Ngân sách hạn hẹp (Windows có máy từ 8 triệu)
✅ Cần nâng cấp RAM/SSD sau này
✅ Dùng phần mềm chỉ có trên Windows
✅ Cần nhiều cổng kết nối hơn
✅ Gaming/Đồ họa chuyên nghiệp (GPU NVIDIA mạnh hơn)"""
    },
    {
        "id": "compare_gaming_ultrabook",
        "topic": "laptop gaming vs ultrabook mỏng nhẹ so sánh",
        "content": """So sánh Laptop Gaming vs Ultrabook:
LAPTOP GAMING:
- Ưu: hiệu năng cao, màn hình tần số cao, tản nhiệt tốt
- Nhược: nặng (2-3kg), pin ngắn (2-4h gaming), to cồng kềnh
- Giá: 15-65 triệu
- Phù hợp: gamer, người thường xuyên ở bàn, có cắm điện

ULTRABOOK (mỏng nhẹ):
- Ưu: nhẹ (<1.5kg), pin trâu (10-18h), thiết kế đẹp
- Nhược: hiệu năng thấp hơn, không gaming được
- Giá: 15-45 triệu
- Phù hợp: di chuyển nhiều, văn phòng, học tập

2-IN-1 (bản lề 360°):
- Kết hợp laptop + tablet
- Có bút cảm ứng (tốt cho sinh viên y, thiết kế)
- Lenovo Yoga, HP Spectre x360, Dell XPS 13 2-in-1"""
    },

    # ══════════════════════════════════════════
    # HỎI ĐÁP THƯỜNG GẶP
    # ══════════════════════════════════════════
    {
        "id": "faq_new_vs_old",
        "topic": "laptop cũ mới nên mua laptop cũ hay mới refurbished",
        "content": """Nên mua laptop mới hay cũ/refurbished?
LAPTOP MỚI:
- Bảo hành đầy đủ, không rủi ro
- Hiệu năng tốt nhất, công nghệ mới nhất
- An tâm sử dụng lâu dài
- Khuyến nghị nếu ngân sách đủ

LAPTOP CŨ/REFURBISHED:
- Tiết kiệm 30-50% so với mới
- Rủi ro: hỏng hóc, pin yếu, không bảo hành hoặc bảo hành ngắn
- Nên mua từ cửa hàng uy tín có kiểm định
- Hỏi kỹ: số lần sạc pin, tình trạng màn hình, bàn phím
- Không nên mua: laptop gaming cũ (thường bị đẩy hiệu năng)

LỜI KHUYÊN: Nếu ngân sách từ 10 triệu trở lên, nên mua mới.
Dưới 10 triệu, laptop refurbished từ nơi uy tín là lựa chọn tốt."""
    },
    {
        "id": "faq_upgrade",
        "topic": "nâng cấp laptop thêm RAM SSD có nâng cấp được không",
        "content": """Hướng dẫn nâng cấp laptop:
RAM:
- Hỏi trước khi mua: RAM có hàn chết không?
- Laptop có thể nâng cấp: Dell Inspiron, ThinkPad, Legion
- Laptop KHÔNG nâng cấp RAM: MacBook, nhiều ASUS/HP cao cấp
- Nâng cấp RAM từ 8GB→16GB: tăng hiệu năng đa nhiệm rõ rệt

SSD:
- Hầu hết laptop đều có thể nâng cấp SSD
- Kiểm tra slot M.2 trống (dùng CPU-Z hoặc hỏi cửa hàng)
- Chi phí SSD 1TB NVMe: 1.2-2 triệu
- Nâng cấp SSD 256GB→1TB: khác biệt rõ ràng

KHI NÀO NÊN NÂNG CẤP:
- Máy đang lag, hết bộ nhớ RAM
- Ổ cứng gần đầy (dưới 15%)
- Pin yếu (thay pin: 500K-1.5 triệu tùy model)

LỜI KHUYÊN: Nên chọn cấu hình đủ dùng từ đầu, tránh phải nâng cấp"""
    },
    {
        "id": "faq_care",
        "topic": "bảo quản laptop vệ sinh laptop sử dụng laptop đúng cách",
        "content": """Cách bảo quản và sử dụng laptop đúng cách:
VỆ SINH:
- Vệ sinh quạt tản nhiệt mỗi 6-12 tháng
- Dùng khí nén thổi bụi ở khe thông gió
- Lau màn hình bằng khăn microfiber khô
- Không ăn uống khi dùng laptop

TẢN NHIỆT:
- Đặt laptop trên bề mặt cứng, phẳng (không dùng trên chăn/gối)
- Dùng đế tản nhiệt nếu hay chơi game/làm nặng
- Nhiệt độ CPU lý tưởng: dưới 85°C
- Thay thermal paste sau 2-3 năm

PIN:
- Duy trì pin 20-80% là tốt nhất
- Tắt chế độ sạc tối đa 100% nếu thường cắm điện
- Không để pin 0% trong thời gian dài

BẢO QUẢN:
- Dùng túi/balo chống sốc khi di chuyển
- Tránh xa nam châm, nhiệt độ cao, ẩm ướt
- Cài phần mềm diệt virus (Windows Defender là đủ)"""
    },
    {
        "id": "faq_accessories",
        "topic": "phụ kiện laptop chuột bàn phím màn hình hub USB",
        "content": """Phụ kiện hữu ích cho laptop:
BẮT BUỘC:
- Túi/balo chống sốc: bảo vệ laptop khi di chuyển
- Bộ tản nhiệt: tăng hiệu năng và tuổi thọ

NÊN CÓ:
- Chuột ngoài: thoải mái hơn trackpad khi dùng lâu
- Bàn phím ngoài: tốt cho dân kỹ thuật/văn phòng
- Hub USB-C: mở rộng cổng kết nối cho MacBook/Ultrabook
- Màn hình ngoài: tăng năng suất làm việc

CHO GAMER:
- Chuột gaming có dây: phản hồi tốt hơn
- Tai nghe gaming: âm thanh vị trí tốt hơn
- Bàn phím cơ rời: gõ tốt hơn

CHO DESIGNER/CREATOR:
- Màu sắc chuẩn: màn hình ngoài 4K calibrated
- Bút cảm ứng (Wacom): vẽ thiết kế
- Ổ cứng ngoài 2TB+: lưu trữ project

LaptopStore có bán đầy đủ phụ kiện chính hãng, hỏi tư vấn thêm nhé!"""
    },
]