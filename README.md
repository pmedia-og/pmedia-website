# PMedia – website mới (three.js + GSAP, nền trời xanh phát sáng)

## Các trang (18)
```
index.html                         Trang chủ
ve-chung-toi/                      Về chúng tôi
dich-vu/                           Tổng hợp dịch vụ
dich-vu/<tên-dịch-vụ>/             11 trang dịch vụ
du-an/                             Dự án (thư viện ảnh có bộ lọc)
dao-tao/                           Đào tạo
sme/                               Phần mềm SME
lien-he/                           Liên hệ (form)
assets/css/site.css                Giao diện nền tảng
assets/css/night.css               Lớp nền trời xanh: kính mờ, chữ sáng
assets/js/bg.js                    Nền trời động (gradient, bụi sáng, đốm sáng, tia sáng) giống bản PMedia F&B 3D
assets/js/site.js                  Hiệu ứng GSAP, menu, bảng giá, lọc ảnh, xem ảnh/video phóng to, form
assets/js/scene.js                 Cảnh 3D three.js (mỗi trang một cảnh, chọn bằng data-scene)
assets/css/sig.css, assets/js/sig.js  Phần riêng của từng trang dịch vụ (màu nhấn, mô phỏng đầu trang, mục tương tác)
assets/img/pm/                     Ảnh lấy từ pmedia.vn + file tải ảnh
```
Mọi liên kết đều nằm trong bộ này. Liên kết ra ngoài chỉ còn Zalo, Google Maps (chỉ đường) và video YouTube Shorts.

## Bản sắc từng trang dịch vụ
Mỗi trang dịch vụ có màu nhấn riêng, được nhuộm nhẹ vào nền trời (đặt trên thẻ `<body>` bằng các biến `--blue`, `--blue-d`, `--mist`, `--sky`), một mô phỏng ở đầu trang và ít nhất một mục tương tác riêng. Muốn đổi màu một trang, sửa 4 biến này trên thẻ `<body>` của trang đó.

## Bước 1 – Tải ảnh về (làm một lần, trước khi gỡ site cũ)
Ảnh được đọc từ `assets/img/pm/`. Danh sách 200 ảnh nằm trong `assets/img/pm/danh-sach-anh.txt`.
- macOS / Linux: `cd assets/img/pm && python3 tai-anh.py`
- Windows: chuột phải `assets/img/pm/tai-anh.ps1` → Run with PowerShell

Trước khi tải, trang vẫn tự lấy ảnh từ địa chỉ cũ trên pmedia.vn để không bị trống. Sau khi tải xong, site hoàn toàn độc lập với site cũ.

## Bước 2 – Xem thử và đưa lên hosting
Mở `index.html` bằng trình duyệt (cần internet để tải font, GSAP và three.js). Tải nguyên thư mục lên thư mục gốc của hosting. Liên kết đang trỏ tới `.../index.html` để xem được ngay trên máy. Khi đã lên hosting, có thể bỏ phần `index.html` nếu muốn đường dẫn gọn.

## Cần làm thêm
- Form liên hệ: điền URL nhận dữ liệu vào `data-endpoint=""` trên thẻ `<form class="cform">` trong `lien-he/index.html`. Form gửi POST các trường `name`, `phone`, `company`, `service` (nhiều giá trị), `message`.
- Thư viện dự án chưa có tên khách hàng, vì site cũ không ghi tên cho từng ảnh. Có thể thêm chú thích vào thuộc tính `alt` của từng ảnh.

## Thư viện dùng
three.js 0.160.0 (jsDelivr), GSAP 3.12.5 + ScrollTrigger (cdnjs), font Be Vietnam Pro và Fraunces (Google Fonts).

## Trang dịch vụ 3D (mặc định)
- `dich-vu/<tên-dịch-vụ>/` là bản 3D: bấm **Xem dịch vụ**, trang tự cuộn từng cảnh, có thuyết minh và phụ đề. Không bấm thì vẫn cuộn chuột xem bình thường.
- Bản đầy đủ (bảng giá, FAQ, ảnh dự án) ở `dich-vu/<tên-dịch-vụ>/chi-tiet/`, có link "Xem chi tiết & bảng giá" ngay dưới nút.
- Đường dẫn cũ `video-3d/...` tự chuyển về trang dịch vụ tương ứng.
- Phím tắt: Space phát/dừng, ←/→ chuyển cảnh, F toàn màn hình, H ẩn điều khiển, C phụ đề, M tắt tiếng, V đổi giọng.

### Giọng đọc
- Mặc định dùng giọng tiếng Việt của trình duyệt (Microsoft Edge có giọng tự nhiên nhất). Trình duyệt không có giọng tiếng Việt thì chạy kèm phụ đề.
- Giọng AI thu sẵn, giống nhau trên mọi trình duyệt: `pip install edge-tts`, rồi trong thư mục `dich-vu/` chạy `python tao-giong-doc.py` (thêm `--giong nam` nếu muốn giọng nam). Mỗi dịch vụ sẽ có thêm thư mục `giong-doc/`.

### Sửa lời thoại
Trong `dich-vu/<tên>/index.html`, đoạn `window.STORY=...`, mục `lines`: mỗi lời là `["phụ đề","câu đọc"]`. Sửa xong thì cập nhật `dich-vu/loi-doc.json` và tạo lại giọng đọc nếu đang dùng giọng thu sẵn.
