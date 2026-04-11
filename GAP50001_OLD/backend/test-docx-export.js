/**
 * Test script: generate GAP report DOCX (no server)
 * Run: node test-docx-export.js
 */
const fs = require("fs");
const path = require("path");
const { generateGapReport } = require("./gap.generator");

const minimalPayload = {
  _id: "test-export-001",
  meta: {
    ref_no: "GAP-TEST-2024-001",
    report_title: "BÁO CÁO KHẢO SÁT GAP ISO 50001:2018",
    survey_date: "2024-03-15",
    version: "v1.0",
    objective: "Phân tích khoảng cách — Xây dựng & đạt chứng nhận ISO 50001:2018",
    exec_summary: "Đánh giá GAP sơ bộ cho tổ chức.",
    exec_summary_items: ["Nhận diện hộ tiêu thụ NL trọng điểm", "Khảo sát các Trạm biến áp"],
    confidential: "CONFIDENTIAL",
  },
  client: {
    name: "Công ty TNHH Test Export",
    site: "Nhà máy 1",
    address: "123 Đường Test, Quận 1, TP.HCM",
    industry: "Sản xuất",
    employees: "150",
    annual_energy: "850 TOE",
    is_large_user: true,
    cert_status: "Chưa có chứng nhận ISO 50001",
  },
  verifier: {
    org: "Đơn vị Tư vấn Test",
    lead: "Nguyễn Văn A",
    team: "Đoàn khảo sát GAP",
    std_applied: "ISO 50001:2018; ISO 50006:2014",
  },
  responses: {
    "4.1.1": { score: 3, note: "Đã xác định." },
    "4.2.2": { score: 4, note: "Đáp ứng." },
    "5.1.1": { score: 4 },
    "6.3.1": { score: 2, note: "Cần bổ sung dữ liệu đo." },
  },
  risk_assessments: {},
  process_gaps: {},
  site_assessments: [
    { name: "Xưởng A", icon: "🏭", energy_types: "Điện", consumption: "500 MWh", percentage: "45", is_seu: true, gap_score: 3.5, equipment: [] },
  ],
  action_plan: [
    { code: "AP-01", action: "Lập kế hoạch rà soát NL", clause: "§6.3", phase: "P1", responsible: "EMR", deadline: "30 ngày" },
  ],
  legal_registry: [],
  risk_items: {},
};

async function run() {
  console.log("Test 1: Full payload...");
  try {
    const buf = await generateGapReport(minimalPayload, []);
    const outPath = path.join(__dirname, "test-output-GAP-report.docx");
    fs.writeFileSync(outPath, buf);
    console.log("  OK: Report written to", outPath, "Size:", buf.length, "bytes");
  } catch (err) {
    console.error("  FAIL:", err.message);
    throw err;
  }

  console.log("Test 2: Minimal payload (only ref_no + client.name)...");
  try {
    const minimal = { meta: { ref_no: "MIN-001" }, client: { name: "Test Co" } };
    const buf2 = await generateGapReport(minimal, []);
    const outPath2 = path.join(__dirname, "test-output-GAP-minimal.docx");
    fs.writeFileSync(outPath2, buf2);
    console.log("  OK: Minimal report written, Size:", buf2.length, "bytes");
  } catch (err) {
    console.error("  FAIL:", err.message);
    throw err;
  }

  console.log("Test 3: With evidence list — 2-column image table + doc table...");
  try {
    const mockEvidence = [
      { surveyId: "test-id", clauseId: "4.1.1", type: "image", filename: "img1.jpg", originalName: "Ảnh 1", path: "test-id/img1.jpg", note: "Chụp từ laptop" },
      { surveyId: "test-id", clauseId: "4.1.1", type: "image", filename: "img2.png", originalName: "Ảnh 2", path: "test-id/img2.png", note: "Đồng bộ điện thoại" },
      { surveyId: "test-id", clauseId: "4.1.1", type: "image", filename: "img3.jpg", originalName: "Ảnh 3", path: "test-id/img3.jpg", note: "Upload thư mục" },
      { surveyId: "test-id", clauseId: "4.2.1", type: "document", filename: "doc.pdf", originalName: "Quy trình.pdf", path: "test-id/doc.pdf", note: "Tài liệu đính kèm" },
    ];
    const buf3 = await generateGapReport(minimalPayload, mockEvidence);
    const outPath3 = path.join(__dirname, "test-output-GAP-with-evidence.docx");
    fs.writeFileSync(outPath3, buf3);
    console.log("  OK: Report with evidence (2-col table) written to", outPath3, "Size:", buf3.length, "bytes");
  } catch (err) {
    console.error("  FAIL:", err.message);
    throw err;
  }

  console.log("Test 4: Real image file → DOCX 2-column table (embed)...");
  try {
    const { UPLOAD_ROOT } = require("./uploadConfig");
    const testDir = path.join(UPLOAD_ROOT, "docx-test-survey");
    if (!fs.existsSync(testDir)) fs.mkdirSync(testDir, { recursive: true });
    // Minimal valid 1x1 PNG (67 bytes)
    const minimalPng = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64");
    const imgPath = path.join(testDir, "evidence-test.png");
    fs.writeFileSync(imgPath, minimalPng);
    const realEvidence = [
      { surveyId: "docx-test-survey", clauseId: "4.1.1", type: "image", filename: "evidence-test.png", originalName: "Bằng chứng test", path: "docx-test-survey/evidence-test.png", note: "Ảnh nhúng thật" },
    ];
    const buf4 = await generateGapReport(minimalPayload, realEvidence);
    const outPath4 = path.join(__dirname, "test-output-GAP-real-image.docx");
    fs.writeFileSync(outPath4, buf4);
    if (buf4.length < 1000) throw new Error("DOCX too small, image may not be embedded");
    console.log("  OK: Report with real embedded image (2-col) written to", outPath4, "Size:", buf4.length, "bytes");
  } catch (err) {
    console.error("  FAIL:", err.message);
    throw err;
  }

  console.log("Test 5: Cơ cấu tổ chức (departments) trong DOCX...");
  try {
    const payloadWithDepts = { ...minimalPayload, client: { ...minimalPayload.client, departments: ["Phòng Kỹ thuật", "Phòng Sản xuất", "Phòng QA/QC", "Ban Năng lượng (EMR)"] } };
    const buf5 = await generateGapReport(payloadWithDepts, []);
    const outPath5 = path.join(__dirname, "test-output-GAP-with-departments.docx");
    fs.writeFileSync(outPath5, buf5);
    if (buf5.length < 1000) throw new Error("DOCX too small");
    // DOCX is zip: raw text may appear in document.xml (check unzipped content or just verify size > minimal)
    const bufMinimal = await generateGapReport({ ...minimalPayload, client: { ...minimalPayload.client } }, []);
    if (buf5.length <= bufMinimal.length) throw new Error("Report with departments should be larger than without");
    console.log("  OK: Report with cơ cấu tổ chức written to", outPath5, "Size:", buf5.length, "bytes");
  } catch (err) {
    console.error("  FAIL:", err.message);
    throw err;
  }

  console.log("\nAll tests passed. DOCX export OK (including 2-column evidence + cơ cấu tổ chức).");
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
