/**
 * ISO50001Gap — frontend/GapSurveyApp.jsx
 * Main wizard: 7-step GAP Survey Tool for ISO 50001:2018
 *
 * Usage:
 *   import GapSurveyApp from './GapSurveyApp';
 *   <GapSurveyApp apiUrl="http://localhost:5002"/>
 */
import { useState, useCallback, useMemo } from "react";
import { C, STEPS, INIT_SURVEY, GAP_CHECKLIST, RISK_CATEGORIES, SCORE_CFG } from "./gap.ui.constants.js";
import { GLOBAL_CSS, Btn, Tag, Toast, SectionHeader } from "./gap.atoms.jsx";
import StepOrg      from "./StepOrg.jsx";
import StepClauses  from "./StepClauses.jsx";
import StepRisk     from "./StepRisk.jsx";
import StepProcess  from "./StepProcess.jsx";
import StepSite     from "./StepSite.jsx";
import StepActions  from "./StepActions.jsx";
import StepExport   from "./StepExport.jsx";

// ── Completion checks per step ───────────────────────────────────
function stepDone(step, survey) {
  const r = survey.responses || {};
  switch (step) {
    case 0: return !!survey.meta?.ref_no && !!survey.client?.name;
    case 1: return GAP_CHECKLIST.filter(i=>(r[i.id]?.score||0)>0).length >= 10;
    case 2: return Object.keys(survey.risk_assessments||{}).length >= 3;
    case 3: return Object.keys(survey.process_gaps||{}).length >= 3;
    case 4: return (survey.site_assessments||[]).length > 0;
    case 5: return (survey.action_plan||[]).length > 0;
    case 6: return false;
    default: return false;
  }
}

// ── Sidebar quick-stats ──────────────────────────────────────────
function QuickStats({ survey }) {
  const r = survey.responses || {};
  const scored = GAP_CHECKLIST.filter(i=>(r[i.id]?.score||0)>0);
  const crit = scored.filter(i=>r[i.id].score<=1).length;
  const maj  = scored.filter(i=>r[i.id].score===2).length;
  const highR = RISK_CATEGORIES.flatMap(c=>c.items).filter(rk=>{
    const rd = survey.risk_assessments?.[rk.id]||{};
    return (rd.likelihood||0)*(rd.impact||0)>=9;
  }).length;
  const avg = scored.length ? (scored.reduce((a,i)=>a+(r[i.id].score||0),0)/scored.length).toFixed(1) : "—";

  return (
    <div style={{ margin:"10px", padding:10, background:C.bg2, borderRadius:8, border:`1px solid ${C.bd1}` }}>
      <div style={{ fontSize:9, color:C.t3, fontWeight:700, textTransform:"uppercase", letterSpacing:1, marginBottom:7 }}>
        Tóm tắt nhanh
      </div>
      {[
        { l:"Điểm TB",    v:avg,                             c:C.blueL  },
        { l:"Nghiêm TG",  v:crit,  u:crit>0?"⚠":"",         c:crit>0?C.red:C.t2 },
        { l:"KG Lớn",     v:maj,                             c:maj>0?C.orange:C.t2 },
        { l:"Rủi ro cao", v:highR,                           c:highR>0?C.red:C.t2 },
        { l:"Actions",    v:(survey.action_plan||[]).length, c:C.tealL  },
        { l:"Hiện trường",v:(survey.site_assessments||[]).length,c:C.skyL },
      ].map(x => (
        <div key={x.l} style={{ display:"flex", justifyContent:"space-between", marginBottom:3 }}>
          <span style={{ fontSize:10.5, color:C.t2 }}>{x.l}</span>
          <span style={{ fontSize:11.5, fontWeight:700, color:x.c }}>
            {x.u}{x.v}
          </span>
        </div>
      ))}
      {survey.client?.name && (
        <div style={{ marginTop:8, padding:"5px 8px", background:C.bg3, borderRadius:5 }}>
          <div style={{ fontSize:10, color:C.t2 }}>Tổ chức</div>
          <div style={{ fontSize:11.5, color:C.t0, fontWeight:600, lineHeight:1.4 }}>
            {survey.client.name.length > 30 ? survey.client.name.slice(0,28)+"…" : survey.client.name}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Top bar ──────────────────────────────────────────────────────
function TopBar({ step, total, survey }) {
  const r = survey.responses || {};
  const crit = GAP_CHECKLIST.filter(i=>(r[i.id]?.score||0)===1).length;
  const maj  = GAP_CHECKLIST.filter(i=>(r[i.id]?.score||0)===2).length;
  return (
    <div style={{ height:52, padding:"0 18px", display:"flex", alignItems:"center",
      justifyContent:"space-between", borderBottom:`1px solid ${C.bd0}`,
      background:`linear-gradient(90deg,${C.bg1},${C.bg2})`,
      position:"sticky", top:0, zIndex:200, backdropFilter:"blur(10px)" }}>
      <div style={{ display:"flex", alignItems:"center", gap:10 }}>
        <div style={{ fontFamily:"'Rajdhani',sans-serif", fontSize:20, fontWeight:700,
          background:`linear-gradient(135deg,${C.blue},${C.tealL})`,
          WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>
          ISO 50001·GAP
        </div>
        <div style={{ width:1, height:22, background:C.bd0 }}/>
        <span style={{ fontSize:12, fontWeight:600, color:C.t1 }}>Field Survey Tool</span>
        <Tag c={C.blue}>v2024</Tag>
      </div>
      <div style={{ display:"flex", gap:6, alignItems:"center" }}>
        {crit>0 && <Tag c={C.red}>{crit} Nghiêm trọng</Tag>}
        {maj>0  && <Tag c={C.orange}>{maj} Khoảng cách lớn</Tag>}
        {crit===0&&maj===0 && <Tag c={C.tealL} sx={{ fontSize:10 }}>Chưa có gap nghiêm trọng</Tag>}
      </div>
      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
        <span style={{ fontSize:10.5, color:C.t2 }}>{step+1}/{total}</span>
        <div style={{ width:80, height:3, background:C.bg4, borderRadius:2, overflow:"hidden" }}>
          <div style={{ height:"100%", width:`${(step+1)/total*100}%`,
            background:`linear-gradient(90deg,${C.blue},${C.tealL})`, transition:"width .3s" }}/>
        </div>
      </div>
    </div>
  );
}

// ── Sidebar ──────────────────────────────────────────────────────
function Sidebar({ step, setStep, survey }) {
  return (
    <div style={{ width:216, flexShrink:0, background:C.bg1, borderRight:`1px solid ${C.bd0}`,
      position:"sticky", top:52, height:"calc(100vh - 52px)",
      overflowY:"auto", display:"flex", flexDirection:"column" }}>
      {STEPS.map((s, i) => {
        const done   = stepDone(i, survey);
        const active = step === i;
        return (
          <button key={s.id} onClick={() => setStep(i)}
            style={{ width:"100%", background:active?`${C.blue}20`:"transparent",
              border:"none", borderLeft:active?`3px solid ${C.blue}`:"3px solid transparent",
              padding:"9px 12px 9px 11px", display:"flex", alignItems:"center", gap:8,
              cursor:"pointer", transition:"all .15s", textAlign:"left" }}>
            <span style={{ fontSize:15, flexShrink:0 }}>{s.icon}</span>
            <span style={{ fontSize:11.5, color:active?C.blueL:C.t1,
              fontWeight:active?700:400, flex:1, lineHeight:1.3 }}>{s.label}</span>
            {done && <span style={{ color:C.tealL, fontSize:11 }}>✓</span>}
          </button>
        );
      })}
      <QuickStats survey={survey}/>
    </div>
  );
}

// ── Bottom nav ───────────────────────────────────────────────────
function BottomNav({ step, setStep, total }) {
  return (
    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center",
      marginTop:20, paddingTop:12, borderTop:`1px solid ${C.bd1}` }}>
      <Btn v="ghost" sz="md" onClick={() => setStep(s => Math.max(0,s-1))} disabled={step===0}>
        ← Trước
      </Btn>
      <div style={{ display:"flex", gap:4 }}>
        {STEPS.map((_,i) => (
          <button key={i} onClick={() => setStep(i)}
            style={{ width:8, height:8, borderRadius:"50%", border:"none", cursor:"pointer",
              transition:"all .2s",
              background:i===step?C.blue:i<step?C.tealL+"80":C.bg4 }}/>
        ))}
      </div>
      {step < total-1
        ? <Btn v="blue" sz="md" onClick={() => setStep(s => Math.min(total-1,s+1))}>Tiếp theo →</Btn>
        : <span style={{ fontSize:11, color:C.t2 }}>Sử dụng nút xuất bên trên</span>
      }
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════════════════
export default function GapSurveyApp({ apiUrl: initApi = "http://localhost:5002" }) {
  const [step,    setStep   ] = useState(0);
  const [survey,  setSurvey ] = useState(INIT_SURVEY);
  const [loading, setLoading] = useState(false);
  const [toast,   setToast  ] = useState(null);
  const [apiUrl,  setApiUrl ] = useState(initApi);

  const handleExport = useCallback(async () => {
    setLoading(true); setToast(null);
    try {
      const res = await fetch(`${apiUrl}/api/iso50001/gap/generate`, {
        method:"POST",
        headers:{ "Content-Type":"application/json" },
        body: JSON.stringify(survey),
      });
      if (!res.ok) {
        const e = await res.json().catch(()=>({ error:"Server error" }));
        throw new Error(e.error || `HTTP ${res.status}`);
      }
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href     = url;
      a.download = `ISO50001_GAP_${(survey.meta?.ref_no||"report").replace(/[^A-Za-z0-9_-]/g,"_")}.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setToast({ type:"success", msg:"✓ Báo cáo GAP ISO 50001 đã được tạo và tải về!" });
    } catch (e) {
      setToast({ type:"error", msg:`Lỗi: ${e.message} — Kiểm tra backend tại ${apiUrl}` });
    } finally {
      setLoading(false);
    }
  }, [survey, apiUrl]);

  const cur = STEPS[step];

  return (
    <>
      <style>{GLOBAL_CSS}</style>
      <div style={{ minHeight:"100vh", background:C.bg0 }}>
        <TopBar step={step} total={STEPS.length} survey={survey}/>
        <div style={{ display:"flex", minHeight:"calc(100vh - 52px)" }}>
          <Sidebar step={step} setStep={setStep} survey={survey}/>
          <div style={{ flex:1, padding:"18px 22px", overflowY:"auto", maxWidth:1060 }}>
            <SectionHeader icon={cur.icon} title={cur.label} badge="ISO 50001:2018"/>
            <Toast toast={toast} onClose={()=>setToast(null)}/>

            <div className="fade-in">
              {step === 0 && <StepOrg     survey={survey} setSurvey={setSurvey}/>}
              {step === 1 && <StepClauses survey={survey} setSurvey={setSurvey}/>}
              {step === 2 && <StepRisk    survey={survey} setSurvey={setSurvey}/>}
              {step === 3 && <StepProcess survey={survey} setSurvey={setSurvey}/>}
              {step === 4 && <StepSite    survey={survey} setSurvey={setSurvey}/>}
              {step === 5 && <StepActions survey={survey} setSurvey={setSurvey}/>}
              {step === 6 && <StepExport  survey={survey} onExport={handleExport}
                               loading={loading} toast={toast}
                               apiUrl={apiUrl} setApiUrl={setApiUrl}/>}
            </div>

            <BottomNav step={step} setStep={setStep} total={STEPS.length}/>
          </div>
        </div>
      </div>
    </>
  );
}
