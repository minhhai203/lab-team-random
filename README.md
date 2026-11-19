# AI In Action Lab - Random

Web bốc thăm phân chia đội vào đề, với hiệu ứng công bố lần lượt và sân khấu Three.js. Chạy hoàn toàn trên trình duyệt, không cần tài khoản hoặc backend.

## Chạy tại máy

```sh
npm install
npm run dev
```

Mở địa chỉ Vite in ra. Dán danh sách đội và danh sách đề, mỗi mục một dòng, sau đó bấm bắt đầu. Nhập mã đề hoặc mã kèm tên đề (ví dụ `D01 - Khoa học`); hệ thống giữ nguyên nội dung từng dòng và hiển thị cạnh tên từng đội. Bảng kết quả được cập nhật bên dưới animation sau mỗi lượt và xuất hiện đầy đủ khi hoàn tất. Chọn **Mở lần lượt** để tự bấm cho từng hòm, hoặc **Mở tất cả** để chạy tự động. Nút **Dừng sau lượt** cho hòm đang quay kết thúc rồi chờ tiếp tục. Nếu tải lại khi chưa hoàn tất, kết quả đã mở được giữ và trang chờ bấm tiếp tục. Số đội trên các đề chênh nhau tối đa một; nếu ít đội hơn đề thì một số đề không có đội. Trước khi bốc, web chặn tên đội hoặc mã đề bị trùng, không phân biệt chữ hoa/thường và khoảng trắng thừa. Với đề có tên, nhập theo dạng `D01 - Tên đề`, `D01: Tên đề` hoặc `D01 | Tên đề` để web so sánh mã `D01`.

Kết quả và danh sách được lưu trong bộ nhớ của trình duyệt trên thiết bị hiện tại; không chia sẻ hay đồng bộ giữa các thiết bị. Có thể tải ảnh bảng tổng kết khi công bố xong. Dữ liệu trình duyệt có thể bị xóa bởi người dùng hoặc chế độ riêng tư.

## Vercel

Import repository vào Vercel. Vercel tự nhận diện Vite; build command `npm run build`, output directory `dist`. Không cần biến môi trường. Sau khi thay đổi code, push lên nhánh được kết nối để Vercel tạo deployment mới.

```sh
npm test
npm run build
```

## Âm thanh

Các tệp trong `public/sounds/` lấy từ [CS2 Simulator Docs](https://github.com/immortal-seeker/cs2-simulator-docs/tree/main/sounds), nơi mô tả chúng là âm thanh gốc của Valve. Kho nguồn không công bố giấy phép; cần xác minh quyền sử dụng/phân phối trước khi xuất bản công khai. Nút âm thanh trên trang cho phép tắt tiếng.

## GitHub Pages

Trong Settings → Pages, chọn source **GitHub Actions**. Sau đó chạy workflow **Deploy GitHub Pages** từ tab Actions (Run workflow). Workflow build với base path `/lab-team-random/` cho địa chỉ dự kiến `https://minhhai203.github.io/lab-team-random/`. GitHub Pages cho repo private tùy thuộc gói tài khoản; trang xuất bản có thể công khai.
