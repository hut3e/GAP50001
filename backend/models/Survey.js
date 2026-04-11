/**
 * ISO 50001 GAP Survey — Mongoose model
 * Lưu trữ phiên khảo sát GAP theo ISO 50001:2018
 */
const mongoose = require("mongoose");

const surveySchema = new mongoose.Schema(
  {
    meta: {
      ref_no: { type: String, required: true, trim: true },
      report_title: String,
      survey_date: String,
      version: { type: String, default: "v1.0" },
      objective: String,
      exec_summary: String,
      /** Danh sách mục tóm tắt điều hành (dropdown + CRUD). Dùng cho xuất báo cáo khi có; nếu không có thì dùng exec_summary. */
      exec_summary_items: { type: [String], default: [] },
      confidential: String,
      /** Logo header: data URL (base64) — logo trái & phải TopBar */
      logo_left_url: String,
      logo_right_url: String,
    },
    client: {
      name: { type: String, required: true, trim: true },
      site: String,
      address: String,
      industry: String,
      employees: String,
      annual_energy: String,
      is_large_user: Boolean,
      cert_status: String,
      // Người đại diện Công ty
      representative_name: String,
      representative_position: String,
      // Người liên hệ (CRUD): [{ full_name, position, department, phone, email }]
      contact_persons: { type: [mongoose.Schema.Types.Mixed], default: [] },
      // Cơ cấu tổ chức: danh sách phòng ban chức năng (dropdown + CRUD, lưu/truy vấn MongoDB)
      departments: { type: [String], default: [] },
      production_shifts: String,       // Số ca sản xuất
      products_services: String,      // Sản phẩm và dịch vụ cung cấp
      scope_geographical: mongoose.Schema.Types.Mixed,
      scope_energy: mongoose.Schema.Types.Mixed,
      scope_product: mongoose.Schema.Types.Mixed,
      scope_control_method: mongoose.Schema.Types.Mixed,
    },
    verifier: {
      org: String,
      accred: String,
      lead: String,
      team: String,
      cert_no: String,
      survey_date: String,
      std_applied: String,
    },
    /** Kế hoạch đánh giá GAP & đoàn đánh giá (quản trị nhiều phiên/kế hoạch) */
    audit_plan: {
      plan_code: String, // Mã kế hoạch / Proposal / Contract
      visit_no: String, // Đợt khảo sát số mấy (VD: Đợt 1/2024)
      from_date: String,
      to_date: String,
      from_city: String,
      to_city: String,
      customer_ref: String, // Mã khách hàng nội bộ (nếu có)
      auditors: { type: [mongoose.Schema.Types.Mixed], default: [] }, // [{ name, role, org, phone, email }]
    },
    /** Clause responses: { [clauseId]: { score, note, extra_notes?, tags?: [{ type:'cat'|'weight'|'legal'|'custom', label }] } } */
    responses: { type: mongoose.Schema.Types.Mixed, default: {} },
    risk_assessments: { type: mongoose.Schema.Types.Mixed, default: {} },
    process_gaps: { type: mongoose.Schema.Types.Mixed, default: {} },
    site_assessments: { type: [mongoose.Schema.Types.Mixed], default: [] },
    solar_assessments: { type: [mongoose.Schema.Types.Mixed], default: [] },
    action_plan: { type: [mongoose.Schema.Types.Mixed], default: [] },
    legal_status: { type: mongoose.Schema.Types.Mixed, default: {} },
    /** A.1 — Đăng ký tuân thủ pháp luật VN: [{ code, subject, doc_type, articles, threshold?, status? }] */
    legal_registry: { type: [mongoose.Schema.Types.Mixed], default: [] },
    /** A.2 — Họ tiêu chuẩn ISO 500xx: [{ standard_id, focus }] */
    iso_standards_registry: { type: [mongoose.Schema.Types.Mixed], default: [] },
    certification_roadmap: { type: [mongoose.Schema.Types.Mixed], default: [] },
    /** Danh sách rủi ro theo nhóm (CRUD): { [categoryId]: [ { id, risk, ref, likelihood, impact, control, recommendation, deadline } ] } */
    risk_items: { type: mongoose.Schema.Types.Mixed, default: {} },
    /** Logistics cho chuyến khảo sát: di chuyển & lưu trú — phục vụ truy vết kế hoạch */
    logistics_trips: { type: [mongoose.Schema.Types.Mixed], default: [] },
    travel_logs: { type: [mongoose.Schema.Types.Mixed], default: [] },
    hotel_logs: { type: [mongoose.Schema.Types.Mixed], default: [] },
  },
  {
    timestamps: true,
    strict: false,
  }
);

surveySchema.index({ "meta.ref_no": 1 }, { unique: true });
surveySchema.index({ "client.name": 1, createdAt: -1 });

module.exports = mongoose.model("Survey", surveySchema);
