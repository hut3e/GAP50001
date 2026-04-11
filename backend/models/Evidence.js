/**
 * ISO 50001 GAP — Bằng chứng khảo sát (hồ sơ tài liệu, ảnh hiện trường)
 * Liên kết: surveyId, clauseId (§), vị trí (site/zone/equipment), actionId
 */
const mongoose = require("mongoose");

const evidenceSchema = new mongoose.Schema(
  {
    surveyId: { type: mongoose.Schema.Types.ObjectId, ref: "Survey", required: true, index: true },
    /** Điều khoản đánh giá (vd: 4.2.1, 5.3, 8.1) */
    clauseId: { type: String, trim: true, default: "", index: true },
    /** Ngữ cảnh: site, zone, equipment, actionId */
    context: {
      site: String,
      zone: String,
      equipment: String,
      actionId: String,
    },
    /** document | image */
    type: { type: String, enum: ["document", "image"], required: true, index: true },
    filename: { type: String, required: true },
    originalName: { type: String, default: "" },
    mimeType: { type: String, default: "" },
    size: { type: Number, default: 0 },
    /** Đường dẫn file trên server (relative to uploads root) */
    path: { type: String, required: true },
    note: { type: String, default: "" },
    /** Nguồn: upload | camera | mobile */
    source: { type: String, enum: ["upload", "camera", "mobile"], default: "upload" },
  },
  { timestamps: true }
);

evidenceSchema.index({ surveyId: 1, clauseId: 1 });
evidenceSchema.index({ surveyId: 1, type: 1 });
evidenceSchema.index({ surveyId: 1, createdAt: -1 });

module.exports = mongoose.model("Evidence", evidenceSchema);
