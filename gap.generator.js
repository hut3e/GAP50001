/**
 * ISO50001Gap — gap.generator.js + gap.routes.js
 * Main DOCX assembler + Express route handler
 *
 * Standalone:  node gap.routes.js
 * Mount:       app.use('/api/iso50001/gap', require('./gap.routes'));
 */
const { Document, Packer, TableOfContents } = require("docx");
const { DOC_STYLES, DOC_NUMBERING, DOC_PAGE, mkHeader, mkFooter } = require("./gap.docx.helpers");
const { buildCover, buildExecutiveSummary, buildGeneralInfo } = require("./gap.docx.cover");
const { buildAllClauses }         = require("./gap.docx.clauses");
const { buildRiskSection, buildProcessSection } = require("./gap.docx.risk");
const { buildSiteSection, buildActionPlan, buildLegalAppendix } = require("./gap.docx.site");

// ── Defaults ──────────────────────────────────────────────────────
function applyDefaults(data) {
  const d = JSON.parse(JSON.stringify(data));
  d.meta.confidential = d.meta.confidential || "CONFIDENTIAL — Chỉ phát hành cho tổ chức được chỉ định";
  d.meta.version      = d.meta.version      || "v1.0";
  d.meta.objective    = d.meta.objective    || "Phân tích khoảng cách (Gap Analysis) — Xây dựng & đạt chứng nhận ISO 50001:2018";
  d.verifier.std_applied = d.verifier.std_applied || "ISO 50001:2018; ISO 50006:2014; ISO 50002:2014; ISO 50047:2016";
  return d;
}

// ── Main generator ────────────────────────────────────────────────
async function generateGapReport(data) {
  const d = applyDefaults(data);
  // Section numbering: 1=cover, 2=general, 3-9=clauses, 10=risk, 11=process, 12=site, 13=action, 14=appendix
  const numClauses = 7; // §4–§10
  const sRisk    = 3 + numClauses;      // 10
  const sProcess = sRisk + 1;           // 11
  const sSite    = sProcess + 1;        // 12
  const sAction  = sSite + 1;           // 13
  const sAppendix= sAction + 1;         // 14

  const children = [
    ...buildCover(d),
    ...[new (require("docx").TableOfContents)("Mục lục", { hyperlink:true, headingStyleRange:"1-3" })],
    ...[new (require("docx").Paragraph)({ children:[new (require("docx").PageBreak)()] })],
    ...buildExecutiveSummary(d),
    ...buildGeneralInfo(d),
    ...buildAllClauses(d, 3),           // §4–§10 → sections 3–9
    ...buildRiskSection(d, sRisk),
    ...buildProcessSection(d, sProcess),
    ...buildSiteSection(d, sSite),
    ...buildActionPlan(d, sAction),
    ...buildLegalAppendix(d, sAppendix),
  ];

  const doc = new Document({
    creator: "ISO 50001 GAP Survey Tool",
    title:   `${d.meta.report_title||"Báo cáo Khảo sát GAP ISO 50001"} — ${d.meta.ref_no||""}`,
    styles:  DOC_STYLES,
    numbering: DOC_NUMBERING,
    sections:[{
      properties:{ page:{ ...DOC_PAGE.size, margin:DOC_PAGE.margin }, titlePage:true },
      headers:{ default:mkHeader(d) },
      footers:{ default:mkFooter(d) },
      children,
    }],
  });
  return await Packer.toBuffer(doc);
}
module.exports = { generateGapReport };

// ═══════════════════════════════════════════════════════════
// EXPRESS ROUTE (gap.routes.js inline)
// ═══════════════════════════════════════════════════════════
if (require.main === module) {
  const express = require("express");
  const cors    = require("cors");
  const app     = express();
  const PORT    = process.env.PORT || 5002;
  app.use(cors({ origin:"*" }));
  app.use(express.json({ limit:"20mb" }));

  // POST /api/iso50001/gap/generate
  app.post("/api/iso50001/gap/generate", async (req, res) => {
    try {
      const d = req.body;
      if (!d?.meta?.ref_no)  return res.status(400).json({ error:"meta.ref_no required" });
      if (!d?.client?.name)  return res.status(400).json({ error:"client.name required" });
      const buf  = await generateGapReport(d);
      const name = `ISO50001_GAP_${d.meta.ref_no.replace(/[^A-Za-z0-9_-]/g,"_")}.docx`;
      res.setHeader("Content-Disposition", `attachment; filename="${name}"`);
      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
      res.setHeader("Content-Length", buf.length);
      res.send(buf);
    } catch (err) {
      console.error("[GAP Report]", err);
      res.status(500).json({ error:"Report generation failed", detail:err.message });
    }
  });

  // GET /api/iso50001/gap/schema
  app.get("/api/iso50001/gap/schema", (_req, res) => res.json({
    meta:{ ref_no:"", report_title:"BÁO CÁO KHẢO SÁT GAP ISO 50001:2018",
           survey_date:"", version:"v1.0", objective:"", exec_summary:"", confidential:"" },
    client:{ name:"", site:"", address:"", industry:"",
             employees:"", annual_energy:"", is_large_user:false, cert_status:"" },
    verifier:{ org:"", accred:"", lead:"", team:"", cert_no:"", survey_date:"", std_applied:"" },
    responses:{
      "4.1.1":{ score:0, note:"", recommendation:"", deadline:"" },
    },
    risk_assessments:{ "RL-01":{ likelihood:0, impact:0, control:"", recommendation:"" } },
    process_gaps:{ "PR-01":{ score:0, finding:"", evidence:"", action:"", notes:"" } },
    site_assessments:[{
      name:"", icon:"🏭", energy_types:"", consumption:"", percentage:"",
      is_seu:false, operator:"", potential:"", gap_score:0, notes:"",
      equipment:[{ name:"", type:"", capacity:"", status:"good", gap_score:0, finding:"" }],
    }],
    action_plan:[{ code:"AP-01", action:"", clause:"", phase:"P1", responsible:"", deadline:"", resources:"" }],
    legal_status:{ "Luật 50/2010/QH12":"pending" },
    certification_roadmap:{},
  }));

  app.get("/health", (_req, res) => res.json({ status:"ok", service:"ISO 50001 GAP Survey Generator" }));
  app.listen(PORT, () => {
    console.log(`\n✅ ISO 50001 GAP Generator: http://localhost:${PORT}`);
    console.log(`   POST /api/iso50001/gap/generate\n`);
  });
}
