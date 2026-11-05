# 🧺 CHỢ ƠI! – VIETNAMESE MARKET TRADING & BUSINESS SIMULATION

> **"Từ một người bình thường bước chân vào chợ với 500 xu đến trở thành Đại Gia Phố Chợ & Trùm Tư Bản Thương Nghiệp."**

CHỢ ƠI! là một webgame mô phỏng kinh doanh, buôn bán và khám phá chợ truyền thống Việt Nam kết hợp đồ họa 3D phong cách stylized sống động, cùng một nền kinh tế thị trường thời gian thực (Dynamic Economy) được tính toán chuẩn xác theo các quy luật kinh tế học.

---

## 🌟 TÍNH NĂNG NỔI BẬT

### 1. 🌾 Thế Giới Chợ Việt Nam 3D Sống Động
- Không gian chợ quê mộc mạc với mái ngói đỏ, sạp gỗ, đèn lồng Hội An, cây chuối cảnh, sọt nông sản, thau nước cá tươi lóng lánh.
- Nhân vật người chơi đội nón lá, xách làn mây đi chợ; các tiểu thương mang nét đặc trưng hóm hỉnh (Bà Tư bán rau Đà Lạt, Bà Sáu vựa cá đồng, Chú Ba điểm tâm trà đá, Bác Bảy đầu mối, Chị Hoa vựa trứng, Anh Hùng tài xế ba gác).
- Chu kỳ ngày - đêm linh hoạt (Sáng sớm, Trưa, Chiều tà, Chập tối) và hiệu ứng thời tiết (Nắng vàng, Mưa giông hạt rơi chân thực).
- Âm thanh môi trường & hiệu ứng âm thanh tổng hợp đa âm sắc qua **Web Audio API** (không phụ thuộc asset ngoài).

### 2. 📈 Mô Hình Kinh Tế Thị Trường Động Độc Lập
Toàn bộ hệ thống giá cả được vận hành bởi các hàm toán học thuần túy:
- **Hàm Cầu (Demand):** Tỷ lệ nghịch với giá theo độ co giãn $Demand = BaseDemand \times DemandFactor \times (Price / BasePrice)^{-Elasticity}$.
- **Hàm Cung (Supply):** Tỷ lệ thuận với giá theo độ co giãn $Supply = BaseSupply \times SupplyFactor \times (Price / BasePrice)^{Elasticity}$.
- **Áp Lực Thị Trường (Market Pressure):** Kết hợp giữa Mất cân đối cung cầu (65%) và Áp lực tồn kho (35%).
- **Làm Mượt Giá (Price Smoothing):** $NewPrice = OldPrice + 0.25 \times (TargetPrice - OldPrice)$.
- **Biên Độ Giá (Bid/Ask Spread) & Trượt Giá (Slippage):** Khối lượng mua sỉ lớn sẽ tạo tác động trượt giá lên thị trường.

### 3. 🏘️ Hai Địa Điểm Giao Thương (Spatial Arbitrage)
- **Chợ Dân Sinh (Bán Lẻ):** Nhu cầu tiêu dùng cao, lượng mua lẻ, giá bán lẻ cao hơn, thích hợp xả hàng lẻ kiếm lời đậm.
- **Chợ Đầu Mối (Bán Buôn):** Kho bãi bạt ngàn, nguồn cung dồi dào, giá gốc sỉ rẻ hơn 15-20%, chuyên gom hàng số lượng lớn.
- Hệ thống xe thồ vận chuyển hàng hóa giữa hai chợ tạo cơ hội đầu cơ chênh lệch giá (Arbitrage) chân thực.

### 4. 📦 Quản Lý Kho & Lô Hàng FIFO
- Quản lý kho theo từng **Lô Hàng (Inventory Lots)** riêng biệt.
- Áp dụng nguyên tắc **FIFO (First In, First Out)** khi xuất bán để tính chính xác Giá vốn hàng bán (COGS).
- Nông sản có hạn sử dụng và suy giảm chất lượng theo thời gian.
- Nâng cấp cơ sở vật chất kho bãi:
  - **Kho Thường (Ambient):** Tốc độ suy giảm 1.0x.
  - **Kho Mát (Cool Storage):** Giảm 50% tốc độ hư hỏng (0.5x).
  - **Kho Lạnh (Refrigerated Storage):** Giảm 80% tốc độ hư hỏng (0.2x).

### 5. 💰 Sổ Cái Tài Chính & Lộ Trình Thăng Tiến
- Sổ cái kế toán thời gian thực: Ghi nhận từng giao dịch, Doanh thu, Giá vốn (COGS), Lợi nhuận gộp, Lương nhân viên và Chi phí vận hành.
- Tính toán Tài Sản Ròng (Net Worth): $NetWorth = Tiền Mặt + Giá Trị Nông Sản Kho + Tài Sản Doanh Nghiệp$.
- 7 Cấp bậc Thương Nhân:
  1. *Người Mới Đi Buôn* (500 xu)
  2. *Tiểu Thương Nhạy Bén* (2.000 xu) – Mở khóa Chợ Đầu Mối
  3. *Chủ Sạp Chợ Đông Khách* (10.000 xu) – Mở khóa Thuê Nhân Viên & Kho Mát
  4. *Đầu Mối Bán Buôn* (50.000 xu) – Mở khóa Ký Hợp Đồng Cung Ứng
  5. *Nhà Phân Phối Nông Sản* (200.000 xu) – Mở khóa Kho Lạnh
  6. *Đại Gia Phố Chợ* (1.000.000 xu)
  7. *Trùm Tư Bản Thương Nghiệp* (5.000.000 xu)

### 6. 🍲 Bếp Ẩm Thực Chế Biến Món Ngon
Chế biến nguyên liệu nông sản thành các món ăn chợ trứ danh để gia tăng biên lợi nhuận:
- **Canh Cà Chua Trứng** (2 Cà chua + 2 Trứng + 1 Hành tím)
- **Rau Xào Tỏi Mỡ Hành** (3 Rau cải + 1 Hành tím)
- **Cá Rô Kho Tộ Miền Tây** (2 Cá rô + 2 Hành tím + 1 Gạo)
- **Suất Cơm Chợ Bình Dân** (2 Gạo + 2 Trứng + 2 Rau cải)

### 7. 📰 Bản Tin Thị Trường & Tin Đồn
- Mưa giông ngập lụt miền Tây, Xe nông sản Đà Lạt cập bến, Lễ hội ngày Rằm, Chiến tranh phá giá...
- Đánh giá độ tin cậy của tin đồn (60% - 95%) để người chơi quyết định tích trữ hay xả hàng.

### 8. 🧪 Phòng Thử Nghiệm Kinh Tế (Headless Simulator Sandbox)
Tích hợp sẵn công cụ mô phỏng toán học tốc độ cao:
- Chạy thử 1 ngày, 7 ngày, 30 ngày thị trường trong vài mili-giây.
- Kiểm tra các quy tắc bất biến (Anti-exploit Invariants): Không âm tiền, không âm giá, không âm tồn kho.

---

## 🎮 ĐIỀU KHIỂN

### Desktop:
- **Click chuột trái (Point & Click)**: Bấm vào bất kỳ vị trí nào trên mặt đất hoặc lối đi, nhân vật sẽ xuất hiện vòng tròn mục tiêu và tự động bước tới đó.
- **W, A, S, D** hoặc **Phím mũi tên**: Di chuyển nhân vật thủ công truyền thống (nếu nhấn phím, lệnh click sẽ được hủy ngay lập tức để ưu tiên bàn phím).
- **Click sạp hàng / Nông sản**: Mở Bảng Giao Dịch trực tiếp cho mặt hàng đó.
- **Click Tiểu thương**: Mở hộp thoại trò chuyện, xem tin tức và Trả Giá.
- **Phím tắt chuyển Tab nhanh**:
  - `1`: Thế giới Chợ 3D
  - `2`: Bảng Giá Thị Trường
  - `3`: Chiếc Làn & Kho Hàng
  - `4`: Tài Chính & Sổ Cái
  - `5`: Doanh Nghiệp & Hợp Đồng
  - `6`: Bếp Chế Biến Ẩm Thực
  - `7`: Bản Tin & Sự Kiện

### Mobile / Màn hình cảm ứng:
- Cụm phím điều hướng ảo (Virtual D-pad) trực quan trên màn hình.
- Nút truy cập nhanh Bảng Giá và Chiếc Làn.
- Giao diện phản hồi cảm ứng mượt mà, dễ thao tác.

---

## 🛠️ CÔNG NGHỆ SỬ DỤNG

- **Frontend & UI:** React 18, TypeScript 5.7, Vite 6
- **3D Graphics:** Three.js, React Three Fiber (R3F), @react-three/drei
- **Sound:** Web Audio API Procedural Synthesizer
- **Styling:** CSS3 Design Tokens, Glassmorphism, Google Fonts ("Be Vietnam Pro" & "Plus Jakarta Sans")
- **Tests & Simulation:** TypeScript Automated Test Suite, Headless Stress Simulator

---

## 🚀 HƯỚNG DẪN CÀI ĐẶT & CHẠY

### 1. Cài đặt dependencies:
```bash
npm install
```

### 2. Chạy môi trường phát triển (Dev):
```bash
npm run dev
```
Trình duyệt sẽ mở tại `http://localhost:5173`.

### 3. Chạy kiểm thử tự động (Unit Tests & Invariant Verification):
```bash
npm test
```

### 4. Đóng gói Production:
```bash
npm run build
npm run preview
```
Bản build tối ưu nằm trong thư mục `dist/`, sẵn sàng triển khai trên Cloudflare Pages, Vercel hoặc bất kỳ web server nào.

---

## ☁️ ĐĂNG NHẬP GMAIL & LƯU TIẾN TRÌNH ĐÁM MÂY (FIREBASE)

Game hỗ trợ đăng nhập 1-click bằng tài khoản Google (Gmail) và tự động đồng bộ tiến trình (Tiền mặt, Kho hàng, Cấp bậc, Sổ cái) lên **Firebase Firestore**:

### 1. Trải nghiệm thử ngay không cần cài đặt:
- Bấm nút **"Lưu Gmail"** ở thanh trên cùng.
- Chọn **"⚡ Trải Nghiệm Thử Bản Demo"** để thử ngay cơ chế Cloud Save & hiển thị Avatar thương nhân.

### 2. Kết nối dự án Firebase thật của bạn (Miễn phí 100%):
1. Vào [Firebase Console](https://console.firebase.google.com/) $\rightarrow$ Tạo Project mới (ví dụ: `cho-oi-game`).
2. Vào **Build → Authentication** $\rightarrow$ Tab *Sign-in method* $\rightarrow$ Bật **Google**.
3. Vào **Build → Firestore Database** $\rightarrow$ Bấm *Create database* (chọn chế độ test hoặc production).
4. Vào **Project Settings (Biểu tượng bánh răng)** $\rightarrow$ Cuộn xuống mục *Your apps* $\rightarrow$ Chọn Web `</>` để lấy các khóa API.
5. Sao chép các khóa vào file `.env`:
   ```env
   VITE_FIREBASE_API_KEY=AIzaSy...
   VITE_FIREBASE_AUTH_DOMAIN=cho-oi-game.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=cho-oi-game
   VITE_FIREBASE_APP_ID=1:123456789:web:...
   ```
   *(Hoặc bạn có thể bấm vào nút **"⚙️ Tùy Chỉnh Mã Firebase"** ngay trên giao diện game để điền trực tiếp mà không cần sửa code).*

---

## 🌐 HƯỚNG DẪN TRIỂN KHAI LÊN GITHUB & VERCEL

### Cách 1: Triển khai tự động bằng GitHub Pages
Project đã được tích hợp sẵn file cấu hình tự động tại `.github/workflows/deploy.yml`:
1. Tạo một repository mới trên GitHub (ví dụ: `cho-oi`).
2. Đẩy toàn bộ mã nguồn lên:
   ```bash
   git init
   git add .
   git commit -m "feat: Master release of CHỢ ƠI! with Google Auth & Cloud Save"
   git branch -M main
   git remote add origin https://github.com/TÊN_GITHUB_CỦA_BẠN/cho-oi.git
   git push -u origin main
   ```
3. Trên GitHub, vào mục **Settings → Pages** $\rightarrow$ Tại mục *Build and deployment / Source*, chọn **GitHub Actions**.
4. GitHub sẽ tự động build và cung cấp cho bạn một link web dạng: `https://ten-ban.github.io/cho-oi/`.

### Cách 2: Triển khai qua Vercel (Khuyên dùng - Nhanh nhất)
1. Đẩy code lên GitHub.
2. Đăng nhập [Vercel](https://vercel.com/) bằng GitHub.
3. Bấm **Add New → Project** $\rightarrow$ Chọn repository `cho-oi` $\rightarrow$ Bấm **Deploy**.
4. Sau 30 giây, game của bạn sẽ online với tên miền miễn phí cực đẹp (ví dụ: `cho-oi.vercel.app`) hỗ trợ HTTPS và cập nhật tự động mỗi khi bạn sửa code!

---

*Phát triển với sự tỉ mỉ, tình yêu dành cho văn hóa chợ Việt và đam mê mô phỏng kinh tế.*
