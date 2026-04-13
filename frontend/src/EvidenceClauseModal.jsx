/**
 * Modal bằng chứng gắn với một điều khoản (4.1.1, 4.2.1, ...) — dùng trong StepClauses
 */
import { useState, useCallback, useEffect, useRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import { C, FONT, SPACE, RADIUS } from "./gap.ui.constants.js";
import { Modal, Btn, Field } from "./gap.atoms.jsx";

const base = (url) => (url ? url.replace(/\/$/, "") : "");

export default function EvidenceClauseModal({ open, onClose, onEvidenceChange, surveyId, clauseId, clauseTitle, apiUrl, setToast, ensureSurveyId }) {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  /** surveyId đã resolve khi mở QR (tránh prop surveyId cập nhật trễ sau ensureSurveyId) */
  const [qrResolvedSurveyId, setQrResolvedSurveyId] = useState(null);
  const [mobileHostOverride, setMobileHostOverride] = useState("");
  const [mobileHostFetched, setMobileHostFetched] = useState(false);
  const qrSurveyIdRef = useRef(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const apiBase = base(apiUrl) || "";
  const isLocalhost = typeof window !== "undefined" && /^(localhost|127\.0\.0\.1)$/.test(window.location?.hostname || "");

  const fetchList = useCallback(async () => {
    if (!surveyId) return;
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (clauseId) params.set("clauseId", clauseId);
      const res = await fetch(`${apiBase}/api/surveys/${surveyId}/evidence?${params}`);
      if (res.ok) setList(await res.json());
    } catch (e) {
      setToast?.({ type: "error", msg: "Không tải được danh sách bằng chứng." });
    } finally {
      setLoading(false);
    }
  }, [surveyId, clauseId, apiBase, setToast]);

  useEffect(() => {
    if (open && surveyId) fetchList();
  }, [open, surveyId, fetchList]);

  useEffect(() => {
    if (!qrOpen || !isLocalhost || mobileHostFetched) return;
    const backendOrigin = apiBase || `${window.location?.protocol || "http:"}//${window.location?.hostname || "localhost"}:5002`;
    fetch(`${backendOrigin}/api/local-ip`)
      .then((r) => r.json())
      .then((d) => {
        if (d?.localIp) setMobileHostOverride(d.localIp);
        setMobileHostFetched(true);
      })
      .catch(() => setMobileHostFetched(true));
  }, [qrOpen, isLocalhost, mobileHostFetched, apiBase]);

  const handleFileUpload = useCallback(
    async (e) => {
      let id = surveyId;
      if (!id && ensureSurveyId) {
        try {
          id = await ensureSurveyId();
        } catch {
          return;
        }
      }
      if (!id) return;
      const files = e.target?.files;
      if (!files?.length) return;
      setUploading(true);
      const note = (document.querySelector("[data-evidence-note-modal]")?.value || "").trim();
      for (let i = 0; i < files.length; i++) {
        const form = new FormData();
        form.append("file", files[i]);
        if (clauseId) form.append("clauseId", clauseId);
        if (note) form.append("note", note);
        try {
          const res = await fetch(`${apiBase}/api/surveys/${id}/evidence`, { method: "POST", body: form });
          if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || res.status);
          setToast?.({ type: "success", msg: `Đã tải lên: ${files[i].name}` });
        } catch (err) {
          setToast?.({ type: "error", msg: `Lỗi: ${err.message}` });
        }
      }
      setUploading(false);
      e.target.value = "";
      fetchList();
      onEvidenceChange?.();
    },
    [surveyId, clauseId, apiBase, setToast, fetchList, onEvidenceChange]
  );

  const capturePhoto = useCallback(async () => {
    if (!videoRef.current) return;
    let id = surveyId;
    if (!id && ensureSurveyId) {
      try {
        id = await ensureSurveyId();
      } catch {
        return;
      }
    }
    if (!id) return;
    const video = videoRef.current;
    // Đợi camera sẵn sàng nếu chưa có kích thước khung hình
    if (!video.videoWidth || !video.videoHeight) {
      await new Promise((resolve) => {
        const handler = () => {
          video.removeEventListener("loadedmetadata", handler);
          resolve();
        };
        video.addEventListener("loadedmetadata", handler);
        setTimeout(() => {
          video.removeEventListener("loadedmetadata", handler);
          resolve();
        }, 1000);
      });
    }
    const width = video.videoWidth || 1280;
    const height = video.videoHeight || 720;
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    canvas.getContext("2d").drawImage(video, 0, 0, width, height);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
    setCameraOpen(false);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    try {
      const res = await fetch(`${apiBase}/api/surveys/${id}/evidence/base64`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: dataUrl,
          clauseId: clauseId || "",
          source: "camera",
          note: (document.querySelector("[data-evidence-note-modal]")?.value || "").trim(),
        }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || res.status);
      setToast?.({ type: "success", msg: "Đã lưu ảnh từ camera." });
      fetchList();
      onEvidenceChange?.();
    } catch (e) {
      setToast?.({ type: "error", msg: `Lỗi: ${e.message}` });
    }
  }, [surveyId, clauseId, apiBase, setToast, fetchList, onEvidenceChange]);

  useEffect(() => {
    if (!cameraOpen) return;
    let stream;
    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
      } catch (e) {
        setToast?.({ type: "error", msg: "Không truy cập được camera." });
      }
    })();
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    };
  }, [cameraOpen, setToast]);

  const deleteEvidence = useCallback(
    async (id) => {
      if (!confirm("Xóa bằng chứng này?")) return;
      try {
        const res = await fetch(`${apiBase}/api/surveys/${surveyId}/evidence/${id}`, { method: "DELETE" });
        if (!res.ok) throw new Error(res.status);
        setToast?.({ type: "success", msg: "Đã xóa bằng chứng." });
        fetchList();
        onEvidenceChange?.();
      } catch (e) {
        setToast?.({ type: "error", msg: `Lỗi: ${e.message}` });
      }
    },
    [surveyId, apiBase, setToast, fetchList, onEvidenceChange]
  );

  const viewUrl = (id) => {
    const t = localStorage.getItem("token");
    return `${apiBase}/api/surveys/${surveyId}/evidence/${id}${t ? `?token=${t}` : ""}`;
  };
  /** URL cho QR: ưu tiên ref (gán ngay khi mở modal), rồi state, rồi prop. Trỏ trực tiếp tới frontend. */
  const mobileCaptureUrl = () => {
    const sid = (qrSurveyIdRef.current != null && String(qrSurveyIdRef.current).trim())
      ? qrSurveyIdRef.current
      : (qrResolvedSurveyId != null ? qrResolvedSurveyId : surveyId);
    const sidStr = sid != null ? String(sid).trim() : "";
    if (!sidStr) return "";
    const host = mobileHostOverride.trim() || window.location.hostname;
    const port = window.location.port || "3000";
    const origin = `${window.location.protocol}//${host}${port === "80" || port === "443" ? "" : ":" + port}`;
    let apiOrigin = apiBase || `${window.location.protocol}//${window.location.hostname}:5002`;
    let socketPort = "5002";
    try {
      const u = new URL(apiOrigin);
      socketPort = u.port || (u.protocol === "https:" ? "443" : "80");
    } catch (_) {}
    const q = new URLSearchParams({ surveyId: sidStr, socketPort });
    if (clauseId) q.set("clauseId", clauseId);
    const qs = q.toString();
    let path = `/mobile-capture/${encodeURIComponent(sidStr)}/${encodeURIComponent(socketPort)}`;
    if (clauseId) path += `/${encodeURIComponent(clauseId)}`;
    return `${origin}${path}?${qs}#${qs}`;
  };

  if (!open) return null;

  return (
    <>
      <Modal open={open} onClose={onClose} title={`Bằng chứng — ${clauseId || "Điều khoản"} ${clauseTitle ? ": " + clauseTitle.slice(0, 40) + "…" : ""}`} width={560}>
        <Field label="Ghi chú (tùy chọn)">
          <input data-evidence-note-modal type="text" placeholder="Mô tả ngắn bằng chứng" style={{ minHeight: 40, padding: "8px 12px", background: C.bg3, border: `1px solid ${C.bd0}`, borderRadius: RADIUS.md, color: C.t0, fontSize: FONT.body, width: "100%" }} />
        </Field>
        <div style={{ display: "flex", flexWrap: "wrap", gap: SPACE.sm, marginBottom: SPACE.lg }}>
          <label style={{ cursor: "pointer", display: "inline-block" }}>
            <input type="file" multiple accept=".doc,.docx,.pdf,.xls,.xlsx,.csv,.jpg,.jpeg,.png,.gif,.webp" onChange={handleFileUpload} style={{ display: "none" }} disabled={uploading} />
            <span style={{ display: "inline-block", padding: "6px 12px", borderRadius: RADIUS.md, minHeight: 32, background: "linear-gradient(135deg,#2563eb,#60a5fa)", color: "#fff", fontWeight: 600, fontSize: 14 }}>{uploading ? "Đang tải…" : "📤 Upload file"}</span>
          </label>
          <Btn v="primary" sz="sm" onClick={() => setCameraOpen(true)}>📷 Chụp camera</Btn>
          <Btn
            v="ghost"
            sz="sm"
            onClick={async () => {
              // Đảm bảo luôn có surveyId HỢP LỆ trước khi mở QR.
              // Lưu id vào state local để URL QR dùng ngay (prop surveyId cập nhật trễ sau setState parent).
              let id = surveyId;
              if (!id && ensureSurveyId) {
                try {
                  id = await ensureSurveyId();
                } catch {
                  return;
                }
              }
              if (!id) return;
              const idStr = String(id).trim();
              qrSurveyIdRef.current = idStr;
              setQrResolvedSurveyId(idStr);
              setQrOpen(true);
            }}
          >
            📱 Chụp từ điện thoại
          </Btn>
        </div>
        <div style={{ fontSize: FONT.label, color: C.t2, marginBottom: SPACE.sm }}>Đã có {list.length} bằng chứng</div>
        {loading ? (
          <p style={{ color: C.t2 }}>Đang tải…</p>
        ) : list.length > 0 ? (
          <ul style={{ listStyle: "none", padding: 0, margin: 0, maxHeight: 200, overflowY: "auto" }}>
            {list.map((item) => (
              <li key={item._id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", borderBottom: `1px solid ${C.bd1}` }}>
                <span style={{ flex: 1, fontSize: FONT.body, color: C.t0 }}>{item.originalName || item.filename}</span>
                <a href={viewUrl(item._id)} target="_blank" rel="noopener noreferrer" style={{ color: C.blueL, fontSize: 14 }}>Xem</a>
                <button type="button" onClick={() => deleteEvidence(item._id)} style={{ background: "none", border: "none", color: C.red, cursor: "pointer", fontSize: 14 }}>Xóa</button>
              </li>
            ))}
          </ul>
        ) : (
          <p style={{ color: C.t2, fontSize: FONT.body }}>Chưa có bằng chứng cho điều khoản này.</p>
        )}
      </Modal>

      <Modal open={cameraOpen} onClose={() => setCameraOpen(false)} title="Chụp ảnh từ camera" width={520}>
        <video ref={videoRef} autoPlay playsInline muted style={{ width: "100%", maxHeight: 300, background: C.bg3, borderRadius: RADIUS.md }} />
        <div style={{ marginTop: SPACE.lg, display: "flex", gap: SPACE.md }}>
          <Btn v="primary" sz="md" onClick={capturePhoto}>Chụp ảnh</Btn>
          <Btn v="ghost" sz="md" onClick={() => setCameraOpen(false)}>Hủy</Btn>
        </div>
      </Modal>

      <Modal open={qrOpen} onClose={() => { setQrOpen(false); setQrResolvedSurveyId(null); setMobileHostFetched(false); qrSurveyIdRef.current = null; }} title="Chụp từ điện thoại (quét QR)" width={420}>
        <p style={{ color: C.t2, marginBottom: SPACE.sm, fontSize: FONT.body }}>Quét QR bằng điện thoại để mở trang chụp ảnh. Ảnh sẽ gắn với điều khoản {clauseId || "—"}.</p>
        {isLocalhost && (
          <p style={{ color: C.amber, marginBottom: SPACE.md, fontSize: 15, padding: "8px 12px", background: "rgba(245,158,11,0.15)", borderRadius: RADIUS.sm }}>Đang chạy trên localhost — nhập <strong>IP máy tính</strong> (vd: 192.168.1.100) để điện thoại mở được. Đã tự điền nếu có.</p>
        )}
        <Field label="IP máy tính (bắt buộc khi quét bằng điện thoại)">
          <input value={mobileHostOverride} onChange={(e) => setMobileHostOverride(e.target.value)} placeholder="192.168.1.x" style={{ minHeight: 40, padding: "8px 12px", background: C.bg3, border: `1px solid ${C.bd0}`, borderRadius: RADIUS.md, color: C.t0, fontSize: FONT.body, width: "100%" }} />
        </Field>
        <div style={{ marginTop: SPACE.xl, marginBottom: SPACE.xl, display: "flex", justifyContent: "center", padding: 16, background: "#fff", borderRadius: RADIUS.lg }}>
          {mobileCaptureUrl() ? <QRCodeSVG value={mobileCaptureUrl()} size={200} level="M" /> : <span style={{ color: C.t2, fontSize: 15 }}>Đang tải…</span>}
        </div>
      </Modal>
    </>
  );
}
