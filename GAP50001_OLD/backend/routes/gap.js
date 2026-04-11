/**
 * ISO 50001 GAP — Routes: generate DOCX, schema
 */
const express = require("express");
const mongoose = require("mongoose");
const { generateGapReport } = require("../gap.generator");
const Evidence = require("../models/Evidence");

const router = express.Router();

router.post("/generate", async (req, res) => {
  try {
    const d = req.body;
    if (!d?.meta?.ref_no) return res.status(400).json({ error: "meta.ref_no required" });
    if (!d?.client?.name) return res.status(400).json({ error: "client.name required" });
    let evidenceList = [];
    const surveyId = d._id;
    if (surveyId && mongoose.Types.ObjectId.isValid(surveyId)) {
      try {
        evidenceList = await Evidence.find({ surveyId }).sort({ clauseId: 1, createdAt: 1 }).lean();
      } catch (_) {}
    }
    const buf = await generateGapReport(d, evidenceList);
    const name = `ISO50001_GAP_${(d.meta.ref_no || "report").replace(/[^A-Za-z0-9_-]/g, "_")}.docx`;
    res.setHeader("Content-Disposition", `attachment; filename="${name}"`);
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
    res.setHeader("Content-Length", buf.length);
    res.send(buf);
  } catch (err) {
    console.error("[GAP Report]", err);
    res.status(500).json({ error: "Report generation failed", detail: err.message });
  }
});

router.get("/schema", (_req, res) =>
  res.json({
    meta: {
      ref_no: "",
      report_title: "BÁO CÁO KHẢO SÁT GAP ISO 50001:2018",
      survey_date: "",
      version: "v1.0",
      objective: "",
      exec_summary: "",
      confidential: "",
    },
    client: {
      name: "",
      site: "",
      address: "",
      industry: "",
      employees: "",
      annual_energy: "",
      is_large_user: false,
      cert_status: "",
    },
    verifier: {
      org: "",
      accred: "",
      lead: "",
      team: "",
      cert_no: "",
      survey_date: "",
      std_applied: "",
    },
    responses: { "4.1.1": { score: 0, note: "", recommendation: "", deadline: "" } },
    risk_assessments: { "RL-01": { likelihood: 0, impact: 0, control: "", recommendation: "" } },
    process_gaps: { "PR-01": { score: 0, finding: "", evidence: "", action: "", notes: "" } },
    site_assessments: [
      {
        name: "",
        icon: "🏭",
        energy_types: "",
        consumption: "",
        percentage: "",
        is_seu: false,
        operator: "",
        potential: "",
        gap_score: 0,
        notes: "",
        equipment: [{ name: "", type: "", capacity: "", status: "good", gap_score: 0, finding: "" }],
      },
    ],
    action_plan: [
      { code: "AP-01", action: "", clause: "", phase: "P1", responsible: "", deadline: "", resources: "" },
    ],
    legal_status: { "Luật 50/2010/QH12, Luật 77/2025/QH15": "pending" },
    legal_registry: [],
    iso_standards_registry: [],
    certification_roadmap: [],
  })
);

module.exports = router;
