/**
 * ISO 50001 GAP — DropdownItem model
 * Quản lý tất cả các mục dropdown trong hệ thống:
 *   equipment_type  — Loại thiết bị
 *   zone_type       — Loại khu vực
 *   department      — Phòng ban / Bộ phận
 *   energy_source   — Nguồn năng lượng (5.2)
 *   product_type    — Phạm vi sản phẩm / dịch vụ (5.3)
 *   industry        — Ngành / Lĩnh vực
 *
 * Mỗi mục: isCustom=false → built-in (seed từ constants), isCustom=true → do admin tạo
 * active=false → ẩn khỏi dropdown (không xóa built-in)
 */
const mongoose = require("mongoose");

const VALID_CATEGORIES = [
  "equipment_type",
  "zone_type",
  "department",
  "energy_source",
  "product_type",
  "industry",
];

const DropdownItemSchema = new mongoose.Schema({
  category: {
    type: String,
    required: true,
    enum: VALID_CATEGORIES,
    index: true,
  },
  id:       { type: String, required: true },
  name:     { type: String, required: true },
  icon:     { type: String, default: "" },
  desc:     { type: String, default: "" },
  checks:   { type: [String], default: [] },
  ref_std:  { type: String, default: "" },
  isCustom: { type: Boolean, default: true },
  order:    { type: Number, default: 9999 },
  active:   { type: Boolean, default: true },
}, { timestamps: true });

DropdownItemSchema.index({ category: 1, id: 1 }, { unique: true });

module.exports = mongoose.model("DropdownItem", DropdownItemSchema);
module.exports.VALID_CATEGORIES = VALID_CATEGORIES;
