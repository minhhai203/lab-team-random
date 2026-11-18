# Nghiên cứu: giao diện mở hòm CS:GO

Thời điểm: 18/11/2026, múi giờ Asia/Ho_Chi_Minh.

## Kết luận

Tham chiếu ảnh mở hòm CS:GO cho thấy hòm đen đặt lớn ở giữa màn hình, thân có gân dọc, nắp có gân, hình tam giác vàng trên mặt trước, khóa vàng và mảng vàng trên cạnh. Màn mở chuyển sang dải vật phẩm chạy ngang qua một vạch chỉ cố định; tốc độ giảm dần trước khi hiện kết quả. Mô hình trong dự án là bản dựng bằng hình học Three.js dựa trên tham chiếu, không phải asset gốc của Valve.

## Nguồn và cách đối chiếu

- [Ảnh màn Unlock Container trên Steam Community](https://steamcommunity.com/sharedfiles/filedetails/?id=3424349844): tham chiếu trực quan về hình dáng, màu và bố cục hòm.
- [Tài liệu vụ kiện New York v. Valve, đoạn 64](https://ag.ny.gov/sites/default/files/court-filings/new-york-v-valve-corporation-complaint-2026.pdf): mô tả chuỗi mở hòm, dải vật phẩm chạy nhanh rồi chậm dần. Đây là tài liệu tố tụng, sử dụng ở đây để đối chiếu mô tả giao diện, không suy diễn các kết luận pháp lý.
- [Bài nghiên cứu DiGRA](https://dl.digra.org/index.php/dl/article/download/1327/1327/1324): ảnh màn Unlock Prisma Case và các vạch màu của vật phẩm.
- [CSGO Roulette V2](https://github.com/StandarterDF/CSGO_Roulette_V2): một mô phỏng cộng đồng dùng ease-out khoảng 5,5 giây; không chứng minh thời gian chính xác của game gốc.

Từ khóa: `CSGO weapon case unlock screen`, `CSGO case opening animation`, `CSGO case roulette`, `CSGO case 3D model`. Tập trung vào CS:GO lịch sử, không mặc định giao diện CS2 là giống hệt. Cài đặt thời gian hiện tại là lựa chọn mô phỏng, chưa đo từng khung hình của game.

## Áp dụng

1. Dựng hòm đen có nắp và khóa chuyển động bằng Three.js; logo H201 tự dựng.
2. Chuyển cảnh toàn màn hình: mở khóa → dải thẻ và vạch vàng → công bố tên đề và đội.
3. Giữ thuật toán chia đã xác định kết quả trước animation; thẻ hiển thị chỉ minh họa, không thay đổi kết quả.
4. Giữ tùy chọn hiện tất cả và hiển thị kết quả trong giao diện HTML; hỗ trợ giảm chuyển động.

## Điểm chưa xác minh

- Chưa đối chiếu khung hình, thời gian, đường cong tốc độ và âm thanh trực tiếp với bản game cụ thể.
- Âm thanh lấy từ nguồn thứ ba được mô tả là âm thanh Valve; giấy phép phân phối chưa được xác minh. Xem README trước khi xuất bản công khai.
