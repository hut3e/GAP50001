# Typography — Chuẩn font cho App GAP ISO 50001

Áp dụng **một scale cố định** (7 bậc) để giao diện đồng nhất, đáp ứng chuẩn phần mềm quốc tế (WCAG, Material Design / Apple HIG).

## Scale (trong `gap.ui.constants.js`)

| Token       | px  | Dùng cho |
|-------------|-----|----------|
| `FONT.caption`     | 11 | Phụ chú, tag nhỏ, metadata, hint |
| `FONT.label`       | 12 | Nhãn form, tiêu đề cột, section label (ĐIỂM ĐÁNH GIÁ:, GHI CHÚ BỔ SUNG), nút nhỏ |
| `FONT.body`        | 14 | Nội dung chính, input, paragraph, nút, list item, số liệu |
| `FONT.subheading`  | 15 | Tiêu đề clause (4.1.1), tên yêu cầu, sub-section |
| `FONT.title`       | 17 | Tiêu đề section (4.1 Bối cảnh & vấn đề), card title |
| `FONT.headline`    | 20 | Tiêu đề trang (§4 – Bối cảnh tổ chức), header chính |
| `FONT.display`     | 24 | Icon lớn, logo, số rất lớn (dùng ít) |

## Quy tắc

1. **Chỉ dùng token** — Không ghi cứng `fontSize: 13` hay `fontSize: 15`; luôn dùng `fontSize: FONT.label`, `FONT.body`, v.v.
2. **Phân cấp rõ** — Label nhỏ hơn body, body nhỏ hơn subheading, subheading nhỏ hơn title, title nhỏ hơn headline.
3. **Tránh chênh lệch quá lớn** — Scale cách đều (11 → 12 → 14 → 15 → 17 → 20 → 24) để không có chỗ “to quá” hoặc “nhỏ quá” so với xung quanh.

## Import

```js
import { C, FONT } from "./gap.ui.constants.js";
```

## Ví dụ

- Tiêu đề section (4.1): `fontSize: FONT.title`
- Tên clause (4.1.1): `fontSize: FONT.subheading`
- Label “Điểm đánh giá:”: `fontSize: FONT.label`
- Nội dung ô nhập / textarea: `fontSize: FONT.body` (hoặc kế thừa từ Input/TA)
- Tag, badge: `fontSize: FONT.caption` hoặc `FONT.label`
- Header app (§4 – Bối cảnh tổ chức): `fontSize: FONT.headline`
