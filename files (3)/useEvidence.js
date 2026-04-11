/**
 * useEvidence — Custom hook quản lý toàn bộ evidence cho Onsite Audit
 *
 * Features:
 *  ✅ Upload files (pdf, doc, docx, xlsx, csv, png, jpg…)
 *  ✅ Upload base64 image (từ camera laptop)
 *  ✅ Camera capture với preview trước khi lưu
 *  ✅ QR code + Socket.IO sync từ điện thoại
 *  ✅ Filter evidence theo stepKey (clause / risk / process / equipment)
 *  ✅ Delete evidence
 *  ✅ Real-time peer count
 */
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { io } from "socket.io-client";

const ACCEPTED_FILES = ".pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.ppt,.pptx,.jpg,.jpeg,.png,.gif,.webp";

/**
 * @param {string} apiUrl   - Base URL của backend (vd: "http://localhost:5002")
 * @param {string} surveyId - MongoDB _id của phiên khảo sát
 * @param {function} onToast - callback(type, msg)
 */
export function useEvidence(apiUrl, surveyId, onToast) {
  const ab = (apiUrl || "").replace(/\/$/, "");

  // ── State ────────────────────────────────────────────────────
  const [evidence,    setEvidence   ] = useState([]);
  const [loading,     setLoading    ] = useState(false);
  const [uploading,   setUploading  ] = useState(false);
  const [sockStatus,  setSockStatus ] = useState("idle");
  const [peerCount,   setPeerCount  ] = useState(0);
  const [localIp,     setLocalIp    ] = useState("");

  // Camera state
  const [cameraOpen,  setCameraOpen ] = useState(false);
  const [capturedImg, setCapturedImg] = useState(null);

  // QR modal state
  const [qrOpen,      setQrOpen     ] = useState(false);
  const [activeStep,  setActiveStep ] = useState(""); // stepKey đang mở evidence

  // ── Refs ─────────────────────────────────────────────────────
  const videoRef  = useRef(null);
  const streamRef = useRef(null);
  const socketRef = useRef(null);

  const toast = useCallback((t, m) => onToast?.(t, m), [onToast]);

  // ── Fetch local IP ──────────────────────────────────────────
  useEffect(() => {
    if (!ab) return;
    fetch(`${ab}/api/local-ip`)
      .then(r => r.json())
      .then(d => { if (d?.localIp) setLocalIp(d.localIp); })
      .catch(() => {});
  }, [ab]);

  // ── Socket.IO ────────────────────────────────────────────────
  useEffect(() => {
    if (!surveyId || !ab) return;
    setSockStatus("connecting");

    const sock = io(ab, {
      transports:           ["websocket", "polling"],
      timeout:              10000,
      reconnectionAttempts: 8,
      reconnectionDelay:    2000,
    });
    socketRef.current = sock;

    sock.on("connect", () => {
      sock.emit("join:survey", surveyId);
      setSockStatus("connected");
    });
    sock.on("joined:survey", d => setPeerCount(d.clients || 1));
    sock.on("peer:joined",   d => {
      setPeerCount(d.clients || 1);
      toast("info", "📱 Điện thoại đã kết nối vào phiên!");
    });
    sock.on("evidence:added",   () => { fetchEvidence(); toast("success", "📷 Ảnh mới từ điện thoại đã lưu!"); });
    sock.on("evidence:deleted", () => fetchEvidence());
    sock.on("disconnect",       () => { setSockStatus("idle"); setPeerCount(0); });
    sock.on("connect_error",    () => setSockStatus("error"));

    return () => {
      sock.emit("leave:survey", surveyId);
      sock.disconnect();
      socketRef.current = null;
      setSockStatus("idle");
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [surveyId, ab]);

  // ── Fetch evidence list ──────────────────────────────────────
  const fetchEvidence = useCallback(async (stepKey = "") => {
    if (!surveyId || !ab) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: 500 });
      if (stepKey) params.set("stepKey", stepKey);
      const res = await fetch(`${ab}/api/surveys/${surveyId}/evidence?${params}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setEvidence(await res.json());
    } catch (e) {
      toast("error", `Tải evidence thất bại: ${e.message}`);
    } finally {
      setLoading(false);
    }
  }, [surveyId, ab, toast]);

  useEffect(() => { fetchEvidence(); }, [fetchEvidence]);

  // ── Upload files (multipart) ─────────────────────────────────
  const uploadFiles = useCallback(async (files, stepKey = "", clauseId = "", note = "") => {
    if (!files?.length || !surveyId) return;
    setUploading(true);
    for (const file of Array.from(files)) {
      const form = new FormData();
      form.append("file", file);
      if (stepKey)  form.append("stepKey",  stepKey);
      if (clauseId) form.append("clauseId", clauseId);
      if (note)     form.append("note",     note);
      try {
        const res = await fetch(`${ab}/api/surveys/${surveyId}/evidence`, {
          method: "POST", body: form,
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || `HTTP ${res.status}`);
        }
        toast("success", `✓ ${file.name}`);
      } catch (e) {
        toast("error", `Upload lỗi: ${e.message}`);
      }
    }
    setUploading(false);
    fetchEvidence();
  }, [surveyId, ab, toast, fetchEvidence]);

  // ── Upload base64 ────────────────────────────────────────────
  const uploadBase64 = useCallback(async (base64, stepKey = "", clauseId = "", note = "", source = "camera") => {
    if (!base64 || !surveyId) return;
    try {
      const res = await fetch(`${ab}/api/surveys/${surveyId}/evidence/base64`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: base64, stepKey, clauseId, note, source }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || `HTTP ${res.status}`);
      toast("success", "✓ Đã lưu ảnh.");
      fetchEvidence();
    } catch (e) {
      toast("error", `Lưu ảnh lỗi: ${e.message}`);
    }
  }, [surveyId, ab, toast, fetchEvidence]);

  // ── Delete ────────────────────────────────────────────────────
  const deleteEvidence = useCallback(async (id) => {
    if (!surveyId || !confirm("Xóa bằng chứng này?")) return;
    try {
      const res = await fetch(`${ab}/api/surveys/${surveyId}/evidence/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      toast("success", "Đã xóa.");
      fetchEvidence();
    } catch (e) {
      toast("error", e.message);
    }
  }, [surveyId, ab, toast, fetchEvidence]);

  // ── Camera open ──────────────────────────────────────────────
  const openCamera = useCallback((stepKey = "") => {
    setActiveStep(stepKey);
    setCapturedImg(null);
    setCameraOpen(true);
  }, []);

  // ── Camera stream management ─────────────────────────────────
  useEffect(() => {
    if (!cameraOpen) return;
    let mounted = true;
    (async () => {
      for (const c of [
        { video: { facingMode: { ideal: "environment" }, width: { ideal: 1920 } } },
        { video: true },
      ]) {
        try {
          const s = await navigator.mediaDevices.getUserMedia(c);
          if (!mounted) { s.getTracks().forEach(t => t.stop()); return; }
          streamRef.current = s;
          if (videoRef.current) videoRef.current.srcObject = s;
          return;
        } catch (_) {}
      }
      if (mounted) { toast("error", "Không truy cập được camera."); setCameraOpen(false); }
    })();
    return () => {
      mounted = false;
      streamRef.current?.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    };
  }, [cameraOpen, toast]);

  // ── Take photo ────────────────────────────────────────────────
  const takePhoto = useCallback(() => {
    const v = videoRef.current;
    if (!v?.videoWidth) { toast("error", "Camera chưa sẵn sàng."); return; }
    const c = document.createElement("canvas");
    c.width = v.videoWidth; c.height = v.videoHeight;
    c.getContext("2d").drawImage(v, 0, 0);
    setCapturedImg(c.toDataURL("image/jpeg", 0.92));
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
  }, [toast]);

  // ── Retake ────────────────────────────────────────────────────
  const retakePhoto = useCallback(async () => {
    setCapturedImg(null);
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" } } });
      streamRef.current = s;
      if (videoRef.current) videoRef.current.srcObject = s;
    } catch (_) {
      try {
        const s = await navigator.mediaDevices.getUserMedia({ video: true });
        streamRef.current = s;
        if (videoRef.current) videoRef.current.srcObject = s;
      } catch (e) { toast("error", `Camera: ${e.message}`); }
    }
  }, [toast]);

  // ── Close camera ─────────────────────────────────────────────
  const closeCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    setCameraOpen(false);
    setCapturedImg(null);
  }, []);

  // ── QR URL (useMemo) ─────────────────────────────────────────
  const qrUrl = useMemo(() => {
    if (!surveyId || !localIp) return "";
    let port = "5002";
    try { if (ab) port = new URL(ab).port || port; } catch (_) {}
    const origin = `http://${localIp}:${port}`;
    const clausePart = activeStep ? `/${encodeURIComponent(activeStep)}` : "";
    const qs = new URLSearchParams({ surveyId, socketPort: port, apiBase: ab || origin, clauseId: activeStep });
    return `${origin}/mobile-capture/${encodeURIComponent(surveyId)}/${port}${clausePart}?${qs}`;
  }, [surveyId, localIp, ab, activeStep]);

  const openQR = useCallback((stepKey = "") => {
    setActiveStep(stepKey);
    setQrOpen(true);
  }, []);

  // ── Get evidence filtered by stepKey ─────────────────────────
  const getByStep = useCallback((stepKey) =>
    evidence.filter(e => e.stepKey === stepKey || e.clauseId === stepKey),
    [evidence]);

  const getByClause = useCallback((clauseId) =>
    evidence.filter(e => e.clauseId === clauseId || e.stepKey === clauseId),
    [evidence]);

  return {
    // data
    evidence, loading, uploading, sockStatus, peerCount, localIp,
    // camera
    cameraOpen, capturedImg, videoRef,
    // qr
    qrOpen, setQrOpen, qrUrl, activeStep, setActiveStep,
    // actions
    fetchEvidence, uploadFiles, uploadBase64, deleteEvidence,
    openCamera, takePhoto, retakePhoto, closeCamera,
    openQR,
    // helpers
    getByStep, getByClause,
    // utils
    ACCEPTED_FILES,
    viewUrl:     (id) => `${ab}/api/surveys/${surveyId}/evidence/${id}`,
    downloadUrl: (id) => `${ab}/api/surveys/${surveyId}/evidence/${id}?download=1`,
  };
}
