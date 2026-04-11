/**
 * ISO 50001 GAP — KanbanDashboard.jsx
 * Kanban Board + Calendar + Statistics + Telegram Notifications
 *
 * Features:
 *  - Kanban board với Drag & Drop (HTML5 native)
 *  - Calendar tháng hiển thị lịch đánh giá
 *  - Statistics tổng hợp tất cả phiên GAP
 *  - Cài đặt Telegram Bot + gửi thông báo thủ công/tự động
 *  - Real-time cập nhật qua polling & Socket.IO
 *  - Alarms / Warnings cho deadline sắp đến
 */
import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { C, FONT, SPACE, RADIUS } from "./gap.ui.constants.js";
import { Btn, Tag, Input, Field, Grid, Sel, TA, Modal, DatePicker } from "./gap.atoms.jsx";
import MessageComposerModal from "./MessageComposerModal.jsx";

// ── Hằng số ──────────────────────────────────────────────────────
const KANBAN_COLS = [
  { id: "planning",    label: "Lên kế hoạch",      icon: "📌", color: C.sky    },
  { id: "in_progress", label: "Đang thực hiện",     icon: "⚡", color: C.blue   },
  { id: "review",      label: "Chờ duyệt",          icon: "🔍", color: C.violet },
  { id: "completed",   label: "Hoàn thành",         icon: "✅", color: C.green  },
  { id: "overdue",     label: "Quá hạn",            icon: "🔴", color: C.red    },
];

const STATUS_COLOR = {
  planning:    C.sky,
  in_progress: C.blue,
  review:      C.violet,
  completed:   C.green,
  overdue:     C.red,
};

const VIEWS = [
  { id: "kanban",   label: "Kanban",     icon: "⬜" },
  { id: "calendar", label: "Lịch",       icon: "📅" },
  { id: "stats",    label: "Thống kê",   icon: "📊" },
  { id: "telegram", label: "Telegram",   icon: "✉️"  },
];

const MONTHS_VN = ["Tháng 1","Tháng 2","Tháng 3","Tháng 4","Tháng 5","Tháng 6","Tháng 7","Tháng 8","Tháng 9","Tháng 10","Tháng 11","Tháng 12"];
const DAYS_VN   = ["CN","T2","T3","T4","T5","T6","T7"];

// ── Helpers ───────────────────────────────────────────────────────
function base(url) { return (url || "").replace(/\/$/, ""); }

function fmtDate(d) {
  if (!d) return "—";
  try {
    const dt = new Date(d);
    if (isNaN(dt.getTime())) return String(d);
    return dt.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
  } catch (_) { return String(d); }
}

function daysUntil(dateStr) {
  if (!dateStr) return null;
  try {
    const target = new Date(dateStr);
    if (isNaN(target.getTime())) return null;
    const now = new Date();
    now.setHours(0,0,0,0);
    target.setHours(0,0,0,0);
    return Math.ceil((target - now) / 864e5);
  } catch (_) { return null; }
}

function urgencyLevel(survey) {
  const ap = survey.audit_plan || {};
  const dTo = daysUntil(ap.to_date);
  const dFrom = daysUntil(ap.from_date);
  if (survey.kanban_status === "overdue") return "overdue";
  if (dTo !== null && dTo < 0) return "overdue";
  if ((dTo !== null && dTo <= 3) || (dFrom !== null && dFrom <= 3)) return "urgent";
  if ((dTo !== null && dTo <= 7) || (dFrom !== null && dFrom <= 7)) return "warning";
  if ((dTo !== null && dTo <= 14) || (dFrom !== null && dFrom <= 14)) return "notice";
  return "ok";
}

function urgencyBadge(level) {
  switch (level) {
    case "overdue": return { icon: "🔴", color: C.red,     label: "Quá hạn"     };
    case "urgent":  return { icon: "🚨", color: C.red,     label: "≤3 ngày"     };
    case "warning": return { icon: "⚠️",  color: C.orange,  label: "≤7 ngày"     };
    case "notice":  return { icon: "🔔", color: C.amberL,  label: "≤14 ngày"    };
    default:        return { icon: "",   color: C.teal,    label: ""            };
  }
}

function calcGapStats(survey) {
  const r = survey.responses || {};
  const scored = Object.values(r).filter(v => v && (v.score || 0) > 0);
  const crit  = scored.filter(v => (v.score || 0) === 1).length;
  const maj   = scored.filter(v => (v.score || 0) === 2).length;
  const good  = scored.filter(v => (v.score || 0) >= 4).length;
  const wSum = scored.reduce((a,v) => a+((v.score||0)*(v.weight||1)), 0);
  const wTot = scored.reduce((a,v) => a+(v.weight||1), 0);
  const avg = wTot > 0 ? (wSum / wTot) : 0;
  return { scored: scored.length, crit, maj, good, avg };
}

function autoStatus(survey) {
  if (survey.kanban_status) return survey.kanban_status;
  const ap = survey.audit_plan || {};
  const dTo = daysUntil(ap.to_date);
  if (dTo !== null && dTo < 0) return "overdue";
  if (ap.from_date) return "planning";
  return "planning";
}

// ── Pulse animation ────────────────────────────────────────────────
const PULSE_CSS = `
@keyframes kbPulse { 0%,100%{opacity:1} 50%{opacity:.4} }
@keyframes kbSlide { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:none} }
@keyframes kbDrop  { 0%{transform:scale(1.03)} 100%{transform:scale(1)} }
.kb-pulse { animation: kbPulse 1.5s ease-in-out infinite; }
.kb-slide { animation: kbSlide .2s ease-out; }
.kb-drop  { animation: kbDrop .15s ease-out; }
`;

// ── SurveyCard ─────────────────────────────────────────────────────
function SurveyCard({ survey, onDragStart, onStatusChange, onSendTelegram, onOpenDetail, isDragging }) {
  const ap = survey.audit_plan || {};
  const client = survey.client || {};
  const meta = survey.meta || {};
  const stats = useMemo(() => calcGapStats(survey), [survey]);
  const urgency = urgencyLevel(survey);
  const ub = urgencyBadge(urgency);
  const auditors = (ap.auditors || []).slice(0, 2).map(a => a.name || a).filter(Boolean);
  const dTo = daysUntil(ap.to_date);
  const dFrom = daysUntil(ap.from_date);
  const status = autoStatus(survey);

  return (
    <div
      draggable
      onDragStart={onDragStart}
      className="kb-slide"
      style={{
        background: isDragging ? C.bg4 : C.bg2,
        border: `1px solid ${ub.color}${urgency !== "ok" ? "88" : "28"}`,
        borderLeft: `3px solid ${ub.color}`,
        borderRadius: RADIUS.lg,
        padding: "10px 12px",
        marginBottom: 8,
        cursor: "grab",
        opacity: isDragging ? 0.5 : 1,
        transition: "all .15s",
        userSelect: "none",
      }}
      title="Kéo để chuyển cột"
    >
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: FONT.body, fontWeight: 700, color: C.t0, lineHeight: 1.3, marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {client.name || "—"}
          </div>
          <div style={{ fontSize: FONT.caption, color: C.t2, fontFamily: "'Fira Code',monospace" }}>
            {meta.ref_no || "—"}
          </div>
        </div>
        {urgency !== "ok" && (
          <div style={{ fontSize: 16, marginLeft: 6, flexShrink: 0 }}>{ub.icon}</div>
        )}
      </div>

      {/* Dates */}
      <div style={{ fontSize: FONT.caption, color: C.t2, marginBottom: 6, display: "flex", gap: 6, flexWrap: "wrap" }}>
        {ap.from_date && <span>📅 {fmtDate(ap.from_date)}</span>}
        {ap.to_date && <span>→ {fmtDate(ap.to_date)}</span>}
        {dTo !== null && (
          <span style={{ color: dTo < 0 ? C.red : dTo <= 7 ? C.orangeL : C.tealL, fontWeight: 600 }}>
            {dTo < 0 ? `QH ${Math.abs(dTo)}n` : `còn ${dTo}n`}
          </span>
        )}
      </div>

      {/* Auditors */}
      {auditors.length > 0 && (
        <div style={{ fontSize: FONT.caption, color: C.skyL, marginBottom: 6, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          👤 {auditors.join(", ")}{(ap.auditors || []).length > 2 ? ` +${(ap.auditors||[]).length-2}` : ""}
        </div>
      )}

      {/* GAP Stats mini */}
      {stats.scored > 0 && (
        <div style={{ display: "flex", gap: 6, marginBottom: 8, flexWrap: "wrap" }}>
          {stats.crit > 0 && (
            <span style={{ fontSize: FONT.caption, background: C.red+"22", color: C.redL, borderRadius: 4, padding: "1px 5px" }}>
              🔴 {stats.crit} NT
            </span>
          )}
          {stats.maj > 0 && (
            <span style={{ fontSize: FONT.caption, background: C.orange+"22", color: C.orangeL, borderRadius: 4, padding: "1px 5px" }}>
              🟠 {stats.maj} KGL
            </span>
          )}
          {stats.avg > 0 && (
            <span style={{ fontSize: FONT.caption, background: C.teal+"22", color: C.tealL, borderRadius: 4, padding: "1px 5px" }}>
              ⭐ {stats.avg.toFixed(1)}
            </span>
          )}
        </div>
      )}

      {/* Actions */}
      <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
        <button onClick={() => onOpenDetail(survey)} style={btnMini(C.blue)}>Chi tiết</button>
        <button onClick={() => onSendTelegram(survey)} style={btnMini(C.teal)} title="Gửi Telegram">✉️</button>
        <select
          value={status}
          onChange={e => onStatusChange(survey._id, e.target.value)}
          onClick={e => e.stopPropagation()}
          style={{ fontSize: FONT.caption, background: C.bg3, border: `1px solid ${C.bd0}`, borderRadius: 4, color: C.t1, padding: "2px 4px", cursor: "pointer", flex: 1 }}
        >
          {KANBAN_COLS.map(c => (
            <option key={c.id} value={c.id}>{c.icon} {c.label}</option>
          ))}
        </select>
      </div>
    </div>
  );
}

function btnMini(color) {
  return {
    fontSize: FONT.caption, padding: "3px 8px", borderRadius: 4,
    background: color + "22", color: color, border: `1px solid ${color}44`,
    cursor: "pointer", fontWeight: 600,
  };
}

// ── KanbanColumn ───────────────────────────────────────────────────
function KanbanColumn({ col, surveys, draggingId, onDragStart, onDragOver, onDrop, onStatusChange, onSendTelegram, onOpenDetail }) {
  const [isDragOver, setIsDragOver] = useState(false);
  return (
    <div
      style={{
        flex: "1 1 200px",
        minWidth: 200,
        maxWidth: 280,
        background: isDragOver ? col.color + "12" : C.bg1,
        border: `1px solid ${isDragOver ? col.color + "66" : C.bd1}`,
        borderRadius: RADIUS.xl,
        padding: "10px 10px 4px",
        transition: "all .15s",
      }}
      onDragEnter={e => { e.preventDefault(); setIsDragOver(true); }}
      onDragOver={e => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; onDragOver(e, col.id); }}
      onDragLeave={e => {
         if (!e.currentTarget.contains(e.relatedTarget)) {
            setIsDragOver(false); 
         }
      }}
      onDrop={e => { e.preventDefault(); setIsDragOver(false); onDrop(e, col.id); }}
    >
      {/* Column header */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10, padding: "6px 4px", borderBottom: `2px solid ${col.color}44` }}>
        <span style={{ fontSize: 16 }}>{col.icon}</span>
        <span style={{ fontSize: FONT.label, fontWeight: 700, color: col.color, textTransform: "uppercase", letterSpacing: "0.05em" }}>
          {col.label}
        </span>
        <span style={{ marginLeft: "auto", fontSize: FONT.caption, background: col.color+"22", color: col.color, borderRadius: RADIUS.full, padding: "1px 7px", fontWeight: 700 }}>
          {surveys.length}
        </span>
      </div>

      {/* Cards */}
      <div style={{ minHeight: 60 }}>
        {surveys.length === 0 && (
          <div style={{ textAlign: "center", color: C.t3, fontSize: FONT.caption, padding: "20px 0", borderRadius: RADIUS.md, border: `1px dashed ${C.bd2}` }}>
            Kéo thả vào đây
          </div>
        )}
        {surveys.map(s => (
          <SurveyCard
            key={s._id}
            survey={s}
            isDragging={draggingId === s._id}
            onDragStart={e => onDragStart(e, s._id)}
            onStatusChange={onStatusChange}
            onSendTelegram={onSendTelegram}
            onOpenDetail={onOpenDetail}
          />
        ))}
      </div>
    </div>
  );
}

// ── Calendar helpers ───────────────────────────────────────────────
function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}
function getFirstDayOfMonth(year, month) {
  return new Date(year, month, 1).getDay();
}
function toDateKey(y, m, d) {
  return `${y}-${String(m+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
}
function parseDateKey(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  return toDateKey(d.getFullYear(), d.getMonth(), d.getDate());
}

// ── CalendarView ───────────────────────────────────────────────────
function CalendarView({ surveys, jobs = [], onOpenDetail, onAddJob, onEditJob }) {
  const now = new Date();
  const [year, setYear]   = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());

  const daysCount  = getDaysInMonth(year, month);
  const firstDay   = getFirstDayOfMonth(year, month);
  const todayKey   = toDateKey(now.getFullYear(), now.getMonth(), now.getDate());

  // Build map: dateKey → [surveys]
  const dateMap = useMemo(() => {
    const m = {};
    for (const s of surveys) {
      const ap = s.audit_plan || {};
      const fromKey = parseDateKey(ap.from_date);
      const toKey   = parseDateKey(ap.to_date);
      // Mark range of days
      if (ap.from_date && ap.to_date) {
        const fd = new Date(ap.from_date);
        const td = new Date(ap.to_date);
        if (!isNaN(fd) && !isNaN(td)) {
          let cur = new Date(fd);
          while (cur <= td) {
            const k = toDateKey(cur.getFullYear(), cur.getMonth(), cur.getDate());
            if (!m[k]) m[k] = [];
            m[k].push(s);
            cur.setDate(cur.getDate() + 1);
          }
        }
      } else {
        const k = fromKey || toKey;
        if (k) { if (!m[k]) m[k] = []; m[k].push(s); }
      }
    }
    for (const j of jobs) {
      if (!j.start_date) continue;
      const d = new Date(j.start_date);
      if (isNaN(d.getTime())) continue;
      const to = j.end_date ? new Date(j.end_date) : d;
      let cur = new Date(d);
      while(cur <= to) {
        const k = toDateKey(cur.getFullYear(), cur.getMonth(), cur.getDate());
        if (!m[k]) m[k] = [];
        m[k].push({ _isJob: true, ...j });
        cur.setDate(cur.getDate() + 1);
      }
    }
    return m;
  }, [surveys, jobs, year, month]);

  const prevMonth = () => { if (month === 0) { setMonth(11); setYear(y => y-1); } else setMonth(m => m-1); };
  const nextMonth = () => { if (month === 11) { setMonth(0); setYear(y => y+1); } else setMonth(m => m+1); };

  // Build grid cells (0 = empty, day = 1..daysCount)
  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysCount; d++) cells.push(d);

  return (
    <div>
      {/* Navigation */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <Btn v="ghost" sz="sm" onClick={prevMonth}>←</Btn>
        <div style={{ fontSize: FONT.title, fontWeight: 700, color: C.t0 }}>
          {MONTHS_VN[month]} {year}
        </div>
        <Btn v="ghost" sz="sm" onClick={nextMonth}>→</Btn>
        <Btn v="ghost" sz="sm" onClick={() => { setMonth(now.getMonth()); setYear(now.getFullYear()); }}>Hôm nay</Btn>
      </div>

      {/* Day headers */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2, marginBottom: 4 }}>
        {DAYS_VN.map(d => (
          <div key={d} style={{ textAlign: "center", fontSize: FONT.caption, color: C.t3, fontWeight: 700, padding: "4px 0", textTransform: "uppercase" }}>
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 3 }}>
        {cells.map((day, idx) => {
          if (day === null) return <div key={`e${idx}`} />;
          const k = toDateKey(year, month, day);
          const daySurveys = dateMap[k] || [];
          const isToday = k === todayKey;
          const hasOverdue = daySurveys.some(s => urgencyLevel(s) === "overdue");
          const hasUrgent  = daySurveys.some(s => urgencyLevel(s) === "urgent");
          const hasWarning = daySurveys.some(s => urgencyLevel(s) === "warning");

          return (
              <div
              key={k}
              onDoubleClick={(e) => { e.stopPropagation(); if (onAddJob) onAddJob(k); }}
              style={{
                minHeight: 80,
                background: isToday ? C.blue+"22" : daySurveys.length ? C.teal+"12" : C.bg2,
                border: `1px solid ${isToday ? C.blue+"66" : daySurveys.length ? C.teal+"33" : C.bd2}`,
                borderRadius: RADIUS.md,
                padding: "4px 5px",
                cursor: "default",
                transition: "background .15s",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3 }}>
                <span style={{ fontSize: FONT.label, fontWeight: isToday ? 800 : 500, color: isToday ? C.blueL : C.t1 }}>
                  {day}
                </span>
                {hasOverdue && <span style={{ fontSize: 9 }}>🔴</span>}
                {!hasOverdue && hasUrgent && <span style={{ fontSize: 9 }}>🚨</span>}
                {!hasOverdue && !hasUrgent && hasWarning && <span style={{ fontSize: 9 }}>⚠️</span>}
              </div>
              {daySurveys.map((s, i) => {
                if (s._isJob) {
                  return (
                    <div
                      key={"job"+s._id + i}
                      onClick={e => { e.stopPropagation(); if (onEditJob) onEditJob(s); }}
                      style={{ fontSize: 10, background: C.blue+"22", color: C.blueL, borderRadius: 3, padding: "2px 4px", marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", cursor: "pointer", border: `1px solid ${C.blue}44` }}
                      title={s.title}
                    >
                      💼 {s.title || "—"}
                    </div>
                  );
                }
                const urg = urgencyLevel(s);
                const col = urg === "overdue" ? C.red : urg === "urgent" ? C.orange : urg === "warning" ? C.yellow : C.teal;
                return (
                  <div
                    key={"surv"+s._id + i}
                    onClick={e => { e.stopPropagation(); onOpenDetail(s); }}
                    style={{ fontSize: 10, background: col+"22", color: col, borderRadius: 4, padding: "3px 4px", marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", cursor: "pointer", border: `1px solid ${col}44`, fontWeight: 600 }}
                    title={`Đánh giá GAP: ${s.client?.name}`}
                  >
                    💼 [GAP] {s.client?.name || s.meta?.ref_no || "—"}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div style={{ display: "flex", gap: 16, marginTop: 16, flexWrap: "wrap", fontSize: FONT.caption, color: C.t2 }}>
        {[
          { icon: "🔴", label: "Quá hạn" },
          { icon: "🚨", label: "≤3 ngày" },
          { icon: "⚠️",  label: "≤7 ngày" },
          { icon: "🔔", label: "≤14 ngày" },
          { icon: "💼", label: "Công việc (Job)" },
        ].map(x => (
          <span key={x.label}>{x.icon} {x.label}</span>
        ))}
      </div>
    </div>
  );
}

// ── StatsView ──────────────────────────────────────────────────────
function StatsView({ surveys }) {
  const stats = useMemo(() => {
    let totalCrit = 0, totalMaj = 0, totalGood = 0, totalScored = 0, totalActions = 0, totalSites = 0;
    const byStatus = { planning: 0, in_progress: 0, review: 0, completed: 0, overdue: 0 };
    const avgScores = [];

    for (const s of surveys) {
      const g = calcGapStats(s);
      totalCrit    += g.crit;
      totalMaj     += g.maj;
      totalGood    += g.good;
      totalScored  += g.scored;
      if (g.avg > 0) avgScores.push(g.avg);
      totalActions += (s.action_plan || []).length;
      totalSites   += (s.site_assessments || []).length;
      const st = autoStatus(s);
      if (byStatus[st] !== undefined) byStatus[st]++;
    }

    const globalAvg = avgScores.length ? (avgScores.reduce((a,b)=>a+b,0)/avgScores.length).toFixed(1) : "—";
    const overdueCount  = surveys.filter(s => urgencyLevel(s) === "overdue").length;
    const urgentCount   = surveys.filter(s => urgencyLevel(s) === "urgent").length;
    const upcomingCount = surveys.filter(s => ["warning","notice"].includes(urgencyLevel(s))).length;

    return { totalCrit, totalMaj, totalGood, totalScored, totalActions, totalSites, globalAvg, byStatus, overdueCount, urgentCount, upcomingCount };
  }, [surveys]);

  const kpiCards = [
    { label: "Tổng phiên GAP",     value: surveys.length,       color: C.blue,   icon: "📋" },
    { label: "Quá hạn",            value: stats.overdueCount,   color: C.red,    icon: "🔴" },
    { label: "Khẩn cấp (≤3 ngày)", value: stats.urgentCount,    color: C.orange, icon: "🚨" },
    { label: "Sắp đến (≤14 ngày)", value: stats.upcomingCount,  color: C.amberL, icon: "🔔" },
    { label: "Gap Nghiêm trọng",   value: stats.totalCrit,      color: C.red,    icon: "⚠️"  },
    { label: "Gap Lớn",            value: stats.totalMaj,       color: C.orange, icon: "🟠" },
    { label: "Điểm TB toàn bộ",    value: stats.globalAvg,      color: C.teal,   icon: "⭐" },
    { label: "Actions tổng",       value: stats.totalActions,   color: C.violet, icon: "✅" },
    { label: "Hiện trường",        value: stats.totalSites,     color: C.sky,    icon: "🏭" },
  ];

  return (
    <div>
      {/* KPI Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))", gap: 12, marginBottom: 32 }}>
        {kpiCards.map(k => (
          <div key={k.label} style={{ background: C.bg2, border: `1px solid ${k.color}33`, borderRadius: RADIUS.xl, padding: "16px 18px", textAlign: "center" }}>
            <div style={{ fontSize: 28, marginBottom: 6 }}>{k.icon}</div>
            <div style={{ fontSize: FONT.display, fontWeight: 800, color: k.color, lineHeight: 1 }}>{k.value}</div>
            <div style={{ fontSize: FONT.caption, color: C.t2, marginTop: 4 }}>{k.label}</div>
          </div>
        ))}
      </div>

      {/* Kanban status breakdown */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: FONT.title, fontWeight: 700, color: C.t0, marginBottom: 12 }}>Phân bổ theo trạng thái</div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {KANBAN_COLS.map(col => {
            const cnt = stats.byStatus[col.id] || 0;
            const pct = surveys.length ? Math.round(cnt / surveys.length * 100) : 0;
            return (
              <div key={col.id} style={{ flex: "1 1 120px", background: C.bg2, border: `1px solid ${col.color}33`, borderRadius: RADIUS.lg, padding: "12px 14px" }}>
                <div style={{ fontSize: 18 }}>{col.icon}</div>
                <div style={{ fontSize: FONT.headline, fontWeight: 800, color: col.color }}>{cnt}</div>
                <div style={{ fontSize: FONT.caption, color: C.t2 }}>{col.label}</div>
                <div style={{ marginTop: 6, height: 4, background: C.bg4, borderRadius: 2 }}>
                  <div style={{ height: "100%", width: pct+"%", background: col.color, borderRadius: 2, transition: "width .4s" }} />
                </div>
                <div style={{ fontSize: FONT.caption, color: C.t3, marginTop: 2 }}>{pct}%</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Top surveys by urgency */}
      <div>
        <div style={{ fontSize: FONT.title, fontWeight: 700, color: C.t0, marginBottom: 12 }}>Phiên cần chú ý nhất</div>
        {surveys
          .filter(s => ["overdue","urgent","warning"].includes(urgencyLevel(s)))
          .sort((a,b) => {
            const order = {overdue: 0, urgent: 1, warning: 2};
            return (order[urgencyLevel(a)]||3) - (order[urgencyLevel(b)]||3);
          })
          .slice(0, 10)
          .map(s => {
            const ap = s.audit_plan || {};
            const urg = urgencyLevel(s);
            const ub = urgencyBadge(urg);
            const g = calcGapStats(s);
            return (
              <div key={s._id} style={{ display: "flex", gap: 12, alignItems: "center", padding: "10px 14px", background: C.bg2, border: `1px solid ${ub.color}33`, borderRadius: RADIUS.md, marginBottom: 6 }}>
                <span style={{ fontSize: 18 }}>{ub.icon}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: FONT.body, fontWeight: 700, color: C.t0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.client?.name || "—"}</div>
                  <div style={{ fontSize: FONT.caption, color: C.t2 }}>{s.meta?.ref_no} • {fmtDate(ap.from_date)} → {fmtDate(ap.to_date)}</div>
                </div>
                {g.crit > 0 && <span style={{ fontSize: FONT.caption, color: C.redL, fontWeight: 700 }}>🔴 {g.crit}</span>}
                <span style={{ fontSize: FONT.caption, color: ub.color, fontWeight: 700 }}>{ub.label}</span>
              </div>
            );
          })}
        {surveys.filter(s => ["overdue","urgent","warning"].includes(urgencyLevel(s))).length === 0 && (
          <div style={{ color: C.tealL, fontSize: FONT.body, padding: "16px 0" }}>✅ Không có phiên nào cần chú ý khẩn cấp.</div>
        )}
      </div>
    </div>
  );
}

// ── TelegramSettings — Wizard 3 bước ─────────────────────────────
const WIZARD_STEPS = [
  { id: 1, icon: "🤖", label: "Bot Token"   },
  { id: 2, icon: "💬", label: "Nhận thông báo" },
  { id: 3, icon: "⏰", label: "Lịch & Gửi"  },
];

const CHAT_TYPE_LABELS = { private: "👤 Cá nhân", group: "👥 Nhóm", supergroup: "👥 Siêu nhóm", channel: "📢 Kênh" };
const WEEKDAY_OPTS = [["1","Thứ Hai"],["2","Thứ Ba"],["3","Thứ Tư"],["4","Thứ Năm"],["5","Thứ Sáu"],["6","Thứ Bảy"],["0","Chủ Nhật"]];

export function Toast2({ toast }) {
  if (!toast) return null;
  const ok = toast.type === "success";
  return (
    <div style={{
      position: "fixed", top: 20, left: "50%", transform: "translateX(-50%)", zIndex: 99999,
      padding: "12px 20px", borderRadius: RADIUS.lg, boxShadow: "0 8px 30px rgba(0,0,0,0.3)",
      background: ok ? C.green + "EE" : C.red + "EE", backdropFilter: "blur(4px)",
      border: `1px solid ${ok ? C.greenL : C.redL}`,
      color: "#fff", fontWeight: 600,
      fontSize: FONT.title, display: "flex", gap: 12, alignItems: "center", minWidth: 300, justifyContent: "center"
    }}>
      <span style={{ flexShrink: 0, fontSize: 24 }}>{ok ? "✅" : "⚠️"}</span>
      <span>{toast.msg}</span>
    </div>
  );
}

function ToggleSwitch({ checked, onChange, label, sub }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: `1px solid ${C.bd2}` }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: FONT.body, color: C.t1 }}>{label}</div>
        {sub && <div style={{ fontSize: FONT.caption, color: C.t3, marginTop: 2 }}>{sub}</div>}
      </div>
      <div onClick={() => onChange(!checked)}
        style={{ width: 44, height: 24, borderRadius: 12, background: checked ? C.teal : C.bg4,
          position: "relative", cursor: "pointer", flexShrink: 0, transition: "background .2s" }}>
        <div style={{ position: "absolute", top: 4, left: checked ? 23 : 4,
          width: 16, height: 16, borderRadius: 8, background: "#fff", transition: "left .2s" }} />
      </div>
    </div>
  );
}

function ChatIdBadge({ chat, onRemove, onChange }) {
  const toggle = (key) => {
    if (onChange) onChange({ ...chat, [key]: !chat[key] });
  };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: "10px 12px",
      background: C.bg3, border: `1px solid ${C.bd1}`, borderRadius: RADIUS.md, marginBottom: 8 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 16 }}>
          {chat.type === "channel" ? "📢" : chat.type === "private" ? "👤" : "👥"}
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: FONT.body, color: C.t0, fontWeight: 600,
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {chat.title || chat.chatId}
          </div>
          <div style={{ fontSize: FONT.caption, color: C.t3, display: "flex", gap: 6 }}>
            <code style={{ background: C.bg2, padding: "0 4px", borderRadius: 3 }}>{chat.chatId}</code>
            {chat.type && <span style={{ color: C.skyL }}>{CHAT_TYPE_LABELS[chat.type] || chat.type}</span>}
          </div>
        </div>
        <button onClick={onRemove}
          style={{ background: C.red + "22", border: "none", color: C.redL,
            borderRadius: RADIUS.sm, padding: "3px 8px", cursor: "pointer", fontSize: FONT.body }}>
          ✕
        </button>
      </div>
      {/* Checkboxes cho fine-grained config */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 4 }}>
        {[
          { key: "notify_auditors", label: "Auditors gán" },
          { key: "notify_gap_plans", label: "Kế hoạch GAP" },
          { key: "notify_gap_results", label: "Kết quả đánh giá" },
          { key: "notify_kanban", label: "Từ Kanban" },
          { key: "notify_calendar", label: "Từ Calendar/Job" }
        ].map(opt => (
          <label key={opt.key} style={{ display: "flex", alignItems: "center", gap: 4, cursor: "pointer",
             background: chat[opt.key] ? C.teal + "22" : C.bg4, border: `1px solid ${chat[opt.key] ? C.teal : C.bd2}`,
             padding: "2px 8px", borderRadius: RADIUS.full, transition: "all .15s" }}>
            <input type="checkbox" checked={chat[opt.key] !== false} onChange={() => toggle(opt.key)} style={{ cursor: "pointer", accentColor: C.teal }} />
            <span style={{ fontSize: 11, color: chat[opt.key] ? C.tealL : C.t2, fontWeight: chat[opt.key] ? 600 : 400 }}>{opt.label}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

function TelegramSettings({ apiUrl, surveys, showToast }) {
  const [step, setStep] = useState(1);

  // ── Step 1: Token ──
  const [tokenInput, setTokenInput]   = useState("");
  const [hasSavedToken, setHasSavedToken] = useState(false);
  const [maskedToken, setMaskedToken] = useState("");
  const [botInfo, setBotInfo]         = useState(null); // { id, username, firstName }
  const [validating, setValidating]   = useState(false);
  const [editToken, setEditToken]     = useState(false);

  // ── Step 2: Chat IDs ──
  const [chatIds, setChatIds]         = useState([]); // [{ chatId, title, type }]
  const [discovering, setDiscovering] = useState(false);
  const [discovered, setDiscovered]   = useState(null); // null | []
  const [manualInput, setManualInput] = useState("");

  // ── Step 3: Schedule ──
  const [dailyEnabled, setDailyEnabled]   = useState(false);
  const [weeklyEnabled, setWeeklyEnabled] = useState(false);
  const [alertsEnabled, setAlertsEnabled] = useState(true);
  const [alertDays, setAlertDays]         = useState([1, 3, 7]);
  const [dailyTime, setDailyTime]         = useState("08:00");
  const [weeklyDay, setWeeklyDay]         = useState("1");
  const [testMsg, setTestMsg]             = useState("");
  const [testLoading, setTestLoading]     = useState(false);
  const [sendLoading, setSendLoading]     = useState(false);
  const [saving, setSaving]               = useState(false);
  const [sendResults, setSendResults]     = useState(null); // [{ chatId, ok, error }]

  // ── Load saved settings ────────────────────────────────────────
  const loadSettings = useCallback(async () => {
    try {
      const res  = await fetch(`${base(apiUrl)}/api/notifications/settings`);
      if (!res.ok) return;
      const data = await res.json();
      setHasSavedToken(!!data.hasBotToken);
      setMaskedToken(data.botTokenMasked || "");
      if (data.botInfo) setBotInfo(data.botInfo);
      if (Array.isArray(data.chatIds)) {
        setChatIds(data.chatIds.map(id => {
          if (typeof id === "object" && id !== null) {
            return {
              chatId: String(id.chatId || ""),
              title: String(id.title || id.chatId || ""),
              type: id.type || "",
              notify_auditors: id.notify_auditors !== false,
              notify_gap_plans: id.notify_gap_plans !== false,
              notify_gap_results: id.notify_gap_results !== false,
              notify_kanban: id.notify_kanban !== false,
              notify_calendar: id.notify_calendar !== false,
            };
          }
          return { 
            chatId: String(id), title: String(id), type: "",
            notify_auditors: true, notify_gap_plans: true, notify_gap_results: true, notify_kanban: true, notify_calendar: true
          };
        }));
      }
      setDailyEnabled(!!data.dailyEnabled);
      setWeeklyEnabled(!!data.weeklyEnabled);
      setAlertsEnabled(data.alertsEnabled !== false);
      if (Array.isArray(data.alertDays)) setAlertDays(data.alertDays);
      if (data.dailyTime) setDailyTime(data.dailyTime);
      if (data.weeklyDay) setWeeklyDay(data.weeklyDay);
    } catch (_) {}
  }, [apiUrl]);

  useEffect(() => { loadSettings(); }, [loadSettings]);

  // ── Step 1: Validate token ─────────────────────────────────────
  const validateToken = async () => {
    const t = tokenInput.trim();
    if (!t) return showToast("error", "Vui lòng nhập Bot Token.");
    if (!/^\d{8,12}:[A-Za-z0-9_-]{35,}$/.test(t))
      return showToast("error", "Định dạng token không đúng. Token có dạng: 123456789:ABCDefghIJKLmnopQRSTuvwxyz...");
    setValidating(true);
    try {
      const res  = await fetch(`${base(apiUrl)}/api/notifications/validate-token?token=${encodeURIComponent(t)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setBotInfo(data.bot);
      showToast("success", `✅ Token hợp lệ! Bot: @${data.bot.username} — ${data.bot.firstName}`);
    } catch (e) { showToast("error", e.message); }
    finally { setValidating(false); }
  };

  // ── Step 2: Discover chats ─────────────────────────────────────
  const discoverChats = async () => {
    const t = tokenInput.trim() || null;
    setDiscovering(true);
    setDiscovered(null);
    try {
      const q   = t ? `?token=${encodeURIComponent(t)}` : "";
      const res = await fetch(`${base(apiUrl)}/api/notifications/discover-chats${q}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setDiscovered(data.chats || []);
      if (!data.chats?.length)
        showToast("error", "Chưa tìm thấy chat nào. Hãy gửi /start hoặc nhắn bất kỳ tin cho bot, rồi thử lại.");
    } catch (e) { showToast("error", e.message); }
    finally { setDiscovering(false); }
  };

  const addChat = (chat) => {
    if (chatIds.some(c => c.chatId === String(chat.chatId))) return;
    setChatIds(prev => [...prev, { 
      chatId: String(chat.chatId), 
      title: chat.title || chat.chatId, 
      type: chat.type || "",
      notify_auditors: true,
      notify_gap_plans: true,
      notify_gap_results: true,
      notify_kanban: true,
      notify_calendar: true
    }]);
  };

  const addManual = () => {
    const id = manualInput.trim();
    if (!id) return;
    if (chatIds.some(c => c.chatId === id)) { showToast("error", "Chat ID này đã được thêm."); return; }
    setChatIds(prev => [...prev, { 
      chatId: id, 
      title: id, 
      type: "manual",
      notify_auditors: true,
      notify_gap_plans: true,
      notify_gap_results: true,
      notify_kanban: true,
      notify_calendar: true
    }]);
    setManualInput("");
  };

  // ── Step 3: Save all settings ──────────────────────────────────
  const saveAll = async () => {
    setSaving(true);
    try {
      const body = {
        chatIds: chatIds,
        dailyEnabled, weeklyEnabled, alertsEnabled,
        alertDays, dailyTime, weeklyDay,
      };
      // Gửi token nếu đang edit HOẶC chưa lưu token
      if ((editToken || !hasSavedToken) && tokenInput.trim()) {
        body.botToken = tokenInput.trim();
      }
      const res  = await fetch(`${base(apiUrl)}/api/notifications/settings`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      if (data.botInfo) setBotInfo(data.botInfo);
      setHasSavedToken(true); setEditToken(false); setTokenInput("");
      showToast("success", "✅ Đã lưu cài đặt và khởi động lại cron jobs.");
      loadSettings();
    } catch (e) { showToast("error", e.message); }
    finally { setSaving(false); }
  };

  const sendTest = async () => {
    setTestLoading(true); setSendResults(null);
    try {
      const body = { customText: testMsg || "" };
      if ((editToken || !hasSavedToken) && tokenInput.trim()) { 
        body.botToken = tokenInput.trim(); 
        body.chatIds = chatIds.map(c => c.chatId); 
      }
      const res  = await fetch(`${base(apiUrl)}/api/notifications/test`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSendResults(data.results || []);
      const ok = (data.results || []).filter(r => r.ok).length;
      showToast(ok > 0 ? "success" : "error", `Đã gửi: ${ok}/${(data.results||[]).length} chat thành công.`);
    } catch (e) { showToast("error", e.message); }
    finally { setTestLoading(false); }
  };

  const sendNow = async (isWeekly = false) => {
    setSendLoading(true); setSendResults(null);
    try {
      const res  = await fetch(`${base(apiUrl)}/api/notifications/send-now`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isWeekly }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSendResults(data.results || []);
      showToast("success", `Đã gửi ${data.sent} tin nhắn thành công.`);
    } catch (e) { showToast("error", e.message); }
    finally { setSendLoading(false); }
  };

  // ── Step indicator ─────────────────────────────────────────────
  const stepsDone = {
    1: hasSavedToken || (botInfo !== null),
    2: chatIds.length > 0,
    3: hasSavedToken && chatIds.length > 0,
  };

  const panelStyle = { background: C.bg2, border: `1px solid ${C.bd0}`, borderRadius: RADIUS.xl, padding: "20px 22px", marginBottom: 14 };
  const labelStyle = { fontSize: FONT.label, color: C.t3, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10, display: "block" };

  return (
    <div style={{ maxWidth: 680 }}>
      {/* ══ STEP 1: Bot Token ══════════════════════════════════════ */}
      <div style={{ marginBottom: 30 }}>
        <div style={panelStyle}>
            <span style={labelStyle}>🤖 Cấu hình Telegram Bot</span>

            {/* Hướng dẫn */}
            <div style={{ background: C.bg3, borderRadius: RADIUS.md, padding: "12px 14px", marginBottom: 16, fontSize: FONT.caption, color: C.t2, lineHeight: 1.7 }}>
              <b style={{ color: C.skyL }}>Cách tạo Bot Token:</b>
              <ol style={{ paddingLeft: 18, marginTop: 4 }}>
                <li>Mở Telegram, tìm <code style={{ background: C.bg2, padding: "1px 5px", borderRadius: 3 }}>@BotFather</code></li>
                <li>Gửi lệnh <code style={{ background: C.bg2, padding: "1px 5px", borderRadius: 3 }}>/newbot</code> → đặt tên bot</li>
                <li>BotFather trả về token dạng <code style={{ background: C.bg2, padding: "1px 5px", borderRadius: 3 }}>123456789:ABCDefgh…</code></li>
                <li>Dán token vào ô bên dưới và nhấn <b>Xác thực</b></li>
              </ol>
            </div>

            {/* Token input */}
            {hasSavedToken && !editToken ? (
              <div style={{ marginBottom: 14 }}>
                <span style={labelStyle}>Bot Token hiện tại</span>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <div style={{ flex: 1, padding: "10px 14px", background: C.bg3, borderRadius: RADIUS.md,
                    fontSize: FONT.body, color: C.t2, fontFamily: "'Fira Code', monospace", letterSpacing: "0.05em" }}>
                    {maskedToken}
                  </div>
                  <Btn v="ghost" sz="sm" onClick={() => setEditToken(true)}>✏️ Đổi</Btn>
                </div>
                {botInfo && (
                  <div style={{ marginTop: 10, padding: "8px 12px", background: C.teal + "18", borderRadius: RADIUS.md,
                    border: `1px solid ${C.teal}44`, display: "flex", gap: 10, alignItems: "center" }}>
                    <span style={{ fontSize: 22 }}>🤖</span>
                    <div>
                      <div style={{ fontSize: FONT.body, fontWeight: 700, color: C.tealL }}>{botInfo.firstName}</div>
                      <div style={{ fontSize: FONT.caption, color: C.t2 }}>@{botInfo.username} · ID: {botInfo.id}</div>
                    </div>
                    <span style={{ marginLeft: "auto", fontSize: FONT.caption, background: C.teal + "33", color: C.tealL, padding: "2px 8px", borderRadius: RADIUS.full }}>✅ Đã xác thực</span>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ marginBottom: 14 }}>
                <span style={labelStyle}>Nhập Bot Token</span>
                <div style={{ display: "flex", gap: 8 }}>
                  <input
                    value={tokenInput}
                    onChange={e => { setTokenInput(e.target.value); setBotInfo(null); }}
                    placeholder="123456789:AABBccDDeeFFggHHiiJJkkLLmmNNoopp..."
                    type="text"
                    autoComplete="off"
                    spellCheck={false}
                    style={{ flex: 1, padding: "10px 14px", background: C.bg3, border: `1px solid ${tokenInput && !/^\d{8,12}:[A-Za-z0-9_-]{35,}$/.test(tokenInput.trim()) ? C.orange : C.bd0}`,
                      borderRadius: RADIUS.md, color: C.t0, fontSize: FONT.body, fontFamily: "'Fira Code', monospace" }}
                  />
                  <Btn v="blue" sz="md" onClick={validateToken} loading={validating}>🔍 Xác thực</Btn>
                  {editToken && <Btn v="ghost" sz="sm" onClick={() => { setEditToken(false); setTokenInput(""); setBotInfo(null); }}>Huỷ</Btn>}
                </div>
                {tokenInput && !/^\d{8,12}:[A-Za-z0-9_-]{35,}$/.test(tokenInput.trim()) && (
                  <div style={{ fontSize: FONT.caption, color: C.orangeL, marginTop: 5 }}>
                    ⚠️ Token chưa đúng định dạng. Kiểm tra lại từ @BotFather.
                  </div>
                )}
                {/* Bot info sau khi validate */}
                {botInfo && (
                  <div style={{ marginTop: 10, padding: "10px 14px", background: C.teal + "18", borderRadius: RADIUS.md,
                    border: `1px solid ${C.teal}44`, display: "flex", gap: 10, alignItems: "center" }}>
                    <span style={{ fontSize: 22 }}>🤖</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: FONT.body, fontWeight: 700, color: C.tealL }}>{botInfo.firstName}</div>
                      <div style={{ fontSize: FONT.caption, color: C.t2 }}>@{botInfo.username} · ID: {botInfo.id}</div>
                      {botInfo.canJoinGroups !== undefined && (
                        <div style={{ fontSize: FONT.caption, color: C.t3, marginTop: 2 }}>
                          Tham gia nhóm: {botInfo.canJoinGroups ? "✅" : "❌"} · Inline: {botInfo.supportsInline ? "✅" : "❌"}
                        </div>
                      )}
                    </div>
                    <span style={{ fontSize: FONT.caption, background: C.teal + "33", color: C.tealL, padding: "3px 10px", borderRadius: RADIUS.full, fontWeight: 700 }}>✅ Hợp lệ</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        
      {/* ══ STEP 2: Chat IDs ══════════════════════════════════════ */}
      <div style={{ marginBottom: 30 }}>
        <div style={panelStyle}>
          <span style={labelStyle}>💬 Thêm người nhận (Chat IDs)</span>

            {/* Hướng dẫn */}
            <div style={{ background: C.bg3, borderRadius: RADIUS.md, padding: "12px 14px", marginBottom: 14, fontSize: FONT.caption, color: C.t2, lineHeight: 1.7 }}>
              <b style={{ color: C.skyL }}>Cách lấy Chat ID:</b>
              <ol style={{ paddingLeft: 18, marginTop: 4 }}>
                <li>Gửi tin nhắn bất kỳ <b>cho bot</b> trên Telegram (hoặc thêm bot vào nhóm/channel)</li>
                <li>Nhấn <b>"🔍 Tự động tìm"</b> để hệ thống gọi <code style={{ background: C.bg2, padding: "1px 4px", borderRadius: 3 }}>getUpdates</code> và liệt kê các chat</li>
                <li>Tick chọn chat muốn nhận thông báo, hoặc nhập thủ công Chat ID</li>
              </ol>
            </div>

            {/* Auto-discover */}
            <div style={{ marginBottom: 16 }}>
              <Btn v="blue" sz="md" onClick={discoverChats} loading={discovering}>🔍 Tự động tìm Chat IDs</Btn>
            </div>

            {/* Discovered list */}
            {discovering && (
              <div style={{ color: C.t2, fontSize: FONT.body, padding: "8px 0" }}>⏳ Đang tìm kiếm…</div>
            )}
            {discovered !== null && !discovering && (
              <div style={{ marginBottom: 16 }}>
                {discovered.length === 0 ? (
                  <div style={{ padding: "10px 14px", background: C.orange + "18", borderRadius: RADIUS.md, border: `1px solid ${C.orange}44`, fontSize: FONT.body, color: C.orangeL }}>
                    ⚠️ Chưa tìm thấy chat nào. Hãy gửi <b>/start</b> hoặc nhắn bot một tin nhắn, rồi nhấn tìm lại.
                  </div>
                ) : (
                  <div>
                    <div style={{ fontSize: FONT.label, color: C.t3, fontWeight: 700, marginBottom: 8 }}>
                      TÌM THẤY {discovered.length} CHAT — CHỌN ĐỂ THÊM:
                    </div>
                    {discovered.map(chat => {
                      const already = chatIds.some(c => c.chatId === String(chat.chatId));
                      return (
                        <div key={chat.chatId} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px",
                          background: already ? C.teal + "12" : C.bg3, border: `1px solid ${already ? C.teal + "44" : C.bd2}`,
                          borderRadius: RADIUS.md, marginBottom: 5, cursor: already ? "default" : "pointer" }}
                          onClick={() => !already && addChat(chat)}>
                          <span style={{ fontSize: 18 }}>
                            {chat.type === "channel" ? "📢" : chat.type === "private" ? "👤" : "👥"}
                          </span>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: FONT.body, color: C.t0, fontWeight: 600 }}>{chat.title}</div>
                            <div style={{ fontSize: FONT.caption, color: C.t3 }}>
                              <code style={{ background: C.bg2, padding: "0 4px", borderRadius: 3 }}>{chat.chatId}</code>
                              {" "}{CHAT_TYPE_LABELS[chat.type] || ""}
                              {chat.username && ` · @${chat.username}`}
                            </div>
                          </div>
                          <span style={{ fontSize: FONT.caption, fontWeight: 700,
                            color: already ? C.tealL : C.blue, background: (already ? C.teal : C.blue) + "22",
                            padding: "3px 10px", borderRadius: RADIUS.full }}>
                            {already ? "✅ Đã thêm" : "+ Thêm"}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Manual add */}
            <div style={{ marginBottom: 16 }}>
              <span style={{ ...labelStyle, marginBottom: 6 }}>Nhập thủ công Chat ID</span>
              <div style={{ display: "flex", gap: 8 }}>
                <input value={manualInput} onChange={e => setManualInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && addManual()}
                  placeholder="-1001234567890  hoặc  123456789"
                  style={{ flex: 1, padding: "10px 14px", background: C.bg3, border: `1px solid ${C.bd0}`,
                    borderRadius: RADIUS.md, color: C.t0, fontSize: FONT.body, fontFamily: "'Fira Code', monospace" }} />
                <Btn v="ghost" sz="md" onClick={addManual}>+ Thêm</Btn>
              </div>
              <div style={{ fontSize: FONT.caption, color: C.t3, marginTop: 4 }}>
                Chat ID âm (vd: <code style={{ background: C.bg3, padding: "0 3px" }}>-1001234567890</code>) là nhóm/channel. Dương là cá nhân.
              </div>
            </div>

            {/* Saved list */}
            {chatIds.length > 0 && (
              <div>
                <div style={{ fontSize: FONT.label, color: C.t3, fontWeight: 700, marginBottom: 8 }}>
                  DANH SÁCH NHẬN THÔNG BÁO ({chatIds.length}):
                </div>
                {chatIds.map(chat => (
                  <ChatIdBadge key={chat.chatId} chat={chat}
                    onChange={(updatedChat) => setChatIds(prev => prev.map(c => c.chatId === updatedChat.chatId ? updatedChat : c))}
                    onRemove={() => setChatIds(prev => prev.filter(c => c.chatId !== chat.chatId))} />
                ))}
              </div>
            )}
            {chatIds.length === 0 && (
              <div style={{ padding: "16px", textAlign: "center", color: C.t3, fontSize: FONT.body,
                background: C.bg3, borderRadius: RADIUS.md, border: `1px dashed ${C.bd1}` }}>
                Chưa có người nhận nào. Tự động tìm hoặc nhập thủ công Chat ID bên trên.
              </div>
            )}
          </div>
        </div>

      {/* ══ STEP 3: Schedule & Test ════════════════════════════════ */}
      <div style={{ marginBottom: 30 }}>
        {/* Schedule */}
        <div style={panelStyle}>
          <span style={labelStyle}>⏰ Lịch gửi tự động (Cron)</span>

            <ToggleSwitch checked={dailyEnabled} onChange={setDailyEnabled}
              label="☀️ Báo cáo hàng ngày"
              sub={`Gửi lúc ${dailyTime} — Múi giờ Asia/Ho_Chi_Minh (GMT+7)`} />
            {dailyEnabled && (
              <div style={{ paddingLeft: 28, paddingBottom: 8, paddingTop: 4, borderBottom: `1px solid ${C.bd2}` }}>
                <label style={{ fontSize: FONT.body, color: C.t1 }}>Giờ gửi: </label>
                <input type="time" value={dailyTime} onChange={e => setDailyTime(e.target.value)}
                  style={{ padding: "5px 10px", background: C.bg3, border: `1px solid ${C.bd0}`,
                    borderRadius: RADIUS.md, color: C.t0, fontSize: FONT.body, marginLeft: 8 }} />
              </div>
            )}

            <ToggleSwitch checked={weeklyEnabled} onChange={setWeeklyEnabled}
              label="🗓️ Báo cáo hàng tuần"
              sub={`Gửi ${["CN","T2","T3","T4","T5","T6","T7"][+weeklyDay]} lúc 08:30 GMT+7`} />
            {weeklyEnabled && (
              <div style={{ paddingLeft: 28, paddingBottom: 8, paddingTop: 4, borderBottom: `1px solid ${C.bd2}` }}>
                <label style={{ fontSize: FONT.body, color: C.t1 }}>Ngày gửi: </label>
                <select value={weeklyDay} onChange={e => setWeeklyDay(e.target.value)}
                  style={{ padding: "5px 10px", background: C.bg3, border: `1px solid ${C.bd0}`,
                    borderRadius: RADIUS.md, color: C.t0, fontSize: FONT.body, marginLeft: 8, cursor: "pointer" }}>
                  {WEEKDAY_OPTS.map(([v,l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
            )}

            <ToggleSwitch checked={alertsEnabled} onChange={setAlertsEnabled}
              label="🔔 Cảnh báo deadline tự động"
              sub="Gửi cảnh báo khi phiên GAP sắp đến deadline (kiểm tra mỗi giờ)" />
            {alertsEnabled && (
              <div style={{ paddingLeft: 28, paddingTop: 8, paddingBottom: 4 }}>
                <div style={{ fontSize: FONT.body, color: C.t1, marginBottom: 6 }}>Cảnh báo trước deadline:</div>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  {[1, 3, 7, 14, 30].map(d => {
                    const checked = alertDays.includes(d);
                    return (
                      <label key={d} style={{ display: "flex", alignItems: "center", gap: 5, cursor: "pointer",
                        padding: "4px 10px", borderRadius: RADIUS.full, border: `1px solid ${checked ? C.teal : C.bd0}`,
                        background: checked ? C.teal + "22" : C.bg3, transition: "all .15s" }}>
                        <input type="checkbox" checked={checked} onChange={e =>
                          setAlertDays(prev => e.target.checked ? [...prev, d].sort((a,b) => a-b) : prev.filter(x => x !== d))}
                          style={{ cursor: "pointer" }} />
                        <span style={{ fontSize: FONT.body, color: checked ? C.tealL : C.t1, fontWeight: checked ? 700 : 400 }}>
                          {d} ngày
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Cron preview */}
            <div style={{ marginTop: 14, padding: "10px 14px", background: C.bg3, borderRadius: RADIUS.md, fontSize: FONT.caption, color: C.t3, fontFamily: "'Fira Code', monospace" }}>
              {dailyEnabled  && <div>Daily:  <span style={{ color: C.blueL }}>{`${(dailyTime||"08:00").split(":")[1]||"0"} ${(dailyTime||"08:00").split(":")[0]||"8"} * * *`}</span></div>}
              {weeklyEnabled && <div>Weekly: <span style={{ color: C.blueL }}>{`30 8 * * ${weeklyDay}`}</span></div>}
              {alertsEnabled && <div>Alerts: <span style={{ color: C.blueL }}>0 * * * *</span> (mỗi giờ)</div>}
            </div>
          </div>

          {/* Test & Send */}
          <div style={panelStyle}>
            <span style={labelStyle}>📤 Kiểm tra & Gửi ngay</span>

            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: FONT.body, color: C.t1, marginBottom: 6 }}>Nội dung tin nhắn test (tùy chọn):</div>
              <textarea value={testMsg} onChange={e => setTestMsg(e.target.value)} rows={3}
                placeholder="Để trống sẽ gửi tin mặc định. Hỗ trợ HTML: <b>bold</b> <i>italic</i> <code>code</code>"
                style={{ width: "100%", padding: "10px 14px", background: C.bg3, border: `1px solid ${C.bd0}`,
                  borderRadius: RADIUS.md, color: C.t0, fontSize: FONT.body, resize: "vertical", minHeight: 70,
                  fontFamily: "'Plus Jakarta Sans', sans-serif" }} />
            </div>

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
              <Btn v="outline" sz="md" onClick={sendTest} loading={testLoading}>📡 Gửi test</Btn>
              <Btn v="blue"    sz="md" onClick={() => sendNow(false)} loading={sendLoading}>☀️ Gửi báo cáo ngay</Btn>
              <Btn v="ghost"   sz="md" onClick={() => sendNow(true)}  loading={sendLoading}>🗓️ Gửi tổng hợp tuần</Btn>
            </div>

            {/* Recipients summary */}
            {chatIds.length > 0 && (
              <div style={{ fontSize: FONT.caption, color: C.t3, marginBottom: 10 }}>
                📨 Sẽ gửi tới: {chatIds.map(c => <span key={c.chatId} style={{ background: C.bg3, padding: "1px 6px", borderRadius: 4, marginRight: 4, color: C.t2 }}>{c.title || c.chatId}</span>)}
              </div>
            )}

            {/* Send results */}
            {sendResults && (
              <div style={{ marginTop: 10 }}>
                <div style={{ fontSize: FONT.label, color: C.t3, fontWeight: 700, marginBottom: 6 }}>KẾT QUẢ GỬI:</div>
                {sendResults.map((r, i) => (
                  <div key={i} style={{ display: "flex", gap: 8, alignItems: "center", padding: "5px 10px",
                    background: r.ok ? C.green + "18" : C.red + "18", borderRadius: RADIUS.md, marginBottom: 4,
                    border: `1px solid ${r.ok ? C.green : C.red}33`, fontSize: FONT.caption }}>
                    <span>{r.ok ? "✅" : "❌"}</span>
                    <code style={{ background: C.bg2, padding: "0 5px", borderRadius: 3 }}>{r.chatId}</code>
                    <span style={{ color: r.ok ? C.greenL : C.redL }}>{r.ok ? `Gửi OK (ID: ${r.message_id || "—"})` : r.error}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Surveys quick-send */}
          <div style={panelStyle}>
            <span style={labelStyle}>📋 Gửi nhanh theo phiên</span>
            {surveys.slice(0, 8).map(s => {
              const ap  = s.audit_plan || {};
              const urg = urgencyLevel(s);
              const ub  = urgencyBadge(urg);
              return (
                <div key={s._id} style={{ display: "flex", gap: 10, alignItems: "center",
                  padding: "8px 0", borderBottom: `1px solid ${C.bd2}` }}>
                  <span style={{ fontSize: 16, flexShrink: 0 }}>{ub.icon || "📋"}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: FONT.body, color: C.t0, fontWeight: 600,
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {s.client?.name || "—"}
                    </div>
                    <div style={{ fontSize: FONT.caption, color: C.t3 }}>
                      {s.meta?.ref_no} · {fmtDate(ap.from_date)} → {fmtDate(ap.to_date)}
                    </div>
                  </div>
                  <button onClick={async () => {
                    try {
                      const res = await fetch(`${base(apiUrl)}/api/notifications/send-survey/${s._id}`, {
                        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({})
                      });
                      const d = await res.json();
                      if (!res.ok) throw new Error(d.error);
                      const ok = (d.results || []).filter(r => r.ok).length;
                      showToast("success", `✅ Đã gửi tới ${ok} chat.`);
                    } catch (e) { showToast("error", "❌ " + e.message); }
                  }} style={btnMini(C.teal)}>✉️ Gửi</button>
                </div>
              );
            })}
            {surveys.length === 0 && (
              <div style={{ color: C.t3, fontSize: FONT.body, padding: "10px 0" }}>Chưa có phiên GAP nào.</div>
            )}
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
            <Btn v="primary" sz="md" onClick={saveAll} loading={saving}>💾 Lưu tất cả cài đặt</Btn>
          </div>
        </div>
      </div>
  );
}

// ── Detail Modal ───────────────────────────────────────────────────
function SurveyDetailModal({ survey, onClose, onStatusChange, onSendTelegram }) {
  if (!survey) return null;
  const ap = survey.audit_plan || {};
  const client = survey.client || {};
  const meta = survey.meta || {};
  const stats = calcGapStats(survey);
  const urg = urgencyLevel(survey);
  const ub = urgencyBadge(urg);
  const dTo = daysUntil(ap.to_date);
  const status = autoStatus(survey);

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.7)", zIndex: 500, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }} onClick={onClose}>
      <div style={{ background: C.bg1, border: `1px solid ${C.bd0}`, borderRadius: RADIUS.xl, maxWidth: 560, width: "100%", maxHeight: "90vh", overflowY: "auto", padding: 24 }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: FONT.headline, fontWeight: 800, color: C.t0 }}>{client.name || "—"}</div>
            <div style={{ fontSize: FONT.body, color: C.t2, fontFamily: "'Fira Code',monospace" }}>{meta.ref_no}</div>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {urg !== "ok" && <div style={{ fontSize: 20 }}>{ub.icon}</div>}
            <button onClick={onClose} style={{ background: "none", border: "none", color: C.t2, cursor: "pointer", fontSize: 20 }}>✕</button>
          </div>
        </div>

        {/* Audit plan */}
        <div style={{ background: C.bg2, borderRadius: RADIUS.lg, padding: "14px 16px", marginBottom: 16 }}>
          <div style={{ fontSize: FONT.label, color: C.t3, fontWeight: 700, textTransform: "uppercase", marginBottom: 10 }}>Kế hoạch đánh giá</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {[
              { label: "Mã kế hoạch", value: ap.plan_code },
              { label: "Đợt khảo sát", value: ap.visit_no },
              { label: "Từ ngày", value: fmtDate(ap.from_date) },
              { label: "Đến ngày", value: fmtDate(ap.to_date) },
              { label: "Từ", value: ap.from_city },
              { label: "Đến", value: ap.to_city },
            ].map(x => x.value ? (
              <div key={x.label}>
                <div style={{ fontSize: FONT.caption, color: C.t3 }}>{x.label}</div>
                <div style={{ fontSize: FONT.body, color: C.t0, fontWeight: 600 }}>{x.value}</div>
              </div>
            ) : null)}
          </div>
          {dTo !== null && (
            <div style={{ marginTop: 10, padding: "8px 12px", background: ub.color+"22", borderRadius: RADIUS.md, fontSize: FONT.body, color: ub.color, fontWeight: 700 }}>
              {ub.icon} {dTo < 0 ? `Đã quá hạn ${Math.abs(dTo)} ngày` : `Còn ${dTo} ngày đến deadline`}
            </div>
          )}
        </div>

        {/* Auditors */}
        {(ap.auditors || []).length > 0 && (
          <div style={{ background: C.bg2, borderRadius: RADIUS.lg, padding: "14px 16px", marginBottom: 16 }}>
            <div style={{ fontSize: FONT.label, color: C.t3, fontWeight: 700, textTransform: "uppercase", marginBottom: 10 }}>Đội đánh giá</div>
            {(ap.auditors || []).map((a, i) => (
              <div key={i} style={{ display: "flex", gap: 8, alignItems: "center", padding: "5px 0", borderBottom: `1px solid ${C.bd2}` }}>
                <span style={{ fontSize: 16 }}>👤</span>
                <div>
                  <div style={{ fontSize: FONT.body, color: C.t0, fontWeight: 600 }}>{a.name || a}</div>
                  {a.role && <div style={{ fontSize: FONT.caption, color: C.t2 }}>{a.role}</div>}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* GAP Statistics */}
        <div style={{ background: C.bg2, borderRadius: RADIUS.lg, padding: "14px 16px", marginBottom: 16 }}>
          <div style={{ fontSize: FONT.label, color: C.t3, fontWeight: 700, textTransform: "uppercase", marginBottom: 10 }}>Thống kê GAP</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
            {[
              { label: "Đã đánh giá", value: stats.scored,    color: C.blue  },
              { label: "Nghiêm trọng", value: stats.crit,    color: C.red   },
              { label: "Gap lớn",      value: stats.maj,     color: C.orange },
              { label: "Điểm TB",      value: stats.avg > 0 ? stats.avg.toFixed(1) : "—", color: C.teal },
              { label: "Actions",      value: (survey.action_plan||[]).length, color: C.violet },
              { label: "Hiện trường",  value: (survey.site_assessments||[]).length, color: C.sky },
            ].map(x => (
              <div key={x.label} style={{ textAlign: "center", padding: "8px", background: C.bg3, borderRadius: RADIUS.md }}>
                <div style={{ fontSize: FONT.title, fontWeight: 800, color: x.color }}>{x.value}</div>
                <div style={{ fontSize: FONT.caption, color: C.t2 }}>{x.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <div style={{ flex: 1 }}>
            <select
              value={status}
              onChange={e => { onStatusChange(survey._id, e.target.value); }}
              style={{ width: "100%", padding: "10px 14px", background: C.bg3, border: `1px solid ${C.bd0}`, borderRadius: RADIUS.md, color: C.t0, fontSize: FONT.body, cursor: "pointer" }}
            >
              {KANBAN_COLS.map(c => (
                <option key={c.id} value={c.id}>{c.icon} {c.label}</option>
              ))}
            </select>
          </div>
          <Btn v="primary" sz="md" onClick={() => onSendTelegram(survey)}>✉️ Gửi Telegram</Btn>
          <Btn v="ghost" sz="sm" onClick={onClose}>Đóng</Btn>
        </div>
      </div>
    </div>
  );
}

// ── AlarmBanner ────────────────────────────────────────────────────
function AlarmBanner({ surveys }) {
  const alarms = useMemo(() => {
    return surveys
      .filter(s => ["overdue","urgent"].includes(urgencyLevel(s)))
      .sort((a,b) => {
        const da = daysUntil((a.audit_plan||{}).to_date) || 9999;
        const db = daysUntil((b.audit_plan||{}).to_date) || 9999;
        return da - db;
      })
      .slice(0, 5);
  }, [surveys]);

  if (!alarms.length) return null;

  return (
    <div style={{ background: C.red+"18", border: `1px solid ${C.red}44`, borderRadius: RADIUS.lg, padding: "10px 16px", marginBottom: 16, display: "flex", gap: 10, alignItems: "flex-start", flexWrap: "wrap" }}>
      <div style={{ fontSize: 20 }}>🚨</div>
      <div style={{ flex: 1, minWidth: 200 }}>
        <div style={{ fontSize: FONT.body, fontWeight: 700, color: C.redL, marginBottom: 4 }}>
          Cảnh báo: {alarms.length} phiên GAP cần chú ý khẩn!
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {alarms.map(s => {
            const dTo = daysUntil((s.audit_plan||{}).to_date);
            return (
              <span key={s._id} style={{ fontSize: FONT.caption, background: C.red+"33", color: C.redL, borderRadius: RADIUS.sm, padding: "2px 8px" }}>
                {s.client?.name || s.meta?.ref_no}
                {dTo !== null && ` (${dTo < 0 ? "QH "+Math.abs(dTo)+"n" : "còn "+dTo+"n"})`}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── JobModal ───────────────────────────────────────────────────────
const lblStyle = { fontSize: FONT.caption, color: C.t2, display: "block", marginBottom: 6, fontWeight:600 };
const inpStyle = { width: "100%", padding: "10px 14px", borderRadius: RADIUS.md, border: `1px solid ${C.bd1}`, background: C.bg3, color: C.t0, fontSize: FONT.body, transition: "border .2s" };

function JobModal({ job, dateKey, onClose, onSave, onDelete, apiUrl, onSendTelegram }) {
  const [form, setForm] = useState(job || {
    title: "",
    assignee: "",
    start_date: dateKey || "",
    end_date: dateKey || "",
    attached_docs: "",
    tools_needed: "",
    status: "pending",
    priority: "medium",
    telegram_targets: []
  });
  
  const [showTg, setShowTg] = useState(false);
  const [tgChats, setTgChats] = useState([]);
  
  useEffect(() => {
    async function loadTg() {
      try {
        const res = await fetch(`${base(apiUrl)}/api/notifications/settings`);
        if (res.ok) {
          const data = await res.json();
          const chats = data.chatIds || [];
          setTgChats(chats);
          if (!job && chats.length > 0 && form.telegram_targets.length === 0) {
            setForm(prev => ({ ...prev, telegram_targets: chats.filter(c => c.notify_calendar !== false).map(c => c.chatId) }));
          }
        }
      } catch(e) {}
    }
    loadTg();
  }, [apiUrl, job]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const toggleTgTarget = (id) => {
    setForm(p => ({
      ...p,
      telegram_targets: p.telegram_targets.includes(id) ? p.telegram_targets.filter(x => x !== id) : [...p.telegram_targets, id]
    }));
  };

  const dLimit = daysUntil(form.end_date);
  const isOverdue = dLimit !== null && dLimit < 0;
  
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.75)", zIndex: 600, display: "flex", alignItems: "center", justifyContent: "center", padding: 16, backdropFilter: "blur(6px)" }} onClick={onClose}>
      <div style={{ background: C.bg1, borderRadius: RADIUS.xl, width: "100%", maxWidth: 640, maxHeight: "90vh", overflowY: "auto", border: `1px solid ${C.bd0}`, boxShadow: "0 24px 48px rgba(0,0,0,0.4)" }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{ padding: "20px 24px", borderBottom: `1px solid ${C.bd1}`, display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, background: C.bg1, zIndex: 10 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: FONT.title, color: C.t0 }}>{job ? "Sửa cấu hình Công Việc / Nhiệm Vụ" : "Tạo Công Việc Bổ Sung"}</h2>
            <div style={{ fontSize: FONT.caption, color: C.t2, marginTop: 4 }}>Cấu hình nhiệm vụ hiện trường, công cụ & cảnh báo Telegram tự động</div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: C.t3, fontSize: 24, cursor: "pointer" }}>✕</button>
        </div>

        {/* Content */}
        <div style={{ padding: "24px" }}>
          
          {/* Urgency Ribbon */}
          {form.end_date && dLimit !== null && (
            <div style={{ marginBottom: 20, padding: "10px 16px", borderRadius: RADIUS.md, display: "flex", alignItems: "center", gap: 10,
                          background: isOverdue ? C.red+"22" : dLimit <= 3 ? C.orange+"22" : C.teal+"22",
                          border: `1px solid ${isOverdue ? C.red : dLimit <= 3 ? C.orange : C.teal}44` }}>
              <span style={{ fontSize: 20 }}>{isOverdue ? "🔴" : dLimit <= 3 ? "🚨" : "⏳"}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: FONT.body, fontWeight: 700, color: isOverdue ? C.redL : dLimit <= 3 ? C.orangeL : C.tealL }}>
                  {isOverdue ? `Đã quá hạn ${Math.abs(dLimit)} ngày!` : `Thời gian còn lại: ${dLimit} ngày đến Deadline`}
                </div>
                <div style={{ fontSize: FONT.caption, color: C.t2 }}>Mức độ Khẩn cấp và Trạng thái sẽ được Update liên tục.</div>
              </div>
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={lblStyle}>Tên công việc <span style={{color:C.red}}>*</span></label>
              <input type="text" name="title" value={form.title} onChange={handleChange} autoFocus placeholder="VD: Mang thiết bị đo khi đi khảo sát GAP..." style={{...inpStyle, borderColor: form.title ? C.bd1 : C.orange}} />
            </div>
            
            <div style={{ gridColumn: "1 / -1", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
               <div>
                  <label style={lblStyle}>Người thực hiện</label>
                  <input type="text" name="assignee" value={form.assignee} onChange={handleChange} placeholder="VD: Vũ Ngọc Toàn" style={{...inpStyle, width:"100%"}} />
               </div>
               <div>
                  <label style={lblStyle}>Mức độ ưu tiên</label>
                  <select name="priority" value={form.priority} onChange={handleChange} style={{...inpStyle, width:"100%", cursor:"pointer"}}>
                    <option value="low">Thấp 🟢</option>
                    <option value="medium">Bình thường 🔵</option>
                    <option value="high">Quan trọng ⚠️</option>
                    <option value="urgent">Khẩn cấp 🚨</option>
                  </select>
               </div>
               <div>
                  <label style={lblStyle}>Trạng thái Job</label>
                  <select name="status" value={form.status} onChange={handleChange} style={{...inpStyle, width:"100%", cursor:"pointer"}}>
                    <option value="pending">⏳ Khởi tạo</option>
                    <option value="in_progress">⚡ Đang thực hiện</option>
                    <option value="completed">✅ Đã hoàn thành</option>
                    <option value="overdue">🔴 Chậm trễ</option>
                  </select>
               </div>
            </div>

            <div>
              <label style={lblStyle}>Ngày bắt đầu</label>
              <DatePicker value={form.start_date || ""} onChange={v => setForm({ ...form, start_date: v })} placeholder="YYYY-MM-DD" />
            </div>
            <div>
              <label style={lblStyle}>Ngày kết thúc (Deadline)</label>
              <DatePicker value={form.end_date || ""} onChange={v => setForm({ ...form, end_date: v })} placeholder="YYYY-MM-DD" />
            </div>

            <div style={{ gridColumn: "1 / -1", borderTop: `1px solid ${C.bd2}`, paddingTop: 16, marginTop: 4 }}>
              <label style={lblStyle}>Hồ sơ tài liệu kèm theo</label>
              <input type="text" name="attached_docs" value={form.attached_docs} onChange={handleChange} placeholder="VD: Sổ tay đo lường, Báo cáo kiểm định..." style={inpStyle} />
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={lblStyle}>Công cụ/dụng cụ cần chuẩn bị</label>
              <input type="text" name="tools_needed" value={form.tools_needed} onChange={handleChange} placeholder="VD: Camera nhiệt, Máy quét Laser..." style={inpStyle} />
            </div>
          </div>

          {/* Telegram Settings Inline */}
          <div style={{ background: C.bg2, borderRadius: RADIUS.lg, border: `1px solid ${C.teal}44`, overflow: "hidden" }}>
             <div onClick={() => setShowTg(!showTg)} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding: "12px 16px", cursor:"pointer", background: showTg ? C.teal+"11" : "transparent" }}>
                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <span style={{fontSize:20}}>🤖</span>
                  <span style={{ fontSize: FONT.body, fontWeight: 700, color: C.tealL }}>Cấu hình gửi Telegram tự động</span>
                </div>
                <span style={{ color:C.tealL }}>{showTg ? "▲" : "▼"}</span>
             </div>
             {showTg && (
               <div style={{ padding: "0 16px 16px" }}>
                 <div style={{ fontSize: FONT.caption, color: C.t2, marginBottom: 12 }}>
                   Hệ thống sẽ gửi Job này đến các ChatID dưới đây. Tích chọn nhóm muốn gửi thông báo.
                 </div>
                 {tgChats.length === 0 ? (
                   <div style={{ fontSize: FONT.caption, color: C.t3, fontStyle:"italic" }}>Chưa có cấu hình Bot. Vui lòng cài đặt Telegram tại tab ngoài.</div>
                 ) : (
                   <div style={{ display:"flex", flexWrap:"wrap", gap: 8 }}>
                     {tgChats.map(c => {
                       const checked = form.telegram_targets.includes(c.chatId);
                       return (
                         <label key={c.chatId} style={{ display:"flex", alignItems:"center", gap:6, padding: "6px 12px", background: checked ? C.teal+"22" : C.bg3, border: `1px solid ${checked ? C.teal : C.bd1}`, borderRadius: RADIUS.full, cursor:"pointer", transition:"all .2s" }}>
                           <input type="checkbox" checked={checked} onChange={() => toggleTgTarget(c.chatId)} style={{cursor:"pointer", accentColor:C.teal}} />
                           <span style={{ fontSize: FONT.caption, color: checked ? C.tealL : C.t1, fontWeight: checked ? 700 : 400 }}>{c.title || c.chatId}</span>
                         </label>
                       );
                     })}
                   </div>
                 )}
               </div>
             )}
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: "16px 24px", borderTop: `1px solid ${C.bd1}`, display: "flex", justifyContent: "space-between", alignItems: "center", background: C.bg2, borderBottomLeftRadius: RADIUS.xl, borderBottomRightRadius: RADIUS.xl }}>
          <div style={{ display: "flex", gap: 12 }}>
            {job ? (
              <Btn v="outline" sz="md" onClick={() => onDelete(job._id)} style={{ color: C.red, borderColor: C.redL }}>🗑 Xoá Job</Btn>
            ) : null}
            {job && onSendTelegram && (
              <Btn v="outline" sz="md" onClick={() => onSendTelegram(job)} style={{ color: C.tealL, borderColor: C.tealL }}>✉️ Gửi Telegram Tuỳ Chỉnh</Btn>
            )}
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <Btn v="ghost" sz="md" onClick={onClose}>Hủy thao tác</Btn>
            <Btn v="primary" sz="md" onClick={() => onSave(form)} disabled={!form.title.trim()}>💾 Lưu & Đồng bộ</Btn>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main KanbanDashboard ───────────────────────────────────────────
export default function KanbanDashboard({ apiUrl, initialTab = "kanban" }) {
  const [view, setView]         = useState(initialTab);
  const [surveys, setSurveys]   = useState([]);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");

  const [toast, setToast] = useState(null);
  const showToast = useCallback((type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 6000);
  }, []);

  useEffect(() => {
    if (initialTab && initialTab !== view) setView(initialTab);
  }, [initialTab]);
  const [draggingId, setDraggingId] = useState(null);
  const [detailSurvey, setDetailSurvey] = useState(null);
  const [filter, setFilter]     = useState({ client: "", auditor: "" });
  const [composerModal, setComposerModal] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const pollRef = useRef(null);

  const [jobs, setJobs]         = useState([]);
  const [jobModal, setJobModal] = useState(null); // null | { isEdit: boolean, job?: object, dateKey?: string }

  // ── Fetch surveys ──────────────────────────────────────────────
  const fetchSurveys = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError("");
    try {
      const res = await fetch(`${base(apiUrl)}/api/surveys?limit=200`);
      if (res.status === 503) throw new Error("MongoDB chưa kết nối — khởi động MongoDB (cổng 27017) và backend, sau đó thử lại.");
      if (!res.ok) throw new Error(`Lỗi tải dữ liệu: HTTP ${res.status}`);
      const data = await res.json();
      setSurveys(Array.isArray(data) ? data : []);
      setLastUpdate(new Date());
    } catch (e) {
      if (!silent) setError(e.message);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [apiUrl]);

  // ── Fetch jobs ─────────────────────────────────────────────────
  const fetchJobs = useCallback(async (silent = false) => {
    try {
      const res = await fetch(`${base(apiUrl)}/api/jobs`);
      if (res.ok) setJobs(await res.json());
    } catch (_) {}
  }, [apiUrl]);

  // Initial load + polling every 30s
  useEffect(() => {
    fetchSurveys();
    fetchJobs();
    pollRef.current = setInterval(() => { fetchSurveys(true); fetchJobs(true); }, 30000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [fetchSurveys, fetchJobs]);

  const saveJob = async (jobData) => {
    const isEdit = !!jobData._id;
    const url = isEdit ? `${base(apiUrl)}/api/jobs/${jobData._id}` : `${base(apiUrl)}/api/jobs`;

    // Process dates to ISO strings before saving so backend Mongoose Date schemas don't throw cast error (from "DD/MM/YYYY")
    const fixD = (d) => {
      if (!d) return d;
      const parts = d.split("/");
      if (parts.length === 3) return `${parts[2]}-${parts[1]}-${parts[0]}`; // YYYY-MM-DD
      return d;
    };
    const payload = { ...jobData, start_date: fixD(jobData.start_date), end_date: fixD(jobData.end_date) };

    try {
      const res = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Lỗi mạng");
      setJobModal(null);
      fetchJobs(true);
      showToast("success", isEdit ? "Cập nhật Job thành công" : "Tạo Job thành công");
    } catch (e) {
      showToast("error", "Lỗi lưu Job: " + e.message);
    }
  };

  const deleteJob = async (id) => {
    if (!window.confirm("Bạn muốn xoá tác vụ này?")) return;
    try {
      const res = await fetch(`${base(apiUrl)}/api/jobs/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Lỗi mạng");
      setJobModal(null);
      fetchJobs(true);
      showToast("success", "Đã xoá Job");
    } catch (e) {
      showToast("error", "Lỗi xoá Job: " + e.message);
    }
  };

  // Socket.IO realtime — kết nối tới backend (không phải Vite dev server)
  useEffect(() => {
    // Resolve đúng backend URL:
    // - apiUrl được set (vd: http://localhost:5002) → dùng trực tiếp
    // - apiUrl rỗng (nginx proxy) → dùng window.location.origin
    //   nhưng trong dev (port 3000) thì thử :5002
    const backendUrl = (() => {
      const explicit = base(apiUrl);
      if (explicit) return explicit;
      const { protocol, hostname, port } = window.location;
      // Dev mode: Vite chạy :3000, backend chạy :5002
      if (port === "3000" || port === "5173") return `${protocol}//${hostname}:5002`;
      // Production/nginx: cùng origin
      return window.location.origin;
    })();

    let cancelled = false;
    let socket = null;

    import("socket.io-client").then(({ io }) => {
      if (cancelled) return; // effect đã cleanup trước khi import xong
      socket = io(backendUrl, {
        transports: ["polling", "websocket"], // polling trước để tránh WS fail ngay
        reconnectionAttempts: 3,
        timeout: 5000,
      });
      socket.on("kanban:status-changed", ({ id, status }) => {
        setSurveys(prev => prev.map(s => s._id === id ? { ...s, kanban_status: status } : s));
      });
      socket.on("connect_error", () => {
        // Không cần làm gì — polling fallback vẫn hoạt động
      });
    }).catch(() => {});

    return () => {
      cancelled = true;
      if (socket) { socket.disconnect(); socket = null; }
    };
  }, [apiUrl]);

  // ── Status change (drag & drop + select) ──────────────────────
  const updateStatus = useCallback(async (surveyId, newStatus) => {
    // Optimistic update
    setSurveys(prev => prev.map(s => s._id === surveyId ? { ...s, kanban_status: newStatus } : s));
    try {
      const res = await fetch(`${base(apiUrl)}/api/surveys/${surveyId}/kanban-status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("Update failed");
    } catch (e) {
      // Rollback on error
      fetchSurveys(true);
    }
  }, [apiUrl, fetchSurveys]);

  // ── Drag & Drop handlers ───────────────────────────────────────
  const handleDragStart = useCallback((e, surveyId) => {
    setDraggingId(surveyId);
    e.dataTransfer.setData("text/plain", surveyId);
    e.dataTransfer.effectAllowed = "move";
  }, []);

  const handleDragOver = useCallback((e, colId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }, []);

  const handleDrop = useCallback((e, colId) => {
    e.preventDefault();
    const surveyId = e.dataTransfer.getData("text/plain") || draggingId;
    setDraggingId(null);
    if (surveyId) updateStatus(surveyId, colId);
  }, [draggingId, updateStatus]);

  // ── Send Telegram for a survey ─────────────────────────────────
  const sendTelegram = useCallback((item, type) => {
    setComposerModal({ obj: item, type });
  }, []);

  // ── Filtered surveys ───────────────────────────────────────────
  const filteredSurveys = useMemo(() => {
    return surveys.filter(s => {
      if (filter.client && !((s.client?.name || "").toLowerCase().includes(filter.client.toLowerCase()))) return false;
      if (filter.auditor) {
        const aud = (s.audit_plan?.auditors || []).map(a => (a.name || a).toLowerCase()).join(" ");
        if (!aud.includes(filter.auditor.toLowerCase())) return false;
      }
      return true;
    });
  }, [surveys, filter]);

  // Grouped by kanban column
  const grouped = useMemo(() => {
    const g = {};
    for (const col of KANBAN_COLS) g[col.id] = [];
    for (const s of filteredSurveys) {
      const st = autoStatus(s);
      if (g[st]) g[st].push(s);
      else g["planning"].push(s);
    }
    return g;
  }, [filteredSurveys]);

  const alarmCount = useMemo(() => filteredSurveys.filter(s => ["overdue","urgent"].includes(urgencyLevel(s))).length, [filteredSurveys]);

  // ── Render ─────────────────────────────────────────────────────
  return (
    <>
      <style>{PULSE_CSS}</style>

      {/* Top bar */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
        {/* View tabs */}
        <div style={{ display: "flex", gap: 4, background: C.bg2, borderRadius: RADIUS.lg, padding: 4, border: `1px solid ${C.bd0}` }}>
          {VIEWS.map(v => (
            <button
              key={v.id}
              onClick={() => setView(v.id)}
              style={{
                padding: "6px 14px",
                borderRadius: RADIUS.md,
                border: "none",
                background: view === v.id ? `linear-gradient(135deg,${C.blue},${C.tealL})` : "transparent",
                color: view === v.id ? "#fff" : C.t2,
                fontSize: FONT.body,
                fontWeight: 600,
                cursor: "pointer",
                transition: "all .15s",
                display: "flex",
                alignItems: "center",
                gap: 5,
              }}
            >
              {v.icon} {v.label}
              {v.id === "kanban" && alarmCount > 0 && (
                <span className="kb-pulse" style={{ fontSize: FONT.caption, background: C.red, color: "#fff", borderRadius: RADIUS.full, padding: "0 5px", minWidth: 16, textAlign: "center" }}>
                  {alarmCount}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Filters */}
        <div style={{ display: "flex", gap: 8, flex: 1, minWidth: 0 }}>
          <input
            value={filter.client}
            onChange={e => setFilter(p => ({ ...p, client: e.target.value }))}
            placeholder="🔍 Lọc khách hàng..."
            style={{ flex: 1, minWidth: 0, padding: "7px 12px", background: C.bg2, border: `1px solid ${C.bd0}`, borderRadius: RADIUS.md, color: C.t0, fontSize: FONT.body }}
          />
          <input
            value={filter.auditor}
            onChange={e => setFilter(p => ({ ...p, auditor: e.target.value }))}
            placeholder="👤 Lọc auditor..."
            style={{ flex: 1, minWidth: 0, padding: "7px 12px", background: C.bg2, border: `1px solid ${C.bd0}`, borderRadius: RADIUS.md, color: C.t0, fontSize: FONT.body }}
          />
        </div>

        {/* Refresh */}
        <Btn v="ghost" sz="sm" onClick={() => fetchSurveys()} loading={loading}>🔄</Btn>
        {lastUpdate && (
          <span style={{ fontSize: FONT.caption, color: C.t3 }}>
            Cập nhật: {lastUpdate.toLocaleTimeString("vi-VN")}
          </span>
        )}
      </div>

      {/* Alarm banner */}
      <AlarmBanner surveys={filteredSurveys} />

      {/* Error */}
      {error && (
        <div style={{ padding: "10px 16px", background: C.red+"22", border: `1px solid ${C.red}66`, borderRadius: RADIUS.md, color: C.redL, marginBottom: 16, fontSize: FONT.body }}>
          ❌ {error}
        </div>
      )}

      {/* Loading skeleton */}
      {loading && surveys.length === 0 && (
        <div style={{ display: "flex", gap: 12 }}>
          {KANBAN_COLS.map(c => (
            <div key={c.id} style={{ flex: 1, minWidth: 180, background: C.bg2, borderRadius: RADIUS.xl, padding: 12, border: `1px solid ${C.bd1}` }}>
              <div className="kb-pulse" style={{ height: 20, background: C.bg3, borderRadius: 4, marginBottom: 12, width: "60%" }} />
              {[1,2].map(i => (
                <div key={i} className="kb-pulse" style={{ height: 80, background: C.bg3, borderRadius: 8, marginBottom: 8 }} />
              ))}
            </div>
          ))}
        </div>
      )}

      {/* ── Views ── */}
      {!loading || surveys.length > 0 ? (
        <>
          {/* KANBAN VIEW */}
          {view === "kanban" && (
            <div style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 12, alignItems: "flex-start" }}>
              {KANBAN_COLS.map(col => (
                <KanbanColumn
                  key={col.id}
                  col={col}
                  surveys={grouped[col.id] || []}
                  draggingId={draggingId}
                  onDragStart={handleDragStart}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  onStatusChange={updateStatus}
                  onSendTelegram={sendTelegram}
                  onOpenDetail={setDetailSurvey}
                />
              ))}
            </div>
          )}

          {/* CALENDAR VIEW */}
          {view === "calendar" && (
            <div style={{ background: C.bg1, border: `1px solid ${C.bd0}`, borderRadius: RADIUS.xl, padding: "20px 24px" }}>
              <CalendarView 
                surveys={filteredSurveys} 
                jobs={jobs} 
                onOpenDetail={setDetailSurvey} 
                onAddJob={dateKey => setJobModal({ job: null, dateKey })} 
                onEditJob={job => setJobModal({ job, dateKey: null })} 
              />
            </div>
          )}

          {/* STATS VIEW */}
          {view === "stats" && (
            <div style={{ background: C.bg1, border: `1px solid ${C.bd0}`, borderRadius: RADIUS.xl, padding: "20px 24px" }}>
              <StatsView surveys={filteredSurveys} />
            </div>
          )}

          {/* TELEGRAM SETTINGS */}
          {view === "telegram" && (
            <div style={{ background: C.bg1, border: `1px solid ${C.bd0}`, borderRadius: RADIUS.xl, padding: "20px 24px" }}>
              <TelegramSettings apiUrl={apiUrl} surveys={filteredSurveys} showToast={showToast} />
            </div>
          )}
        </>
      ) : null}

      <Toast2 toast={toast} />

      {/* Job modal */}
      {jobModal && (
        <JobModal
          job={jobModal.job}
          dateKey={jobModal.dateKey}
          onClose={() => setJobModal(null)}
          onSave={saveJob}
          onDelete={deleteJob}
          apiUrl={apiUrl}
          onSendTelegram={(j) => sendTelegram(j, "job")}
        />
      )}

      {/* Detail modal */}
      {detailSurvey && (
        <SurveyDetailModal
          survey={detailSurvey}
          onClose={() => setDetailSurvey(null)}
          onStatusChange={(id, status) => { updateStatus(id, status); setDetailSurvey(prev => prev ? { ...prev, kanban_status: status } : null); }}
          onSendTelegram={(s) => sendTelegram(s, "survey")}
        />
      )}

      {/* Composer modal */}
      <MessageComposerModal 
        isOpen={!!composerModal} 
        onClose={() => setComposerModal(null)} 
        targetItem={composerModal?.obj} 
        type={composerModal?.type} 
        apiUrl={base(apiUrl)} 
      />
    </>
  );
}
