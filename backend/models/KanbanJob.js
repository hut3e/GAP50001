/**
 * KanbanJob — mỗi kế hoạch đánh giá GAP là một job trên bảng Kanban
 * Sync từ Survey.audit_plan; status được quản lý riêng.
 */
const mongoose = require("mongoose");

const kanbanJobSchema = new mongoose.Schema(
  {
    surveyId:   { type: mongoose.Schema.Types.ObjectId, ref: "Survey", unique: true },
    ref_no:     { type: String, default: "" },
    customer:   { type: String, default: "" },
    site:       { type: String, default: "" },
    plan_code:  { type: String, default: "" },
    visit_no:   { type: String, default: "" },
    from_date:  { type: String, default: "" },   // "YYYY-MM-DD" hoặc "DD/MM/YYYY"
    to_date:    { type: String, default: "" },
    auditors:   { type: [mongoose.Schema.Types.Mixed], default: [] }, // [{name,role,org}]
    lead:       { type: String, default: "" },

    // Kanban state
    status: {
      type: String,
      enum: ["planned","in_progress","waiting_client","completed","overdue"],
      default: "planned",
    },
    priority:   { type: String, enum: ["low","normal","high","urgent"], default: "normal" },
    order:      { type: Number, default: 0 },   // vị trí trong cột

    // Tracking
    notes:      { type: String, default: "" },
    tags:       { type: [String], default: [] },
    assignee:   { type: String, default: "" },
    checklist:  { type: [{ text: String, done: { type: Boolean, default: false } }], default: [] },

    // GAP stats snapshot (sync từ Survey responses)
    stats: {
      total_clauses:  { type: Number, default: 0 },
      scored:         { type: Number, default: 0 },
      critical:       { type: Number, default: 0 },
      major:          { type: Number, default: 0 },
      avg_score:      { type: Number, default: 0 },
    },

    // Telegram notification flags
    notified_upcoming: { type: Boolean, default: false },
    notified_overdue:  { type: Boolean, default: false },
    last_notified_at:  { type: Date, default: null },
  },
  { timestamps: true }
);

kanbanJobSchema.index({ status: 1, order: 1 });
kanbanJobSchema.index({ from_date: 1 });
kanbanJobSchema.index({ to_date: 1 });

module.exports = mongoose.model("KanbanJob", kanbanJobSchema);
