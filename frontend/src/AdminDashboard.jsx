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
import { Card, Field, Grid, Input, Sel, Btn, Tag, KPIBar, Modal, TA, DatePicker } from "./gap.atoms.jsx";

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
  const [tab, setTab] = useState(initialTab || "surveys"); // surveys | clients | auditors | audit_plan | logistics | checklist | export

  // Trạng thái cho các modal CRUD
  const [editSurvey, setEditSurvey] = useState(null);

  // Checklist (điều khoản GAP) — CRUD state
  const [clItems, setClItems] = useState([]);
  const [clLoading, setClLoading] = useState(false);
  const [clModal, setClModal] = useState(null); // null | { mode:"add"|"edit", item?:{} }
  const [clForm, setClForm] = useState({ id:"", clause:"", title:"", weight:2, cat:"doc", legal:"" });
  const [clSaving, setClSaving] = useState(false);
  const [clFilter, setClFilter] = useState("");

  // Dropdown items state
  const [ddCategory, setDdCategory] = useState("equipment_type");
  const [ddItems, setDdItems] = useState([]);
  const [ddLoading, setDdLoading] = useState(false);
  const [ddModal, setDdModal] = useState(null); // null | { mode:"add"|"edit", item?:{} }
  const [ddForm, setDdForm] = useState({ id:"", name:"", icon:"", desc:"", ref_std:"", checks:"", order:9999 });
  const [ddSaving, setDdSaving] = useState(false);
  const [ddFilter, setDdFilter] = useState("");

  const loadDropdowns = useCallback(async (cat) => {
    const b = base(apiUrl);
    const category = cat || ddCategory;
    setDdLoading(true);
    try {
      const res = await fetch(`${b}/api/iso50001/gap/dropdowns/${category}`);
      const data = await res.json().catch(() => []);
      setDdItems(Array.isArray(data) ? data : []);
    } finally { setDdLoading(false); }
  }, [apiUrl, ddCategory]);

  useEffect(() => { if (tab === "dropdowns") loadDropdowns(); }, [tab, loadDropdowns]);

  const saveDdItem = useCallback(async () => {
    const b = base(apiUrl);
    if (!b) return;
    const { id, name, icon, desc, ref_std, checks, order } = ddForm;
    if (!name.trim()) return alert("Tên là bắt buộc");
    if (ddModal?.mode === "add" && !id.trim()) return alert("ID là bắt buộc");
    setDdSaving(true);
    try {
      const isEdit = ddModal?.mode === "edit";
      const checksArr = checks ? checks.split("\n").map(s=>s.trim()).filter(Boolean) : [];
      if (isEdit) {
        const url = `${b}/api/iso50001/gap/dropdowns/${ddModal.item.id}`;
        const res = await fetch(url, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ category: ddCategory, name, icon, desc, ref_std, checks: checksArr, order: Number(order) }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) { alert("Lỗi: " + (data.error || res.status)); return; }
      } else {
        const res = await fetch(`${b}/api/iso50001/gap/dropdowns`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ category: ddCategory, id, name, icon, desc, ref_std, checks: checksArr, order: Number(order) }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) { alert("Lỗi: " + (data.error || res.status)); return; }
      }
      setDdModal(null);
      await loadDropdowns();
    } finally { setDdSaving(false); }
  }, [apiUrl, ddForm, ddModal, ddCategory, loadDropdowns]);

  const deleteDdItem = useCallback(async (item) => {
    const label = item.isCustom ? `Xóa mục "${item.name}"?` : `Ẩn mục built-in "${item.name}" khỏi dropdown?`;
    if (!window.confirm(label)) return;
    const b = base(apiUrl);
    await fetch(`${b}/api/iso50001/gap/dropdowns/${item.id}?category=${ddCategory}`, { method: "DELETE" });
    await loadDropdowns();
  }, [apiUrl, ddCategory, loadDropdowns]);

  const loadChecklist = useCallback(async () => {
    const b = base(apiUrl);
    setClLoading(true);
    try {
      const res = await fetch(`${b}/api/iso50001/gap/checklist`);
      const data = await res.json().catch(() => []);
      setClItems(Array.isArray(data) ? data : []);
    } finally { setClLoading(false); }
  }, [apiUrl]);

  useEffect(() => { if (tab === "checklist") loadChecklist(); }, [tab, loadChecklist]);

  const saveClItem = useCallback(async () => {
    const b = base(apiUrl);
    const { id, clause, title, weight, cat, legal } = clForm;
    if (!id.trim() || !clause.trim() || !title.trim()) return alert("id, clause, title là bắt buộc");
    setClSaving(true);
    try {
      const isEdit = clModal?.mode === "edit";
      const url = isEdit ? `${b}/api/iso50001/gap/checklist/${id}` : `${b}/api/iso50001/gap/checklist`;
      const method = isEdit ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, clause, title, weight: Number(weight), cat, legal }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { alert("Lỗi: " + (data.error || res.status)); return; }
      setClModal(null);
      await loadChecklist();
    } finally { setClSaving(false); }
  }, [apiUrl, clForm, clModal, loadChecklist]);

  const deleteClItem = useCallback(async (itemId) => {
    if (!window.confirm(`Xóa điều khoản "${itemId}"? Hành động này không thể hoàn tác.`)) return;
    const b = base(apiUrl);
    await fetch(`${b}/api/iso50001/gap/checklist/${itemId}`, { method: "DELETE" });
    await loadChecklist();
  }, [apiUrl, loadChecklist]);

  // Audit plan modal state
  const [planModal, setPlanModal] = useState(null); // { survey } | null
  const [planForm, setPlanForm] = useState({
    plan_code: "", visit_no: "", customer_ref: "",
    from_city: "", to_city: "", from_date: "", to_date: "",
    auditors_text: "",
  });
  const [planSaving, setPlanSaving] = useState(false);
  const [editType, setEditType] = useState(null); // "client" | "auditor"
  const [clientForm, setClientForm] = useState({ name: "", site: "", address: "", industry: "", annual_energy: "", cert_status: "" });
  const [auditorForm, setAuditorForm] = useState({ org: "", lead: "", team: "" });

  const [clientBulk, setClientBulk] = useState(null);   // { key, surveys: [...], selectedId }
  const [auditorBulk, setAuditorBulk] = useState(null); // { name, org, surveys: [...], selectedId }

  const [travelModal, setTravelModal] = useState(null); // { mode: 'add'|'edit', item?: {}, surveyId?: '' }
  const [tForm, setTForm] = useState({ surveyId: "", who: "", from_city: "", to_city: "", mode: "air", provider: "", depart_date: "", return_date: "", note: "" });

  const [hotelModal, setHotelModal] = useState(null); // { mode: 'add'|'edit', item?: {}, surveyId?: '' }
  const [hForm, setHForm] = useState({ surveyId: "", who: "", from_date: "", to_date: "", nights: 1, hotel_name: "", hotel_address: "", contact_name: "", contact_phone: "", unit_price: "", invoice_request: false, invoice_no: "" });


  const [clientFilter, setClientFilter] = useState("");
  const [refFilter, setRefFilter] = useState("");
  const [planFilter, setPlanFilter] = useState("");
  const [auditorFilter, setAuditorFilter] = useState("");
  const [transportFilter, setTransportFilter] = useState("");

  const load = useCallback(async () => {
    const b = base(apiUrl);
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
      const trips = Array.isArray(s.travel_logs) ? s.travel_logs : [];

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
      const travels = Array.isArray(s.travel_logs) ? s.travel_logs : [];
      const hotels  = Array.isArray(s.hotel_logs) ? s.hotel_logs : [];
      totalTrips += travels.length + hotels.length;
    });
    return {
      surveys: filtered.length,
      clients: uniqueClients.size,
      trips: totalTrips,
      people: totalPeople,
      nights: totalNights,
    };
  }, [filtered]);
  const [dbClients, setDbClients] = useState([]);
  const [dbAuditors, setDbAuditors] = useState([]);
  const [clientSaving, setClientSaving] = useState(false);
  const [auditorSaving, setAuditorSaving] = useState(false);

  const loadMasterData = useCallback(async () => {
    const b = base(apiUrl);
    try {
      const [cRes, aRes] = await Promise.all([
        fetch(`${b}/api/clients`),
        fetch(`${b}/api/auditors`)
      ]);
      const [cData, aData] = await Promise.all([cRes.json(), aRes.json()]);
      setDbClients(Array.isArray(cData) ? cData : []);
      setDbAuditors(Array.isArray(aData) ? aData : []);
    } catch (e) { console.error("Load master data error", e); }
  }, [apiUrl]);

  useEffect(() => { loadMasterData(); }, [loadMasterData]);

  const filteredClients = useMemo(() => {
    const lc = (s) => String(s || "").toLowerCase();
    return dbClients.filter((c) => {
      if (clientFilter && !lc(c.name).includes(lc(clientFilter)) && !lc(c.site).includes(lc(clientFilter))) return false;
      return true;
    });
  }, [dbClients, clientFilter]);

  const filteredAuditors = useMemo(() => {
    const lc = (s) => String(s || "").toLowerCase();
    return dbAuditors.filter((a) => {
      const txt = lc(a.name) + " " + lc(a.org);
      if (auditorFilter && !txt.includes(lc(auditorFilter))) return false;
      return true;
    });
  }, [dbAuditors, auditorFilter]);

  const travelRows = useMemo(() => {
    const rows = [];
    filtered.forEach((s) => {
      const logs = Array.isArray(s.travel_logs) ? s.travel_logs : [];
      logs.forEach((t, idx) => {
        rows.push({
          id: `${s._id}_${idx}`,
          surveyId: s._id,
          tripIndex: idx,
          ref_no: s.meta?.ref_no || "",
          client: s.client?.name || "",
          who: t.who || "",
          mode: t.mode || "air",
          provider: t.provider || "",
          route: `${t.from_city || "—"} → ${t.to_city || "—"}`,
          depart_date: t.depart_date || "",
          return_date: t.return_date || "",
          note: t.note || "",
          original: t,
        });
      });
    });
    return rows;
  }, [filtered]);

  const hotelRows = useMemo(() => {
    const rows = [];
    filtered.forEach((s) => {
      const logs = Array.isArray(s.hotel_logs) ? s.hotel_logs : [];
      logs.forEach((t, idx) => {
        rows.push({
          id: `${s._id}_${idx}`,
          surveyId: s._id,
          tripIndex: idx,
          ref_no: s.meta?.ref_no || "",
          client: s.client?.name || "",
          who: t.who || "",
          hotel_name: t.hotel_name || "",
          time: `${t.from_date || "—"}${t.to_date ? ` → ${t.to_date}` : ""}`,
          nights: t.nights || 0,
          contact: `${t.contact_name || ""} ${t.contact_phone || ""}`.trim() || "—",
          billing: `Giá: ${t.unit_price || "—"} - ${t.invoice_request ? "HĐ: " + (t.invoice_no || "Có") : "Không HĐ"}`,
          original: t,
        });
      });
    });
    return rows;
  }, [filtered]);

  const renderFilterSummary = () => {
    if (tab === "clients") return `Đang hiển thị ${filteredClients.length} khách hàng (từ tổng số ${dbClients.length} bản ghi).`;
    if (tab === "auditors") return `Đang hiển thị ${filteredAuditors.length} chuyên gia (từ tổng số ${dbAuditors.length} bản ghi).`;
    if (tab === "logistics") return `Đang hiển thị ${travelRows.length} chuyến đi & ${hotelRows.length} booking KS (thuộc ${filtered.length} kế hoạch).`;
    return `Đang hiển thị ${filtered.length} kế hoạch (từ tổng số ${items.length} bản ghi).`;
  };

  // Handle Clients CRUD
  const [clientModal, setClientModal] = useState(null); // { mode: "add"|"edit", item?: {} }
  const [cForm, setCForm] = useState({ name:"", site:"", industry:"", annual_energy:"", cert_status:"", address:"", contact_person:"" });
  const openClient = (item) => {
    if (item) { setClientModal({ mode: "edit", item }); setCForm({ ...item, name: item.name||"", site: item.site||"" }); }
    else { setClientModal({ mode: "add" }); setCForm({ name:"", site:"", industry:"", annual_energy:"", cert_status:"", address:"", contact_person:"" }); }
  };
  const saveClientDb = async () => {
    const b = base(apiUrl);
    if (!cForm.name) return alert("Tên khách hàng là bắt buộc");
    setClientSaving(true);
    try {
      const isEdit = clientModal.mode === "edit";
      const u = isEdit ? `${b}/api/clients/${clientModal.item._id}` : `${b}/api/clients`;
      const res = await fetch(u, { method: isEdit ? "PUT" : "POST", headers: {"Content-Type":"application/json"}, body: JSON.stringify(cForm) });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error); }
      await loadMasterData();
      setClientModal(null);
    } catch(e) { alert(e.message); } finally { setClientSaving(false); }
  };
  const deleteClientDb = async (id) => {
    if (!window.confirm("Xóa khách hàng này?")) return;
    await fetch(`${base(apiUrl)}/api/clients/${id}`, { method: "DELETE" });
    await loadMasterData();
  };

  // Handle Auditors CRUD
  const [auditorModal, setAuditorModal] = useState(null); // { mode: "add"|"edit", item?: {} }
  const [aForm, setAForm] = useState({ name:"", org:"", role:"", email:"", phone:"" });
  const openAuditor = (item) => {
    if (item) { setAuditorModal({ mode: "edit", item }); setAForm({ ...item, name: item.name||"" }); }
    else { setAuditorModal({ mode: "add" }); setAForm({ name:"", org:"", role:"Auditor", email:"", phone:"" }); }
  };
  const saveAuditorDb = async () => {
    const b = base(apiUrl);
    if (!aForm.name) return alert("Tên là bắt buộc");
    setAuditorSaving(true);
    try {
      const isEdit = auditorModal.mode === "edit";
      const u = isEdit ? `${b}/api/auditors/${auditorModal.item._id}` : `${b}/api/auditors`;
      const res = await fetch(u, { method: isEdit ? "PUT" : "POST", headers: {"Content-Type":"application/json"}, body: JSON.stringify(aForm) });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error); }
      await loadMasterData();
      setAuditorModal(null);
    } catch(e) { alert(e.message); } finally { setAuditorSaving(false); }
  };
  const deleteAuditorDb = async (id) => {
    if (!window.confirm("Xóa Auditor này?")) return;
    await fetch(`${base(apiUrl)}/api/auditors/${id}`, { method: "DELETE" });
    await loadMasterData();
  };
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

  // Dữ liệu analytics & biểu đồ (nếu cần)
  // ...

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
      <div style={{ display: "flex", gap: 6, marginBottom: 4 }}>
        {[
          ["surveys", "Quản trị GAP & Kế hoạch"],
          ["clients", "Quản trị Khách hàng"],
          ["auditors", "Quản trị Auditors"],
          ["audit_plan", "🧭 Kế hoạch đánh giá GAP"],
          ["logistics", "🧳 Logistics & Khách sạn"],
          ["checklist", "📝 Quản trị điều khoản"],
          ["dropdowns", "🗂️ Quản trị Dropdown"],
          ["export", "Form Export báo cáo"],
        ].map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            style={{
              padding: "6px 12px",
              borderRadius: 999,
              border: `1px solid ${tab === id ? C.blue : C.bd0}`,
              background: tab === id ? `${C.blue}22` : C.bg2,
              color: tab === id ? C.blueL : C.t1,
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Bộ lọc áp dụng chung cho khối Survey & Export */}
      {!["dropdowns", "checklist"].includes(tab) && (
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
          <span style={{ fontSize: 13, color: C.t2 }}>
            {renderFilterSummary()}
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
      )}

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
          <div style={{ marginBottom: 12, display: "flex", justifyContent: "flex-end" }}>
            <Btn v="primary" sz="md" onClick={() => openClient(null)}>
              + Khách hàng mới
            </Btn>
          </div>
          <div style={{ overflowX: "auto", borderRadius: 10, border: `1px solid ${C.bd0}` }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
              <thead>
                <tr style={{ background: C.bg3 }}>
                  <th style={{ padding: "8px 10px", textAlign: "left", borderBottom: `1px solid ${C.bd0}` }}>Khách hàng</th>
                  <th style={{ padding: "8px 10px", textAlign: "left", borderBottom: `1px solid ${C.bd0}` }}>Cơ sở</th>
                  <th style={{ padding: "8px 10px", textAlign: "left", borderBottom: `1px solid ${C.bd0}` }}>Ngành / NL tiêu thụ</th>
                  <th style={{ padding: "8px 10px", textAlign: "left", borderBottom: `1px solid ${C.bd0}` }}>Trạng thái chứng nhận</th>
                  <th style={{ padding: "8px 10px", textAlign: "right", borderBottom: `1px solid ${C.bd0}` }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredClients.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: 12, textAlign: "center", color: C.t3 }}>
                      Không có dữ liệu khách hàng phù hợp.
                    </td>
                  </tr>
                ) : (
                  filteredClients.map((c) => (
                    <tr key={c._id} style={{ background: C.bg2 }}>
                      <td style={{ padding: "6px 10px", borderBottom: `1px solid ${C.bd2}`, color: C.t0 }}>{c.name}</td>
                      <td style={{ padding: "6px 10px", borderBottom: `1px solid ${C.bd2}`, color: C.t1 }}>{c.site}</td>
                      <td style={{ padding: "6px 10px", borderBottom: `1px solid ${C.bd2}`, color: C.t1, fontSize: 13 }}>
                        {c.industry || "—"} {c.annual_energy && <span style={{ color: C.t2 }}> — {c.annual_energy}</span>}
                      </td>
                      <td style={{ padding: "6px 10px", borderBottom: `1px solid ${C.bd2}`, color: C.t1, fontSize: 13 }}>
                        {c.cert_status || "—"}
                      </td>
                      <td style={{ padding: "6px 10px", borderBottom: `1px solid ${C.bd2}`, textAlign: "right" }}>
                        <Btn v="ghost" sz="sm" sx={{ marginRight: 6 }} onClick={() => openClient(c)}>Sửa</Btn>
                        <Btn v="ghost" sz="sm" sx={{ color: C.redL }} onClick={() => deleteClientDb(c._id)}>Xoá</Btn>
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
          <div style={{ marginBottom: 12, display: "flex", justifyContent: "flex-end" }}>
            <Btn v="primary" sz="md" onClick={() => openAuditor(null)}>
              + Chuyên gia mới
            </Btn>
          </div>
          <div style={{ overflowX: "auto", borderRadius: 10, border: `1px solid ${C.bd0}` }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
              <thead>
                <tr style={{ background: C.bg3 }}>
                  <th style={{ padding: "8px 10px", textAlign: "left", borderBottom: `1px solid ${C.bd0}` }}>Tên auditor</th>
                  <th style={{ padding: "8px 10px", textAlign: "left", borderBottom: `1px solid ${C.bd0}` }}>Vai trò</th>
                  <th style={{ padding: "8px 10px", textAlign: "left", borderBottom: `1px solid ${C.bd0}` }}>Tổ chức</th>
                  <th style={{ padding: "8px 10px", textAlign: "left", borderBottom: `1px solid ${C.bd0}` }}>Email / ĐT</th>
                  <th style={{ padding: "8px 10px", textAlign: "right", borderBottom: `1px solid ${C.bd0}` }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredAuditors.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: 12, textAlign: "center", color: C.t3 }}>
                      Không có dữ liệu chuyên gia phù hợp.
                    </td>
                  </tr>
                ) : (
                  filteredAuditors.map((a) => (
                    <tr key={a._id} style={{ background: C.bg2 }}>
                      <td style={{ padding: "6px 10px", borderBottom: `1px solid ${C.bd2}`, color: C.t0 }}>{a.name}</td>
                      <td style={{ padding: "6px 10px", borderBottom: `1px solid ${C.bd2}`, color: C.t1 }}>{a.role || "—"}</td>
                      <td style={{ padding: "6px 10px", borderBottom: `1px solid ${C.bd2}`, color: C.t1 }}>{a.org || "—"}</td>
                      <td style={{ padding: "6px 10px", borderBottom: `1px solid ${C.bd2}`, color: C.t1 }}>
                        {a.email || "—"} / {a.phone || "—"}
                      </td>
                      <td style={{ padding: "6px 10px", borderBottom: `1px solid ${C.bd2}`, textAlign: "right" }}>
                        <Btn v="ghost" sz="sm" sx={{ marginRight: 6 }} onClick={() => openAuditor(a)}>Sửa</Btn>
                        <Btn v="ghost" sz="sm" sx={{ color: C.redL }} onClick={() => deleteAuditorDb(a._id)}>Xoá</Btn>
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
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* 1. Travel Logs */}
          <Card title="Quản trị Di chuyển (Travel)" icon="✈️" accent={C.sky}>
            <div style={{ marginBottom: 12, display: "flex", justifyContent: "flex-end" }}>
              <Btn v="primary" sz="md" onClick={() => {
                setTForm({ surveyId: items[0]?._id || "", who: "", from_city: "", to_city: "", mode: "air", provider: "", depart_date: "", return_date: "", note: "" });
                setTravelModal({ mode: "add" });
              }}>+ Thêm kịch bản di chuyển</Btn>
            </div>
            <div style={{ overflowX: "auto", borderRadius: 10, border: `1px solid ${C.bd0}` }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
                <thead>
                  <tr style={{ background: C.bg3 }}>
                    <th style={{ padding: "8px 10px", textAlign: "left", borderBottom: `1px solid ${C.bd0}` }}>Mã khảo sát</th>
                    <th style={{ padding: "8px 10px", textAlign: "left", borderBottom: `1px solid ${C.bd0}` }}>Khách hàng</th>
                    <th style={{ padding: "8px 10px", textAlign: "left", borderBottom: `1px solid ${C.bd0}` }}>Người đi</th>
                    <th style={{ padding: "8px 10px", textAlign: "left", borderBottom: `1px solid ${C.bd0}` }}>Thông tin chuyến</th>
                    <th style={{ padding: "8px 10px", textAlign: "left", borderBottom: `1px solid ${C.bd0}` }}>Tuyến đường & Thời gian</th>
                    <th style={{ padding: "8px 10px", textAlign: "left", borderBottom: `1px solid ${C.bd0}` }}>Notes</th>
                    <th style={{ padding: "8px 10px", textAlign: "right", borderBottom: `1px solid ${C.bd0}` }}>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {travelRows.length === 0 ? (
                    <tr><td colSpan={7} style={{ padding: 12, textAlign: "center", color: C.t3 }}>Chưa có chuyến đi nào được khai báo.</td></tr>
                  ) : (
                    travelRows.map((r) => (
                      <tr key={r.id} style={{ background: C.bg2 }}>
                        <td style={{ padding: "6px 10px", borderBottom: `1px solid ${C.bd2}`, fontFamily: "'Fira Code',monospace", color: C.blueL }}>{r.ref_no}</td>
                        <td style={{ padding: "6px 10px", borderBottom: `1px solid ${C.bd2}`, color: C.t0 }}>{r.client}</td>
                        <td style={{ padding: "6px 10px", borderBottom: `1px solid ${C.bd2}`, color: C.t0, fontWeight: 600 }}>{r.who}</td>
                        <td style={{ padding: "6px 10px", borderBottom: `1px solid ${C.bd2}`, color: C.t1 }}>
                          <Tag c={r.mode === "air" ? C.sky : r.mode === "water" ? C.teal : C.orange}>{r.mode || "—"}</Tag>
                          <div style={{ fontSize: 13, marginTop: 4 }}>Hãng: {r.provider || "—"}</div>
                        </td>
                        <td style={{ padding: "6px 10px", borderBottom: `1px solid ${C.bd2}`, color: C.t1 }}>
                          <div style={{ fontSize: 13 }}>{r.route}</div>
                          <div style={{ fontSize: 13, color: C.t2 }}>{r.depart_date} → {r.return_date}</div>
                        </td>
                        <td style={{ padding: "6px 10px", borderBottom: `1px solid ${C.bd2}`, color: C.t2, fontSize: 13 }}>{r.note || "—"}</td>
                        <td style={{ padding: "6px 10px", borderBottom: `1px solid ${C.bd2}`, textAlign: "right" }}>
                          <Btn v="ghost" sz="sm" onClick={() => {
                            setTForm({ surveyId: r.surveyId, ...r.original });
                            setTravelModal({ mode: "edit", tripIndex: r.tripIndex, surveyId: r.surveyId });
                          }}>Sửa</Btn>
                          <Btn v="ghost" sz="sm" sx={{ color: C.redL }} onClick={async () => {
                            if (!window.confirm("Xóa chuyến đi này?")) return;
                            const survey = items.find(s => s._id === r.surveyId);
                            const copy = [...(survey.travel_logs || [])];
                            copy.splice(r.tripIndex, 1);
                            await updateSurvey({ ...survey, travel_logs: copy });
                          }}>Xóa</Btn>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          {/* 2. Hotel Logs */}
          <Card title="Quản trị Lưu trú (Hotels)" icon="🛏️" accent={C.green}>
            <div style={{ marginBottom: 12, display: "flex", justifyContent: "flex-end" }}>
              <Btn v="primary" sz="md" onClick={() => {
                setHForm({ surveyId: items[0]?._id || "", who: "", from_date: "", to_date: "", nights: 1, hotel_name: "", hotel_address: "", contact_name: "", contact_phone: "", unit_price: "", invoice_request: false, invoice_no: "" });
                setHotelModal({ mode: "add" });
              }}>+ Book Khách sạn mới</Btn>
            </div>
            <div style={{ overflowX: "auto", borderRadius: 10, border: `1px solid ${C.bd0}` }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
                <thead>
                  <tr style={{ background: C.bg3 }}>
                    <th style={{ padding: "8px 10px", textAlign: "left", borderBottom: `1px solid ${C.bd0}` }}>Mã khảo sát</th>
                    <th style={{ padding: "8px 10px", textAlign: "left", borderBottom: `1px solid ${C.bd0}` }}>Khách hàng</th>
                    <th style={{ padding: "8px 10px", textAlign: "left", borderBottom: `1px solid ${C.bd0}` }}>Người ở</th>
                    <th style={{ padding: "8px 10px", textAlign: "left", borderBottom: `1px solid ${C.bd0}` }}>Thời gian & Số đêm</th>
                    <th style={{ padding: "8px 10px", textAlign: "left", borderBottom: `1px solid ${C.bd0}` }}>Khách sạn (Hotel)</th>
                    <th style={{ padding: "8px 10px", textAlign: "left", borderBottom: `1px solid ${C.bd0}` }}>Đơn giá & Hoá đơn</th>
                    <th style={{ padding: "8px 10px", textAlign: "right", borderBottom: `1px solid ${C.bd0}` }}>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {hotelRows.length === 0 ? (
                    <tr><td colSpan={7} style={{ padding: 12, textAlign: "center", color: C.t3 }}>Chưa có khai báo lưu trú khách sạn nào.</td></tr>
                  ) : (
                    hotelRows.map((r) => (
                      <tr key={r.id} style={{ background: C.bg2 }}>
                        <td style={{ padding: "6px 10px", borderBottom: `1px solid ${C.bd2}`, fontFamily: "'Fira Code',monospace", color: C.blueL }}>{r.ref_no}</td>
                        <td style={{ padding: "6px 10px", borderBottom: `1px solid ${C.bd2}`, color: C.t0 }}>{r.client}</td>
                        <td style={{ padding: "6px 10px", borderBottom: `1px solid ${C.bd2}`, color: C.t0, fontWeight: 600 }}>{r.who}</td>
                        <td style={{ padding: "6px 10px", borderBottom: `1px solid ${C.bd2}`, color: C.t1 }}>
                          <div>{r.time}</div>
                          <Tag c={C.green} sx={{ marginTop: 4 }}>{r.nights} đêm</Tag>
                        </td>
                        <td style={{ padding: "6px 10px", borderBottom: `1px solid ${C.bd2}`, color: C.t1, fontSize: 13 }}>
                          <strong>{r.hotel_name}</strong><br/>
                          <span style={{ color: C.t2 }}>{r.contact}</span>
                        </td>
                        <td style={{ padding: "6px 10px", borderBottom: `1px solid ${C.bd2}`, color: C.t1, fontSize: 13 }}>{r.billing}</td>
                        <td style={{ padding: "6px 10px", borderBottom: `1px solid ${C.bd2}`, textAlign: "right" }}>
                          <Btn v="ghost" sz="sm" onClick={() => {
                            setHForm({ surveyId: r.surveyId, ...r.original });
                            setHotelModal({ mode: "edit", tripIndex: r.tripIndex, surveyId: r.surveyId });
                          }}>Sửa</Btn>
                          <Btn v="ghost" sz="sm" sx={{ color: C.redL }} onClick={async () => {
                            if (!window.confirm("Xóa lưu trú này?")) return;
                            const survey = items.find(s => s._id === r.surveyId);
                            const copy = [...(survey.hotel_logs || [])];
                            copy.splice(r.tripIndex, 1);
                            await updateSurvey({ ...survey, hotel_logs: copy });
                          }}>Xóa</Btn>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {tab === "audit_plan" && (
        <Card title="Kế hoạch đánh giá GAP" icon="🧭" accent={C.green}>
          <p style={{ fontSize: 14, color: C.t2, marginBottom: 12 }}>
            Quản lý kế hoạch đánh giá GAP cho từng phiên khảo sát. Dữ liệu được lưu trực tiếp vào MongoDB và xuất trong báo cáo DOCX.
          </p>
          <div style={{ overflowX: "auto", borderRadius: 10, border: `1px solid ${C.bd0}` }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
              <thead>
                <tr style={{ background: C.bg3 }}>
                  <th style={{ padding: "8px 10px", textAlign: "left", borderBottom: `1px solid ${C.bd0}` }}>Mã khảo sát</th>
                  <th style={{ padding: "8px 10px", textAlign: "left", borderBottom: `1px solid ${C.bd0}` }}>Khách hàng</th>
                  <th style={{ padding: "8px 10px", textAlign: "left", borderBottom: `1px solid ${C.bd0}` }}>Mã kế hoạch</th>
                  <th style={{ padding: "8px 10px", textAlign: "left", borderBottom: `1px solid ${C.bd0}` }}>Đợt khảo sát</th>
                  <th style={{ padding: "8px 10px", textAlign: "left", borderBottom: `1px solid ${C.bd0}` }}>Thời gian</th>
                  <th style={{ padding: "8px 10px", textAlign: "left", borderBottom: `1px solid ${C.bd0}` }}>Lead auditor</th>
                  <th style={{ padding: "8px 10px", textAlign: "right", borderBottom: `1px solid ${C.bd0}` }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={7} style={{ padding: 12, textAlign: "center", color: C.t3 }}>Chưa có phiên nào.</td></tr>
                ) : filtered.map((s) => {
                  const ap = s.audit_plan || {};
                  const lead = ap.auditors?.find(a => a.role?.toLowerCase().includes("lead"))?.name || s.verifier?.lead || "";
                  return (
                    <tr key={s._id} style={{ background: C.bg2 }}>
                      <td style={{ padding: "6px 10px", borderBottom: `1px solid ${C.bd2}`, fontFamily: "'Fira Code',monospace", color: C.blueL, fontSize: 13 }}>{s.meta?.ref_no || s._id}</td>
                      <td style={{ padding: "6px 10px", borderBottom: `1px solid ${C.bd2}`, color: C.t0 }}>{s.client?.name || "—"}</td>
                      <td style={{ padding: "6px 10px", borderBottom: `1px solid ${C.bd2}`, color: C.t1 }}>{ap.plan_code || "—"}</td>
                      <td style={{ padding: "6px 10px", borderBottom: `1px solid ${C.bd2}`, color: C.t1 }}>{ap.visit_no || "—"}</td>
                      <td style={{ padding: "6px 10px", borderBottom: `1px solid ${C.bd2}`, color: C.t2, fontSize: 13 }}>
                        {ap.from_date || "—"}{ap.to_date ? ` → ${ap.to_date}` : ""}
                      </td>
                      <td style={{ padding: "6px 10px", borderBottom: `1px solid ${C.bd2}`, color: C.t1 }}>{lead || "—"}</td>
                      <td style={{ padding: "6px 10px", borderBottom: `1px solid ${C.bd2}`, textAlign: "right" }}>
                        <Btn v="ghost" sz="sm" onClick={() => {
                          const ap2 = s.audit_plan || {};
                          const auditorsText = (ap2.auditors || [])
                            .map(a => `${a.name || ""}${a.role ? ` (${a.role})` : ""}${a.org ? ` – ${a.org}` : ""}`)
                            .filter(Boolean).join("; ") || s.verifier?.team || "";
                          setPlanForm({
                            plan_code: ap2.plan_code || "",
                            visit_no: ap2.visit_no || "",
                            customer_ref: ap2.customer_ref || "",
                            from_city: ap2.from_city || "",
                            to_city: ap2.to_city || "",
                            from_date: ap2.from_date || "",
                            to_date: ap2.to_date || "",
                            auditors_text: auditorsText,
                          });
                          setPlanModal({ survey: s });
                        }}>
                          Sửa kế hoạch
                        </Btn>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Modal: Kế hoạch đánh giá GAP */}
      {planModal && (
        <Modal
          open={!!planModal}
          onClose={() => setPlanModal(null)}
          title={`Kế hoạch đánh giá GAP — ${planModal.survey?.meta?.ref_no || ""}`}
          width={640}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <Grid cols={2} gap={12}>
              <Field label="Mã kế hoạch / Hợp đồng">
                <Input value={planForm.plan_code} onChange={v => setPlanForm(f => ({ ...f, plan_code: v }))} placeholder="PLAN-2024-001 / HĐ TVNL-2024-01" />
              </Field>
              <Field label="Đợt khảo sát">
                <Input value={planForm.visit_no} onChange={v => setPlanForm(f => ({ ...f, visit_no: v }))} placeholder="Đợt 1/2024" />
              </Field>
              <Field label="Mã khách hàng nội bộ">
                <Input value={planForm.customer_ref} onChange={v => setPlanForm(f => ({ ...f, customer_ref: v }))} placeholder="KH-ENERGY-001" />
              </Field>
              <Field label="Khách hàng (Tên doanh nghiệp)">
                <Input value={planModal.survey?.client?.name || ""} disabled />
              </Field>
              <Field label="Địa chỉ cơ sở (Site)">
                <Input value={`${planModal.survey?.client?.site || ""} — ${planModal.survey?.client?.address || ""}`} disabled />
              </Field>
              <Field label="Ngành nghề / Người liên hệ">
                <Input value={`${planModal.survey?.client?.industry || ""} / ${planModal.survey?.client?.representative_name || ""}`} disabled />
              </Field>
              <Field label="Ngày bắt đầu">
                <DatePicker value={planForm.from_date || ""} onChange={v => setPlanForm(f => ({ ...f, from_date: v }))} placeholder="YYYY-MM-DD" />
              </Field>
              <Field label="Ngày kết thúc">
                <DatePicker value={planForm.to_date || ""} onChange={v => setPlanForm(f => ({ ...f, to_date: v }))} placeholder="YYYY-MM-DD" />
              </Field>
            </Grid>
            <Field label="Danh sách Auditors (Chọn từ danh sách)">
              <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 150, overflowY: "auto", padding: 10, background: C.bg4, border: `1px solid ${C.bd0}`, borderRadius: 6 }}>
                {dbAuditors.length === 0 && <div style={{ fontSize: 13, color: C.t3 }}>Chưa có auditor nào trong hệ thống. Hãy thêm ở Quản trị Auditors.</div>}
                {dbAuditors.map(a => {
                  const labelStr = `${a.name}${a.role ? ` (${a.role})` : ""}${a.org ? ` - ${a.org}` : ""}`;
                  const checked = planForm.auditors_text.includes(a.name);
                  return (
                    <label key={a._id} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, cursor: "pointer", color: C.t0 }}>
                      <input type="checkbox" checked={checked} onChange={(e) => {
                        let arr = planForm.auditors_text.split(";").map(s => s.trim()).filter(Boolean);
                        if (e.target.checked) {
                          if (!arr.includes(labelStr)) arr.push(labelStr);
                        } else {
                          arr = arr.filter(s => !s.startsWith(a.name));
                        }
                        setPlanForm(f => ({ ...f, auditors_text: arr.join("; ") }));
                      }} />
                      {labelStr}
                    </label>
                  )
                })}
              </div>
            </Field>
            {planSaving && <div style={{ fontSize: 13, color: C.t2 }}>Đang lưu...</div>}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 4 }}>
              <Btn v="ghost" sz="md" onClick={() => setPlanModal(null)}>Hủy</Btn>
              <Btn v="blue" sz="md" disabled={planSaving} onClick={async () => {
                const s = planModal.survey;
                if (!s?._id) return;
                const auditors = planForm.auditors_text
                  .split(";").map(t => t.trim()).filter(Boolean)
                  .map(t => {
                    const roleMatch = t.match(/\(([^)]+)\)/);
                    const orgMatch = t.match(/–\s*(.+)$/);
                    const name = t.replace(/\([^)]+\)/, "").replace(/–.+$/, "").trim();
                    return { name, role: roleMatch?.[1] || "", org: orgMatch?.[1]?.trim() || "" };
                  });
                const updated = {
                  ...s,
                  audit_plan: {
                    ...(s.audit_plan || {}),
                    plan_code: planForm.plan_code,
                    visit_no: planForm.visit_no,
                    customer_ref: planForm.customer_ref,
                    from_city: planForm.from_city,
                    to_city: planForm.to_city,
                    from_date: planForm.from_date,
                    to_date: planForm.to_date,
                    auditors,
                  },
                };
                setPlanSaving(true);
                try {
                  await updateSurvey(updated);
                  setPlanModal(null);
                } catch(e) {
                  alert("Lỗi lưu: " + (e.message || e));
                } finally {
                  setPlanSaving(false);
                }
              }}>Lưu vào DB</Btn>
            </div>
          </div>
        </Modal>
      )}

      {tab === "checklist" && (
        <Card title="Quản trị điều khoản GAP (CRUD)" icon="📝" accent={C.violet}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
            <div style={{ display:"flex", gap:8, alignItems:"center" }}>
              <Input value={clFilter} onChange={setClFilter} placeholder="Lọc theo id, clause, tiêu đề..." />
              <Btn v="outline" sz="sm" onClick={loadChecklist} disabled={clLoading}>🔄 Tải lại</Btn>
            </div>
            <div style={{ display:"flex", gap:6 }}>
              <Btn v="ghost" sz="sm" onClick={async () => {
                if (!window.confirm("Seed dữ liệu mặc định (bỏ qua nếu id đã tồn tại)?")) return;
                const b = base(apiUrl);
                const res = await fetch(`${b}/api/iso50001/gap/checklist/seed`, { method:"POST" });
                const d = await res.json().catch(()=>({}));
                alert(`Seed xong: thêm ${d.inserted}, bỏ qua ${d.skipped}, tổng ${d.total}`);
                await loadChecklist();
              }}>⚡ Seed mặc định</Btn>
              <Btn v="blue" sz="sm" onClick={() => {
                setClForm({ id:"", clause:"", title:"", weight:2, cat:"doc", legal:"" });
                setClModal({ mode:"add" });
              }}>＋ Thêm điều khoản</Btn>
            </div>
          </div>
          <div style={{ overflowX:"auto", border:`1px solid ${C.bd0}`, borderRadius:8 }}>
            <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
              <thead>
                <tr style={{ background:C.bg3 }}>
                  <th style={{ padding:"7px 10px", textAlign:"left", borderBottom:`1px solid ${C.bd0}`, whiteSpace:"nowrap" }}>ID</th>
                  <th style={{ padding:"7px 10px", textAlign:"left", borderBottom:`1px solid ${C.bd0}` }}>Clause</th>
                  <th style={{ padding:"7px 10px", textAlign:"left", borderBottom:`1px solid ${C.bd0}` }}>Tiêu đề</th>
                  <th style={{ padding:"7px 10px", textAlign:"left", borderBottom:`1px solid ${C.bd0}` }}>Weight</th>
                  <th style={{ padding:"7px 10px", textAlign:"left", borderBottom:`1px solid ${C.bd0}` }}>Cat</th>
                  <th style={{ padding:"7px 10px", textAlign:"left", borderBottom:`1px solid ${C.bd0}` }}>Pháp lý</th>
                  <th style={{ padding:"7px 8px", textAlign:"right", borderBottom:`1px solid ${C.bd0}`, whiteSpace:"nowrap" }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {clLoading ? (
                  <tr><td colSpan={7} style={{ padding:12, textAlign:"center", color:C.t2 }}>Đang tải...</td></tr>
                ) : clItems.filter(it => {
                  if (!clFilter) return true;
                  const f = clFilter.toLowerCase();
                  return it.id.toLowerCase().includes(f) || it.clause.toLowerCase().includes(f) || it.title.toLowerCase().includes(f);
                }).map((it, idx) => (
                  <tr key={it.id} style={{ background: idx%2 ? C.bg2 : "transparent" }}>
                    <td style={{ padding:"5px 10px", borderBottom:`1px solid ${C.bd2}`, fontFamily:"'Fira Code',monospace", color:C.blueL, whiteSpace:"nowrap" }}>{it.id}</td>
                    <td style={{ padding:"5px 10px", borderBottom:`1px solid ${C.bd2}`, color:C.t2, whiteSpace:"nowrap" }}>{it.clause}</td>
                    <td style={{ padding:"5px 10px", borderBottom:`1px solid ${C.bd2}`, color:C.t0 }}>{it.title}</td>
                    <td style={{ padding:"5px 10px", borderBottom:`1px solid ${C.bd2}`, color:C.t1, whiteSpace:"nowrap" }}>
                      <Tag c={it.weight===3?C.red:it.weight===2?C.orange:C.teal}>{it.weight===3?"⚠ Critical":it.weight===2?"Major":"Minor"}</Tag>
                    </td>
                    <td style={{ padding:"5px 10px", borderBottom:`1px solid ${C.bd2}`, color:C.t2, fontSize:12, whiteSpace:"nowrap" }}>{it.cat}</td>
                    <td style={{ padding:"5px 10px", borderBottom:`1px solid ${C.bd2}`, color:C.t3, fontSize:12, maxWidth:200, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{it.legal || "—"}</td>
                    <td style={{ padding:"5px 8px", borderBottom:`1px solid ${C.bd2}`, textAlign:"right", whiteSpace:"nowrap" }}>
                      <Btn v="ghost" sz="sm" sx={{ marginRight:4 }} onClick={() => {
                        setClForm({ id:it.id, clause:it.clause, title:it.title, weight:it.weight, cat:it.cat, legal:it.legal||"" });
                        setClModal({ mode:"edit", item:it });
                      }}>Sửa</Btn>
                      <Btn v="ghost" sz="sm" sx={{ color:C.red }} onClick={() => deleteClItem(it.id)}>Xóa</Btn>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ marginTop:8, fontSize:13, color:C.t3 }}>
            Tổng: {clItems.length} điều khoản. Thay đổi có hiệu lực ngay khi tải lại trang khảo sát.
          </div>
        </Card>
      )}

      {/* Modal: Thêm / Sửa điều khoản */}
      {clModal && (
        <Modal open={!!clModal} onClose={() => setClModal(null)}
          title={clModal.mode === "add" ? "Thêm điều khoản mới" : `Sửa điều khoản — ${clForm.id}`}
          width={600}
        >
          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
            <Grid cols={2} gap={12}>
              <Field label="ID điều khoản" required>
                <Input value={clForm.id} onChange={v=>setClForm(f=>({...f,id:v}))}
                  placeholder="4.1.5" disabled={clModal.mode==="edit"}/>
              </Field>
              <Field label="Clause (nhóm)" required>
                <Input value={clForm.clause} onChange={v=>setClForm(f=>({...f,clause:v}))} placeholder="4.1"/>
              </Field>
            </Grid>
            <Field label="Tiêu đề điều khoản" required>
              <Input value={clForm.title} onChange={v=>setClForm(f=>({...f,title:v}))}
                placeholder="Mô tả yêu cầu ISO 50001:2018..."/>
            </Field>
            <Grid cols={2} gap={12}>
              <Field label="Mức độ (weight)">
                <select value={clForm.weight} onChange={e=>setClForm(f=>({...f,weight:Number(e.target.value)}))}
                  style={{ width:"100%", padding:"7px 10px", background:C.bg4, border:`1px solid ${C.bd0}`, borderRadius:6, color:C.t0, fontSize:13 }}>
                  <option value={1}>1 — Minor (nhỏ)</option>
                  <option value={2}>2 — Major (lớn)</option>
                  <option value={3}>3 — Critical (nghiêm trọng)</option>
                </select>
              </Field>
              <Field label="Danh mục (cat)">
                <select value={clForm.cat} onChange={e=>setClForm(f=>({...f,cat:e.target.value}))}
                  style={{ width:"100%", padding:"7px 10px", background:C.bg4, border:`1px solid ${C.bd0}`, borderRadius:6, color:C.t0, fontSize:13 }}>
                  <option value="doc">doc — Tài liệu</option>
                  <option value="practice">practice — Thực hành</option>
                  <option value="measurement">measurement — Đo lường</option>
                  <option value="leadership">leadership — Lãnh đạo</option>
                  <option value="legal">legal — Pháp lý</option>
                </select>
              </Field>
            </Grid>
            <Field label="Tham chiếu pháp lý (legal)">
              <Input value={clForm.legal} onChange={v=>setClForm(f=>({...f,legal:v}))}
                placeholder="TT 25/2020/TT-BCT; Luật 50/2010/QH12"/>
            </Field>
            <div style={{ display:"flex", justifyContent:"flex-end", gap:8, marginTop:4 }}>
              <Btn v="ghost" sz="md" onClick={() => setClModal(null)}>Hủy</Btn>
              <Btn v="blue" sz="md" disabled={clSaving} onClick={saveClItem}>
                {clSaving ? "Đang lưu..." : "Lưu vào DB"}
              </Btn>
            </div>
          </div>
        </Modal>
      )}

      {tab === "dropdowns" && (
        <Card title="Quản trị Dropdown (Loại khu vực & Thiết bị)" icon="🗂️" accent={C.teal}>
          {/* Category switcher */}
          <div style={{ display:"flex", gap:8, marginBottom:14 }}>
            {[["equipment_type","⚙️ Loại thiết bị"],["zone_type","🏭 Loại khu vực"]].map(([cat,label]) => (
              <button key={cat} type="button"
                onClick={() => { setDdCategory(cat); setDdFilter(""); loadDropdowns(cat); }}
                style={{ padding:"6px 16px", borderRadius:999,
                  border:`1px solid ${ddCategory===cat ? C.teal : C.bd0}`,
                  background: ddCategory===cat ? `${C.teal}22` : C.bg3,
                  color: ddCategory===cat ? C.tealL : C.t1,
                  fontSize:14, cursor:"pointer", fontWeight: ddCategory===cat ? 700 : 400 }}>
                {label}
              </button>
            ))}
          </div>

          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
            <div style={{ display:"flex", gap:8, alignItems:"center" }}>
              <Input value={ddFilter} onChange={setDdFilter} placeholder="Lọc theo id, tên..." />
              <Btn v="outline" sz="sm" onClick={() => loadDropdowns()} disabled={ddLoading}>🔄 Tải lại</Btn>
            </div>
            <div style={{ display:"flex", gap:6 }}>
              <Btn v="ghost" sz="sm" onClick={async () => {
                if (!window.confirm("Seed tất cả built-in items vào DB (bỏ qua nếu đã có)?")) return;
                const b = base(apiUrl);
                const res = await fetch(`${b}/api/iso50001/gap/dropdowns/seed`, { method:"POST" });
                const d = await res.json().catch(()=>({}));
                alert(`Seed xong: thêm ${d.inserted}, bỏ qua ${d.skipped}`);
                await loadDropdowns();
              }}>⚡ Seed built-in</Btn>
              <Btn v="blue" sz="sm" onClick={() => {
                setDdForm({ id:"", name:"", icon: ddCategory==="equipment_type" ? "⚙️" : "🏭", desc:"", ref_std:"", checks:"", order:9999 });
                setDdModal({ mode:"add" });
              }}>＋ Thêm mục mới</Btn>
            </div>
          </div>

          <div style={{ overflowX:"auto", border:`1px solid ${C.bd0}`, borderRadius:8 }}>
            <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
              <thead>
                <tr style={{ background:C.bg3 }}>
                  <th style={{ padding:"7px 10px", textAlign:"left", borderBottom:`1px solid ${C.bd0}`, whiteSpace:"nowrap" }}>Icon</th>
                  <th style={{ padding:"7px 10px", textAlign:"left", borderBottom:`1px solid ${C.bd0}`, whiteSpace:"nowrap" }}>ID</th>
                  <th style={{ padding:"7px 10px", textAlign:"left", borderBottom:`1px solid ${C.bd0}` }}>Tên</th>
                  {ddCategory === "zone_type" && (
                    <th style={{ padding:"7px 10px", textAlign:"left", borderBottom:`1px solid ${C.bd0}` }}>Mô tả</th>
                  )}
                  {ddCategory === "equipment_type" && (
                    <th style={{ padding:"7px 10px", textAlign:"left", borderBottom:`1px solid ${C.bd0}`, whiteSpace:"nowrap" }}>Tiêu chuẩn</th>
                  )}
                  <th style={{ padding:"7px 10px", textAlign:"left", borderBottom:`1px solid ${C.bd0}`, whiteSpace:"nowrap" }}>Loại</th>
                  <th style={{ padding:"7px 8px", textAlign:"right", borderBottom:`1px solid ${C.bd0}`, whiteSpace:"nowrap" }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {ddLoading ? (
                  <tr><td colSpan={6} style={{ padding:12, textAlign:"center", color:C.t2 }}>Đang tải...</td></tr>
                ) : ddItems.filter(it => {
                  if (!ddFilter) return true;
                  const f = ddFilter.toLowerCase();
                  return it.id.toLowerCase().includes(f) || it.name.toLowerCase().includes(f);
                }).map((it, idx) => (
                  <tr key={it.id} style={{ background: idx%2 ? C.bg2 : "transparent", opacity: it.active===false ? 0.45 : 1 }}>
                    <td style={{ padding:"5px 10px", borderBottom:`1px solid ${C.bd2}`, fontSize:20, lineHeight:1 }}>{it.icon || "📌"}</td>
                    <td style={{ padding:"5px 10px", borderBottom:`1px solid ${C.bd2}`, fontFamily:"'Fira Code',monospace", color:C.tealL, whiteSpace:"nowrap" }}>{it.id}</td>
                    <td style={{ padding:"5px 10px", borderBottom:`1px solid ${C.bd2}`, color:C.t0 }}>{it.name}</td>
                    {ddCategory === "zone_type" && (
                      <td style={{ padding:"5px 10px", borderBottom:`1px solid ${C.bd2}`, color:C.t3, fontSize:12, maxWidth:220, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{it.desc || "—"}</td>
                    )}
                    {ddCategory === "equipment_type" && (
                      <td style={{ padding:"5px 10px", borderBottom:`1px solid ${C.bd2}`, color:C.t3, fontSize:12, whiteSpace:"nowrap" }}>{it.ref_std || "—"}</td>
                    )}
                    <td style={{ padding:"5px 10px", borderBottom:`1px solid ${C.bd2}`, whiteSpace:"nowrap" }}>
                      {it.isCustom
                        ? <Tag c={C.green}>✏️ Custom</Tag>
                        : <Tag c={C.sky}>🔒 Built-in</Tag>}
                      {it.active === false && <Tag c={C.red} sx={{ marginLeft:4 }}>Ẩn</Tag>}
                    </td>
                    <td style={{ padding:"5px 8px", borderBottom:`1px solid ${C.bd2}`, textAlign:"right", whiteSpace:"nowrap" }}>
                      <Btn v="ghost" sz="sm" sx={{ marginRight:4 }} onClick={() => {
                        setDdForm({
                          id: it.id, name: it.name, icon: it.icon || "",
                          desc: it.desc || "", ref_std: it.ref_std || "",
                          checks: (it.checks || []).join("\n"),
                          order: it.order ?? 9999,
                        });
                        setDdModal({ mode:"edit", item: it });
                      }}>Sửa</Btn>
                      <Btn v="ghost" sz="sm" sx={{ color: it.isCustom ? C.red : C.orange }}
                        onClick={() => deleteDdItem(it)}>
                        {it.isCustom ? "Xóa" : "Ẩn"}
                      </Btn>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ marginTop:8, fontSize:13, color:C.t3 }}>
            Tổng: {ddItems.length} mục. Built-in từ constants — Custom lưu trong DB.
          </div>
        </Card>
      )}

      {/* Modal: Thêm / Sửa dropdown item */}
      {ddModal && (
        <Modal open={!!ddModal} onClose={() => setDdModal(null)}
          title={ddModal.mode === "add"
            ? `Thêm mục mới — ${ddCategory === "equipment_type" ? "Loại thiết bị" : "Loại khu vực"}`
            : `Sửa mục — ${ddForm.name}`}
          width={560}
        >
          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
            <Grid cols={2} gap={12}>
              <Field label="ID (chữ hoa, không dấu)" required>
                <Input value={ddForm.id} onChange={v=>setDdForm(f=>({...f,id:v.toUpperCase()}))}
                  placeholder={ddCategory==="equipment_type" ? "EQ-MOT" : "ZN-MFG"}
                  disabled={ddModal.mode==="edit"}/>
              </Field>
              <Field label="Icon (emoji)">
                <Input value={ddForm.icon} onChange={v=>setDdForm(f=>({...f,icon:v}))}
                  placeholder={ddCategory==="equipment_type" ? "⚙️" : "🏭"}/>
              </Field>
            </Grid>
            <Field label="Tên hiển thị" required>
              <Input value={ddForm.name} onChange={v=>setDdForm(f=>({...f,name:v}))}
                placeholder={ddCategory==="equipment_type" ? "Hệ thống động cơ điện" : "Xưởng sản xuất chính"}/>
            </Field>
            {ddCategory === "zone_type" && (
              <Field label="Mô tả (desc)">
                <Input value={ddForm.desc} onChange={v=>setDdForm(f=>({...f,desc:v}))}
                  placeholder="Khu vực sản xuất trọng tâm..."/>
              </Field>
            )}
            {ddCategory === "equipment_type" && (
              <>
                <Field label="Tiêu chuẩn tham chiếu (ref_std)">
                  <Input value={ddForm.ref_std} onChange={v=>setDdForm(f=>({...f,ref_std:v}))}
                    placeholder="ISO 50001 §8.4.1; IEC 60034-30-1"/>
                </Field>
                <Field label="Checklist gợi ý (mỗi dòng 1 mục)">
                  <textarea value={ddForm.checks}
                    onChange={e=>setDdForm(f=>({...f,checks:e.target.value}))}
                    placeholder={"Kiểm tra hệ số công suất\nĐo hiệu suất định kỳ\n..."}
                    rows={4}
                    style={{ width:"100%", background:C.bg4, border:`1px solid ${C.bd0}`,
                      borderRadius:6, padding:"6px 10px", color:C.t0, fontSize:13,
                      resize:"vertical", fontFamily:"inherit" }}/>
                </Field>
              </>
            )}
            <Field label="Thứ tự hiển thị (order)">
              <Input value={String(ddForm.order)} onChange={v=>setDdForm(f=>({...f,order:v}))} placeholder="9999"/>
            </Field>
            <div style={{ display:"flex", justifyContent:"flex-end", gap:8, marginTop:4 }}>
              <Btn v="ghost" sz="md" onClick={() => setDdModal(null)}>Hủy</Btn>
              <Btn v="blue" sz="md" disabled={ddSaving} onClick={saveDdItem}>
                {ddSaving ? "Đang lưu..." : "Lưu vào DB"}
              </Btn>
            </div>
          </div>
        </Modal>
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

      {/* Modal CRUD Travel */}
      {travelModal && (
        <Modal open={true} onClose={() => setTravelModal(null)} title={travelModal.mode === "add" ? "Thêm mới Kịch bản di chuyển" : "Chỉnh sửa Di chuyển"} width={640}>
          <Grid cols={1} gap={10}>
            {travelModal.mode === "add" && (
              <Field label="Chọn Kế hoạch / Phiên GAP *">
                <select value={tForm.surveyId} onChange={e => setTForm({...tForm, surveyId: e.target.value})} style={{ width: "100%", padding: "8px", background: C.bg3, border: `1px solid ${C.bd0}`, borderRadius: 6, color: C.t0 }}>
                  {items.map(s => <option key={s._id} value={s._id}>{s.meta?.ref_no} - {s.client?.name}</option>)}
                </select>
              </Field>
            )}
          </Grid>
          <Grid cols={2} gap={10} style={{ marginTop: 10 }}>
            <Field label="Người đi *"><Input value={tForm.who} onChange={v => setTForm({...tForm, who: v})} placeholder="Tên Auditor" /></Field>
            <Field label="Phương tiện">
              <select value={tForm.mode} onChange={(e) => setTForm({...tForm, mode: e.target.value})} style={{ width: "100%", padding: "8px", background: C.bg3, border: `1px solid ${C.bd0}`, borderRadius: 6, color: C.t0 }}>
                <option value="air">✈ Đường không</option>
                <option value="road">🚗 Đường bộ</option>
                <option value="water">🚢 Đường thủy</option>
              </select>
            </Field>
            <Field label="Đi từ"><Input value={tForm.from_city} onChange={v => setTForm({...tForm, from_city: v})} placeholder="TP.HCM" /></Field>
            <Field label="Đến"><Input value={tForm.to_city} onChange={v => setTForm({...tForm, to_city: v})} placeholder="Hà Nội" /></Field>
            <Field label="Ngày đi"><DatePicker value={tForm.depart_date || ""} onChange={v => setTForm({...tForm, depart_date: v})} placeholder="YYYY-MM-DD" /></Field>
            <Field label="Ngày về"><DatePicker value={tForm.return_date || ""} onChange={v => setTForm({...tForm, return_date: v})} placeholder="YYYY-MM-DD" /></Field>
          </Grid>
          <Grid cols={1} gap={10} style={{ marginTop: 10 }}>
            <Field label="Hãng vận chuyển (Nhà cung cấp)"><Input value={tForm.provider} onChange={v => setTForm({...tForm, provider: v})} placeholder="Vietnam Airlines..." /></Field>
            <Field label="Ghi chú (Note)"><Input value={tForm.note} onChange={v => setTForm({...tForm, note: v})} placeholder="Hành lý 20kg, đổi giờ bay..." /></Field>
          </Grid>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 16 }}>
            <Btn v="ghost" sz="md" onClick={() => setTravelModal(null)}>Huỷ</Btn>
            <Btn v="primary" sz="md" onClick={async () => {
              try {
                const survey = items.find(s => s._id === tForm.surveyId);
                if (!survey) return alert("Vui lòng chọn Kế hoạch GAP");
                const copy = [...(survey.travel_logs || [])];
                if (travelModal.mode === "add") copy.push(tForm);
                else copy[travelModal.tripIndex] = tForm;
                await updateSurvey({ ...survey, travel_logs: copy });
                setTravelModal(null);
              } catch (e) { alert("Lỗi: " + e.message); }
            }}>Lưu</Btn>
          </div>
        </Modal>
      )}

      {/* Modal CRUD Hotel */}
      {hotelModal && (
        <Modal open={true} onClose={() => setHotelModal(null)} title={hotelModal.mode === "add" ? "Thêm mới Lưu trú Khách sạn" : "Chỉnh sửa Lưu trú Khách sạn"} width={640}>
          <Grid cols={1} gap={10}>
             {hotelModal.mode === "add" && (
              <Field label="Chọn Kế hoạch / Phiên GAP *">
                <select value={hForm.surveyId} onChange={e => setHForm({...hForm, surveyId: e.target.value})} style={{ width: "100%", padding: "8px", background: C.bg3, border: `1px solid ${C.bd0}`, borderRadius: 6, color: C.t0 }}>
                  {items.map(s => <option key={s._id} value={s._id}>{s.meta?.ref_no} - {s.client?.name}</option>)}
                </select>
              </Field>
            )}
            <Field label="Người ở (Auditors) *"><Input value={hForm.who} onChange={v => setHForm({...hForm, who: v})} placeholder="Nguyễn Văn A, Lê Thị B" /></Field>
          </Grid>
          <Grid cols={2} gap={10} style={{ marginTop: 10 }}>
            <Field label="Từ ngày"><DatePicker value={hForm.from_date || ""} onChange={v => setHForm({...hForm, from_date: v})} placeholder="YYYY-MM-DD" /></Field>
            <Field label="Đến ngày (và Số đêm)">
              <div style={{ display: "flex", gap: 10 }}>
                <DatePicker value={hForm.to_date || ""} onChange={v => setHForm({...hForm, to_date: v})} placeholder="YYYY-MM-DD" style={{flex: 1}}/>
                <Input value={hForm.nights} onChange={v => setHForm({...hForm, nights: Number(v)||0})} placeholder="Đêm" style={{width: 60}}/>
              </div>
            </Field>
            <Field label="Tên khách sạn"><Input value={hForm.hotel_name} onChange={v => setHForm({...hForm, hotel_name: v})} placeholder="Mường Thanh Palace" /></Field>
            <Field label="Đơn giá hiện tại"><Input value={hForm.unit_price} onChange={v => setHForm({...hForm, unit_price: v})} placeholder="1,500,000 VNĐ" /></Field>
            <Field label="Người liên hệ (Khách sạn)"><Input value={hForm.contact_name} onChange={v => setHForm({...hForm, contact_name: v})} placeholder="Lễ tân / NVKD" /></Field>
            <Field label="Số điện thoại liên hệ"><Input value={hForm.contact_phone} onChange={v => setHForm({...hForm, contact_phone: v})} placeholder="090..." /></Field>
          </Grid>
          <Grid cols={1} gap={10} style={{ marginTop: 10 }}>
            <Field label="Địa chỉ Khách sạn"><Input value={hForm.hotel_address} onChange={v => setHForm({...hForm, hotel_address: v})} /></Field>
          </Grid>
          <div style={{ display: "flex", gap: 20, marginTop: 16, alignItems: "center" }}>
             <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", color: C.t0, fontSize: 14 }}>
               <input type="checkbox" checked={hForm.invoice_request} onChange={e => setHForm({...hForm, invoice_request: e.target.checked})} />
               Có xuất hoá đơn
             </label>
             {hForm.invoice_request && (
               <div style={{ flex: 1 }}>
                 <Input value={hForm.invoice_no} onChange={v => setHForm({...hForm, invoice_no: v})} placeholder="Nhập số hoá đơn / Mã số thuế / Tên công ty..." />
               </div>
             )}
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 16 }}>
            <Btn v="ghost" sz="md" onClick={() => setHotelModal(null)}>Huỷ</Btn>
            <Btn v="primary" sz="md" onClick={async () => {
              try {
                const survey = items.find(s => s._id === hForm.surveyId);
                if (!survey) return alert("Vui lòng chọn Kế hoạch GAP");
                const copy = [...(survey.hotel_logs || [])];
                if (hotelModal.mode === "add") copy.push(hForm);
                else copy[hotelModal.tripIndex] = hForm;
                await updateSurvey({ ...survey, hotel_logs: copy });
                setHotelModal(null);
              } catch (e) { alert("Lỗi: " + e.message); }
            }}>Lưu</Btn>
          </div>
        </Modal>
      )}
      {/* Modal CRUD Khách hàng master data */}
      {clientModal && (
        <Modal open={true} onClose={() => setClientModal(null)} title={clientModal.mode === "add" ? "Thêm mới Khách hàng" : "Chỉnh sửa Khách hàng"}>
          <Grid cols={2} gap={10}>
            <Field label="Tên tổ chức (Khách hàng) *"><Input value={cForm.name} onChange={v => setCForm(p => ({...p, name: v}))} placeholder="Company ABC" /></Field>
            <Field label="Tên cơ sở (Site)"><Input value={cForm.site} onChange={v => setCForm(p => ({...p, site: v}))} placeholder="Site 1" /></Field>
            <Field label="Ngành nghề"><Input value={cForm.industry} onChange={v => setCForm(p => ({...p, industry: v}))} placeholder="Sản xuất, Dịch vụ..." /></Field>
            <Field label="Năng lượng tiêu thụ (TOE)"><Input value={cForm.annual_energy} onChange={v => setCForm(p => ({...p, annual_energy: v}))} placeholder="1000 TOE" /></Field>
            <Field label="Tình trạng chứng nhận"><Input value={cForm.cert_status} onChange={v => setCForm(p => ({...p, cert_status: v}))} placeholder="ISO 9001..." /></Field>
            <Field label="Người liên hệ"><Input value={cForm.contact_person} onChange={v => setCForm(p => ({...p, contact_person: v}))} placeholder="Mr. A" /></Field>
            <div style={{ gridColumn: "1 / -1" }}>
              <Field label="Địa chỉ"><Input value={cForm.address} onChange={v => setCForm(p => ({...p, address: v}))} /></Field>
            </div>
          </Grid>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 16 }}>
            <Btn v="ghost" sz="md" onClick={() => setClientModal(null)}>Huỷ</Btn>
            <Btn v="primary" sz="md" onClick={saveClientDb} loading={clientSaving}>Lưu</Btn>
          </div>
        </Modal>
      )}

      {/* Modal CRUD Auditor master data */}
      {auditorModal && (
        <Modal open={true} onClose={() => setAuditorModal(null)} title={auditorModal.mode === "add" ? "Thêm mới Chuyên gia" : "Chỉnh sửa Chuyên gia"}>
          <Grid cols={2} gap={10}>
            <Field label="Họ và tên *"><Input value={aForm.name} onChange={v => setAForm(p => ({...p, name: v}))} /></Field>
            <Field label="Tổ chức cấp"><Input value={aForm.org} onChange={v => setAForm(p => ({...p, org: v}))} /></Field>
            <Field label="Vai trò chuẩn"><Input value={aForm.role} onChange={v => setAForm(p => ({...p, role: v}))} /></Field>
            <Field label="Số điện thoại"><Input value={aForm.phone} onChange={v => setAForm(p => ({...p, phone: v}))} /></Field>
            <div style={{ gridColumn: "1 / -1" }}>
              <Field label="Thư điện tử (Email)"><Input value={aForm.email} onChange={v => setAForm(p => ({...p, email: v}))} /></Field>
            </div>
          </Grid>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 16 }}>
            <Btn v="ghost" sz="md" onClick={() => setAuditorModal(null)}>Huỷ</Btn>
            <Btn v="primary" sz="md" onClick={saveAuditorDb} loading={auditorSaving}>Lưu</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

