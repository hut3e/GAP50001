/**
 * StepEvidence — Bằng chứng khảo sát GAP ISO 50001:2018
 *
 * Từ bản tối ưu trong `files (3)/StepEvidence.final.jsx`:
 *  - Socket.IO join/leave theo room surveyId, hiển thị số thiết bị online
 *  - QR URL ổn định, truyền surveyId + socketPort + clauseId/apiBase cho mobile
 *  - Mobile capture dùng Socket.IO + HTTP fallback nên ảnh luôn lưu về đúng phiên
 */
import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { io } from "socket.io-client";
import { QRCodeSVG } from "qrcode.react";
import { C, FONT, SPACE, RADIUS, GAP_CHECKLIST as DEFAULT_CHECKLIST } from "./gap.ui.constants.js";
import { Card, Btn, Input, Field, Grid, Tag, Modal } from "./gap.atoms.jsx";

const apiBase = (url) => (url || "").replace(/\/$/, "");
const makeSocketUrl = (apiUrl) => {
  const explicit = apiBase(apiUrl);
  if (explicit) return explicit;
  const { protocol, hostname, port } = window.location;
  if (port === "3000" || port === "5173") return `${protocol}//${hostname}:5002`;
  return window.location.origin;
};

const TYPE_OPTIONS = [
  ["", "Tất cả loại"],
  ["document", "📄 Tài liệu"],
  ["image", "🖼 Ảnh"],
];

const SOURCE_OPTIONS = [
  ["", "Tất cả nguồn"],
  ["upload", "📤 Upload"],
  ["camera", "📷 Camera laptop"],
  ["mobile", "📱 Điện thoại"],
];

const SEL_STYLE = {
  minHeight: 38,
  padding: "6px 12px",
  background: C.bg3,
  border: `1px solid ${C.bd0}`,
  borderRadius: RADIUS.md,
  color: C.t0,
  fontSize: FONT.body,
};

export default function StepEvidence({ survey, surveyId, apiUrl, setToast, ensureSurveyId, checklist: checklistProp }) {
  const GAP_CHECKLIST = checklistProp || DEFAULT_CHECKLIST;
  const CLAUSE_OPTIONS = [...new Set(GAP_CHECKLIST.map((c) => c.clause))].sort().map((cl) => [cl, `§${cl}`]);
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [filters, setFilters] = useState({ clauseId: "", type: "", source: "", q: "" });

  const [cameraOpen, setCameraOpen] = useState(false);
  const [capturedImg, setCapturedImg] = useState(null);

  const [mobileQROpen, setMobileQROpen] = useState(false);
  const [mobileHost, setMobileHost] = useState("");
  const [hostFetched, setHostFetched] = useState(false);

  const [sockStatus, setSockStatus] = useState("idle"); // idle|connecting|connected|error
  const [roomPeers, setRoomPeers] = useState(0);

  const [clauseId, setClauseId] = useState("");
  const [noteVal, setNoteVal] = useState("");

  const [editItem, setEditItem] = useState(null);
  const [editForm, setEditForm] = useState({ clauseId: "", note: "" });
  const [editFile, setEditFile] = useState(null);

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const socketRef = useRef(null);
  const resolvedIdRef = useRef(null);
  const prevCountRef = useRef(0);
  const pollTimerRef = useRef(null);

  const ab = apiBase(apiUrl);
  const sid = surveyId || resolvedIdRef.current;

  const toast = useCallback(
    (type, msg) => setToast?.({ type, msg }),
    [setToast]
  );

  const getOrCreate = useCallback(async () => {
    if (sid) return sid;
    if (!ensureSurveyId) throw new Error("Chưa tạo phiên — điền thông tin ở Bước 1.");
    const id = await ensureSurveyId();
    if (!id) throw new Error("Tạo phiên thất bại.");
    resolvedIdRef.current = id;
    return id;
  }, [sid, ensureSurveyId]);

  const fetchList = useCallback(async () => {
    if (!sid) return;
    setLoading(true);
    try {
      const p = new URLSearchParams();
      if (filters.clauseId) p.set("clauseId", filters.clauseId);
      if (filters.type) p.set("type", filters.type);
      if (filters.source) p.set("source", filters.source);
      if (filters.q) p.set("q", filters.q);
      // yêu cầu tối đa 1000 bản ghi để lần đăng nhập nào cũng thấy gần như đầy đủ lịch sử
      p.set("limit", "1000");
      const res = await fetch(`${ab}/api/surveys/${sid}/evidence?${p}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      // So sánh số lượng để biết có bằng chứng mới (kể cả khi chỉ có HTTP fallback, không có Socket.IO)
      const prev = prevCountRef.current || 0;
      setList(data);
      if (data.length > prev) {
        const diff = data.length - prev;
        toast("success", `✓ Đã nhận ${diff} bằng chứng mới.`);
      }
      prevCountRef.current = data.length;
    } catch (e) {
      toast("error", `Không tải được danh sách: ${e.message}`);
    } finally {
      setLoading(false);
    }
  }, [sid, ab, filters, toast]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  useEffect(() => {
    if (!sid) return;
    setSockStatus("connecting");
    let socket;
    try {
      socket = io(makeSocketUrl(apiUrl), {
        transports: ["websocket", "polling"],
        timeout: 10000,
        reconnectionAttempts: 10,
        reconnectionDelay: 2000,
      });
      socketRef.current = socket;

      socket.on("connect", () => {
        socket.emit("join:survey", sid);
        setSockStatus("connected");
        // Bảo đảm ít nhất đếm được chính desktop khi vừa kết nối
        setRoomPeers((prev) => (prev && prev > 0 ? prev : 1));
      });
      socket.on("joined:survey", (d) => setRoomPeers(d.clients || 1));
      socket.on("peer:joined", (d) => {
        setRoomPeers(d.clients || 1);
        toast("info", "📱 Điện thoại đã kết nối vào phòng!");
      });
      socket.on("evidence:added", () => {
        fetchList();
        toast("success", "📷 Ảnh mới từ điện thoại đã được lưu!");
      });
      socket.on("evidence:deleted", () => fetchList());
      socket.on("disconnect", () => setSockStatus("idle"));
      socket.on("connect_error", () => setSockStatus("error"));
    } catch (_) {
      setSockStatus("error");
    }

    return () => {
      if (socket) {
        socket.emit("leave:survey", sid);
        socket.disconnect();
      }
      socketRef.current = null;
      setSockStatus("idle");
    };
  }, [sid, apiUrl, fetchList, toast]);

  // Polling fallback: nếu Socket.IO không connected, cứ 8s tự fetch lại danh sách
  useEffect(() => {
    if (sockStatus !== "connected" && sid) {
      if (!pollTimerRef.current) {
        pollTimerRef.current = setInterval(() => {
          fetchList();
        }, 8000);
      }
    } else if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
    return () => {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
      }
    };
  }, [sockStatus, sid, fetchList]);

  const handleFileUpload = useCallback(
    async (e) => {
      const files = e.target?.files;
      if (!files?.length) return;
      let id;
      try {
        id = await getOrCreate();
      } catch (err) {
        toast("error", err.message);
        return;
      }
      setUploading(true);
      for (let i = 0; i < files.length; i += 1) {
        const form = new FormData();
        form.append("file", files[i]);
        if (clauseId) form.append("clauseId", clauseId);
        if (noteVal) form.append("note", noteVal);
        try {
          const res = await fetch(`${ab}/api/surveys/${id}/evidence`, { method: "POST", body: form });
          if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.error || `HTTP ${res.status}`);
          }
          toast("success", `✓ Đã tải lên: ${files[i].name}`);
        } catch (err) {
          toast("error", `Lỗi upload: ${err.message}`);
        }
      }
      setUploading(false);
      e.target.value = "";
      fetchList();
    },
    [getOrCreate, ab, clauseId, noteVal, toast, fetchList]
  );

  const openCamera = useCallback(async () => {
    try {
      await getOrCreate();
    } catch (err) {
      toast("error", err.message);
      return;
    }
    setCapturedImg(null);
    setCameraOpen(true);
  }, [getOrCreate, toast]);

  useEffect(() => {
    if (!cameraOpen) return;
    let mounted = true;

    const startStream = async () => {
      for (const constraints of [
        { video: { facingMode: { ideal: "environment" }, width: { ideal: 1920 } } },
        { video: true },
      ]) {
        try {
          const s = await navigator.mediaDevices.getUserMedia(constraints);
          if (!mounted) {
            s.getTracks().forEach((t) => t.stop());
            return;
          }
          streamRef.current = s;
          if (videoRef.current) videoRef.current.srcObject = s;
          return;
        } catch (_) {
          // try next
        }
      }
      if (mounted) {
        toast("error", "Không truy cập được camera. Kiểm tra quyền trình duyệt.");
        setCameraOpen(false);
      }
    };

    startStream();
    return () => {
      mounted = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    };
  }, [cameraOpen, toast]);

  const takePhoto = useCallback(() => {
    const video = videoRef.current;
    if (!video?.videoWidth) {
      toast("error", "Camera chưa sẵn sàng, thử lại.");
      return;
    }
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0);
    setCapturedImg(canvas.toDataURL("image/jpeg", 0.92));
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }, [toast]);

  const confirmPhoto = useCallback(
    async () => {
      if (!capturedImg) return;
      let id;
      try {
        id = await getOrCreate();
      } catch (err) {
        toast("error", err.message);
        return;
      }
      try {
        const res = await fetch(`${ab}/api/surveys/${id}/evidence/base64`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            imageBase64: capturedImg,
            source: "camera",
            clauseId: clauseId || undefined,
            note: noteVal || undefined,
          }),
        });
        if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || `HTTP ${res.status}`);
        toast("success", "✓ Đã lưu ảnh từ camera.");
        setCapturedImg(null);
        setCameraOpen(false);
        fetchList();
      } catch (e) {
        toast("error", `Lỗi: ${e.message}`);
      }
    },
    [capturedImg, getOrCreate, ab, clauseId, noteVal, toast, fetchList]
  );

  const retakePhoto = useCallback(async () => {
    setCapturedImg(null);
    try {
      const s = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
      });
      streamRef.current = s;
      if (videoRef.current) videoRef.current.srcObject = s;
    } catch (e) {
      toast("error", `Camera: ${e.message}`);
    }
  }, [toast]);

  const isLocalhost = typeof window !== "undefined" && /^(localhost|127\.0\.0\.1)$/.test(window.location.hostname);

  useEffect(() => {
    if (!mobileQROpen || hostFetched) return;
    const backendOrigin = ab || `${window.location.protocol}//${window.location.hostname}:5002`;
    fetch(`${backendOrigin}/api/local-ip`)
      .then((r) => r.json())
      .then((d) => {
        if (d?.localIp && d.localIp !== "127.0.0.1") setMobileHost(d.localIp);
      })
      .catch(() => {})
      .finally(() => setHostFetched(true));
  }, [mobileQROpen, hostFetched, ab]);

  const openMobileQR = useCallback(async () => {
    try {
      await getOrCreate();
    } catch (err) {
      toast("error", err.message);
      return;
    }
    setHostFetched(false);
    setMobileQROpen(true);
  }, [getOrCreate, toast]);

  const mobileCaptureUrl = useMemo(() => {
    const activeSid = sid || resolvedIdRef.current;
    if (!activeSid || !mobileQROpen) return "";

    const hostname = (mobileHost || "").trim() || window.location.hostname;
    const port = window.location.port;
    const origin = `${window.location.protocol}//${hostname}${port && port !== "80" && port !== "443" ? `:${port}` : ""}`;

    let socketPort = port || "5002";
    if (ab) {
      try {
        socketPort = new URL(ab).port || socketPort;
      } catch {
        // ignore
      }
    }

    const pathParts = ["/mobile-capture", encodeURIComponent(activeSid), encodeURIComponent(socketPort)];
    if (clauseId) pathParts.push(encodeURIComponent(clauseId));

    const qs = new URLSearchParams({
      surveyId: activeSid,
      socketPort,
      apiBase: ab || `${window.location.protocol}//${hostname}:${socketPort}`,
    });
    if (clauseId) qs.set("clauseId", clauseId);
    const qStr = qs.toString();
    return `${origin}${pathParts.join("/")}?${qStr}#${qStr}`;
  }, [sid, mobileQROpen, mobileHost, ab, clauseId]);

  const openEdit = useCallback((item) => {
    setEditItem(item);
    setEditForm({ clauseId: item.clauseId || "", note: item.note || "" });
    setEditFile(null);
  }, []);

  const saveEdit = useCallback(async () => {
    if (!editItem || !sid) return;
    setUploading(true);
    try {
      let body, headers;
      if (editFile) {
        body = new FormData();
        body.append("file", editFile);
        if (editForm.clauseId) body.append("clauseId", editForm.clauseId);
        if (editForm.note) body.append("note", editForm.note);
        headers = {};
      } else {
        body = JSON.stringify(editForm);
        headers = { "Content-Type": "application/json" };
      }

      const res = await fetch(`${ab}/api/surveys/${sid}/evidence/${editItem._id}`, {
        method: "PUT",
        headers,
        body,
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || `HTTP ${res.status}`);
      toast("success", "✓ Đã cập nhật.");
      setEditItem(null);
      setEditFile(null);
      fetchList();
    } catch (e) {
      toast("error", `Lỗi: ${e.message}`);
    } finally {
      setUploading(false);
    }
  }, [editItem, editForm, editFile, sid, ab, toast, fetchList]);

  const deleteEvidence = useCallback(
    async (id) => {
      if (!sid || !confirm("Xóa bằng chứng này?")) return;
      try {
        const res = await fetch(`${ab}/api/surveys/${sid}/evidence/${id}`, { method: "DELETE" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        toast("success", "✓ Đã xóa.");
        fetchList();
      } catch (e) {
        toast("error", `Lỗi: ${e.message}`);
      }
    },
    [sid, ab, toast, fetchList]
  );

  const viewUrl = (id) => {
    const t = localStorage.getItem("token");
    return `${ab}/api/surveys/${sid}/evidence/${id}${t ? `?token=${t}` : ""}`;
  };
  const downloadUrl = (id) => {
    const t = localStorage.getItem("token");
    return `${ab}/api/surveys/${sid}/evidence/${id}?download=1${t ? `&token=${t}` : ""}`;
  };

  const sockBadge = {
    idle: { color: C.t3, dot: "○", label: "Socket.IO chưa kết nối (dùng polling)" },
    connecting: { color: C.amberL, dot: "◌", label: "Đang kết nối Socket.IO…" },
    connected: { color: C.tealL, dot: "●", label: `Socket.IO online · ${roomPeers} thiết bị` },
    error: { color: C.redL, dot: "✗", label: "Socket.IO lỗi · Đang dùng HTTP + polling" },
  }[sockStatus] || { color: C.t3, dot: "○", label: "Socket.IO…" };

  return (
    <>
      <Card title="Upload bằng chứng hiện trường" icon="📁" accent={C.blue}>
        <p style={{ color: C.t2, marginBottom: SPACE.lg, fontSize: FONT.body, lineHeight: 1.6 }}>
          Chọn <strong>điều khoản</strong> trước khi upload — bằng chứng sẽ gắn đúng với điều khoản đánh giá ISO 50001:2018.
        </p>

        <Grid cols={1} gap={SPACE.lg}>
          <Field label="§ Điều khoản ISO 50001:2018 gắn với bằng chứng">
            <select
              value={clauseId}
              onChange={(e) => setClauseId(e.target.value)}
              style={{ ...SEL_STYLE, width: "100%", maxWidth: 360 }}
            >
              <option value="">— Chọn điều khoản —</option>
              {CLAUSE_OPTIONS.map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Ghi chú bằng chứng (tùy chọn)">
            <Input value={noteVal} onChange={setNoteVal} placeholder="Mô tả ngắn về bằng chứng…" />
          </Field>

          <div style={{ display: "flex", flexWrap: "wrap", gap: SPACE.md, alignItems: "center" }}>
            <label style={{ cursor: uploading ? "not-allowed" : "pointer" }}>
              <input
                type="file"
                multiple
                accept=".doc,.docx,.pdf,.xls,.xlsx,.csv,.txt,.jpg,.jpeg,.png,.gif,.webp"
                onChange={handleFileUpload}
                disabled={uploading}
                style={{ display: "none" }}
              />
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "8px 18px",
                  borderRadius: RADIUS.md,
                  minHeight: 40,
                  background: "linear-gradient(135deg,#2563eb,#60a5fa)",
                  color: "#fff",
                  fontWeight: 600,
                  fontSize: 15,
                  opacity: uploading ? 0.55 : 1,
                }}
              >
                {uploading ? "⏳ Đang tải…" : "📤 Chọn file (doc, pdf, excel, ảnh)"}
              </span>
            </label>

            <Btn v="primary" sz="md" onClick={openCamera}>
              📷 Camera Laptop
            </Btn>
            <Btn v="ghost" sz="md" onClick={openMobileQR}>
              📱 Điện thoại (QR)
            </Btn>

            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                fontSize: 14,
                color: sockBadge.color,
              }}
            >
              <span style={{ fontSize: 13 }}>{sockBadge.dot}</span>
              {sockBadge.label}
            </span>
          </div>
        </Grid>
      </Card>

      <Card title="Tìm kiếm & Lọc bằng chứng" icon="🔍" accent={C.amberL}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: SPACE.md, alignItems: "center" }}>
          <input
            type="text"
            placeholder="Tìm tên file, ghi chú…"
            value={filters.q}
            onChange={(e) =>
              setFilters((f) => ({
                ...f,
                q: e.target.value,
              }))
            }
            style={{ ...SEL_STYLE, width: 210 }}
          />
          {[
            { key: "clauseId", opts: [["", "§ Tất cả điều khoản"], ...CLAUSE_OPTIONS], w: 190 },
            { key: "type", opts: TYPE_OPTIONS, w: 150 },
            { key: "source", opts: SOURCE_OPTIONS, w: 160 },
          ].map(({ key, opts, w }) => (
            <select
              key={key}
              value={filters[key]}
              onChange={(e) =>
                setFilters((f) => ({
                  ...f,
                  [key]: e.target.value,
                }))
              }
              style={{ ...SEL_STYLE, width: w }}
            >
              {opts.map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          ))}
          <Btn v="outline" sz="sm" onClick={fetchList}>
            🔄 Làm mới
          </Btn>
        </div>
      </Card>

      <Card title={`Danh sách bằng chứng (${list.length})`} icon="📋" accent={C.tealL}>
        {loading ? (
          <p style={{ color: C.t2 }}>Đang tải…</p>
        ) : list.length === 0 ? (
          <p style={{ color: C.t2 }}>
            Chưa có bằng chứng. Hãy upload file, chụp camera Laptop, hoặc dùng điện thoại qua QR.
          </p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: FONT.body }}>
              <thead>
                <tr style={{ borderBottom: `2px solid ${C.bd0}` }}>
                  {["Loại", "Tên / Ghi chú", "§ Điều khoản", "Nguồn", "Ngày", "Thao tác"].map((h) => (
                    <th
                      key={h}
                      style={{
                        textAlign: h === "Thao tác" ? "right" : "left",
                        padding: "10px 8px",
                        color: C.t2,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {list.map((item) => (
                  <tr key={item._id} style={{ borderBottom: `1px solid ${C.bd1}` }}>
                    <td style={{ padding: "8px" }}>
                      <Tag c={item.type === "image" ? C.tealL : C.blueL} sm>
                        {item.type === "image" ? "🖼 Ảnh" : "📄 Tài liệu"}
                      </Tag>
                    </td>
                    <td style={{ padding: "8px", maxWidth: 260 }}>
                      <span
                        style={{
                          color: C.t0,
                          fontWeight: 500,
                          display: "block",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {item.originalName || item.filename}
                      </span>
                      {item.note && <span style={{ color: C.t2, fontSize: 13 }}>{item.note}</span>}
                    </td>
                    <td style={{ padding: "8px" }}>
                      {item.clauseId ? (
                        <Tag c={C.blueL} sm>
                          §{item.clauseId}
                        </Tag>
                      ) : (
                        <span style={{ color: C.t3 }}>—</span>
                      )}
                    </td>
                    <td style={{ padding: "8px" }}>
                      <Tag c={C.t2} sm>
                        {item.source || "upload"}
                      </Tag>
                    </td>
                    <td style={{ padding: "8px", color: C.t2, fontSize: 13, whiteSpace: "nowrap" }}>
                      {item.createdAt ? new Date(item.createdAt).toLocaleString("vi-VN") : "—"}
                    </td>
                    <td style={{ padding: "8px", textAlign: "right", whiteSpace: "nowrap" }}>
                      <a
                        href={viewUrl(item._id)}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: C.blueL, marginRight: 8, fontSize: 14 }}
                      >
                        Xem
                      </a>
                      <a
                        href={downloadUrl(item._id)}
                        download
                        style={{ color: C.blueL, marginRight: 8, fontSize: 14 }}
                      >
                        Tải
                      </a>
                      <button
                        type="button"
                        onClick={() => openEdit(item)}
                        style={{
                          background: "none",
                          border: "none",
                          color: C.blueL,
                          cursor: "pointer",
                          marginRight: 8,
                          fontSize: 14,
                        }}
                      >
                        Sửa
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteEvidence(item._id)}
                        style={{
                          background: "none",
                          border: "none",
                          color: C.redL,
                          cursor: "pointer",
                          fontSize: 14,
                        }}
                      >
                        Xóa
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal
        open={cameraOpen}
        onClose={() => {
          setCameraOpen(false);
          setCapturedImg(null);
        }}
        title="📷 Chụp ảnh bằng chứng — Camera Laptop"
        width={680}
      >
        {capturedImg ? (
          <div>
            <p style={{ color: C.t2, fontSize: 15, marginBottom: SPACE.md }}>
              Xem trước — Nhấn <strong>Lưu ảnh</strong> để xác nhận hoặc <strong>Chụp lại</strong>.
            </p>
            <img
              src={capturedImg}
              alt="Preview"
              style={{
                width: "100%",
                maxHeight: 380,
                objectFit: "contain",
                borderRadius: RADIUS.md,
                background: "#000",
                border: `1px solid ${C.bd0}`,
              }}
            />
            <div style={{ marginTop: SPACE.lg, display: "flex", gap: SPACE.md }}>
              <Btn v="primary" sz="lg" onClick={confirmPhoto}>
                ✅ Lưu ảnh
              </Btn>
              <Btn v="ghost" sz="lg" onClick={retakePhoto}>
                🔁 Chụp lại
              </Btn>
              <Btn
                v="ghost"
                sz="md"
                onClick={() => {
                  setCameraOpen(false);
                  setCapturedImg(null);
                }}
              >
                Hủy
              </Btn>
            </div>
          </div>
        ) : (
          <div>
            <p style={{ color: C.t2, fontSize: 15, marginBottom: SPACE.md }}>
              Ảnh sẽ lưu với điều khoản: <strong>{clauseId ? `§${clauseId}` : "(chưa chọn)"}</strong>
            </p>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              style={{ width: "100%", maxHeight: 390, background: "#000", borderRadius: RADIUS.md, display: "block" }}
            />
            <div style={{ marginTop: SPACE.lg, display: "flex", gap: SPACE.md }}>
              <Btn v="primary" sz="lg" onClick={takePhoto}>
                📸 Chụp ảnh
              </Btn>
              <Btn v="ghost" sz="lg" onClick={() => setCameraOpen(false)}>
                Hủy
              </Btn>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={mobileQROpen}
        onClose={() => {
          setMobileQROpen(false);
          setHostFetched(false);
        }}
        title="📱 Chụp ảnh bằng điện thoại — Quét QR"
        width={480}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: SPACE.md }}>
          {isLocalhost && (
            <div
              style={{
                padding: "10px 14px",
                background: `${C.amberL}15`,
                border: `1px solid ${C.amberL}40`,
                borderRadius: RADIUS.md,
              }}
            >
              <p style={{ color: C.amberL, fontWeight: 600, fontSize: 15 }}>⚠️ Đang chạy trên localhost</p>
              <p style={{ color: C.t2, fontSize: 14, marginTop: 3 }}>
                Nhập IP LAN máy tính để điện thoại (cùng WiFi) quét được QR.
              </p>
            </div>
          )}

          <Field label="IP máy tính trong mạng WiFi nội bộ">
            <Input value={mobileHost} onChange={setMobileHost} placeholder="vd: 192.168.1.100" />
          </Field>

          <Field label="Điều khoản đính kèm (tùy chọn)">
            <select
              value={clauseId}
              onChange={(e) => setClauseId(e.target.value)}
              style={{ ...SEL_STYLE, width: "100%" }}
            >
              <option value="">— Không gắn điều khoản —</option>
              {CLAUSE_OPTIONS.map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </Field>

          <div style={{ display: "flex", justifyContent: "center", padding: 20, background: "#fff", borderRadius: RADIUS.lg }}>
            {mobileCaptureUrl ? (
              <QRCodeSVG value={mobileCaptureUrl} size={232} level="M" />
            ) : (
              <div
                style={{
                  width: 232,
                  height: 232,
                  background: C.bg3,
                  borderRadius: RADIUS.md,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <p style={{ color: C.t2, fontSize: 15, textAlign: "center", padding: 16 }}>
                  {sid ? "Nhập IP để tạo QR…" : "Cần tạo phiên trước"}
                </p>
              </div>
            )}
          </div>

          {mobileCaptureUrl && (
            <div
              onClick={() => {
                navigator.clipboard?.writeText(mobileCaptureUrl);
                toast("info", "✓ Đã copy URL!");
              }}
              title="Click để copy URL"
              style={{
                background: C.bg3,
                padding: "8px 12px",
                borderRadius: RADIUS.sm,
                fontFamily: "monospace",
                fontSize: 14.5,
                color: C.t1,
                wordBreak: "break-all",
                border: `1px solid ${C.bd0}`,
                cursor: "pointer",
              }}
            >
              {mobileCaptureUrl}
            </div>
          )}

          <div style={{ background: C.bg3, padding: "10px 14px", borderRadius: RADIUS.md }}>
            <p style={{ color: C.t2, fontSize: 14, lineHeight: 1.7 }}>
              📡 <strong>Hướng dẫn:</strong> Điện thoại và máy tính <strong>cùng WiFi</strong>.
              <br />
              Quét QR → trang chụp ảnh mở trên phone → chụp → ảnh đồng bộ ngay qua Socket.IO.
              <br />
              Nếu Socket lỗi, ảnh vẫn lưu được qua HTTP POST.
            </p>
            {sockStatus === "connected" && (
              <p style={{ color: C.tealL, fontSize: 14, marginTop: 6, fontWeight: 600 }}>
                ✅ Socket đã kết nối · {roomPeers} thiết bị trong phòng
              </p>
            )}
          </div>
        </div>
      </Modal>

      <Modal open={!!editItem} onClose={() => setEditItem(null)} title="✏️ Sửa bằng chứng" width={480}>
        {editItem && (
          <div style={{ display: "flex", flexDirection: "column", gap: SPACE.md }}>
            <Field label="Điều khoản (§)">
              <select
                value={editForm.clauseId}
                onChange={(e) =>
                  setEditForm((f) => ({
                    ...f,
                    clauseId: e.target.value,
                  }))
                }
                style={{ ...SEL_STYLE, width: "100%" }}
              >
                <option value="">— Không gắn —</option>
                {CLAUSE_OPTIONS.map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Ghi chú">
              <Input
                value={editForm.note}
                onChange={(v) =>
                  setEditForm((f) => ({
                    ...f,
                    note: v,
                  }))
                }
                placeholder="Ghi chú…"
              />
            </Field>
            <Field label="Bằng chứng thay thế (Tùy chọn)">
              <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                <input
                  type="file"
                  id="edit-file-upload"
                  accept=".doc,.docx,.pdf,.xls,.xlsx,.csv,.txt,.jpg,.jpeg,.png,.gif,.webp"
                  onChange={(e) => setEditFile(e.target.files[0] || null)}
                  style={{ display: "none" }}
                  disabled={uploading}
                />
                <Btn v="outline" sz="sm" onClick={() => document.getElementById("edit-file-upload").click()} disabled={uploading}>
                  📤 Chọn tệp tin mới
                </Btn>
                {editFile && (
                  <span style={{ fontSize: 13, color: C.teal }}>
                    <span style={{ fontWeight: 600 }}>Tệp mới đính kèm:</span> {editFile.name}
                  </span>
                )}
              </div>
            </Field>
            <div style={{ display: "flex", gap: SPACE.md, marginTop: 8 }}>
              <Btn v="primary" sz="md" onClick={saveEdit} disabled={uploading}>
                {uploading ? "Đang lưu..." : "Lưu thay đổi"}
              </Btn>
              <Btn v="ghost" sz="md" onClick={() => { setEditItem(null); setEditFile(null); }} disabled={uploading}>
                Hủy
              </Btn>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
