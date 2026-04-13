import React, { useState, useMemo } from "react";
import { C, FONT } from "./gap.ui.constants.js";
import { Btn, Modal, Field, Input, Sel, Tag, Grid, DatePicker } from "./gap.atoms.jsx";

// Hàm hỗ trợ format date "YYYY-MM-DD"
const dString = (d) => {
  if (!d) return "";
  const dd = new Date(d);
  if (isNaN(dd.getTime())) return d;
  return `${dd.getDate().toString().padStart(2,"0")}/${(dd.getMonth()+1).toString().padStart(2,"0")}/${dd.getFullYear()}`;
};

const diffDays = (d1, d2) => {
  return Math.round((new Date(d2) - new Date(d1)) / (1000 * 60 * 60 * 24));
};

export default function RoadmapGantt({ roadmapRows, setRoadmapRows, meta = {}, setMeta = () => {}, apiUrl }) {
  const [modal, setModal] = useState({ open: false, index: null });
  const [form, setForm] = useState({ 
    type: "task", 
    no: "", 
    phaseName: "",
    activity: "", 
    resp: "", 
    supp: "", 
    startDate: "", 
    endDate: "" 
  });
  const [chatId, setChatId] = useState("");
  const [pushModal, setPushModal] = useState({ open: false, taskInfo: null });

  const openAdd = () => {
    setForm({ type: "task", no: "", phaseName: "", activity: "", resp: "", supp: "", startDate: "", endDate: "" });
    setModal({ open: true, index: null });
  };

  const openEdit = (i) => {
    const r = roadmapRows[i];
    setForm({
      type: r.type || "task",
      no: r.no || "",
      phaseName: r.phaseName || "",
      activity: r.activity || "",
      resp: r.resp || "",
      supp: r.supp || "",
      startDate: r.startDate || "",
      endDate: r.endDate || ""
    });
    setModal({ open: true, index: i });
  };

  const saveForm = () => {
    const next = [...roadmapRows];
    if (modal.index === null) next.push({ ...form });
    else next[modal.index] = { ...form };
    
    // Sắp xếp tự động theo số thứ tự (TT)
    next.sort((a, b) => {
      const s1 = (a.no && a.no !== "") ? String(a.no) : "999";
      const s2 = (b.no && b.no !== "") ? String(b.no) : "999";
      return s1.localeCompare(s2, undefined, { numeric: true });
    });
    
    setRoadmapRows(next);
    setModal({ open: false, index: null });
  };

  const removeRow = (i) => {
    if(!window.confirm("Bạn có chắc muốn xoá?")) return;
    setRoadmapRows(roadmapRows.filter((_, idx)=>idx!==i));
  };

  const pushToSystem = async () => {
    try {
      const { taskInfo } = pushModal;
      // 1. Send Job API
      const jobRes = await fetch(`${apiUrl}/api/jobs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `[Roadmap] ${taskInfo.no ? taskInfo.no + ". " : ""}${taskInfo.activity}`,
          assignee: taskInfo.resp,
          start_date: taskInfo.startDate,
          end_date: taskInfo.endDate,
          telegram_targets: chatId ? [chatId] : []
        })
      });
      if (!jobRes.ok) throw new Error("Lỗi khi đẩy lên Calendar (Job).");
      alert("Đã lưu thành công vào Lịch & Job, hệ thống sẽ tự động nhắn qua Telegram!");
      setPushModal({ open: false, taskInfo: null });
    } catch (e) {
      alert("Lỗi: " + e.message);
    }
  };

  // Tính toán các cột Tháng & Tuần bằng cách quét min/max date
  const { timelineMonths, minDate, maxDate } = useMemo(() => {
    let minD = null, maxD = null;
    
    if (meta?.roadmap_custom_start) {
      const parts = meta.roadmap_custom_start.split('-');
      if (parts.length === 2) minD = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, 1);
    }
    if (meta?.roadmap_custom_end) {
      const parts = meta.roadmap_custom_end.split('-');
      if (parts.length === 2) maxD = new Date(parseInt(parts[0]), parseInt(parts[1]), 0);
    }

    if (!minD || !maxD) {
      let calcMinD = null, calcMaxD = null;
      roadmapRows.forEach(r => {
        if (r.startDate) {
          const sd = new Date(r.startDate);
          if (!isNaN(sd.getTime()) && (!calcMinD || sd < calcMinD)) calcMinD = sd;
        }
        if (r.endDate) {
          const ed = new Date(r.endDate);
          if (!isNaN(ed.getTime()) && (!calcMaxD || ed > calcMaxD)) calcMaxD = ed;
        }
      });
      if (!calcMinD) calcMinD = new Date();
      if (!calcMaxD) calcMaxD = new Date(calcMinD.getTime() + 120 * 24 * 3600 * 1000); // Mặc định 4 tháng

      if (!minD) minD = new Date(calcMinD.getFullYear(), calcMinD.getMonth(), 1);
      if (!maxD) maxD = new Date(calcMaxD.getFullYear(), calcMaxD.getMonth() + 1, 0); 
    }

    // Dịch lại minD về ngày 1 của tháng để an toàn
    minD = new Date(minD.getFullYear(), minD.getMonth(), 1);
    maxD = new Date(maxD.getFullYear(), maxD.getMonth() + 1, 0); 
    
    // Tạo list các tháng & tuần
    const months = [];
    let cur = new Date(minD.getTime());
    while (cur <= maxD && months.length < 36) { // limit 36 months max
      months.push({ 
        y: cur.getFullYear(), 
        m: cur.getMonth() + 1, 
        weeks: [1, 2, 3, 4] 
      });
      cur = new Date(cur.getFullYear(), cur.getMonth() + 1, 1);
    }
    return { timelineMonths: months, minDate: minD, maxDate: maxD };
  }, [roadmapRows, meta?.roadmap_custom_start, meta?.roadmap_custom_end]);

  const checkIntersect = (start, end, year, month, w) => {
    if (!start || !end) return false;
    const s = new Date(start); const e = new Date(end);
    if (isNaN(s.getTime()) || isNaN(e.getTime())) return false;
    
    // Ngày bắt đầu và kết thúc của cái tuần w trong tháng đó
    const wStart = new Date(year, month - 1, 1 + (w - 1) * 7);
    let wEnd = new Date(year, month - 1, w * 7);
    if (w === 4) wEnd = new Date(year, month, 0); // Tuần 4 kéo tới hết tháng

    return s <= wEnd && e >= wStart;
  };

  return (
    <div style={{ padding: 0 }}>
      {/* Action Bar */}
      <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 10, alignItems: "center", marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <span style={{ fontSize: FONT.label, color: C.t2, fontWeight: 600 }}>Thời gian tuỳ chỉnh hiển thị:</span>
          <div>
            <Input type="month" value={meta?.roadmap_custom_start || ""} onChange={v => setMeta("roadmap_custom_start", v)} placeholder="Từ tháng..." style={{ minHeight: 40, width: 140 }} />
          </div>
          <span>→</span>
          <div>
            <Input type="month" value={meta?.roadmap_custom_end || ""} onChange={v => setMeta("roadmap_custom_end", v)} placeholder="Đến tháng..." style={{ minHeight: 40, width: 140 }} />
          </div>
        </div>
        <Btn v="blue" sz="sm" onClick={openAdd}>＋ Thêm mốc / Giai đoạn</Btn>
      </div>

      <div style={{ overflowX: "auto", border: `1px solid ${C.bd0}`, borderRadius: 8, background: "#fff", boxShadow: "0 4px 6px rgba(0,0,0,0.05)" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 1000, fontSize: 13, borderSpacing: 0 }}>
          <thead>
            {/* Header Level 1 - Tháng */}
            <tr style={{ background: "#0a4b6c", color: "#fff", height: 32 }}>
              <th rowSpan={2} style={{ width: 40, border: "1px solid #1a5c7f", borderLeft:"none" }}>TT</th>
              <th rowSpan={2} style={{ border: "1px solid #1a5c7f", minWidth: 280 }}>HẠNG MỤC CÔNG VIỆC</th>
              <th rowSpan={2} style={{ border: "1px solid #1a5c7f", width: 100 }}>TRÁCH NHIỆM CHÍNH</th>
              <th rowSpan={2} style={{ border: "1px solid #1a5c7f", width: 80 }}>HỖ TRỢ</th>
              <th rowSpan={2} style={{ border: "1px solid #1a5c7f", width: 80 }}>BẮT ĐẦU</th>
              <th rowSpan={2} style={{ border: "1px solid #1a5c7f", width: 80 }}>KẾT THÚC</th>
              {timelineMonths.map((m, i) => (
                <th key={i} colSpan={4} style={{ border: "1px solid #1a5c7f", borderRight: i === timelineMonths.length - 1 ? "none" : undefined }}>
                  Tháng {m.m}.{m.y}
                </th>
              ))}
              <th rowSpan={2} style={{ border: "1px solid #1a5c7f", width: 100 }}>Thao tác</th>
            </tr>
            {/* Header Level 2 - Tuần */}
            <tr style={{ background: "#065d83", color: "#fff", height: 24, fontSize: 11 }}>
              {timelineMonths.map((m, idx) => (
                m.weeks.map(w => (
                  <th key={`${idx}-${w}`} style={{ border: "1px solid #1a5c7f", width: 24, fontWeight: 500 }}>W{w}</th>
                ))
              ))}
            </tr>
          </thead>
          <tbody>
            {roadmapRows.length === 0 ? (
              <tr><td colSpan={20} style={{ padding: 20, textAlign: "center", color: C.t3 }}>Chưa có lộ trình nào.</td></tr>
            ) : null}
            {roadmapRows
              .map((row, originalIndex) => ({ row, originalIndex }))
              .sort((a, b) => {
                const s1 = (a.row.no && a.row.no !== "") ? String(a.row.no) : "999";
                const s2 = (b.row.no && b.row.no !== "") ? String(b.row.no) : "999";
                return s1.localeCompare(s2, undefined, { numeric: true });
              })
              .map(({ row, originalIndex }, displayIndex) => {
              const isPhase = row.type === "phase";
              const rowColor = isPhase ? "#183247" : "#333";
              return (
                <tr key={originalIndex} style={{ borderBottom: "1px solid #dee2e6", background: isPhase ? "#eef3f7" : "#fff", fontWeight: isPhase ? 700 : 400, color: rowColor }}>
                  <td style={{ padding: "6px", textAlign: "center", borderRight: "1px solid #dee2e6" }}>{row.no}</td>
                  <td style={{ padding: "6px 12px", borderRight: "1px solid #dee2e6", textTransform: isPhase ? "uppercase" : "none" }}>
                    {isPhase ? row.phaseName : row.activity}
                  </td>
                  <td style={{ padding: "6px", textAlign: "center", borderRight: "1px solid #dee2e6" }}>{!isPhase && row.resp}</td>
                  <td style={{ padding: "6px", textAlign: "center", borderRight: "1px solid #dee2e6" }}>{!isPhase && row.supp}</td>
                  <td style={{ padding: "6px", textAlign: "center", borderRight: "1px solid #dee2e6" }}>{dString(row.startDate)}</td>
                  <td style={{ padding: "6px", textAlign: "center", borderRight: "2px solid #5c7f92" }}>{dString(row.endDate)}</td>
                  
                  {/* Calendar Bars */}
                  {timelineMonths.map((m) => (
                    m.weeks.map(w => {
                      const isActive = checkIntersect(row.startDate, row.endDate, m.y, m.m, w);
                      return (
                        <td key={`${m.m}-${w}`} style={{ 
                          borderRight: "1px solid #dee2e6", 
                          padding: 1, 
                          background: isActive ? (isPhase ? "#84b0c2" : "#0f8ea3") : "transparent" 
                        }}>
                          {isActive && <div style={{ height: "100%", width: "100%" }}></div>}
                        </td>
                      );
                    })
                  ))}

                  <td style={{ padding: "4px", textAlign: "center" }}>
                    <div style={{ display: "flex", gap: 4, justifyContent: "center" }}>
                      <Btn v="ghost" sz="sm" sx={{ padding: "2px 4px", minWidth: 0, fontSize: 11 }} onClick={() => openEdit(originalIndex)}>Sửa</Btn>
                      <Btn v="ghost" sz="sm" sx={{ padding: "2px 4px", minWidth: 0, fontSize: 11, color: C.red }} onClick={() => removeRow(originalIndex)}>Xoá</Btn>
                      {!isPhase && (
                        <Btn v="outline" sz="sm" sx={{ padding: "2px 4px", minWidth: 0, fontSize: 11, borderColor: "#28a745", color: "#28a745" }} 
                             onClick={() => setPushModal({ open: true, taskInfo: row })}>
                           🚀 Giao việc
                        </Btn>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Modal open={modal.open} onClose={() => setModal({ open: false, index: null })} title={modal.index === null ? "Thêm Item Lộ Trình" : "Chỉnh sửa Item Lộ Trình"} width={500}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Field label="Loại mục">
            <Sel options={[["phase", "Phần (Giai đoạn)"], ["task", "Hạng mục công việc"]]} value={form.type} onChange={v => setForm({ ...form, type: v })} />
          </Field>
          <Field label="TT (Số thứ tự)"><Input value={form.no} onChange={v => setForm({ ...form, no: v })} placeholder="VD: 1, 2, 2.1, 2.2"/></Field>
          
          {form.type === "phase" ? (
            <Field label="Tên Phần (Giai đoạn)"><Input value={form.phaseName} onChange={v => setForm({ ...form, phaseName: v })} placeholder="VD: CAM KẾT & CHUẨN BỊ"/></Field>
          ) : (
             <>
               <Grid cols={2} gap={10}>
                 <Field label="Hạng mục công việc"><Input value={form.activity} onChange={v => setForm({ ...form, activity: v })} placeholder="Quy trình đánh giá rủi ro..."/></Field>
                 <Field label="Trách nhiệm chính"><Input value={form.resp} onChange={v => setForm({ ...form, resp: v })} placeholder="QA"/></Field>
               </Grid>
               <Field label="Hỗ trợ"><Input value={form.supp} onChange={v => setForm({ ...form, supp: v })} placeholder="KTDA, BQLNL"/></Field>
             </>
          )}
          <Grid cols={2} gap={10}>
            <Field label="Ngày bắt đầu"><DatePicker value={form.startDate} onChange={v => setForm({ ...form, startDate: v })} placeholder="d/m/Y" /></Field>
            <Field label="Ngày kết thúc"><DatePicker value={form.endDate} onChange={v => setForm({ ...form, endDate: v })} placeholder="d/m/Y" /></Field>
          </Grid>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 10 }}>
            <Btn v="ghost" sz="md" onClick={() => setModal({ open: false, index: null })}>Hủy</Btn>
            <Btn v="blue" sz="md" onClick={saveForm}>Lưu</Btn>
          </div>
        </div>
      </Modal>

      <Modal open={pushModal.open} onClose={() => setPushModal({ open: false, taskInfo: null })} title="Đẩy sang Calendar & Giao việc Telegram" width={450}>
        {pushModal.taskInfo && (
           <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
             <p style={{ fontSize: 14, color: C.t1, margin: 0 }}>Hệ thống sẽ tạo một Job mới trong Calendar và ping trực tiếp cho nhân sự qua Telegram.</p>
             <div style={{ background: C.bg2, padding: 10, borderRadius: 6, fontSize: 13 }}>
                <strong>Công việc:</strong> {pushModal.taskInfo.activity}<br/>
                <strong>Thời gian:</strong> {pushModal.taskInfo.startDate} → {pushModal.taskInfo.endDate}<br/>
                <strong>Người phụ trách:</strong> {pushModal.taskInfo.resp}
             </div>
             <Field label="Telegram Chat ID (Để trống nếu dùng mặc định của hệ thống)">
               <Input value={chatId} onChange={setChatId} placeholder="VD: @BQL_Iso_Vinasoy hoặc 123456789"/>
             </Field>
             <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 10 }}>
               <Btn v="ghost" sz="md" onClick={() => setPushModal({ open: false, taskInfo: null })}>Hủy</Btn>
               <Btn v="blue" sz="md" onClick={pushToSystem}>🚀 Tạo Job & Đẩy Telegram</Btn>
             </div>
           </div>
        )}
      </Modal>

    </div>
  );
}
