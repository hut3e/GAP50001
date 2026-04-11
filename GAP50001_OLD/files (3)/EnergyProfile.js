/**
 * EnergyProfile — Hồ sơ Nguồn Năng lượng Sử dụng
 * Lưu trữ toàn bộ dữ liệu tiếp cận theo nguồn NL cho một phiên Onsite Audit
 *
 * Mỗi survey có một EnergyProfile duy nhất (1-1).
 * EnergyProfile gồm nhiều EnergySource (bản ghi từng loại NL).
 *
 * Tiêu chuẩn tham chiếu:
 *  - ISO 50001:2018 §6.3 (Energy Review), §6.4 (EnPI), §6.5 (EnB)
 *  - ISO 50006:2014 (EnPI & EnB methodology)
 *  - Luật 50/2010/QH12 §3 (Cơ sở sử dụng NL trọng điểm ≥1000 TOE/năm)
 *  - TT 09/2012 §8 (Xác định SEU)
 */
"use strict";
const mongoose = require("mongoose");

// ── Monthly data point ────────────────────────────────────────────
const MonthlyDataSchema = new mongoose.Schema({
  year:    { type: Number, required: true },
  month:   { type: Number, required: true, min: 1, max: 12 },
  value:   { type: Number, default: 0 },         // Tiêu thụ theo đơn vị sơ cấp
  valueGJ: { type: Number, default: 0 },         // Quy đổi GJ
  valueTOE:{ type: Number, default: 0 },         // Quy đổi TOE
  cost:    { type: Number, default: 0 },         // Chi phí VNĐ
  unit_price: { type: Number, default: 0 },      // Đơn giá (đ/kWh, đ/m³…)
  note:    { type: String, trim: true },
}, { _id: false });

// ── Secondary consumption (tiêu thụ thứ cấp) ────────────────────
const SecondarySchema = new mongoose.Schema({
  description:  { type: String, trim: true },    // VD: "Hơi nước phát từ lò hơi nội bộ"
  sourceType:   { type: String, trim: true },    // VD: "steam","chilled_water","compressed_air"
  primaryFuel:  { type: String, trim: true },    // Nguồn NL sơ cấp tạo ra
  unit:         { type: String, trim: true },    // kg/h, kW, m³/h
  annualValue:  { type: Number, default: 0 },
  convertedGJ:  { type: Number, default: 0 },
  convertedTOE: { type: Number, default: 0 },
  users:        { type: [String], default: [] }, // Khu vực sử dụng
  is_seu:       { type: Boolean, default: false },
  notes:        { type: String, trim: true },
}, { _id: true });

// ── Per-source audit findings ─────────────────────────────────────
const AuditFindingSchema = new mongoose.Schema({
  question:     { type: String, trim: true },
  answer:       { type: String, trim: true },
  conformance:  { type: String, enum:["conform","minor_nc","major_nc","observation","na",""], default:"" },
  evidence:     { type: String, trim: true },
}, { _id: false });

// ── Single Energy Source ──────────────────────────────────────────
const EnergySourceSchema = new mongoose.Schema({
  // Định danh
  sourceId:     { type: String, required: true },        // ES-001, ES-002…
  energyType:   { type: String, required: true, trim: true }, // Điện, Khí tự nhiên…
  energyForm:   { type: String, trim: true },            // Dạng sơ cấp / thứ cấp
  category:     {
    type: String,
    enum: ["primary","secondary","renewable","waste_heat"],
    default: "primary",
  },
  supplier:     { type: String, trim: true },
  meterCount:   { type: Number, default: 0 },
  meterCalibrated: { type: Boolean, default: false },
  meterCalibDate:  { type: String },

  // Đơn vị
  primaryUnit:     { type: String, trim: true, default: "kWh" }, // Đơn vị sơ cấp
  secondaryUnit:   { type: String, trim: true, default: "GJ"  }, // Đơn vị chuyển đổi 1
  tertiaryUnit:    { type: String, trim: true, default: "TOE" }, // Đơn vị chuyển đổi 2
  conversionToGJ:  { type: Number, default: 0 },   // 1 primaryUnit = x GJ
  conversionToTOE: { type: Number, default: 0 },   // 1 primaryUnit = x TOE

  // Tiêu thụ tổng hợp
  annual_primary:  { type: Number, default: 0 },   // Tổng tiêu thụ đơn vị sơ cấp / năm
  annual_GJ:       { type: Number, default: 0 },   // Tổng GJ / năm
  annual_TOE:      { type: Number, default: 0 },   // Tổng TOE / năm
  annual_cost:     { type: Number, default: 0 },   // Tổng chi phí VNĐ / năm
  avg_unit_price:  { type: Number, default: 0 },   // Đơn giá bình quân

  // Dữ liệu lịch sử theo tháng (12–24 tháng)
  monthlyData:     { type: [MonthlyDataSchema], default: [] },

  // Tỷ lệ tiêu thụ
  percentOfTotal:  { type: Number, default: 0 },   // % tổng NL toàn cơ sở
  percentOfSEU:    { type: Number, default: 0 },   // % nếu là SEU

  // Đánh giá trọng điểm
  is_seu:          { type: Boolean, default: false },
  seu_reason:      { type: String, trim: true },   // Lý do xác định SEU
  seu_threshold:   { type: Number, default: 0 },   // Ngưỡng xác định (VD: ≥1000 TOE/năm)

  // Xu hướng và EnPI
  trend:           { type: String, enum:["increasing","stable","decreasing","unknown"], default:"unknown" },
  enpi_type:       { type: String, trim: true },   // VD: kWh/tấn SP, kWh/m²
  enpi_value:      { type: Number, default: 0 },
  enpi_unit:       { type: String, trim: true },
  enpi_baseline:   { type: Number, default: 0 },
  enpi_target:     { type: Number, default: 0 },

  // Tiêu thụ thứ cấp phát sinh từ nguồn này
  secondaryOutputs:{ type: [SecondarySchema], default: [] },

  // Phát hiện kiểm toán
  auditFindings:   { type: [AuditFindingSchema], default: [] },
  overallFinding:  { type: String, trim: true },
  recommendation:  { type: String, trim: true },
  priority:        { type: String, enum:["critical","high","medium","low",""], default:"" },

  // Tiêu chuẩn / Quy định áp dụng
  regulatoryRef:   { type: [String], default: [] },

  sortOrder:       { type: Number, default: 0 },
}, { _id: true });

// ── Main EnergyProfile Schema ──────────────────────────────────────
const energyProfileSchema = new mongoose.Schema({
  surveyId:     { type: mongoose.Schema.Types.ObjectId, ref:"Survey", required:true, index:true, unique:true },
  clientName:   { type: String, trim: true },
  auditDate:    { type: String },                    // YYYY-MM-DD

  // Tổng quan tổ chức (từ §4.1 / §6.3 Energy Review)
  baseline_year:     { type: String },               // Năm cơ sở
  review_period:     { type: String },               // Kỳ rà soát (VD: "2023-01 → 2023-12")
  total_annual_GJ:   { type: Number, default: 0 },
  total_annual_TOE:  { type: Number, default: 0 },
  total_annual_cost: { type: Number, default: 0 },
  is_large_consumer: { type: Boolean, default: false }, // ≥1000 TOE/năm (Luật 50/2010)
  large_consumer_threshold: { type: Number, default: 1000 }, // TOE/năm

  // Danh sách nguồn năng lượng
  sources: { type: [EnergySourceSchema], default: [] },

  // Nhận xét tổng quan
  overall_comment:   { type: String, trim: true },
  data_quality:      { type: String, enum:["good","fair","poor","unknown"], default:"unknown" },
  data_completeness: { type: Number, default: 0 },   // % dữ liệu đủ / thiếu

  // Bằng chứng liên quan (danh sách evidenceId từ Evidence model)
  relatedEvidenceIds: [{ type: mongoose.Schema.Types.ObjectId, ref:"Evidence" }],

  meta: { type: mongoose.Schema.Types.Mixed, default: {} },
}, {
  timestamps: true,
  strict: false,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// ── Pre-save: auto-compute totals ──────────────────────────────────
energyProfileSchema.pre("save", function (next) {
  let totalGJ = 0, totalTOE = 0, totalCost = 0;
  for (const s of this.sources || []) {
    // Re-compute annual from monthlyData if present
    if (s.monthlyData?.length) {
      s.annual_primary = s.monthlyData.reduce((a, m) => a + (m.value  || 0), 0);
      s.annual_GJ      = s.monthlyData.reduce((a, m) => a + (m.valueGJ|| 0), 0);
      s.annual_TOE     = s.monthlyData.reduce((a, m) => a + (m.valueTOE||0), 0);
      s.annual_cost    = s.monthlyData.reduce((a, m) => a + (m.cost   || 0), 0);
    }
    // Re-compute from conversionFactor if monthly GJ/TOE not filled
    if (!s.annual_GJ  && s.annual_primary && s.conversionToGJ ) s.annual_GJ  = s.annual_primary * s.conversionToGJ;
    if (!s.annual_TOE && s.annual_primary && s.conversionToTOE) s.annual_TOE = s.annual_primary * s.conversionToTOE;
    totalGJ   += s.annual_GJ   || 0;
    totalTOE  += s.annual_TOE  || 0;
    totalCost += s.annual_cost || 0;
  }
  this.total_annual_GJ   = totalGJ;
  this.total_annual_TOE  = totalTOE;
  this.total_annual_cost = totalCost;

  // Tính % tiêu thụ từng nguồn
  if (totalTOE > 0) {
    for (const s of this.sources || []) {
      s.percentOfTotal = +((s.annual_TOE / totalTOE) * 100).toFixed(2);
    }
  }

  // Xác định cơ sở trọng điểm
  this.is_large_consumer = totalTOE >= (this.large_consumer_threshold || 1000);

  next();
});

// ── Virtual: SEU list ──────────────────────────────────────────────
energyProfileSchema.virtual("seuList").get(function () {
  return (this.sources || []).filter(s => s.is_seu);
});

module.exports = mongoose.model("EnergyProfile", energyProfileSchema);
