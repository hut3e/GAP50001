/**
 * ChecklistItem — ISO 50001 GAP điều khoản (có thể CRUD qua Admin)
 * Mỗi item: id (duy nhất, vd "4.1.1"), clause, title, weight, cat, legal, order
 */
const mongoose = require("mongoose");

const checklistItemSchema = new mongoose.Schema(
  {
    id:     { type: String, required: true, unique: true, trim: true }, // "4.1.1"
    clause: { type: String, required: true, trim: true },               // "4.1"
    title:  { type: String, required: true, trim: true },
    weight: { type: Number, default: 2, min: 1, max: 3 },              // 1=minor,2=major,3=critical
    cat:    { type: String, default: "doc",
              enum: ["doc","practice","measurement","leadership","legal"] },
    legal:  { type: String, default: "" },
    order:  { type: Number, default: 0 },                               // dùng để sắp xếp
  },
  { timestamps: true }
);

checklistItemSchema.index({ clause: 1, order: 1 });

module.exports = mongoose.model("ChecklistItem", checklistItemSchema);
