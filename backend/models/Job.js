const mongoose = require("mongoose");

const jobSchema = new mongoose.Schema({
  title: { type: String, required: true },
  assignee: { type: String },
  start_date: { type: Date },
  end_date: { type: Date },
  attached_docs: { type: String },
  tools_needed: { type: String },
  status: { type: String, default: "pending" },
  priority: { type: String, default: "medium" },
  telegram_targets: { type: [String], default: [] },
  survey_id: { type: mongoose.Schema.Types.ObjectId, ref: "Survey" },
}, { timestamps: true });

module.exports = mongoose.model("Job", jobSchema);
