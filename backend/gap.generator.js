/**
 * ISO50001Gap — DOCX report generator (no Express)
 */
const { Document, Packer, TableOfContents } = require("docx");
const { DOC_STYLES, DOC_NUMBERING, DOC_PAGE, mkHeader, mkFooter } = require("./gap.docx.helpers");
const { buildCover, buildExecutiveSummary, buildGeneralInfo } = require("./gap.docx.cover");
const { buildAllClauses } = require("./gap.docx.clauses");
const { buildRiskSection, buildProcessSection } = require("./gap.docx.risk");
const { buildSiteSection, buildMetersSection, buildActionPlan, buildLegalAppendix } = require("./gap.docx.site");
const { buildEvidenceSection } = require("./gap.docx.evidence");

function applyDefaults(data) {
  const d = JSON.parse(JSON.stringify(data || {}));
  d.meta = d.meta || {};
  d.client = d.client || {};
  d.meta.confidential = d.meta.confidential || "CONFIDENTIAL — Chỉ phát hành cho tổ chức được chỉ định";
  d.meta.version = d.meta.version || "v1.0";
  d.meta.objective =
    d.meta.objective ||
    "Phân tích khoảng cách (Gap Analysis) — Xây dựng & đạt chứng nhận ISO 50001:2018";
  d.verifier = d.verifier || {};
  d.verifier.std_applied =
    d.verifier.std_applied || "ISO 50001:2018; ISO 50006:2014; ISO 50002:2014; ISO 50047:2016";
  d.responses = d.responses || {};
  d.risk_assessments = d.risk_assessments || {};
  d.process_gaps = d.process_gaps || {};
  d.site_assessments = Array.isArray(d.site_assessments) ? d.site_assessments : [];
  d.meters = Array.isArray(d.meters) ? d.meters : [];
  d.action_plan = Array.isArray(d.action_plan) ? d.action_plan : [];
  d.risk_items = d.risk_items || {};
  d.legal_status = d.legal_status || {};
  d.legal_registry = Array.isArray(d.legal_registry) ? d.legal_registry : [];
  d.iso_standards_registry = Array.isArray(d.iso_standards_registry) ? d.iso_standards_registry : [];
  return d;
}

async function generateGapReport(data, evidenceList = [], checklist = null) {
  const d = applyDefaults(data);
  const numClauses = 7;
  const sRisk = 3 + numClauses;
  const sProcess = sRisk + 1;
  const sSite = sProcess + 1;
  const sMeters = sSite + 1;
  const sAction = sMeters + 1;
  const sEvidence = sAction + 1;
  const sAppendix = sEvidence + 1;

  const children = [
    ...buildCover(d, checklist),
    ...[new TableOfContents("Mục lục", { hyperlink: true, headingStyleRange: "1-3" })],
    ...[new (require("docx").Paragraph)({ children: [new (require("docx").PageBreak)()] })],
    ...buildExecutiveSummary(d, checklist),
    ...buildGeneralInfo(d),
    ...buildAllClauses(d, 3, checklist),
    ...buildRiskSection(d, sRisk),
    ...buildProcessSection(d, sProcess),
    ...buildSiteSection(d, sSite),
    ...buildMetersSection(d, sMeters),
    ...buildActionPlan(d, sAction),
    ...buildEvidenceSection(d, evidenceList, sEvidence),
    ...buildLegalAppendix(d, sAppendix),
  ];

  const doc = new Document({
    creator: "ISO 50001 GAP Survey Tool",
    title: `${d.meta.report_title || "Báo cáo Khảo sát GAP ISO 50001"} — ${d.meta.ref_no || ""}`,
    styles: DOC_STYLES,
    numbering: DOC_NUMBERING,
    sections: [
      {
        properties: {
          page: { ...DOC_PAGE.size, margin: DOC_PAGE.margin },
          titlePage: true,
        },
        headers: { default: mkHeader(d) },
        footers: { default: mkFooter(d) },
        children,
      },
    ],
  });
  return await Packer.toBuffer(doc);
}

module.exports = { generateGapReport };
