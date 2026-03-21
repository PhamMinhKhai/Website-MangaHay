<p align="center">
  <h1 align="center">MangaHay</h1>
  <p align="center">
    <em>Nền tảng đọc truyện tranh trực tuyến được xây dựng với Node.js</em>
  </p>
  <p align="center">
    <img src="https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen?logo=node.js" alt="Node">
    <img src="https://img.shields.io/badge/express-4.x-blue?logo=express" alt="Express">
    <img src="https://img.shields.io/badge/mongodb-7.x-green?logo=mongodb" alt="MongoDB">
    <img src="https://img.shields.io/badge/cloudinary-enabled-blueviolet?logo=cloudinary" alt="Cloudinary">
    <img src="https://img.shields.io/badge/license-ISC-orange" alt="License">
  </p>
</p>

---

## Giới Thiệu

**MangaHay** là một website đọc truyện tranh (manga) full-stack, hỗ trợ cả giao diện web và API cho ứng dụng mobile. Người dùng có thể duyệt thư viện truyện, đọc truyện online với trình đọc chuyên dụng, bình luận, lưu truyện yêu thích, và tải chapter về máy. Quản trị viên có bảng điều khiển riêng để quản lý toàn bộ nội dung.

---

## Tính Năng

### Người Dùng

- Đăng ký / Đăng nhập (Session-based cho web, JWT cho mobile)
- Duyệt thư viện truyện với bộ lọc thể loại & tìm kiếm
- Đọc truyện online với trình đọc chuyên dụng
- Lưu truyện yêu thích
- Lịch sử đọc truyện tự động
- Bình luận trên từng truyện
- Tải chapter về máy
- Quản lý hồ sơ cá nhân

### Quản Trị Viên

- Dashboard tổng quan
- Quản lý truyện (thêm / sửa / xóa)
- Quản lý chapter & upload trang truyện
- Quản lý người dùng
- Quản lý slider trang chủ
- Quản lý bình luận

### Mobile API

- Xác thực JWT (access token + refresh token)
- RESTful API đầy đủ cho ứng dụng mobile

---

## Công Nghệ Sử Dụng

| Thành phần        | Công nghệ                                          |
| ----------------- | -------------------------------------------------- |
| **Runtime**       | Node.js                                            |
| **Framework**     | Express.js 4.x                                     |
| **Database**      | MongoDB Atlas + Mongoose 7.x                       |
| **Template**      | EJS (Embedded JavaScript)                          |
| **Auth (Web)**    | Express Session + bcrypt + connect-mongo           |
| **Auth (Mobile)** | JSON Web Token (JWT) + Refresh Token               |
| **Image Storage** | Cloudinary + multer-storage-cloudinary             |
| **Image Process** | Sharp (resize, optimize)                           |
| **Validation**    | express-validator                                  |
| **Khác**          | compression, cors, archiver (tải chapter dạng ZIP) |

---

## Cấu Trúc Dự Án

```
MangaHay/
├── config/              # Cấu hình DB, app settings
│   ├── config.js
│   └── database.js
├── helpers/             # Utility functions
│   ├── fileDelete.js
│   └── sanitizeFilename.js
├── middleware/          # Middleware xác thực & upload
│   ├── auth.js
│   └── upload.js
├── models/              # Mongoose schemas
│   ├── Chapter.js
│   ├── Comment.js
│   ├── Favorite.js
│   ├── Manga.js
│   ├── ReadingHistory.js
│   ├── Slider.js
│   └── User.js
├── public/              # Static assets
│   ├── css/
│   └── js/
├── routes/              # API & page routes
│   ├── admin.js
│   ├── auth.js
│   ├── chapters.js
│   ├── comments.js
│   ├── genreRoutes.js
│   ├── manga.js
│   ├── mobile-auth.js
│   ├── mobile-user.js
│   ├── pages.js
│   ├── slider.js
│   └── user.js
├── views/               # EJS templates
│   ├── admin/           # Trang quản trị
│   ├── partials/        # Header, footer, ...
│   └── *.ejs            # Trang người dùng
├── server.js            # Entry point
├── setup.js             # Script khởi tạo
├── seed-sample.js       # Dữ liệu mẫu
├── .env.example         # Mẫu biến môi trường
└── package.json
```

---

## Cài Đặt & Chạy

### Yêu Cầu

- **Node.js** >= 18.x
- **MongoDB** (local hoặc [MongoDB Atlas](https://www.mongodb.com/atlas))
- **Cloudinary** account ([đăng ký miễn phí](https://cloudinary.com/users/register/free))

### 1. Clone repository

```bash
git clone https://github.com/PhamMinhKhai/Website-MangaHay.git
cd mangahay
```

### 2. Cài đặt dependencies

```bash
npm install
```

### 3. Cấu hình biến môi trường

Sao chép file `.env.example` thành `.env` và cập nhật các giá trị:

```bash
cp .env.example .env
```

```env
# Server
PORT=3000
NODE_ENV=development

# MongoDB
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/mangahay

# Session & JWT
SESSION_SECRET=your-super-secret-key
JWT_SECRET=your-jwt-secret
JWT_REFRESH_SECRET=your-jwt-refresh-secret

# CORS
ALLOWED_ORIGINS=*

# Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

### 4. Khởi tạo dữ liệu (tuỳ chọn)

```bash
# Chạy script setup
npm run setup

# Hoặc seed dữ liệu mẫu
npm run seed
```

### 5. Chạy ứng dụng

```bash
# Development (auto-reload)
npm run dev

# Production
npm start
```

Truy cập **http://localhost:3000**

---

## API Endpoints

### Authentication (Web)

| Method | Endpoint             | Mô tả     |
| ------ | -------------------- | --------- |
| POST   | `/api/auth/login`    | Đăng nhập |
| POST   | `/api/auth/register` | Đăng ký   |

### Authentication (Mobile)

| Method | Endpoint                    | Mô tả           |
| ------ | --------------------------- | --------------- |
| POST   | `/api/mobile/auth/login`    | Đăng nhập (JWT) |
| POST   | `/api/mobile/auth/register` | Đăng ký (JWT)   |

### Manga

| Method | Endpoint         | Mô tả            |
| ------ | ---------------- | ---------------- |
| GET    | `/api/manga`     | Danh sách truyện |
| GET    | `/api/manga/:id` | Chi tiết truyện  |

### Chapters

| Method | Endpoint            | Mô tả       |
| ------ | ------------------- | ----------- |
| GET    | `/api/chapters/:id` | Lấy chapter |

### User

| Method | Endpoint              | Mô tả               |
| ------ | --------------------- | ------------------- |
| GET    | `/api/user/favorites` | Danh sách yêu thích |
| GET    | `/api/user/history`   | Lịch sử đọc         |

### Admin

| Method | Endpoint               | Mô tả              |
| ------ | ---------------------- | ------------------ |
| GET    | `/api/admin/stats`     | Thống kê tổng quan |
| POST   | `/api/admin/manga`     | Thêm truyện mới    |
| PUT    | `/api/admin/manga/:id` | Cập nhật truyện    |
| DELETE | `/api/admin/manga/:id` | Xóa truyện         |

---

## Thể Loại Hỗ Trợ

Action · Adventure · Comedy · Drama · Romance · Fantasy · Horror · Mystery · Psychological · Sci-Fi · Slice of Life · Supernatural · Sports · Mecha

---

## License

Dự án được phát hành dưới giấy phép **ISC**.

---

<p align="center">
  Made with love by Pham Minh Khai
</p>
