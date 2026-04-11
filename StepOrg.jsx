/**
 * ISO50001Gap — frontend/StepOrg.jsx
 * Step 1: Thông tin tổ chức, cơ sở, đoàn khảo sát, mục tiêu
 */
import { C } from "./gap.ui.constants.js";
import { Card, Field, Grid, Input, TA, Sel, Rule, Tag } from "./gap.atoms.jsx";

const INDUSTRIES = [
  "", "Sản xuất xi-măng", "Sản xuất thép / kim loại", "Sản xuất giấy / bột giấy",
  "Sản xuất hóa chất / phân bón", "Sản xuất nhựa / cao su", "Dệt may / sợi",
  "Thực phẩm & Đồ uống", "Điện tử / Linh kiện", "Gỗ / Nội thất", "Khai thác / Chế biến khoáng sản",
  "Sản xuất gạch ngói / vật liệu XD", "Chế biến thủy hải sản", "Khách sạn / Tòa nhà thương mại",
  "Bệnh viện / Y tế", "Cảng biển / Logistics", "Năng lượng tái tạo", "Khác",
];
const CERT_STATUSES = [
  ["Chưa có chứng nhận ISO 50001", "Chưa có chứng nhận ISO 50001"],
  ["Đang xây dựng EnMS", "Đang xây dựng EnMS (In Progress)"],
  ["Đã có chứng nhận, cần cải tiến", "Đã có — Cần cải tiến (Surveillance)"],
  ["Hết hạn chứng nhận", "Đã hết hạn — Cần tái chứng nhận"],
];
const PHASES = [
  ["Gap Analysis (Khảo sát khoảng cách)", "🔍 Gap Analysis (Khảo sát khoảng cách)"],
  ["Tư vấn xây dựng EnMS", "🏗️ Tư vấn xây dựng EnMS từ đầu"],
  ["Đánh giá nội bộ EnMS", "✔️ Đánh giá nội bộ EnMS"],
  ["Chuẩn bị chứng nhận", "🏅 Chuẩn bị chứng nhận ISO 50001"],
  ["Tái chứng nhận / Giám sát", "🔄 Tái chứng nhận / Surveillance"],
];

export default function StepOrg({ survey, setSurvey }) {
  const setMeta = (k, v) => setSurvey(p => ({ ...p, meta: { ...p.meta, [k]: v } }));
  const setClient = (k, v) => setSurvey(p => ({ ...p, client: { ...p.client, [k]: v } }));
  const setVerifier = (k, v) => setSurvey(p => ({ ...p, verifier: { ...p.verifier, [k]: v } }));

  const { meta, client, verifier } = survey;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>

      {/* Survey meta */}
      <Card title="Thông tin khảo sát" icon="📋" accent={C.blue}>
        <Grid cols={2} gap={10}>
          <Field label="Mã khảo sát" required>
            <Input value={meta.ref_no} onChange={v => setMeta("ref_no", v)} placeholder="GAP-2024-001" />
          </Field>
          <Field label="Ngày khảo sát">
            <Input value={meta.survey_date} onChange={v => setMeta("survey_date", v)} placeholder="DD/MM/YYYY – DD/MM/YYYY" />
          </Field>
          <Field label="Phiên bản"><Input value={meta.version} onChange={v => setMeta("version", v)} placeholder="v1.0" /></Field>
          <Field label="Giai đoạn tư vấn">
            <Sel value={meta.phase || "Gap Analysis (Khảo sát khoảng cách)"} onChange={v => setMeta("phase", v)} options={PHASES} />
          </Field>
          <Field label="Tiêu đề báo cáo" sx={{ gridColumn: "1/-1" }}>
            <Input value={meta.report_title} onChange={v => setMeta("report_title", v)}
              placeholder="BÁO CÁO KHẢO SÁT GAP ISO 50001:2018 — TÊN TỔ CHỨC" />
          </Field>
          <Field label="Mục tiêu khảo sát" sx={{ gridColumn: "1/-1" }}>
            <TA value={meta.objective} onChange={v => setMeta("objective", v)} rows={2}
              placeholder="Phân tích khoảng cách giữa thực trạng EnMS và yêu cầu ISO 50001:2018 để lên kế hoạch xây dựng và đạt chứng nhận trong vòng 12 tháng..." />
          </Field>
          <Field label="Tóm tắt điều hành (Executive Summary)" sx={{ gridColumn: "1/-1" }}>
            <TA value={meta.exec_summary} onChange={v => setMeta("exec_summary", v)} rows={4}
              placeholder={"Tóm tắt kết quả khảo sát:\n• Điểm mạnh của tổ chức...\n• Khoảng cách lớn nhất cần ưu tiên...\n• Lộ trình đề xuất..."} />
          </Field>
        </Grid>
      </Card>

      {/* Client info */}
      <Card title="Tổ chức được khảo sát" icon="🏭" accent={C.skyL}>
        <Grid cols={2} gap={10}>
          <Field label="Tên tổ chức / Công ty" required sx={{ gridColumn: "1/-1" }}>
            <Input value={client.name} onChange={v => setClient("name", v)} placeholder="Công ty Cổ phần / TNHH..." />
          </Field>
          <Field label="Tên cơ sở / Nhà máy">
            <Input value={client.site} onChange={v => setClient("site", v)} placeholder="Nhà máy ABC — KCN..." />
          </Field>
          <Field label="Ngành / Lĩnh vực">
            <Sel value={client.industry || ""} onChange={v => setClient("industry", v)}
              options={INDUSTRIES.map(i => [i, i || "— Chọn ngành —"])} />
          </Field>
          <Field label="Địa chỉ" sx={{ gridColumn: "1/-1" }}>
            <TA value={client.address} onChange={v => setClient("address", v)} rows={2} placeholder="Địa chỉ đầy đủ cơ sở..." />
          </Field>
          <Field label="Số CBCNV">
            <Input value={client.employees} onChange={v => setClient("employees", v)} placeholder="500 người" />
          </Field>
          <Field label="NL tiêu thụ/năm (TOE)">
            <Input value={client.annual_energy} onChange={v => setClient("annual_energy", v)} placeholder="2.500 TOE/năm" />
          </Field>
          <Field label="Tình trạng chứng nhận ISO 50001" sx={{ gridColumn: "1/-1" }}>
            <Sel value={client.cert_status || ""} onChange={v => setClient("cert_status", v)} options={CERT_STATUSES} />
          </Field>
        </Grid>
        {/* Large energy user flag */}
        <div style={{
          marginTop: 10, padding: "9px 13px", background: `${C.orange}10`,
          borderRadius: 7, border: `1px solid ${C.orange}25`, display: "flex", alignItems: "center", gap: 10
        }}>
          <input type="checkbox" id="large_user" checked={!!client.is_large_user}
            onChange={e => setClient("is_large_user", e.target.checked)}
            style={{ width: 16, height: 16, accentColor: C.orangeL, cursor: "pointer" }} />
          <label htmlFor="large_user" style={{ cursor: "pointer", fontSize: 12.5, color: C.t0, lineHeight: 1.5 }}>
            <strong style={{ color: C.orangeL }}>Cơ sở sử dụng NL trọng điểm</strong> (≥1.000 TOE/năm)
            — Bắt buộc: Kiểm toán NL định kỳ 3 năm, báo cáo hàng năm, kế hoạch 5 năm và khuyến khích áp dụng ISO 50001 theo TT 09/2012 & TT 25/2020
          </label>
        </div>
      </Card>

      {/* Verifier info */}
      <Card title="Đoàn khảo sát tư vấn" icon="🔬" accent={C.violet}>
        <Grid cols={2} gap={10}>
          <Field label="Tên đơn vị tư vấn" required sx={{ gridColumn: "1/-1" }}>
            <Input value={verifier.org} onChange={v => setVerifier("org", v)} placeholder="Trung tâm Tư vấn Năng lượng..." />
          </Field>
          <Field label="Giấy phép / Công nhận">
            <Input value={verifier.accred} onChange={v => setVerifier("accred", v)} placeholder="Giấy phép kiểm toán NL số .../BCT" />
          </Field>
          <Field label="Trưởng đoàn (Lead Auditor)">
            <Input value={verifier.lead} onChange={v => setVerifier("lead", v)} placeholder="Nguyễn Văn A — Energy Auditor Cấp II" />
          </Field>
          <Field label="Thành viên đoàn" sx={{ gridColumn: "1/-1" }}>
            <Input value={verifier.team} onChange={v => setVerifier("team", v)} placeholder="Trần B; Lê C; Phạm D" />
          </Field>
          <Field label="Số chứng chỉ EA">
            <Input value={verifier.cert_no} onChange={v => setVerifier("cert_no", v)} placeholder="EA-BCT-2021-0456" />
          </Field>
          <Field label="Tiêu chuẩn áp dụng">
            <Input value={verifier.std_applied} onChange={v => setVerifier("std_applied", v)}
              placeholder="ISO 50001:2018; ISO 50006:2014; ISO 50002:2014" />
          </Field>
        </Grid>
      </Card>

      {/* Legal applicability quick check */}
      <Card title="Xác định khung pháp lý áp dụng" icon="⚖️" accent={C.red}>
        <div style={{ fontSize: 12, color: C.t1, marginBottom: 10 }}>Chọn trạng thái tuân thủ hiện tại với các văn bản pháp lý Việt Nam</div>
        <Grid cols={2} gap={8}>
          {[
            ["Luật 50/2010/QH12", "Luật Sử dụng NL tiết kiệm và HQ"],
            ["TT 09/2012/TT-BCT", "Quản lý NL tại cơ sở CN trọng điểm"],
            ["TT 25/2020/TT-BCT", "Kiểm toán năng lượng (chu kỳ 3 năm)"],
            ["TT 38/2014/TT-BCT", "Đào tạo quản lý NL (chứng chỉ EMR)"],
            ["TT 36/2016/TT-BCT", "Dán nhãn NL và MEPS thiết bị"],
            ["NĐ 06/2022/NĐ-CP", "Giảm phát thải KNK (nếu ≥3.000 tCO₂e)"],
          ].map(([code, name]) => {
            const s = survey.legal_status?.[code] || "pending";
            const scol = s === "compliant" ? C.teal : s === "partial" ? C.amber : s === "non_compliant" ? C.red : C.grey2;
            return (
              <div key={code} style={{
                background: C.bg3, borderRadius: 7, padding: "7px 10px",
                border: `1px solid ${scol}25`, display: "flex", flexDirection: "column", gap: 5
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontFamily: "'Fira Code',monospace", fontSize: 10.5, color: C.blueL }}>{code}</span>
                  <Tag c={scol}>{s === "compliant" ? "✓ Tuân thủ" : s === "partial" ? "⚠ Một phần" : s === "non_compliant" ? "✗ Chưa TT" : "○ Chưa XĐ"}</Tag>
                </div>
                <div style={{ fontSize: 11, color: C.t1 }}>{name}</div>
                <select value={s}
                  onChange={e => setSurvey(p => ({ ...p, legal_status: { ...p.legal_status, [code]: e.target.value } }))}
                  style={{
                    background: C.bg4, border: `1px solid ${C.bd0}`, borderRadius: 5,
                    padding: "3px 6px", color: C.t0, fontSize: 11, cursor: "pointer"
                  }}>
                  <option value="pending">○ Chưa xác định</option>
                  <option value="compliant">✓ Tuân thủ</option>
                  <option value="partial">⚠ Một phần</option>
                  <option value="non_compliant">✗ Chưa tuân thủ</option>
                  <option value="not_applicable">— Không áp dụng</option>
                </select>
              </div>
            );
          })}
        </Grid>
      </Card>
    </div>
  );
}
