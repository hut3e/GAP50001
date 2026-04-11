const mongoose = require("mongoose");

const AuditorSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  org: { type: String, default: "" },
  role: { type: String, default: "Auditor" },
  email: { type: String, default: "" },
  phone: { type: String, default: "" },
}, { timestamps: true });

module.exports = mongoose.model("Auditor", AuditorSchema);
