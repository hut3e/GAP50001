/**
 * ISO50001Gap — frontend/AdminDashboard.jsx
 * Màn hình dành cho Nhà quản trị:
 * - Quản trị Khách hàng
 * - Quản trị Auditors
 * - Quản trị Logistics & Khách sạn
 * - Quản trị các phiên khảo sát GAP
 * - Form hỗ trợ Export báo cáo
 */
import { useEffect, useMemo, useState, useCallback } from "react";
import { C } from "./gap.ui.constants.js";
import { Card, Field, Grid, Input, Sel, Btn, Tag, KPIBar, Modal, TA } from "./gap.atoms.jsx";

const base = (url) => (url ? url.replace(/\/$/, "") : "");

const TRANSPORT_FILTERS = [
  ["", "Tất cả loại di chuyển"],
  ["air", "✈ Đường không"],
  ["road", "🚗 Đường bộ"],
  ["water", "🚢 Đường thủy"],
];

export default function AdminDashboard({ apiUrl, initialTab = "surveys" }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [tab, setTab] = useState(initialTab || "surveys"); // surveys | clients | auditors | logistics | export

  // Trạng thái cho các modal CRUD
  const [editSurvey, setEditSurvey] = useState(null);
  const [editType, setEditType] = useState(null); // "client" | "auditor" | "trip"
  const [editTripIndex, setEditTripIndex] = useState(null);
  const [clientForm, setClientForm] = useState({ name: "", site: "", address: "", industry: "", annual_energy: "", cert_status: "" });
  const [auditorForm, setAuditorForm] = useState({ org: "", lead: "", team: "" });
  const [tripForm, setTripForm] = useState({ mode: "air", provider: "", from_city: "", to_city: "", depart_date: "", return_date: "", people: 1, rooms: 1, hotel: "" });
  const [clientBulk, setClientBulk] = useState(null);   // { key, surveys: [...], selectedId }
  const [auditorBulk, setAuditorBulk] = useState(null); // { name, org, surveys: [...], selectedId }

  const [clientFilter, setClientFilter] = useState("");
  const [refFilter, setRefFilter] = useState("");
  const [planFilter, setPlanFilter] = useState("");
  const [auditorFilter, setAuditorFilter] = useState("");
  const [transportFilter, setTransportFilter] = useState("");

  // ── Dropdown management state ────────────────────────────────────────
  const DD_CATS = [
    { id:"equipment_type", label:"Loại thiết bị",        icon:"⚙️" },
    { id:"zone_type",      label:"Loại khu vực",          icon:"🏭" },
    { id:"department",     label:"Phòng ban / Bộ phận",   icon:"🏢" },
    { id:"energy_source",  label:"Nguồn năng lượng",      icon:"⚡" },
    { id:"product_type",   label:"Phạm vi sản phẩm",      icon:"📦" },
    { id:"industry",       label:"Ngành / Lĩnh vực",      icon:"🏭" },
  ];
  const [ddCategory, setDdCategory] = useState("equipment_type");
  const [ddItems, setDdItems] = useState([]);
  const [ddLoading, setDdLoading] = useState(false);
  const [ddFilter, setDdFilter] = useState("");
  const [ddModal, setDdModal] = useState(null); // null | { mode:"add"|"edit", item? }
  const [ddForm, setDdForm] = useState({ id:"", name:"", icon:"", desc:"", ref_std:"", checks:"", order:9999 });
  const [ddSaving, setDdSaving] = useState(false);

  const loadDropdowns = useCallback(async (cat) => {
    const b = base(apiUrl);
    if (!b) return;
    const category = cat || ddCategory;
    setDdLoading(true);
    try {
      const res = await fetch(`${b}/api/dropdowns/${category}`);
      const data = await res.json().catch(() => []);
      setDdItems(Array.isArray(data) ? data : []);
    } catch (_) { setDdItems([]); }
    finally { setDdLoading(false); }
  }, [apiUrl, ddCategory]);

  useEffect(() => { if (tab === "dropdowns") loadDropdowns(); }, [tab, loadDropdowns]);

  const saveDdItem = useCallback(async () => {
    const b = base(apiUrl);
    if (!b) return;
    const { id, name, icon, desc, ref_std, checks, order } = ddForm;
    if (!name.trim()) { alert("Tên là bắt buộc"); return; }
    if (ddModal?.mode === "add" && !id.trim()) { alert("ID là bắt buộc"); return; }
    setDdSaving(true);
    try {
      const isEdit = ddModal?.mode === "edit";
      const checksArr = checks ? checks.split("\n").map(s => s.trim()).filter(Boolean) : [];
      let res;
      if (isEdit) {
        res = await fetch(`${b}/api/dropdowns/${ddModal.item.id}?category=${ddCategory}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ category: ddCategory, name, icon, desc, ref_std, checks: checksArr, order: Number(order) }),
        });
      } else {
        res = await fetch(`${b}/api/dropdowns`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ category: ddCategory, id, name, icon, desc, ref_std, checks: checksArr, order: Number(order) }),
        });
      }
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { alert("Lỗi: " + (data.error || res.status)); return; }
      setDdModal(null);
      await loadDropdowns();
    } finally { setDdSaving(false); }
  }, [apiUrl, ddForm, ddModal, ddCategory, loadDropdowns]);

  const deleteDdItem = useCallback(async (item) => {
    const label = item.isCustom ? `Xóa mục "${item.name}"?` : `Ẩn mục built-in "${item.name}" khỏi dropdown?`;
    if (!window.confirm(label)) return;
    const b = base(apiUrl);
    await fetch(`${b}/api/dropdowns/${item.id}?category=${ddCategory}`, { method: "DELETE" });
    await loadDropdowns();
  }, [apiUrl, ddCategory, loadDropdowns]);

  const load = useCallback(async () => {
    const b = base(apiUrl);
    if (!b) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${b}/api/surveys?limit=500`);
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e.error || `HTTP ${res.status}`);
      }
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.message || "Không tải được danh sách phiên.");
    } finally {
      setLoading(false);
    }
  }, [apiUrl]);

  useEffect(() => {
    load();
  }, [load]);

  // Đồng bộ tab khi initialTab thay đổi (mở từ sidebar)
  useEffect(() => {
    if (initialTab && initialTab !== tab) setTab(initialTab);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialTab]);

  const updateSurvey = useCallback(
    async (updated) => {
      const b = base(apiUrl);
      if (!b || !updated?._id) return;
      const res = await fetch(`${b}/api/surveys/${updated._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || `HTTP ${res.status}`);
      }
      setItems((prev) => prev.map((s) => (s._id === data._id ? data : s)));
    },
    [apiUrl]
  );

  const filtered = useMemo(() => {
    const lc = (s) => String(s || "").toLowerCase();
    return items.filter((s) => {
      const clientName = lc(s.client?.name);
      const site = lc(s.client?.site);
      const ref = lc(s.meta?.ref_no);
      const planCode = lc(s.audit_plan?.plan_code);
      const visitNo = lc(s.audit_plan?.visit_no);
      const auditorsText = lc(
        (s.audit_plan?.auditors || [])
          .map((a) => a.name || a.role || "")
          .join(" ") || s.verifier?.team || s.verifier?.lead
      );
      const trips = Array.isArray(s.logistics_trips) ? s.logistics_trips : [];

      if (clientFilter && !clientName.includes(lc(clientFilter)) && !site.includes(lc(clientFilter))) return false;
      if (refFilter && !ref.includes(lc(refFilter))) return false;
      if (planFilter && !planCode.includes(lc(planFilter)) && !visitNo.includes(lc(planFilter))) return false;
      if (auditorFilter && !auditorsText.includes(lc(auditorFilter))) return false;
      if (transportFilter) {
        const hasMode = trips.some((t) => t.mode === transportFilter);
        if (!hasMode) return false;
      }
      return true;
    });
  }, [items, clientFilter, refFilter, planFilter, auditorFilter, transportFilter]);

  const stats = useMemo(() => {
    const uniqueClients = new Set();
    let totalTrips = 0;
    let totalPeople = 0;
    let totalNights = 0;
    filtered.forEach((s) => {
      if (s.client?.name) uniqueClients.add(s.client.name);
      const trips = Array.isArray(s.logistics_trips) ? s.logistics_trips : [];
      totalTrips += trips.length;
      trips.forEach((t) => {
        totalPeople += Number(t.people || 0);
        totalNights += Number(t.nights || 0);
      });
    });
    return {
      surveys: filtered.length,
      clients: uniqueClients.size,
      trips: totalTrips,
      people: totalPeople,
      nights: totalNights,
    };
  }, [filtered]);

  // Dữ liệu khách hàng (gộp theo tên tổ chức + cơ sở)
  const clientRows = useMemo(() => {
    const map = new Map();
    items.forEach((s) => {
      if (!s.client?.name) return;
      const key = `${s.client.name}__${s.client.site || ""}`;
      const cur = map.get(key) || {
        key,
        name: s.client.name,
        site: s.client.site || "",
        industry: s.client.industry || "",
        annual_energy: s.client.annual_energy || "",
        cert_status: s.client.cert_status || "",
        surveys: 0,
        lastRef: "",
        lastDate: "",
      };
      cur.surveys += 1;
      if (!cur.lastDate || (s.meta?.survey_date || "") > cur.lastDate) {
        cur.lastDate = s.meta?.survey_date || "";
        cur.lastRef = s.meta?.ref_no || "";
      }
      map.set(key, cur);
    });
    return Array.from(map.values());
  }, [items]);

  // Dữ liệu auditors (từ verifier + audit_plan.auditors)
  const auditorRows = useMemo(() => {
    const map = new Map();
    items.forEach((s) => {
      const planAuditors = Array.isArray(s.audit_plan?.auditors) ? s.audit_plan.auditors : [];
      const list = [];
      if (s.verifier?.lead) list.push({ name: s.verifier.lead, role: "Lead", org: s.verifier.org || "" });
      const teamNames = String(s.verifier?.team || "")
        .split(/[;,]/)
        .map((t) => t.trim())
        .filter(Boolean);
      teamNames.forEach((n) => list.push({ name: n, role: "Team", org: s.verifier.org || "" }));
      planAuditors.forEach((a) => list.push({ name: a.name || "", role: a.role || "", org: a.org || s.verifier?.org || "" }));
      list
        .filter((a) => a.name)
        .forEach((a) => {
          const key = `${a.name}__${a.org || ""}`;
          const cur = map.get(key) || { key, name: a.name, role: a.role || "", org: a.org || "", surveys: 0 };
          cur.surveys += 1;
          map.set(key, cur);
        });
    });
    return Array.from(map.values());
  }, [items]);

  // Dữ liệu logistics (flatten logistics_trips)
  const logisticsRows = useMemo(() => {
    const rows = [];
    items.forEach((s) => {
      const trips = Array.isArray(s.logistics_trips) ? s.logistics_trips : [];
      trips.forEach((t, idx) => {
        rows.push({
          id: `${s._id}_${idx}`,
          surveyId: s._id,
          tripIndex: idx,
          ref_no: s.meta?.ref_no || "",
          client: s.client?.name || "",
          mode: t.mode || "",
          provider: t.provider || "",
          route: `${t.from_city || "—"} → ${t.to_city || "—"}`,
          time: `${t.depart_date || "—"}${t.return_date ? ` → ${t.return_date}` : ""}`,
          people: Number(t.people || 0),
          rooms: Number(t.rooms || 0),
          hotel: t.hotel || "",
        });
      });
    });
    return rows;
  }, [items]);

  // Export một survey bất kỳ (không ảnh hưởng wizard)
  const exportSurvey = useCallback(
    async (survey) => {
      const b = base(apiUrl);
      if (!b || !survey?._id) return;
      try {
        const res = await fetch(`${b}/api/iso50001/gap/generate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(survey),
        });
        if (!res.ok) {
          const e = await res.json().catch(() => ({}));
          throw new Error(e.error || `HTTP ${res.status}`);
        }
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `ISO50001_GAP_${(survey.meta?.ref_no || "report").replace(/[^A-Za-z0-9_-]/g, "_")}.docx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } catch (e) {
        // Hiển thị lỗi đơn giản trong console, Admin có thể xem
        console.error("Export error:", e);
        alert(`Lỗi export: ${e.message || e}`);
      }
    },
    [apiUrl]
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <KPIBar
        items={[
          { label: "Tổng kế hoạch GAP", value: stats.surveys, col: C.blue, icon: "📋" },
          { label: "Khách hàng", value: stats.clients, col: C.teal, icon: "🏭" },
          { label: "Chuyến đi", value: stats.trips, col: C.orange, icon: "🧳" },
          { label: "Số lượt người", value: stats.people, col: C.violet, icon: "👥" },
          { label: "Số đêm lưu trú", value: stats.nights, col: C.green, icon: "🛏️" },
        ]}
      />

      {/* Thanh menu tab cho các khối quản trị */}
      <div style={{ display: "flex", gap: 6, marginBottom: 4, flexWrap: "wrap" }}>
        {[
          ["surveys",   "📋 GAP & Kế hoạch"],
          ["clients",   "🏭 Khách hàng"],
          ["auditors",  "🔬 Auditors"],
          ["logistics", "🧳 Logistics"],
          ["dropdowns", "🗂️ Dropdown"],
          ["export",    "📄 Export"],
        ].map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            style={{
              padding: "6px 14px",
              borderRadius: 999,
              border: `1px solid ${tab === id ? C.blue : C.bd0}`,
              background: tab === id ? `${C.blue}22` : C.bg2,
              color: tab === id ? C.blueL : C.t1,
              fontSize: 13,
              fontWeight: tab === id ? 700 : 400,
              cursor: "pointer",
              whiteSpace: "nowrap",
              transition: "all .15s",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Bộ lọc áp dụng chung cho khối Survey & Export */}
      <Card title="Bộ lọc quản trị" icon="🔎" accent={C.sky}>
        <Grid cols={5} gap={10} minCol="200px">
          <Field label="Khách hàng / Cơ sở">
            <Input value={clientFilter} onChange={setClientFilter} placeholder="Tên tổ chức hoặc cơ sở..." />
          </Field>
          <Field label="Mã khảo sát (ref_no)">
            <Input value={refFilter} onChange={setRefFilter} placeholder="GAP-2024-..." />
          </Field>
          <Field label="Mã kế hoạch / Đợt khảo sát">
            <Input value={planFilter} onChange={setPlanFilter} placeholder="PLAN-2024-... / Đợt 1/2024" />
          </Field>
          <Field label="Auditor / Đoàn đánh giá">
            <Input value={auditorFilter} onChange={setAuditorFilter} placeholder="Tên auditor, tổ chức tư vấn..." />
          </Field>
          <Field label="Loại di chuyển">
            <Sel value={transportFilter} onChange={setTransportFilter} options={TRANSPORT_FILTERS} />
          </Field>
        </Grid>
        <div style={{ marginTop: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 14, color: C.t2 }}>
            Đang hiển thị <strong>{filtered.length}</strong> kế hoạch (từ tổng số {items.length} bản ghi).
          </span>
          <div style={{ display: "flex", gap: 8 }}>
            <Btn v="ghost" sz="sm" onClick={() => { setClientFilter(""); setRefFilter(""); setPlanFilter(""); setAuditorFilter(""); setTransportFilter(""); }}>
              Xóa bộ lọc
            </Btn>
            <Btn v="outline" sz="sm" onClick={load} loading={loading}>
              🔄 Tải lại dữ liệu
            </Btn>
          </div>
        </div>
        {error && (
          <div style={{ marginTop: 8, fontSize: 14, color: C.red }}>
            Lỗi tải dữ liệu: {error}
          </div>
        )}
      </Card>

      {/* Nội dung theo từng tab quản trị */}
      {tab === "surveys" && (
        <Card title="Quản trị kế hoạch GAP & logistics" icon="📊" accent={C.blue}>
          <div style={{ overflowX: "auto", borderRadius: 10, border: `1px solid ${C.bd0}` }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
              <thead>
                <tr style={{ background: C.bg3 }}>
                  <th style={{ padding: "8px 10px", textAlign: "left", borderBottom: `1px solid ${C.bd0}` }}>Mã khảo sát</th>
                  <th style={{ padding: "8px 10px", textAlign: "left", borderBottom: `1px solid ${C.bd0}` }}>Khách hàng / Cơ sở</th>
                  <th style={{ padding: "8px 10px", textAlign: "left", borderBottom: `1px solid ${C.bd0}` }}>Mã kế hoạch / Đợt</th>
                  <th style={{ padding: "8px 10px", textAlign: "left", borderBottom: `1px solid ${C.bd0}` }}>Thời gian khảo sát</th>
                  <th style={{ padding: "8px 10px", textAlign: "left", borderBottom: `1px solid ${C.bd0}` }}>Lead / Đoàn đánh giá</th>
                  <th style={{ padding: "8px 10px", textAlign: "left", borderBottom: `1px solid ${C.bd0}` }}>Logistics</th>
                  <th style={{ padding: "8px 10px", textAlign: "right", borderBottom: `1px solid ${C.bd0}` }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ padding: 12, textAlign: "center", color: C.t3 }}>
                      Không có bản ghi nào phù hợp bộ lọc hiện tại.
                    </td>
                  </tr>
                ) : (
                  filtered.map((s) => {
                    const trips = Array.isArray(s.logistics_trips) ? s.logistics_trips : [];
                    const people = trips.reduce((a, t) => a + Number(t.people || 0), 0);
                    const nights = trips.reduce((a, t) => a + Number(t.nights || 0), 0);
                    const modes = Array.from(new Set(trips.map((t) => t.mode))).filter(Boolean);
                    const plan = s.audit_plan || {};
                    const lead = s.verifier?.lead || (plan.auditors && plan.auditors[0]?.name) || "";
                    const team = s.verifier?.team || "";
                    const city = plan.to_city || s.client?.site || "";

                    return (
                      <tr key={s._id} style={{ background: C.bg2 }}>
                        <td style={{ padding: "6px 10px", borderBottom: `1px solid ${C.bd2}`, fontFamily: "'Fira Code',monospace", color: C.blueL }}>
                          {s.meta?.ref_no || s._id}
                        </td>
                        <td style={{ padding: "6px 10px", borderBottom: `1px solid ${C.bd2}`, color: C.t0 }}>
                          <div style={{ fontWeight: 600 }}>{s.client?.name || "—"}</div>
                          <div style={{ fontSize: 13, color: C.t2 }}>{city}</div>
                        </td>
                        <td style={{ padding: "6px 10px", borderBottom: `1px solid ${C.bd2}`, color: C.t1 }}>
                          <div>{plan.plan_code || "—"}</div>
                          <div style={{ fontSize: 13, color: C.t2 }}>{plan.visit_no || ""}</div>
                        </td>
                        <td style={{ padding: "6px 10px", borderBottom: `1px solid ${C.bd2}`, color: C.t1, fontSize: 13 }}>
                          {plan.from_date || "—"} {plan.to_date ? `→ ${plan.to_date}` : ""}
                        </td>
                        <td style={{ padding: "6px 10px", borderBottom: `1px solid ${C.bd2}`, color: C.t1, fontSize: 13 }}>
                          {lead && <div><strong>{lead}</strong></div>}
                          {team && <div style={{ color: C.t2 }}>{team}</div>}
                        </td>
                        <td style={{ padding: "6px 10px", borderBottom: `1px solid ${C.bd2}`, color: C.t1, fontSize: 13 }}>
                          <div style={{ marginBottom: 4 }}>
                            {trips.length > 0 ? (
                              <>
                                <Tag c={C.orange}>{trips.length} chuyến</Tag>
                                <span style={{ marginLeft: 6 }}>{people} người, {nights} đêm</span>
                              </>
                            ) : (
                              <span style={{ color: C.t3 }}>Chưa khai báo</span>
                            )}
                          </div>
                          {modes.length > 0 && (
                            <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                              {modes.map((m) => (
                                <Tag key={m} c={m === "air" ? C.sky : m === "water" ? C.teal : C.orange} sx={{ fontSize: 12 }}>
                                  {m === "air" ? "✈ Air" : m === "water" ? "🚢 Water" : "🚗 Road"}
                                </Tag>
                              ))}
                            </div>
                          )}
                        </td>
                        <td style={{ padding: "6px 10px", borderBottom: `1px solid ${C.bd2}`, textAlign: "right" }}>
                          <Btn
                            v="ghost"
                            sz="sm"
                            sx={{ marginRight: 6 }}
                            onClick={() => {
                              setEditSurvey(s);
                              setEditType("client");
                              setClientForm({
                                name: s.client?.name || "",
                                site: s.client?.site || "",
                                address: s.client?.address || "",
                                industry: s.client?.industry || "",
                                annual_energy: s.client?.annual_energy || "",
                                cert_status: s.client?.cert_status || "",
                              });
                            }}
                          >
                            Sửa KH
                          </Btn>
                          <Btn
                            v="ghost"
                            sz="sm"
                            onClick={() => {
                              setEditSurvey(s);
                              setEditType("auditor");
                              setAuditorForm({
                                org: s.verifier?.org || "",
                                lead: s.verifier?.lead || "",
                                team: s.verifier?.team || "",
                              });
                            }}
                          >
                            Sửa Auditor
                          </Btn>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {tab === "clients" && (
        <Card title="Quản trị khách hàng" icon="🏭" accent={C.teal}>
          <div style={{ overflowX: "auto", borderRadius: 10, border: `1px solid ${C.bd0}` }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
              <thead>
                <tr style={{ background: C.bg3 }}>
                  <th style={{ padding: "8px 10px", textAlign: "left", borderBottom: `1px solid ${C.bd0}` }}>Khách hàng</th>
                  <th style={{ padding: "8px 10px", textAlign: "left", borderBottom: `1px solid ${C.bd0}` }}>Cơ sở</th>
                  <th style={{ padding: "8px 10px", textAlign: "left", borderBottom: `1px solid ${C.bd0}` }}>Ngành / NL tiêu thụ</th>
                  <th style={{ padding: "8px 10px", textAlign: "left", borderBottom: `1px solid ${C.bd0}` }}>Trạng thái chứng nhận</th>
                  <th style={{ padding: "8px 10px", textAlign: "left", borderBottom: `1px solid ${C.bd0}` }}>Số phiên GAP</th>
                  <th style={{ padding: "8px 10px", textAlign: "left", borderBottom: `1px solid ${C.bd0}` }}>Phiên gần nhất</th>
                  <th style={{ padding: "8px 10px", textAlign: "right", borderBottom: `1px solid ${C.bd0}` }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {clientRows.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ padding: 12, textAlign: "center", color: C.t3 }}>
                      Chưa có dữ liệu khách hàng.
                    </td>
                  </tr>
                ) : (
                  clientRows.map((c) => (
                    <tr key={c.key} style={{ background: C.bg2 }}>
                      <td style={{ padding: "6px 10px", borderBottom: `1px solid ${C.bd2}`, color: C.t0 }}>{c.name}</td>
                      <td style={{ padding: "6px 10px", borderBottom: `1px solid ${C.bd2}`, color: C.t1 }}>{c.site}</td>
                      <td style={{ padding: "6px 10px", borderBottom: `1px solid ${C.bd2}`, color: C.t1, fontSize: 13 }}>
                        {c.industry || "—"} {c.annual_energy && <span style={{ color: C.t2 }}> — {c.annual_energy}</span>}
                      </td>
                      <td style={{ padding: "6px 10px", borderBottom: `1px solid ${C.bd2}`, color: C.t1, fontSize: 13 }}>
                        {c.cert_status || "—"}
                      </td>
                      <td style={{ padding: "6px 10px", borderBottom: `1px solid ${C.bd2}`, color: C.t1 }}>{c.surveys}</td>
                      <td style={{ padding: "6px 10px", borderBottom: `1px solid ${C.bd2}`, color: C.t2, fontSize: 13 }}>
                        {c.lastRef || "—"} {c.lastDate && `(${c.lastDate})`}
                      </td>
                      <td style={{ padding: "6px 10px", borderBottom: `1px solid ${C.bd2}`, textAlign: "right" }}>
                        <Btn
                          v="ghost"
                          sz="sm"
                          onClick={() => {
                            const [name, site] = c.key.split("__");
                            const surveysForClient = items.filter(
                              (s) => s.client?.name === name && (s.client?.site || "") === (site || "")
                            );
                            if (!surveysForClient.length) return;
                            setClientBulk({
                              key: c.key,
                              name: c.name,
                              site: c.site,
                              surveys: surveysForClient,
                              selectedId: surveysForClient[0]._id,
                            });
                          }}
                        >
                          Sửa khách hàng…
                        </Btn>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {tab === "auditors" && (
        <Card title="Quản trị Auditors" icon="🔬" accent={C.violet}>
          <div style={{ overflowX: "auto", borderRadius: 10, border: `1px solid ${C.bd0}` }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
              <thead>
                <tr style={{ background: C.bg3 }}>
                  <th style={{ padding: "8px 10px", textAlign: "left", borderBottom: `1px solid ${C.bd0}` }}>Tên auditor</th>
                  <th style={{ padding: "8px 10px", textAlign: "left", borderBottom: `1px solid ${C.bd0}` }}>Vai trò</th>
                  <th style={{ padding: "8px 10px", textAlign: "left", borderBottom: `1px solid ${C.bd0}` }}>Tổ chức</th>
                  <th style={{ padding: "8px 10px", textAlign: "left", borderBottom: `1px solid ${C.bd0}` }}>Số phiên tham gia</th>
                  <th style={{ padding: "8px 10px", textAlign: "right", borderBottom: `1px solid ${C.bd0}` }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {auditorRows.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: 12, textAlign: "center", color: C.t3 }}>
                      Chưa có dữ liệu auditor.
                    </td>
                  </tr>
                ) : (
                  auditorRows.map((a) => (
                    <tr key={a.key} style={{ background: C.bg2 }}>
                      <td style={{ padding: "6px 10px", borderBottom: `1px solid ${C.bd2}`, color: C.t0 }}>{a.name}</td>
                      <td style={{ padding: "6px 10px", borderBottom: `1px solid ${C.bd2}`, color: C.t1 }}>{a.role || "—"}</td>
                      <td style={{ padding: "6px 10px", borderBottom: `1px solid ${C.bd2}`, color: C.t1 }}>{a.org || "—"}</td>
                      <td style={{ padding: "6px 10px", borderBottom: `1px solid ${C.bd2}`, color: C.t1 }}>{a.surveys}</td>
                      <td style={{ padding: "6px 10px", borderBottom: `1px solid ${C.bd2}`, textAlign: "right" }}>
                        <Btn
                          v="ghost"
                          sz="sm"
                          onClick={() => {
                            const [name, org] = a.key.split("__");
                            const surveysForAuditor = items.filter((s) => {
                              const inLead = s.verifier?.lead === name;
                              const inTeam = String(s.verifier?.team || "")
                                .split(/[;,]/)
                                .map((t) => t.trim())
                                .includes(name);
                              const inPlan =
                                Array.isArray(s.audit_plan?.auditors) &&
                                s.audit_plan.auditors.some((ad) => ad.name === name);
                              return inLead || inTeam || inPlan;
                            });
                            if (!surveysForAuditor.length) return;
                            setAuditorBulk({
                              name: a.name,
                              org: a.org,
                              surveys: surveysForAuditor,
                              selectedId: surveysForAuditor[0]._id,
                            });
                          }}
                        >
                          Sửa auditor…
                        </Btn>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {tab === "logistics" && (
        <Card title="Quản trị Logistics & Khách sạn (nội bộ)" icon="🧳" accent={C.teal}>
          <div style={{ overflowX: "auto", borderRadius: 10, border: `1px solid ${C.bd0}` }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
              <thead>
                <tr style={{ background: C.bg3 }}>
                  <th style={{ padding: "8px 10px", textAlign: "left", borderBottom: `1px solid ${C.bd0}` }}>Mã khảo sát</th>
                  <th style={{ padding: "8px 10px", textAlign: "left", borderBottom: `1px solid ${C.bd0}` }}>Khách hàng</th>
                  <th style={{ padding: "8px 10px", textAlign: "left", borderBottom: `1px solid ${C.bd0}` }}>Loại</th>
                  <th style={{ padding: "8px 10px", textAlign: "left", borderBottom: `1px solid ${C.bd0}` }}>Nhà cung cấp</th>
                  <th style={{ padding: "8px 10px", textAlign: "left", borderBottom: `1px solid ${C.bd0}` }}>Tuyến đường</th>
                  <th style={{ padding: "8px 10px", textAlign: "left", borderBottom: `1px solid ${C.bd0}` }}>Thời gian</th>
                  <th style={{ padding: "8px 10px", textAlign: "left", borderBottom: `1px solid ${C.bd0}` }}>Người / Phòng</th>
                  <th style={{ padding: "8px 10px", textAlign: "right", borderBottom: `1px solid ${C.bd0}` }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {logisticsRows.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ padding: 12, textAlign: "center", color: C.t3 }}>
                      Chưa có chuyến đi nào được khai báo.
                    </td>
                  </tr>
                ) : (
                  logisticsRows.map((r) => (
                    <tr key={r.id} style={{ background: C.bg2 }}>
                      <td style={{ padding: "6px 10px", borderBottom: `1px solid ${C.bd2}`, fontFamily: "'Fira Code',monospace", color: C.blueL }}>{r.ref_no}</td>
                      <td style={{ padding: "6px 10px", borderBottom: `1px solid ${C.bd2}`, color: C.t0 }}>{r.client}</td>
                      <td style={{ padding: "6px 10px", borderBottom: `1px solid ${C.bd2}`, color: C.t1 }}>
                        <Tag c={r.mode === "air" ? C.sky : r.mode === "water" ? C.teal : C.orange}>{r.mode || "—"}</Tag>
                      </td>
                      <td style={{ padding: "6px 10px", borderBottom: `1px solid ${C.bd2}`, color: C.t1 }}>{r.provider}</td>
                      <td style={{ padding: "6px 10px", borderBottom: `1px solid ${C.bd2}`, color: C.t1, fontSize: 13 }}>{r.route}</td>
                      <td style={{ padding: "6px 10px", borderBottom: `1px solid ${C.bd2}`, color: C.t1, fontSize: 13 }}>{r.time}</td>
                      <td style={{ padding: "6px 10px", borderBottom: `1px solid ${C.bd2}`, color: C.t1, fontSize: 13 }}>
                        {r.people} người / {r.rooms} phòng{r.hotel ? ` @ ${r.hotel}` : ""}
                      </td>
                      <td style={{ padding: "6px 10px", borderBottom: `1px solid ${C.bd2}`, textAlign: "right" }}>
                        <Btn
                          v="ghost"
                          sz="sm"
                          sx={{ marginRight: 6 }}
                          onClick={() => {
                            const survey = items.find((s) => s._id === r.surveyId);
                            if (!survey) return;
                            const trip = (survey.logistics_trips || [])[r.tripIndex] || {};
                            setEditSurvey(survey);
                            setEditTripIndex(r.tripIndex);
                            setEditType("trip");
                            setTripForm({
                              mode: trip.mode || "air",
                              provider: trip.provider || "",
                              from_city: trip.from_city || "",
                              to_city: trip.to_city || "",
                              depart_date: trip.depart_date || "",
                              return_date: trip.return_date || "",
                              people: trip.people || 1,
                              rooms: trip.rooms || 1,
                              hotel: trip.hotel || "",
                            });
                          }}
                        >
                          Sửa
                        </Btn>
                        <Btn
                          v="ghost"
                          sz="sm"
                          sx={{ color: C.red }}
                          onClick={async () => {
                            const survey = items.find((s) => s._id === r.surveyId);
                            if (!survey) return;
                            if (!window.confirm("Xóa chuyến logistics này khỏi phiên GAP?")) return;
                            try {
                              const trips = Array.isArray(survey.logistics_trips) ? survey.logistics_trips.slice() : [];
                              trips.splice(r.tripIndex, 1);
                              await updateSurvey({ ...survey, logistics_trips: trips });
                            } catch (e) {
                              alert(`Lỗi xóa trip: ${e.message || e}`);
                            }
                          }}
                        >
                          Xóa
                        </Btn>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {tab === "export" && (
        <Card title="Form export báo cáo GAP (DOCX)" icon="📄" accent={C.blue}>
          <p style={{ fontSize: 14, color: C.t2, marginBottom: 8 }}>
            Chọn phiên khảo sát GAP và bấm &quot;Xuất DOCX&quot; để tạo báo cáo chuẩn in ấn (giống chức năng trong wizard, nhưng dành cho Nhà quản trị).
          </p>
          <div style={{ overflowX: "auto", borderRadius: 10, border: `1px solid ${C.bd0}` }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
              <thead>
                <tr style={{ background: C.bg3 }}>
                  <th style={{ padding: "8px 10px", textAlign: "left", borderBottom: `1px solid ${C.bd0}` }}>Mã khảo sát</th>
                  <th style={{ padding: "8px 10px", textAlign: "left", borderBottom: `1px solid ${C.bd0}` }}>Khách hàng</th>
                  <th style={{ padding: "8px 10px", textAlign: "left", borderBottom: `1px solid ${C.bd0}` }}>Ngày khảo sát</th>
                  <th style={{ padding: "8px 10px", textAlign: "left", borderBottom: `1px solid ${C.bd0}` }}>Lead auditor</th>
                  <th style={{ padding: "8px 10px", textAlign: "right", borderBottom: `1px solid ${C.bd0}` }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: 12, textAlign: "center", color: C.t3 }}>
                      Không có phiên nào theo bộ lọc hiện tại.
                    </td>
                  </tr>
                ) : (
                  filtered.map((s) => (
                    <tr key={s._id} style={{ background: C.bg2 }}>
                      <td style={{ padding: "6px 10px", borderBottom: `1px solid ${C.bd2}`, fontFamily: "'Fira Code',monospace", color: C.blueL }}>
                        {s.meta?.ref_no || s._id}
                      </td>
                      <td style={{ padding: "6px 10px", borderBottom: `1px solid ${C.bd2}`, color: C.t0 }}>{s.client?.name || "—"}</td>
                      <td style={{ padding: "6px 10px", borderBottom: `1px solid ${C.bd2}`, color: C.t1, fontSize: 13 }}>
                        {s.meta?.survey_date || "—"}
                      </td>
                      <td style={{ padding: "6px 10px", borderBottom: `1px solid ${C.bd2}`, color: C.t1, fontSize: 13 }}>
                        {s.verifier?.lead || "—"}
                      </td>
                      <td style={{ padding: "6px 10px", borderBottom: `1px solid ${C.bd2}`, textAlign: "right" }}>
                        <Btn v="blue" sz="sm" onClick={() => exportSurvey(s)}>
                          Xuất DOCX
                        </Btn>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Modal: sửa khách hàng */}
      <Modal
        open={!!clientBulk}
        onClose={() => setClientBulk(null)}
        title="Chọn phiên GAP để sửa khách hàng"
        width={520}
      >
        {clientBulk && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <p style={{ fontSize: 14, color: C.t2 }}>
              Khách hàng: <strong>{clientBulk.name}</strong> — {clientBulk.site || "Không có tên cơ sở"}.
              Chọn một phiên GAP bên dưới để sửa thông tin khách hàng trong phiên đó.
            </p>
            <Field label="Phiên GAP">
              <select
                value={clientBulk.selectedId}
                onChange={(e) => setClientBulk((b) => ({ ...b, selectedId: e.target.value }))}
                style={{
                  width: "100%",
                  minHeight: 40,
                  padding: "8px 12px",
                  background: C.bg3,
                  border: `1px solid ${C.bd0}`,
                  borderRadius: 6,
                  color: C.t0,
                }}
              >
                {clientBulk.surveys.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.meta?.ref_no || s._id} — {s.meta?.survey_date || ""}
                  </option>
                ))}
              </select>
            </Field>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 8 }}>
              <Btn v="ghost" sz="sm" onClick={() => setClientBulk(null)}>
                Hủy
              </Btn>
              <Btn
                v="blue"
                sz="sm"
                onClick={() => {
                  const s = clientBulk.surveys.find((sv) => sv._id === clientBulk.selectedId) || clientBulk.surveys[0];
                  if (!s) return;
                  setClientBulk(null);
                  setEditSurvey(s);
                  setEditType("client");
                  setClientForm({
                    name: s.client?.name || "",
                    site: s.client?.site || "",
                    address: s.client?.address || "",
                    industry: s.client?.industry || "",
                    annual_energy: s.client?.annual_energy || "",
                    cert_status: s.client?.cert_status || "",
                  });
                }}
              >
                Tiếp tục
              </Btn>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={!!editSurvey && editType === "client"}
        onClose={() => {
          setEditSurvey(null);
          setEditType(null);
        }}
        title="Sửa thông tin khách hàng (phiên GAP này)"
        width={640}
      >
        {editSurvey && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <Field label="Tên tổ chức / Công ty">
              <Input value={clientForm.name} onChange={(v) => setClientForm((f) => ({ ...f, name: v }))} />
            </Field>
            <Field label="Cơ sở / Nhà máy">
              <Input value={clientForm.site} onChange={(v) => setClientForm((f) => ({ ...f, site: v }))} />
            </Field>
            <Field label="Địa chỉ">
              <TA value={clientForm.address} onChange={(v) => setClientForm((f) => ({ ...f, address: v }))} rows={2} />
            </Field>
            <Field label="Ngành / Lĩnh vực">
              <Input value={clientForm.industry} onChange={(v) => setClientForm((f) => ({ ...f, industry: v }))} />
            </Field>
            <Field label="NL tiêu thụ/năm">
              <Input value={clientForm.annual_energy} onChange={(v) => setClientForm((f) => ({ ...f, annual_energy: v }))} />
            </Field>
            <Field label="Trạng thái chứng nhận ISO 50001">
              <Input value={clientForm.cert_status} onChange={(v) => setClientForm((f) => ({ ...f, cert_status: v }))} />
            </Field>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 8 }}>
              <Btn v="ghost" sz="md" onClick={() => { setEditSurvey(null); setEditType(null); }}>
                Hủy
              </Btn>
              <Btn
                v="blue"
                sz="md"
                onClick={async () => {
                  try {
                    const updated = { ...editSurvey, client: { ...(editSurvey.client || {}), ...clientForm } };
                    await updateSurvey(updated);
                    setEditSurvey(null);
                    setEditType(null);
                  } catch (e) {
                    alert(`Lỗi lưu khách hàng: ${e.message || e}`);
                  }
                }}
              >
                Lưu
              </Btn>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal: sửa auditor */}
      <Modal
        open={!!auditorBulk}
        onClose={() => setAuditorBulk(null)}
        title="Chọn phiên GAP để sửa auditor"
        width={520}
      >
        {auditorBulk && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <p style={{ fontSize: 14, color: C.t2 }}>
              Auditor: <strong>{auditorBulk.name}</strong> {auditorBulk.org && `— ${auditorBulk.org}`}. Chọn một phiên GAP bên dưới
              để cập nhật thông tin auditor trong phiên đó.
            </p>
            <Field label="Phiên GAP">
              <select
                value={auditorBulk.selectedId}
                onChange={(e) => setAuditorBulk((b) => ({ ...b, selectedId: e.target.value }))}
                style={{
                  width: "100%",
                  minHeight: 40,
                  padding: "8px 12px",
                  background: C.bg3,
                  border: `1px solid ${C.bd0}`,
                  borderRadius: 6,
                  color: C.t0,
                }}
              >
                {auditorBulk.surveys.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.meta?.ref_no || s._id} — {s.client?.name || ""}
                  </option>
                ))}
              </select>
            </Field>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 8 }}>
              <Btn v="ghost" sz="sm" onClick={() => setAuditorBulk(null)}>
                Hủy
              </Btn>
              <Btn
                v="blue"
                sz="sm"
                onClick={() => {
                  const s = auditorBulk.surveys.find((sv) => sv._id === auditorBulk.selectedId) || auditorBulk.surveys[0];
                  if (!s) return;
                  setAuditorBulk(null);
                  setEditSurvey(s);
                  setEditType("auditor");
                  setAuditorForm({
                    org: s.verifier?.org || "",
                    lead: s.verifier?.lead || "",
                    team: s.verifier?.team || "",
                  });
                }}
              >
                Tiếp tục
              </Btn>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={!!editSurvey && editType === "auditor"}
        onClose={() => {
          setEditSurvey(null);
          setEditType(null);
        }}
        title="Sửa thông tin Auditor (phiên GAP này)"
        width={640}
      >
        {editSurvey && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <Field label="Đơn vị tư vấn">
              <Input value={auditorForm.org} onChange={(v) => setAuditorForm((f) => ({ ...f, org: v }))} />
            </Field>
            <Field label="Lead Auditor">
              <Input value={auditorForm.lead} onChange={(v) => setAuditorForm((f) => ({ ...f, lead: v }))} />
            </Field>
            <Field label="Thành viên đoàn (phân cách bằng ; )">
              <Input value={auditorForm.team} onChange={(v) => setAuditorForm((f) => ({ ...f, team: v }))} />
            </Field>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 8 }}>
              <Btn v="ghost" sz="md" onClick={() => { setEditSurvey(null); setEditType(null); }}>
                Hủy
              </Btn>
              <Btn
                v="blue"
                sz="md"
                onClick={async () => {
                  try {
                    const updated = {
                      ...editSurvey,
                      verifier: { ...(editSurvey.verifier || {}), org: auditorForm.org, lead: auditorForm.lead, team: auditorForm.team },
                    };
                    await updateSurvey(updated);
                    setEditSurvey(null);
                    setEditType(null);
                  } catch (e) {
                    alert(`Lỗi lưu auditor: ${e.message || e}`);
                  }
                }}
              >
                Lưu
              </Btn>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal: sửa một chuyến logistics */}
      <Modal
        open={!!editSurvey && editType === "trip"}
        onClose={() => {
          setEditSurvey(null);
          setEditType(null);
          setEditTripIndex(null);
        }}
        title="Sửa chuyến Logistics / Khách sạn (nội bộ)"
        width={640}
      >
        {editSurvey && editTripIndex != null && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <Grid cols={2} gap={10}>
              <Field label="Loại">
                <select
                  value={tripForm.mode}
                  onChange={(e) => setTripForm((f) => ({ ...f, mode: e.target.value }))}
                  style={{ width: "100%", minHeight: 34, padding: "6px 8px", background: C.bg3, border: `1px solid ${C.bd0}`, borderRadius: 6, color: C.t0 }}
                >
                  <option value="air">✈ Đường không</option>
                  <option value="road">🚗 Đường bộ</option>
                  <option value="water">🚢 Đường thủy</option>
                </select>
              </Field>
              <Field label="Nhà cung cấp">
                <Input value={tripForm.provider} onChange={(v) => setTripForm((f) => ({ ...f, provider: v }))} />
              </Field>
            </Grid>
            <Grid cols={2} gap={10}>
              <Field label="Đi từ">
                <Input value={tripForm.from_city} onChange={(v) => setTripForm((f) => ({ ...f, from_city: v }))} />
              </Field>
              <Field label="Đến">
                <Input value={tripForm.to_city} onChange={(v) => setTripForm((f) => ({ ...f, to_city: v }))} />
              </Field>
            </Grid>
            <Grid cols={2} gap={10}>
              <Field label="Ngày đi">
                <Input value={tripForm.depart_date} onChange={(v) => setTripForm((f) => ({ ...f, depart_date: v }))} />
              </Field>
              <Field label="Ngày về">
                <Input value={tripForm.return_date} onChange={(v) => setTripForm((f) => ({ ...f, return_date: v }))} />
              </Field>
            </Grid>
            <Grid cols={3} gap={10}>
              <Field label="Số người">
                <Input value={tripForm.people} onChange={(v) => setTripForm((f) => ({ ...f, people: Number(v) || 0 }))} />
              </Field>
              <Field label="Số phòng">
                <Input value={tripForm.rooms} onChange={(v) => setTripForm((f) => ({ ...f, rooms: Number(v) || 0 }))} />
              </Field>
              <Field label="Khách sạn">
                <Input value={tripForm.hotel} onChange={(v) => setTripForm((f) => ({ ...f, hotel: v }))} />
              </Field>
            </Grid>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 8 }}>
              <Btn
                v="ghost"
                sz="md"
                onClick={() => {
                  setEditSurvey(null);
                  setEditType(null);
                  setEditTripIndex(null);
                }}
              >
                Hủy
              </Btn>
              <Btn
                v="blue"
                sz="md"
                onClick={async () => {
                  try {
                    const trips = Array.isArray(editSurvey.logistics_trips) ? editSurvey.logistics_trips.slice() : [];
                    trips[editTripIndex] = { ...(trips[editTripIndex] || {}), ...tripForm };
                    await updateSurvey({ ...editSurvey, logistics_trips: trips });
                    setEditSurvey(null);
                    setEditType(null);
                    setEditTripIndex(null);
                  } catch (e) {
                    alert(`Lỗi lưu trip: ${e.message || e}`);
                  }
                }}
              >
                Lưu
              </Btn>
            </div>
          </div>
        )}
      </Modal>

      {/* ══════════════════════════════════════════════════════════════
          TAB: Quản trị Dropdown — toàn bộ các dropdown trong hệ thống
          ══════════════════════════════════════════════════════════════ */}
      {tab === "dropdowns" && (
        <Card title="Quản trị Dropdown — Toàn bộ danh mục lựa chọn" icon="🗂️" accent={C.teal}>
          {/* Category tabs */}
          <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:14 }}>
            {DD_CATS.map(({ id, label, icon }) => (
              <button key={id} type="button"
                onClick={() => { setDdCategory(id); setDdFilter(""); loadDropdowns(id); }}
                style={{ padding:"6px 14px", borderRadius:999,
                  border:`1px solid ${ddCategory===id ? C.teal : C.bd0}`,
                  background: ddCategory===id ? `${C.teal}22` : C.bg3,
                  color: ddCategory===id ? C.tealL : C.t1,
                  fontSize:13, cursor:"pointer", fontWeight: ddCategory===id ? 700 : 400,
                  display:"flex", alignItems:"center", gap:5 }}>
                <span>{icon}</span>{label}
              </button>
            ))}
          </div>

          {/* Current category info */}
          <div style={{ padding:"8px 12px", background:`${C.teal}10`, borderRadius:8, marginBottom:12,
            border:`1px solid ${C.teal}25`, fontSize:13, color:C.t2 }}>
            <strong style={{ color:C.tealL }}>{DD_CATS.find(c=>c.id===ddCategory)?.icon} {DD_CATS.find(c=>c.id===ddCategory)?.label}</strong>
            {" — "}Hiển thị tất cả mục built-in và tùy chỉnh. Built-in (🔒) từ constants, Custom (✏️) do Admin thêm vào DB.
          </div>

          {/* Actions bar */}
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10, flexWrap:"wrap" }}>
            <div style={{ flex:"1 1 180px", minWidth:140, maxWidth:320 }}>
              <input
                value={ddFilter}
                onChange={e => setDdFilter(e.target.value)}
                placeholder="🔍 Lọc theo id, tên..."
                style={{
                  width:"100%", padding:"7px 12px", background:"#0c2840",
                  border:"1px solid rgba(56,189,248,.28)", borderRadius:8,
                  color:"#f8fcff", fontSize:13, fontFamily:"'Plus Jakarta Sans',sans-serif", outline:"none",
                }}
              />
            </div>
            <Btn v="outline" sz="sm" onClick={() => loadDropdowns()} disabled={ddLoading}>🔄 Tải lại</Btn>
            <Btn v="ghost" sz="sm" onClick={async () => {
              if (!window.confirm(`Seed built-in "${DD_CATS.find(c=>c.id===ddCategory)?.label}" vào DB?`)) return;
              const b = base(apiUrl);
              const res = await fetch(`${b}/api/dropdowns/seed?category=${ddCategory}`, { method:"POST" });
              const d = await res.json().catch(()=>({}));
              alert(`Seed xong: thêm ${d.inserted}, bỏ qua ${d.skipped}`);
              await loadDropdowns();
            }}>⚡ Seed danh mục này</Btn>
            <Btn v="ghost" sz="sm" onClick={async () => {
              if (!window.confirm("Seed TẤT CẢ 6 nhóm danh mục vào DB?")) return;
              const b = base(apiUrl);
              const res = await fetch(`${b}/api/dropdowns/seed`, { method:"POST" });
              const d = await res.json().catch(()=>({}));
              alert(`Seed xong: thêm ${d.inserted}, bỏ qua ${d.skipped}`);
              await loadDropdowns();
            }}>⚡ Seed tất cả</Btn>
            <Btn v="blue" sz="sm" onClick={() => {
              const defaultIcon = { equipment_type:"⚙️", zone_type:"🏭", department:"🏢", energy_source:"⚡", product_type:"📦", industry:"🏭" }[ddCategory] || "📌";
              setDdForm({ id:"", name:"", icon:defaultIcon, desc:"", ref_std:"", checks:"", order:9999 });
              setDdModal({ mode:"add" });
            }}>＋ Thêm mục mới</Btn>
          </div>

          {/* Items table */}
          <div style={{ overflowX:"auto", border:`1px solid ${C.bd0}`, borderRadius:8 }}>
            <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
              <thead>
                <tr style={{ background:C.bg3 }}>
                  {[["Icon",44],["ID",120],["Tên",null],["Mô tả / Ref Std",180],["Loại",80],["Thao tác",110]].map(([h,w]) => (
                    <th key={h} style={{ padding:"8px 10px", textAlign:"left", borderBottom:`1px solid ${C.bd0}`, whiteSpace:"nowrap", width: w||undefined }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ddLoading ? (
                  <tr><td colSpan={6} style={{ padding:16, textAlign:"center", color:C.t2 }}>⏳ Đang tải...</td></tr>
                ) : (() => {
                  const filtered = ddItems.filter(it => {
                    if (!ddFilter) return true;
                    const f = ddFilter.toLowerCase();
                    return (it.id||"").toLowerCase().includes(f) || (it.name||"").toLowerCase().includes(f);
                  });
                  if (!filtered.length) return (
                    <tr><td colSpan={6} style={{ padding:16, textAlign:"center", color:C.t3 }}>
                      {ddItems.length === 0 ? "Chưa có dữ liệu. Nhấn ⚡ Seed built-in để nạp dữ liệu từ constants." : "Không tìm thấy mục phù hợp."}
                    </td></tr>
                  );
                  return filtered.map((it, idx) => (
                    <tr key={it.id + idx} style={{ background: idx%2 ? `${C.bg3}60` : "transparent", opacity: it.active===false ? 0.45 : 1 }}>
                      <td style={{ padding:"6px 10px", borderBottom:`1px solid ${C.bd2}`, fontSize:20, lineHeight:1 }}>{it.icon || "📌"}</td>
                      <td style={{ padding:"6px 10px", borderBottom:`1px solid ${C.bd2}`, fontFamily:"'Fira Code',monospace", color:C.tealL, fontSize:12, whiteSpace:"nowrap" }}>{it.id}</td>
                      <td style={{ padding:"6px 10px", borderBottom:`1px solid ${C.bd2}`, color:C.t0, fontWeight:600 }}>{it.name}</td>
                      <td style={{ padding:"6px 10px", borderBottom:`1px solid ${C.bd2}`, color:C.t3, fontSize:12, maxWidth:220, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                        {it.desc || it.ref_std || "—"}
                      </td>
                      <td style={{ padding:"6px 10px", borderBottom:`1px solid ${C.bd2}`, whiteSpace:"nowrap" }}>
                        {it.isCustom
                          ? <span style={{ background:`${C.green}18`, color:C.greenL, border:`1px solid ${C.green}30`, borderRadius:4, padding:"2px 7px", fontSize:11, fontWeight:700 }}>✏️ Custom</span>
                          : <span style={{ background:`${C.sky}18`, color:C.skyL, border:`1px solid ${C.sky}30`, borderRadius:4, padding:"2px 7px", fontSize:11, fontWeight:700 }}>🔒 Built-in</span>}
                        {it.active === false && <span style={{ background:`${C.red}18`, color:C.redL, border:`1px solid ${C.red}30`, borderRadius:4, padding:"2px 7px", fontSize:11, fontWeight:700, marginLeft:4 }}>Ẩn</span>}
                      </td>
                      <td style={{ padding:"6px 8px", borderBottom:`1px solid ${C.bd2}`, whiteSpace:"nowrap" }}>
                        <div style={{ display:"flex", gap:4 }}>
                          <button type="button" onClick={() => {
                            setDdForm({ id:it.id, name:it.name, icon:it.icon||"", desc:it.desc||"", ref_std:it.ref_std||"", checks:(it.checks||[]).join("\n"), order:it.order??9999 });
                            setDdModal({ mode:"edit", item:it });
                          }} style={{ padding:"3px 8px", background:`${C.blue}20`, border:`1px solid ${C.blue}40`, color:C.blueL, borderRadius:4, fontSize:12, cursor:"pointer", fontWeight:600 }}>Sửa</button>
                          <button type="button" onClick={() => deleteDdItem(it)}
                            style={{ padding:"3px 8px", background:`${it.isCustom ? C.red : C.orange}20`, border:`1px solid ${it.isCustom ? C.red : C.orange}40`, color:it.isCustom ? C.redL : C.orangeL, borderRadius:4, fontSize:12, cursor:"pointer", fontWeight:600 }}>
                            {it.isCustom ? "Xóa" : (it.active===false ? "Hiện" : "Ẩn")}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ));
                })()}
              </tbody>
            </table>
          </div>
          <div style={{ marginTop:8, fontSize:12, color:C.t3, display:"flex", justifyContent:"space-between" }}>
            <span>Tổng: <strong>{ddItems.length}</strong> mục. 🔒 Built-in từ constants — ✏️ Custom lưu trong DB.</span>
            <span style={{ color:C.t2 }}>API: <code style={{ fontFamily:"'Fira Code',monospace", fontSize:11 }}>/api/dropdowns/{ddCategory}</code></span>
          </div>
        </Card>
      )}

      {/* Modal: Thêm / Sửa dropdown item */}
      {ddModal && (
        <Modal open={true} onClose={() => setDdModal(null)}
          title={ddModal.mode === "add"
            ? `＋ Thêm mục mới — ${DD_CATS.find(c=>c.id===ddCategory)?.label || ddCategory}`
            : `✏️ Sửa mục — ${ddForm.name}`}
          width={560}
        >
          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
            <Grid cols={2} gap={12}>
              <Field label="ID (chữ hoa, không dấu)" required>
                <Input value={ddForm.id} onChange={v=>setDdForm(f=>({...f,id:v.toUpperCase().replace(/\s/g,"-")}))}
                  placeholder={{ equipment_type:"EQ-MOT", zone_type:"ZN-MFG", department:"DEP-XXX", energy_source:"ENR-XXX", product_type:"PRD-XXX", industry:"IND-XXX" }[ddCategory] || "XXX-001"}
                  disabled={ddModal.mode==="edit"}/>
              </Field>
              <Field label="Icon (emoji)">
                <Input value={ddForm.icon} onChange={v=>setDdForm(f=>({...f,icon:v}))} placeholder="⚙️ 🏭 📦 ..."/>
              </Field>
            </Grid>
            <Field label="Tên hiển thị" required>
              <Input value={ddForm.name} onChange={v=>setDdForm(f=>({...f,name:v}))}
                placeholder="Tên đầy đủ bằng tiếng Việt..."/>
            </Field>
            {(ddCategory === "zone_type" || ddCategory === "department" || ddCategory === "product_type" || ddCategory === "industry") && (
              <Field label="Mô tả ngắn (tuỳ chọn)">
                <Input value={ddForm.desc} onChange={v=>setDdForm(f=>({...f,desc:v}))}
                  placeholder="Mô tả chức năng, đặc điểm..."/>
              </Field>
            )}
            {(ddCategory === "equipment_type" || ddCategory === "energy_source") && (
              <Field label="Tiêu chuẩn tham chiếu (ref_std)">
                <Input value={ddForm.ref_std} onChange={v=>setDdForm(f=>({...f,ref_std:v}))}
                  placeholder="ISO 50001 §8.1; TT 36/2016; IEC 60034..."/>
              </Field>
            )}
            {ddCategory === "equipment_type" && (
              <Field label="Checklist kiểm tra (mỗi dòng 1 mục)">
                <textarea value={ddForm.checks}
                  onChange={e=>setDdForm(f=>({...f,checks:e.target.value}))}
                  rows={4}
                  placeholder={"Kiểm tra công suất định mức vs thực tế\nĐo hiệu suất định kỳ\nKiểm tra biến tần VFD..."}
                  style={{ width:"100%", background:C.bg3, border:`1px solid ${C.bd0}`, borderRadius:8, padding:"8px 12px", color:C.t0, fontSize:13, resize:"vertical", fontFamily:"inherit" }}/>
              </Field>
            )}
            <Field label="Thứ tự hiển thị (order)">
              <Input value={ddForm.order} onChange={v=>setDdForm(f=>({...f,order:v}))} placeholder="9999"/>
            </Field>
            <div style={{ display:"flex", justifyContent:"flex-end", gap:8, paddingTop:8, borderTop:`1px solid ${C.bd0}` }}>
              <Btn v="ghost" sz="md" onClick={() => setDdModal(null)}>Hủy</Btn>
              <Btn v="blue" sz="md" onClick={saveDdItem} loading={ddSaving}>
                {ddModal.mode==="add" ? "＋ Thêm mục" : "💾 Lưu thay đổi"}
              </Btn>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

