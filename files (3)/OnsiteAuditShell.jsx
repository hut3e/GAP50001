/**
 * OnsiteAuditShell v2 — Shell chính Onsite Audit GAP ISO 50001:2018
 *
 * 5 bước đánh giá hoàn chỉnh:
 *  Step 1 — §4–§10 Clause-by-clause (StepClauses_Onsite)
 *  Step 2 — Tiếp cận rủi ro        (StepRisk_Onsite)
 *  Step 3 — Tiếp cận quá trình     (StepProcess_Onsite)
 *  Step 4 — Thiết bị tiêu thụ NL   (StepEquipment_Onsite)
 *  Step 5 — Nguồn Năng lượng SD    (StepEnergy_Onsite)  ← MỚI
 *
 * BACKEND — Thêm vào server.js:
 *   const energyProfilesRouter = require("./routes/energyProfiles");
 *   app.use("/api/energy-profiles", energyProfilesRouter);
 */
import { useState, useEffect, useCallback, useRef } from "react";
import { useEvidence }        from "./useEvidence";
import StepClauses_Onsite     from "./StepClauses_Onsite";
import StepRisk_Onsite        from "./StepRisk_Onsite";
import StepProcess_Onsite     from "./StepProcess_Onsite";
import StepEquipment_Onsite   from "./StepEquipment_Onsite";
import StepEnergy_Onsite      from "./StepEnergy_Onsite";
import { C, GAP_CHECKLIST }   from "./OnsiteAuditConstants";

// ── Step config ────────────────────────────────────────────────────
const STEPS = [
  { id:"clauses",  icon:"📖", label:"Điều khoản §4–§10",   shortLabel:"§4–§10"   },
  { id:"risk",     icon:"⚠️",  label:"Tiếp cận rủi ro",     shortLabel:"Rủi ro"   },
  { id:"process",  icon:"🔄", label:"Tiếp cận quá trình",   shortLabel:"Quá trình"},
  { id:"equipment",icon:"⚙️", label:"Thiết bị tiêu thụ NL", shortLabel:"Thiết bị" },
  { id:"energy",   icon:"⚡", label:"Nguồn Năng lượng SD",  shortLabel:"Nguồn NL" },
];

const EMPTY_STATE = {
  responses:        {},
  risk_assessments: {},
  process_gaps:     {},
  site_assessments: [],
};

// ── Toast ──────────────────────────────────────────────────────────
function useToast() {
  const [toast, setToast] = useState(null);
  const show = useCallback((type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3800);
  }, []);
  return { toast, show };
}

// ── Plan selector ──────────────────────────────────────────────────
function PlanSelector({ plans, onSelect, loading }) {
  return (
    <div style={{ padding:24, maxWidth:860 }}>
      <h2 style={{ color:C.t0, fontWeight:800, fontSize:22, marginBottom:6 }}>
        🔍 Onsite Audit GAP — ISO 50001:2018
      </h2>
      <p style={{ color:C.t2, fontSize:13, marginBottom:20 }}>
        Chọn kế hoạch đã được duyệt để bắt đầu phiên audit onsite.
      </p>
      {loading && <p style={{ color:C.t2 }}>Đang tải…</p>}
      {!loading && plans.length === 0 && (
        <div style={{ background:C.bg2, border:`1px dashed ${C.bd}`,
          borderRadius:12, padding:32, textAlign:"center" }}>
          <p style={{ color:C.amberL, fontSize:36, marginBottom:8 }}>📋</p>
          <p style={{ color:C.t0, fontWeight:700, marginBottom:6 }}>
            Chưa có kế hoạch nào ở trạng thái "Đã duyệt"
          </p>
          <p style={{ color:C.t2, fontSize:13 }}>
            Vào <strong>Kế hoạch Đánh giá</strong> → Tạo và duyệt kế hoạch trước.
          </p>
        </div>
      )}
      <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
        {plans.map(p => (
          <div key={p._id} onClick={() => onSelect(p)}
            style={{ background:C.bg2, border:`1px solid ${C.blue}44`, borderRadius:12,
              padding:"16px 20px", cursor:"pointer", transition:"border-color .15s" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div>
                <p style={{ color:C.t0, fontWeight:700, fontSize:15, margin:0 }}>
                  {p.planCode} — {p.title || p.planCode}
                </p>
                <p style={{ color:C.t2, fontSize:12, margin:"4px 0 0" }}>
                  🏭 {p.clientName||"—"} · 📅 {p.dateFrom||"?"} → {p.dateTo||"?"}
                  {p.leadAuditor?.fullName && ` · 👤 ${p.leadAuditor.fullName}`}
                </p>
              </div>
              <span style={{ color:C.blueL, fontSize:24 }}>▶</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Progress bar ───────────────────────────────────────────────────
function ProgressBar({ pct }) {
  const col = pct >= 80 ? C.tealL : pct >= 50 ? C.amberL : C.redL;
  return (
    <div style={{ height:5, background:C.bg3, borderRadius:3, overflow:"hidden" }}>
      <div style={{ height:"100%", width:`${pct}%`,
        background:`linear-gradient(90deg,${C.blueL},${col})`,
        transition:"width .4s", borderRadius:3 }}/>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
export default function OnsiteAuditShell({ apiUrl = "" }) {
  const ab = (apiUrl||"").replace(/\/$/, "");
  const { toast, show: showToast } = useToast();

  const [plans,      setPlans     ] = useState([]);
  const [planLoading,setPlanLoading] = useState(false);
  const [selPlan,    setSelPlan   ] = useState(null);
  const [surveyId,   setSurveyId  ] = useState("");
  const [auditData,  setAuditData ] = useState(EMPTY_STATE);
  const [step,       setStep      ] = useState("clauses");
  const [saving,     setSaving    ] = useState(false);

  const evHook = useEvidence(ab, surveyId, showToast);
  const saveTimer = useRef(null);

  const api = useCallback(async (method, url, body) => {
    const res = await fetch(`${ab}${url}`, {
      method,
      headers: { "Content-Type":"application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });
    const d = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(d.error || `HTTP ${res.status}`);
    return d;
  }, [ab]);

  // ── Load plans ──────────────────────────────────────────────────
  useEffect(() => {
    setPlanLoading(true);
    api("GET","/api/audit-plans?status=approved&limit=100")
      .then(d => setPlans(d.list||[]))
      .catch(e => showToast("error",e.message))
      .finally(() => setPlanLoading(false));
  }, [api, showToast]);

  // ── Select plan ─────────────────────────────────────────────────
  const selectPlan = useCallback(async (plan) => {
    setSelPlan(plan);
    setSaving(true);
    try {
      const refNo = `ONSITE-${plan.planCode}`;
      let sid = "";
      let existing = null;
      try {
        const d = await api("GET",`/api/surveys?q=${encodeURIComponent(refNo)}&limit=1`);
        const list = d.list||d||[];
        if (list.length > 0) { existing = list[0]; sid = existing._id||existing.id; }
      } catch(_) {}
      if (!sid) {
        const created = await api("POST","/api/surveys",{
          meta:{
            ref_no: refNo,
            report_title:`GAP Onsite — ${plan.clientName||plan.planCode}`,
            survey_date: new Date().toISOString().split("T")[0],
          },
          client:{ name: plan.clientName||"" },
          verifier:{ org:"" },
        });
        sid = created._id||created.id;
      }
      setSurveyId(sid);
      if (existing) {
        setAuditData({
          responses:        existing.responses        || {},
          risk_assessments: existing.risk_assessments || {},
          process_gaps:     existing.process_gaps     || {},
          site_assessments: existing.site_assessments || [],
        });
      } else {
        setAuditData(EMPTY_STATE);
      }
    } catch(e) {
      showToast("error","Không tạo được phiên: "+e.message);
      setSelPlan(null);
    } finally { setSaving(false); }
  }, [api, showToast]);

  // ── Save survey (clauses/risk/process/equipment) ────────────────
  const saveSurvey = useCallback(async (silent=false) => {
    if (!surveyId) return;
    setSaving(true);
    try {
      await api("PUT",`/api/surveys/${surveyId}`,{
        responses:        auditData.responses,
        risk_assessments: auditData.risk_assessments,
        process_gaps:     auditData.process_gaps,
        site_assessments: auditData.site_assessments,
      });
      if (!silent) showToast("success","✓ Đã lưu.");
    } catch(e) { showToast("error","Lỗi lưu: "+e.message); }
    finally { setSaving(false); }
  }, [api, surveyId, auditData, showToast]);

  // ── Schedule auto-save ──────────────────────────────────────────
  const scheduleAutoSave = useCallback(() => {
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => saveSurvey(true), 5000);
  }, [saveSurvey]);

  // ── Data update handlers ────────────────────────────────────────
  const handleUpdate = useCallback((section, key, value) => {
    setAuditData(prev => ({
      ...prev,
      [section]: { ...prev[section], [key]: value },
    }));
    scheduleAutoSave();
  }, [scheduleAutoSave]);

  const handleEquipUpdate = useCallback((id, field, val) => {
    setAuditData(prev => ({
      ...prev,
      site_assessments: prev.site_assessments.map(e =>
        e.id === id ? { ...e, [field]: val } : e),
    }));
    scheduleAutoSave();
  }, [scheduleAutoSave]);

  const handleEquipAdd = useCallback((item) => {
    setAuditData(prev => ({
      ...prev, site_assessments: [...prev.site_assessments, item],
    }));
  }, []);

  const handleEquipDelete = useCallback((id) => {
    if (!confirm("Xóa thiết bị này?")) return;
    setAuditData(prev => ({
      ...prev, site_assessments: prev.site_assessments.filter(e => e.id !== id),
    }));
  }, []);

  // ── Clause progress ─────────────────────────────────────────────
  const clausePct = Math.round(
    GAP_CHECKLIST.filter(c => (auditData.responses[c.id]?.score||0) > 0).length
    / GAP_CHECKLIST.length * 100
  );

  // ── Guard ───────────────────────────────────────────────────────
  if (!selPlan) return <PlanSelector plans={plans} onSelect={selectPlan} loading={planLoading}/>;

  // ── Shell ───────────────────────────────────────────────────────
  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100%", minHeight:0 }}>
      {/* Toast */}
      {toast && (
        <div style={{ position:"fixed", top:20, right:20, zIndex:3000,
          padding:"12px 20px", borderRadius:10, fontWeight:600, fontSize:14,
          background:toast.type==="success"?C.greenL:toast.type==="info"?C.blueL:C.redL,
          color:"#fff", boxShadow:"0 4px 20px rgba(0,0,0,.5)" }}>
          {toast.type==="success"?"✅":toast.type==="info"?"📱":"❌"} {toast.msg}
        </div>
      )}

      {/* Session header */}
      <div style={{ background:C.bg2, borderBottom:`1px solid ${C.bd}`,
        padding:"12px 20px", flexShrink:0 }}>
        <div style={{ display:"flex", justifyContent:"space-between",
          alignItems:"center", flexWrap:"wrap", gap:10 }}>
          <div>
            <p style={{ color:C.t0, fontWeight:800, fontSize:16, margin:0 }}>
              🔍 {selPlan.planCode} — {selPlan.clientName || selPlan.title}
            </p>
            <p style={{ color:C.t2, fontSize:11, margin:"3px 0 0" }}>
              📅 {selPlan.dateFrom} → {selPlan.dateTo}
              {selPlan.leadAuditor?.fullName && ` · 👤 ${selPlan.leadAuditor.fullName}`}
              &nbsp;·&nbsp;
              <span style={{ color: evHook.sockStatus==="connected"?C.tealL:C.amberL }}>
                Socket: {evHook.sockStatus}
                {evHook.peerCount > 1 && ` · ${evHook.peerCount} devices`}
              </span>
              {saving && <span style={{ color:C.amberL }}> · ⏳</span>}
              &nbsp;·&nbsp;
              <span style={{ fontFamily:"monospace", fontSize:10, color:C.t2 }}>
                {surveyId.slice(-8)}
              </span>
            </p>
          </div>
          <div style={{ display:"flex", gap:8 }}>
            <button onClick={() => saveSurvey(false)} disabled={saving}
              style={{ padding:"7px 18px", background:saving?C.t3:C.tealL,
                color:"#fff", border:"none", borderRadius:8, fontWeight:700,
                fontSize:13, cursor:"pointer" }}>
              💾 Lưu
            </button>
            <button onClick={() => { setSelPlan(null); setSurveyId(""); setAuditData(EMPTY_STATE); }}
              style={{ padding:"7px 14px", background:"transparent",
                border:`1px solid ${C.bd}`, color:C.t2, borderRadius:8,
                fontSize:13, cursor:"pointer" }}>
              ← Quay lại
            </button>
          </div>
        </div>
        <div style={{ marginTop:10 }}>
          <ProgressBar pct={clausePct}/>
          <p style={{ color:C.t2, fontSize:10, margin:"3px 0 0", textAlign:"right" }}>
            §4–§10: {clausePct}% · 📎 {evHook.evidence.length} bằng chứng
          </p>
        </div>
      </div>

      {/* Step tabs */}
      <div style={{ display:"flex", gap:2, padding:"8px 16px",
        background:C.bg1, borderBottom:`1px solid ${C.bd}`,
        flexShrink:0, overflowX:"auto" }}>
        {STEPS.map(s => (
          <button key={s.id} onClick={() => setStep(s.id)} style={{
            display:"flex", alignItems:"center", gap:5,
            padding:"7px 14px", borderRadius:8, fontSize:12.5, fontWeight:700,
            border:"none", cursor:"pointer", whiteSpace:"nowrap",
            background: step===s.id ? C.blue : `${C.blue}18`,
            color:       step===s.id ? "#fff"  : C.blueL,
          }}>
            {s.icon} {s.shortLabel}
          </button>
        ))}
      </div>

      {/* Step content */}
      <div style={{ flex:1, overflowY:"auto", padding:"20px 20px 40px" }}>
        {step==="clauses" && (
          <StepClauses_Onsite
            responses={auditData.responses}
            onUpdate={handleUpdate}
            evHook={evHook}
            onSave={() => saveSurvey()}
            saving={saving}/>
        )}
        {step==="risk" && (
          <StepRisk_Onsite
            riskData={auditData.risk_assessments}
            onUpdate={handleUpdate}
            evHook={evHook}
            onSave={() => saveSurvey()}
            saving={saving}/>
        )}
        {step==="process" && (
          <StepProcess_Onsite
            processData={auditData.process_gaps}
            onUpdate={handleUpdate}
            evHook={evHook}
            onSave={() => saveSurvey()}
            saving={saving}/>
        )}
        {step==="equipment" && (
          <StepEquipment_Onsite
            equipList={auditData.site_assessments}
            onEquipUpdate={handleEquipUpdate}
            onEquipAdd={handleEquipAdd}
            onEquipDelete={handleEquipDelete}
            evHook={evHook}
            onSave={() => saveSurvey()}
            saving={saving}/>
        )}
        {step==="energy" && (
          <StepEnergy_Onsite
            surveyId={surveyId}
            apiUrl={apiUrl}
            evHook={evHook}
            onSave={(type, msg) => showToast(type, msg)}
            saving={saving}/>
        )}
      </div>
    </div>
  );
}
