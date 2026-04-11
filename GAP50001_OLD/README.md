# Ứng dụng Khảo sát GAP ISO 50001:2018

Full-stack: Frontend (React + Vite), Backend (Express + MongoDB), xuất báo cáo DOCX. Chạy bằng Docker + Nginx.

## Yêu cầu

- Node.js 18+
- Docker & Docker Compose (hoặc chỉ Node + MongoDB khi chạy local)

## Chạy bằng Docker (khuyến nghị)

```bash
# Build và chạy toàn bộ
docker compose up -d --build

# Ứng dụng: http://localhost:8888
# API backend được proxy tại /api (ví dụ /api/surveys, /api/iso50001/gap/generate)
```

Nếu cổng 8888 bận, sửa trong `docker-compose.yml` service `nginx` → `ports: ["8080:80"]` (hoặc cổng khác).

MongoDB trong Docker không map ra host mặc định; cần truy cập từ máy host thì thêm `ports: ["27019:27017"]` cho service `mongo` (đã có sẵn trong file).

## Chạy local (không Docker)

1. **MongoDB**: Chạy MongoDB local (ví dụ cổng 27017).

2. **Backend**
   ```bash
   npm install
   export MONGODB_URI=mongodb://localhost:27017/iso50001gap   # Windows: set MONGODB_URI=...
   npm start
   ```
   Backend: http://localhost:5002

3. **Frontend**
   ```bash
   cd frontend && npm install && npm run dev
   ```
   Mở http://localhost:3000 (Vite proxy /api sang backend).

## API chính

| Method | Path | Mô tả |
|--------|------|--------|
| GET | /api/surveys | Danh sách phiên khảo sát |
| GET | /api/surveys/:id | Chi tiết một phiên |
| POST | /api/surveys | Tạo phiên mới |
| PUT | /api/surveys/:id | Cập nhật phiên |
| DELETE | /api/surveys/:id | Xóa phiên |
| GET | /api/iso50001/gap/schema | Schema mặc định GAP |
| POST | /api/iso50001/gap/generate | Tạo file DOCX báo cáo GAP (body = JSON phiên khảo sát) |

## Cấu trúc thư mục

- `frontend/` — React (Vite), wizard 7 bước, Lưu/Tải phiên, Xuất DOCX
- `backend/` — Express, MongoDB (Survey), routes surveys + gap generate
- `nginx/` — Cấu hình Nginx (proxy /api, serve SPA)

Build frontend: `cd frontend && npm run build`. Build Docker: `docker compose build`.
