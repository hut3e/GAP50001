# Kiểm thử CRUD & MongoDB — ISO 50001 GAP

## Yêu cầu

- **MongoDB** đang chạy (mặc định `localhost:27017`)
- **Backend** đang chạy: `npm run dev` hoặc `node server.js` (cổng 5002)

## Chạy kiểm thử

```bash
cd backend
node test-crud-mongo.js
```

Hoặc dùng base URL khác:

```bash
API_BASE=http://localhost:5002 node test-crud-mongo.js
```

## Các bước được kiểm thử

| # | Mô tả | API | Kiểm tra |
|---|--------|-----|----------|
| 1 | Health & MongoDB | `GET /health` | `mongo === "connected"` |
| 2 | Danh sách phiên | `GET /api/surveys?limit=5` | Trả về mảng |
| 3 | **Create** phiên | `POST /api/surveys` | 201, có `_id`, ref_no + client.name bắt buộc |
| 4 | **Read** theo id | `GET /api/surveys/:id` | Dữ liệu khớp (meta, client, responses, action_plan, exec_summary_items, contact_persons) |
| 4b | Read theo ref_no | `GET /api/surveys/ref/:ref_no` | Cùng _id với GET by id |
| 4c | Trùng ref_no | `POST /api/surveys` (cùng ref_no) | 409 Conflict, trả về id phiên tồn tại |
| 5 | **Update** phiên | `PUT /api/surveys/:id` | 200, client.name & employees cập nhật đúng |
| 6 | Đọc lại sau update | `GET /api/surveys/:id` | Dữ liệu MongoDB khớp với payload vừa PUT |
| 7 | **Create** bằng chứng | `POST /api/surveys/:id/evidence/base64` | 201, có _id |
| 8 | **Read** danh sách evidence | `GET /api/surveys/:id/evidence` | Bằng chứng vừa tạo có trong list |
| 8b | **Update** evidence | `PUT /api/surveys/:id/evidence/:eid` | note, clauseId cập nhật đúng |
| 9 | Xuất báo cáo DOCX | `POST /api/iso50001/gap/generate` | 200, Content-Type DOCX, body > 1KB |
| 10 | **Delete** bằng chứng | `DELETE /api/surveys/:id/evidence/:eid` | 200, list evidence không còn bản ghi đó |
| 11 | **Delete** phiên | `DELETE /api/surveys/:id` | 200, GET :id trả 404 |

## Chuẩn hóa dữ liệu khi Load (frontend)

Khi tải phiên (`handleLoadOne`), app chuẩn hóa để form/modal hiển thị đúng:

- `meta.exec_summary_items`: mảng (hoặc tách từ `exec_summary` string)
- `client.contact_persons`: luôn mảng
- `audit_plan.auditors`: luôn mảng
- `responses[*].evidence_notes`: luôn mảng
- `site_assessments`, `action_plan`, `legal_registry`, `iso_standards_registry`, `certification_roadmap`, `logistics_trips`: luôn mảng (hoặc [])

## Kết quả mong đợi

Tất cả bước **PASS** → App hoạt động đúng với dữ liệu thật MongoDB, CRUD Survey & Evidence và xuất DOCX đều ổn định.
