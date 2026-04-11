const mongoose = require("mongoose");

const ClientSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  site: { type: String, default: "" },
  industry: { type: String, default: "" },
  annual_energy: { type: String, default: "" },
  cert_status: { type: String, default: "" },
  address: { type: String, default: "" },
  contact_person: { type: String, default: "" },
}, { timestamps: true });

module.exports = mongoose.model("Client", ClientSchema);
