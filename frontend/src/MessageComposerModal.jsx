import React, { useState, useEffect } from "react";
import { C, RADIUS, FONT, SPACE } from "./gap.ui.constants.js";
import { Btn, Input, Modal, Field } from "./gap.atoms.jsx";

export default function MessageComposerModal({ isOpen, onClose, targetItem, type, apiUrl }) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    prefix: "",
    note: "",
    chatIds: []
  });

  useEffect(() => {
    if (isOpen) {
      if (type === "survey") {
        setForm({ prefix: "📋 CẬP NHẬT PHIÊN GAP: " + (targetItem?.client?.name || ""), note: "", chatIds: [] });
      } else if (type === "job") {
        setForm({ prefix: "📅 NHIỆM VỤ MỚI: " + (targetItem?.title || ""), note: "", chatIds: targetItem?.telegram_targets || [] });
      }
    }
  }, [isOpen, targetItem, type]);

  const handleSend = async () => {
    setLoading(true);
    try {
      const endpoint = type === "survey" 
        ? `${apiUrl}/api/notifications/send-survey/${targetItem._id}`
        : `${apiUrl}/api/notifications/send-job/${targetItem._id}`; // NEED TO CREATE send-job in backend
        
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Gửi thất bại");
      alert("✅ Đã gửi Telegram thành công!");
      onClose();
    } catch (e) {
      alert("❌ Lỗi: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal open={isOpen} onClose={onClose} title="✉️ Gửi thông báo Telegram (Tuỳ chỉnh)" width={500}>
      <Field label="Tiêu đề thông báo (Tuỳ chọn)">
        <Input value={form.prefix} onChange={v => setForm({ ...form, prefix: v })} placeholder="Nhập tiêu đề custom..." />
      </Field>
      <Field label="Ghi chú thêm (Tuỳ chọn)">
        <textarea 
          value={form.note} 
          onChange={e => setForm({ ...form, note: e.target.value })} 
          placeholder="Nhập lời nhắn gửi đến Telegram..."
          style={{ width: "100%", padding: "10px 14px", border: `1px solid ${C.bd0}`, borderRadius: RADIUS.md, fontSize: FONT.body, minHeight: 100, background: C.bg3, color: C.t0, resize: "vertical" }}
        />
      </Field>
      <div style={{ padding: "10px", background: C.blueL+"15", color: C.blueL, borderRadius: RADIUS.md, fontSize: FONT.caption, marginBottom: SPACE.lg }}>
        💡 Hệ thống sẽ tự động tổng hợp dữ liệu {type === "survey" ? "từ Kế hoạch đánh giá và báo cáo GAP" : "từ lịch làm việc của công việc này"} rồi nối vào sau lời nhắc của bạn.
      </div>
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
        <Btn v="ghost" sz="md" onClick={onClose} disabled={loading}>Hủy</Btn>
        <Btn v="primary" sz="md" onClick={handleSend} disabled={loading}>{loading ? "Đang gửi..." : "✈️ Gửi Đi"}</Btn>
      </div>
    </Modal>
  );
}
