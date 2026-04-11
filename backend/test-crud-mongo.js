/**
 * Kiểm thử toàn diện CRUD + MongoDB + truy vấn dữ liệu thật
 * Chạy: node test-crud-mongo.js
 * Yêu cầu: Backend đang chạy (npm run dev hoặc node server.js) và MongoDB đang chạy (cổng 27017)
 */
const BASE = process.env.API_BASE || "http://localhost:5002";

async function request(method, path, body = null, contentType = "application/json") {
  const url = path.startsWith("http") ? path : `${BASE}${path}`;
  const opts = { method, headers: {} };
  if (body && contentType === "application/json") {
    opts.headers["Content-Type"] = "application/json";
    opts.body = JSON.stringify(body);
  } else if (body && contentType === "multipart") {
    opts.body = body;
  }
  const res = await fetch(url, opts);
  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch (_) {
    data = text;
  }
  return { ok: res.ok, status: res.status, data, headers: res.headers };
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg || "Assertion failed");
}

let createdSurveyId;
let createdEvidenceId;
const REF_NO = `GAP-TEST-${Date.now()}`;

async function run() {
  console.log("=== Kiểm thử CRUD & MongoDB - ISO 50001 GAP ===\n");
  console.log("Base URL:", BASE);

  // ── 1. Health & MongoDB ─────────────────────────────────────
  console.log("\n[1] GET /health — Kiểm tra backend và MongoDB");
  const health = await request("GET", "/health");
  assert(health.ok, "Health check failed: " + (health.data?.error || health.status));
  assert(health.data?.mongo === "connected", "MongoDB phải đang kết nối (mongo: connected)");
  console.log("  OK — MongoDB:", health.data.mongo, "| DB:", health.data.database);

  // ── 2. GET list surveys (có thể rỗng) ────────────────────────
  console.log("\n[2] GET /api/surveys — Danh sách phiên");
  const listRes = await request("GET", "/api/surveys?limit=5");
  assert(listRes.ok || listRes.status === 503, "List surveys failed");
  if (listRes.status === 503) {
    console.log("  SKIP — MongoDB chưa kết nối");
    process.exit(1);
  }
  const list = Array.isArray(listRes.data) ? listRes.data : [];
  console.log("  OK — Số phiên hiện có:", list.length);

  // ── 3. POST survey (Create) ──────────────────────────────────
  console.log("\n[3] POST /api/surveys — Tạo phiên mới");
  const newSurvey = {
    meta: {
      ref_no: REF_NO,
      report_title: "Báo cáo test CRUD",
      survey_date: new Date().toISOString().slice(0, 10),
      version: "v1.0",
      exec_summary_items: ["Mục 1", "Mục 2"],
    },
    client: {
      name: "Công ty Test CRUD",
      site: "NM1",
      address: "123 Test",
      industry: "SX",
      contact_persons: [{ full_name: "Nguyễn A", position: "EMR", department: "Kỹ thuật", phone: "090", email: "a@test.com" }],
    },
    verifier: { org: "Đơn vị TV Test" },
    responses: { "4.1.1": { score: 3, note: "Test" }, "5.1.1": { score: 4 } },
    risk_assessments: {},
    process_gaps: {},
    site_assessments: [],
    action_plan: [{ code: "AP-01", action: "Hành động test", phase: "P1", responsible: "EMR" }],
    legal_status: {},
    risk_items: {},
  };
  const createRes = await request("POST", "/api/surveys", newSurvey);
  assert(createRes.ok, "Create survey failed: " + (createRes.data?.error || createRes.status));
  assert(createRes.data?._id, "Response phải có _id");
  createdSurveyId = createRes.data._id;
  console.log("  OK — _id:", createdSurveyId);

  // ── 4. GET survey by id (Read) ───────────────────────────────
  console.log("\n[4] GET /api/surveys/:id — Đọc phiên vừa tạo");
  const getOne = await request("GET", `/api/surveys/${createdSurveyId}`);
  assert(getOne.ok, "Get survey failed: " + (getOne.data?.error || getOne.status));
  const loaded = getOne.data;
  assert(loaded.meta?.ref_no === REF_NO, "ref_no không khớp");
  assert(loaded.client?.name === "Công ty Test CRUD", "client.name không khớp");
  assert(loaded.responses?.["4.1.1"]?.score === 3, "responses không khớp");
  assert(Array.isArray(loaded.action_plan) && loaded.action_plan.length > 0, "action_plan phải là mảng có phần tử");
  assert(Array.isArray(loaded.meta?.exec_summary_items), "exec_summary_items phải là mảng");
  assert(Array.isArray(loaded.client?.contact_persons), "contact_persons phải là mảng");
  console.log("  OK — ref_no:", loaded.meta.ref_no, "| client:", loaded.client.name, "| responses keys:", Object.keys(loaded.responses || {}).length);

  // ── 4b. GET survey by ref_no ──────────────────────────────────
  console.log("\n[4b] GET /api/surveys/ref/:ref_no — Đọc phiên theo mã tham chiếu");
  const byRef = await request("GET", `/api/surveys/ref/${encodeURIComponent(REF_NO)}`);
  assert(byRef.ok, "Get by ref_no failed: " + (byRef.data?.error || byRef.status));
  assert(byRef.data?._id === createdSurveyId, "Survey theo ref_no phải trùng _id");
  console.log("  OK — Cùng _id khi truy vấn theo ref_no");

  // ── 4c. POST trùng ref_no → 409 ───────────────────────────────
  console.log("\n[4c] POST /api/surveys (ref_no trùng) — Phải trả 409");
  const dupRes = await request("POST", "/api/surveys", { meta: { ref_no: REF_NO }, client: { name: "Khác" } });
  assert(dupRes.status === 409, "Tạo phiên trùng ref_no phải trả 409 Conflict");
  assert(dupRes.data?.id || dupRes.data?._id, "409 phải kèm id phiên đã tồn tại");
  console.log("  OK — 409 Conflict, id tồn tại:", dupRes.data?.id || dupRes.data?._id);

  // ── 5. PUT survey (Update) ───────────────────────────────────
  console.log("\n[5] PUT /api/surveys/:id — Cập nhật phiên");
  const updated = { ...loaded, client: { ...loaded.client, name: "Công ty Test CRUD (đã cập nhật)", employees: "200" } };
  updated.responses["5.1.1"] = { score: 5, note: "Cập nhật" };
  const putRes = await request("PUT", `/api/surveys/${createdSurveyId}`, updated);
  assert(putRes.ok, "Update survey failed: " + (putRes.data?.error || putRes.status));
  assert(putRes.data?.client?.name === "Công ty Test CRUD (đã cập nhật)", "Tên client sau update không đúng");
  assert(putRes.data?.client?.employees === "200", "employees sau update không đúng");
  console.log("  OK — client.name:", putRes.data.client.name, "| employees:", putRes.data.client.employees);

  // ── 6. GET lại và so sánh (truy vấn dữ liệu thật) ─────────────
  console.log("\n[6] GET /api/surveys/:id — Đọc lại sau update (dữ liệu thật MongoDB)");
  const getAgain = await request("GET", `/api/surveys/${createdSurveyId}`);
  assert(getAgain.ok, "Get again failed");
  assert(getAgain.data?.client?.name === "Công ty Test CRUD (đã cập nhật)", "Dữ liệu MongoDB không khớp sau update");
  assert(getAgain.data?.responses?.["5.1.1"]?.score === 5, "responses.5.1.1 sau update không khớp");
  console.log("  OK — Dữ liệu đọc từ MongoDB khớp với dữ liệu đã lưu");

  // ── 7. Evidence: POST (base64 ảnh) ───────────────────────────
  console.log("\n[7] POST /api/surveys/:id/evidence/base64 — Thêm bằng chứng (ảnh base64)");
  const tinyBase64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
  const evRes = await request("POST", `/api/surveys/${createdSurveyId}/evidence/base64`, {
    imageBase64: tinyBase64,
    clauseId: "4.1",
    note: "Bằng chứng test CRUD",
  });
  assert(evRes.ok, "Evidence POST failed: " + (evRes.data?.error || evRes.status));
  assert(evRes.data?._id, "Evidence phải trả về _id");
  createdEvidenceId = evRes.data._id;
  console.log("  OK — evidence _id:", createdEvidenceId);

  // ── 8. Evidence: GET list ────────────────────────────────────
  console.log("\n[8] GET /api/surveys/:id/evidence — Danh sách bằng chứng");
  const evList = await request("GET", `/api/surveys/${createdSurveyId}/evidence`);
  assert(evList.ok, "Evidence list failed");
  const evArr = Array.isArray(evList.data) ? evList.data : [];
  assert(evArr.some((e) => e._id === createdEvidenceId), "Bằng chứng vừa tạo phải có trong danh sách");
  console.log("  OK — Số bằng chứng:", evArr.length);

  // ── 8b. Evidence: PUT (cập nhật note) ─────────────────────────
  console.log("\n[8b] PUT /api/surveys/:id/evidence/:eid — Cập nhật ghi chú bằng chứng");
  const putEv = await request("PUT", `/api/surveys/${createdSurveyId}/evidence/${createdEvidenceId}`, {
    note: "Ghi chú đã cập nhật bởi test CRUD",
    clauseId: "5.1",
  });
  assert(putEv.ok, "Evidence PUT failed: " + (putEv.data?.error || putEv.status));
  assert(putEv.data?.note === "Ghi chú đã cập nhật bởi test CRUD", "note sau update không đúng");
  assert(putEv.data?.clauseId === "5.1", "clauseId sau update không đúng");
  console.log("  OK — note & clauseId đã cập nhật");

  // ── 9. Gap report generate (dùng dữ liệu thật) ───────────────
  console.log("\n[9] POST /api/iso50001/gap/generate — Xuất báo cáo DOCX (dữ liệu thật)");
  const docPayload = { ...getAgain.data, _id: createdSurveyId };
  const docResRaw = await fetch(`${BASE}/api/iso50001/gap/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(docPayload),
  });
  assert(docResRaw.ok, "Gap generate failed: " + docResRaw.status);
  const contentType = docResRaw.headers.get("content-type") || "";
  assert(
    contentType.includes("wordprocessingml") || contentType.includes("octet-stream"),
    "Content-Type phải là DOCX (wordprocessingml hoặc octet-stream)"
  );
  const buf = await docResRaw.arrayBuffer();
  assert(buf.byteLength > 1000, "Kích thước file DOCX phải > 1KB");
  console.log("  OK — DOCX generated, size:", buf.byteLength, "bytes");

  // ── 10. Evidence: DELETE ─────────────────────────────────────
  console.log("\n[10] DELETE /api/surveys/:id/evidence/:eid — Xóa bằng chứng");
  const delEv = await request("DELETE", `/api/surveys/${createdSurveyId}/evidence/${createdEvidenceId}`);
  assert(delEv.ok, "Evidence DELETE failed: " + (delEv.data?.error || delEv.status));
  const evListAfter = await request("GET", `/api/surveys/${createdSurveyId}/evidence`);
  const afterArr = Array.isArray(evListAfter.data) ? evListAfter.data : [];
  assert(!afterArr.some((e) => e._id === createdEvidenceId), "Bằng chứng đã xóa không còn trong list");
  console.log("  OK — Bằng chứng đã xóa");

  // ── 11. DELETE survey (cleanup) ───────────────────────────────
  console.log("\n[11] DELETE /api/surveys/:id — Xóa phiên test");
  const delSurvey = await request("DELETE", `/api/surveys/${createdSurveyId}`);
  assert(delSurvey.ok, "Survey DELETE failed: " + (delSurvey.data?.error || delSurvey.status));
  const getDeleted = await request("GET", `/api/surveys/${createdSurveyId}`);
  assert(getDeleted.status === 404, "Phiên đã xóa không còn GET được (404)");
  console.log("  OK — Phiên đã xóa, GET trả 404");

  console.log("\n=== Tất cả bước kiểm thử CRUD & MongoDB đã PASS ===\n");
}

run().catch((err) => {
  console.error("\n[FAIL]", err.message);
  process.exit(1);
});
