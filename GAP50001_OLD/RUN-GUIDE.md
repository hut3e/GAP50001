# 🚀 Hướng Dẫn Chạy — macOS Ventura 13.5+

## Mục lục
- [Cách A: Docker Desktop](#cách-a--docker-desktop-khuyến-nghị)
- [Cách B: Colima](#cách-b--colima)
- [Cách C: Không Docker (MongoDB native)](#cách-c--không-docker--mongodb-native)
- [Khắc phục lỗi](#-khắc-phục-sự-cố)

---

## Cách A — Docker Desktop (Khuyến nghị)

### 1. Cài đặt Docker Desktop
```bash
# Tải từ: https://docs.docker.com/desktop/install/mac-install/
# Chọn "Mac with Intel chip" hoặc "Mac with Apple silicon"

# Sau khi cài xong, mở Docker Desktop và đợi:
# "Docker Desktop is running"
```

### 2. Chạy ứng dụng
```bash
cd ~/GAP50001/GAP50001
docker compose up -d --build
```

### 3. Mở ứng dụng
```
http://localhost:8888
```

### 4. Kiểm tra trạng thái
```bash
docker compose ps
docker compose logs -f backend   # Xem logs backend
```

### Các lệnh hữu ích
```bash
docker compose down              # Dừng
docker compose down -v           # Dừng + XÓA database
docker compose restart backend   # Restart backend
docker compose logs mongo        # Logs MongoDB
```

---

## Cách B — Colima

Colima là thay thế Docker Desktop cho macOS (nhẹ hơn, dùng QEMU).

### 1. Cài đặt Colima (nếu chưa có)
```bash
brew install colima docker docker-compose

# Kiểm tra:
colima --version
```

### 2. Chạy ứng dụng
```bash
cd ~/GAP50001/GAP50001

# Cách 1 — Dùng script có sẵn:
chmod +x start-colima.sh
./start-colima.sh

# Cách 2 — Chạy thủ công:
colima start
docker compose up -d --build
```

### 3. Mở ứng dụng
```
http://localhost:8888
```

### Nếu Colima bị lỗi — Khắc phục nhanh
```bash
# Reset Colima hoàn toàn:
colima stop
colima delete
colima start --arch aarch64 --vm-type=vz --vz-rosetta --cpu 4 --memory 8

# Rồi chạy lại:
docker compose up -d --build
```

---

## Cách C — Không Docker (MongoDB native)

Dùng khi muốn chạy trực tiếp, không qua container.

### 1. Cài MongoDB Community
```bash
brew install mongodb-community

# MongoDB sẽ tự khởi động làm LaunchDaemon
brew services start mongodb-community

# Kiểm tra:
brew services list | grep mongo
mongod --version
```

### 2. Kiểm tra MongoDB đã chạy
```bash
# MongoDB chạy ở localhost:27017
mongosh --eval "db.adminCommand('ping')"
# Thấy { ok: 1 } = ✅
```

### 3. Chạy Backend + Frontend
```bash
cd ~/GAP50001/GAP50001

chmod +x start-native.sh
./start-native.sh
```

### 4. Mở ứng dụng
```
http://localhost:3000
```

### Nếu cổng 3000 bị chiếm
```bash
# Đổi sang cổng khác:
cd frontend
VITE_PORT=3001 npm run dev

# Hoặc kill process chiếm cổng:
lsof -ti:3000 | xargs kill -9
```

---

## 📊 Kết quả mong đợi

| Service | Docker Desktop / Colima | Native (no Docker) |
|---------|------------------------|-------------------|
| **App** | http://localhost:8888 | http://localhost:3000 |
| **API Health** | http://localhost:8888/health | http://localhost:5002/health |
| **MongoDB** | localhost:27017 | localhost:27017 |
| **Backend logs** | `docker compose logs -f backend` | terminal backend |
| **Frontend logs** | `docker compose logs -f nginx` | terminal frontend |

---

## 🆘 Khắc phục sự cố

### Lỗi "docker: command not found"
Docker chưa được cài hoặc Docker Desktop chưa mở.
```bash
# Kiểm tra:
docker --version

# Mở Docker Desktop (GUI), hoặc cài mới:
brew install --cask docker
```

### Lỗi "colima: command not found"
```bash
brew install colima
colima start
```

### Lỗi "port already in use" (8888, 27017, 3000, 5002)
```bash
# Tìm process:
lsof -i :8888
lsof -i :27017
lsof -i :3000
lsof -i :5002

# Kill process (thay PID):
kill -9 <PID>
```

### MongoDB container liên tục restart (Docker)
```bash
docker compose logs mongo
# Thường do thiếu RAM cho Docker — tăng RAM trong Docker Desktop Settings
```

### Lỗi "Cannot find module 'mongoose'" trong backend
```bash
cd backend
npm install
```

### Lỗi "Cannot find module 'vite'" trong frontend
```bash
cd frontend
npm install
```

### Frontend trắng trang trong Docker
```bash
# Rebuild không cache:
docker compose build --no-cache nginx
docker compose up -d nginx

# Xem logs:
docker compose logs nginx
```

### Database "iso50001gap" không xuất hiện trong MongoDB Compass
- **Bình thường!** Database chỉ được tạo khi **lưu phiên khảo sát lần đầu**
- Tạo 1 survey và lưu → DB sẽ xuất hiện trong Compass

### Muốn dùng MongoDB Compass
```
Connection String: mongodb://localhost:27017
```
Sau khi lưu survey lần đầu, database `iso50001gap` sẽ hiện trong danh sách.
