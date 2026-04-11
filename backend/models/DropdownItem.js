/**
 * ISO 50001 GAP — DropdownItem model
 * Lưu các mục tùy chỉnh cho dropdown: equipment_type, zone_type
 * Built-in items được merge từ gap.constants.js; custom items lưu ở đây với isCustom: true
 */
const mongoose = require("mongoose");

const DropdownItemSchema = new mongoose.Schema({
  category: {
    type: String,
    required: true,
    enum: ["equipment_type", "zone_type"],
    index: true,
  },
  id:       { type: String, required: true },        // e.g. "EQ-MOT", "ZN-MFG", hoặc custom "EQ-USR-001"
  name:     { type: String, required: true },
  icon:     { type: String, default: "📌" },
  desc:     { type: String, default: "" },           // zone_type: mô tả khu vực
  checks:   { type: [String], default: [] },         // equipment_type: checklist gợi ý
  ref_std:  { type: String, default: "" },           // equipment_type: tiêu chuẩn tham chiếu
  isCustom: { type: Boolean, default: true },        // false = built-in (seed từ constants)
  order:    { type: Number, default: 9999 },         // thứ tự hiển thị
  active:   { type: Boolean, default: true },        // false = ẩn khỏi dropdown
}, { timestamps: true });

DropdownItemSchema.index({ category: 1, id: 1 }, { unique: true });

module.exports = mongoose.model("DropdownItem", DropdownItemSchema);
