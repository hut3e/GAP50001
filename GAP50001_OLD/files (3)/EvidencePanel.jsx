/**
 * EvidencePanel — Component bằng chứng dùng chung cho mọi bước Onsite Audit
 *
 * Props:
 *  evHook    - kết quả từ useEvidence()
 *  stepKey   - định danh bước (clauseId / "risk-xxx" / "proc-xxx" / "equip-xxx")
 *  clauseId  - (tuỳ chọn) §clause gắn với file
 *  note      - (tuỳ chọn) ghi chú mặc định khi upload
 *  compact   - boolean, hiển thị dạng thu gọn
 */
import { QRCodeSVG } from "qrcode.react";

const C = {
  bg1:"#0f172a",bg2:"#1e293b",bg3:"#263350",
  t0:"#e8f4ff",t1:"#94b8d8",t2:"#4a7a9b",t3:"#1c3d57",
  bd:"rgba(46,95,163,.2)",
  blue:"#2E5FA3",blueL:"#4e8fd4",teal:"#0D7377",tealL:"#14b8a6",
  red:"#C0392B",redL:"#ef4444",amber:"#B7770D",amberL:"#f59e0b",
  green:"#1A7A4A",greenL:"#22c55e",violet:"#6C3483",
};

const SOCK_BADGE = {
  idle:       { dot:"○", label:"Chưa kết nối", col:C.t2      },
  connecting: { dot:"◌", label:"Đang kết nối", col:C.amberL  },
  connected:  { dot:"●", label:"Đã kết nối",   col:C.tealL   },
  error:      { dot:"✗", label:"Lỗi socket",   col:C.redL    },
};

function FileTypeIcon({ type, name = "" }) {
  const ext = name.split(".").pop().toLowerCase();
  if (type === "image" || ["jpg","jpeg","png","gif","webp"].includes(ext)) return "🖼";
  if (["pdf"].includes(ext)) return "📕";
  if (["doc","docx"].includes(ext)) return "📘";
  if (["xls","xlsx","csv"].includes(ext)) return "📗";
  return "📄";
}

export default function EvidencePanel({
  evHook, stepKey = "", clauseId = "", note = "", compact = false,
}) {
  const {
    evidence, loading, uploading, sockStatus, peerCount,
    cameraOpen, capturedImg, videoRef, qrOpen, setQrOpen, qrUrl,
    fetchEvidence, uploadFiles, uploadBase64, deleteEvidence,
    openCamera, takePhoto, retakePhoto, closeCamera, openQR,
    getByStep, ACCEPTED_FILES, viewUrl, downloadUrl,
    localIp, activeStep,
  } = evHook;

  const list = getByStep(stepKey || clauseId);
  const sock = SOCK_BADGE[sockStatus] || SOCK_BADGE.idle;

  const handleFiles = (e) => {
    uploadFiles(e.target.files, stepKey, clauseId, note);
    e.target.value = "";
  };

  const confirmPhoto = () => {
    uploadBase64(capturedImg, stepKey, clauseId,
      note || `Camera onsite ${new Date().toLocaleString("vi-VN")}`, "camera");
    closeCamera();
  };

  // ── Styles ────────────────────────────────────────────────────
  const btnStyle = (col = C.blue) => ({
    display:"inline-flex", alignItems:"center", gap:5, padding:"5px 12px",
    background:`${col}22`, border:`1px solid ${col}55`, borderRadius:6,
    color:col, fontSize:12, fontWeight:700, cursor:"pointer", whiteSpace:"nowrap",
  });
  const inp = {
    background:C.bg3, border:`1px solid ${C.bd}`, borderRadius:6,
    color:C.t0, fontSize:12, padding:"7px 10px", outline:"none",
  };

  return (
    <>
      {/* ── Toolbar ─────────────────────────────────────────── */}
      <div style={{ display:"flex", flexWrap:"wrap", gap:6, alignItems:"center",
        padding:compact?"8px 0":"10px 0" }}>

        {/* File upload */}
        <label style={btnStyle(C.blue)} title="Upload file tài liệu / ảnh">
          <input type="file" multiple accept={ACCEPTED_FILES}
            onChange={handleFiles} disabled={uploading}
            style={{ display:"none" }}/>
          {uploading ? "⏳ Đang tải…" : "📤 Upload file"}
        </label>

        {/* Camera laptop */}
        <button style={btnStyle(C.teal)} onClick={() => openCamera(stepKey)}>
          📷 Camera PC
        </button>

        {/* QR / điện thoại */}
        <button style={btnStyle(C.violet)} onClick={() => openQR(stepKey)}>
          📱 Điện thoại (QR)
        </button>

        {/* Refresh */}
        <button style={btnStyle(C.t2)} onClick={fetchEvidence} title="Làm mới danh sách">
          🔄
        </button>

        {/* Socket status + evidence count */}
        <span style={{ fontSize:11, color:sock.col, display:"flex", alignItems:"center", gap:4, marginLeft:4 }}>
          <span style={{ fontSize:8 }}>{sock.dot}</span>
          {sock.label} {sockStatus==="connected" && peerCount>1 && `· ${peerCount} thiết bị`}
        </span>

        {list.length > 0 && (
          <span style={{ fontSize:11, color:C.tealL, marginLeft:4, fontWeight:700 }}>
            {list.length} bằng chứng
          </span>
        )}
      </div>

      {/* ── Evidence thumbnails / list ───────────────────────── */}
      {loading ? (
        <p style={{ color:C.t2, fontSize:12, padding:"4px 0" }}>Đang tải…</p>
      ) : list.length > 0 && (
        <div style={{ display:"flex", flexWrap:"wrap", gap:8, padding:"6px 0" }}>
          {list.map(ev => (
            <div key={ev._id} style={{
              position:"relative", background:C.bg3, border:`1px solid ${C.bd}`,
              borderRadius:8, overflow:"hidden", width:compact?72:88, flexShrink:0,
            }}>
              {ev.type === "image" ? (
                <img src={viewUrl(ev._id)} alt={ev.originalName}
                  style={{ width:"100%", height:compact?72:80, objectFit:"cover", display:"block" }}/>
              ) : (
                <div style={{ width:"100%", height:compact?72:80, display:"flex",
                  alignItems:"center", justifyContent:"center", fontSize:28,
                  background:`${C.blue}18` }}>
                  <FileTypeIcon type={ev.type} name={ev.originalName||ev.filename}/>
                </div>
              )}
              {/* hover actions */}
              <div style={{ padding:"4px 6px", background:C.bg1 }}>
                <p style={{ fontSize:9, color:C.t2, overflow:"hidden", textOverflow:"ellipsis",
                  whiteSpace:"nowrap", margin:0 }} title={ev.originalName||ev.filename}>
                  {ev.originalName||ev.filename}
                </p>
                <div style={{ display:"flex", gap:6, marginTop:2 }}>
                  <a href={viewUrl(ev._id)} target="_blank" rel="noopener noreferrer"
                    style={{ color:C.blueL, fontSize:10 }}>Xem</a>
                  <a href={downloadUrl(ev._id)} download
                    style={{ color:C.tealL, fontSize:10 }}>Tải</a>
                  <button onClick={() => deleteEvidence(ev._id)}
                    style={{ background:"none", border:"none", color:C.redL,
                      cursor:"pointer", fontSize:10, padding:0 }}>Xóa</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Camera Modal ─────────────────────────────────────── */}
      {cameraOpen && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.85)", zIndex:2000,
          display:"flex", alignItems:"center", justifyContent:"center" }}
          onClick={e => e.target===e.currentTarget && closeCamera()}>
          <div style={{ background:C.bg2, border:`1px solid ${C.bd}`, borderRadius:14,
            padding:24, maxWidth:620, width:"95%", maxHeight:"95vh", overflowY:"auto" }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:16 }}>
              <h3 style={{ color:C.t0, fontWeight:700, margin:0 }}>📷 Chụp ảnh bằng chứng</h3>
              <button onClick={closeCamera} style={{ background:"none", border:"none", color:C.t2, cursor:"pointer", fontSize:18 }}>✕</button>
            </div>

            {capturedImg ? (
              <>
                <p style={{ color:C.t2, fontSize:12, marginBottom:10 }}>
                  Xem trước — Nhấn <strong>Lưu ảnh</strong> để xác nhận
                </p>
                <img src={capturedImg} alt="Preview"
                  style={{ width:"100%", maxHeight:360, objectFit:"contain", borderRadius:10, background:"#000" }}/>
                <div style={{ display:"flex", gap:10, marginTop:14 }}>
                  <button style={{ ...btnStyle(C.teal), padding:"8px 20px", fontSize:13 }} onClick={confirmPhoto}>
                    ✅ Lưu ảnh
                  </button>
                  <button style={{ ...btnStyle(C.amber), padding:"8px 20px", fontSize:13 }} onClick={retakePhoto}>
                    🔁 Chụp lại
                  </button>
                  <button style={{ ...btnStyle(C.t2), padding:"8px 14px", fontSize:13 }} onClick={closeCamera}>
                    Hủy
                  </button>
                </div>
              </>
            ) : (
              <>
                <video ref={videoRef} autoPlay playsInline muted
                  style={{ width:"100%", maxHeight:380, background:"#000",
                    borderRadius:10, display:"block" }}/>
                <div style={{ display:"flex", gap:10, marginTop:14 }}>
                  <button style={{ ...btnStyle(C.blue), padding:"9px 24px", fontSize:14 }} onClick={takePhoto}>
                    📸 Chụp ảnh
                  </button>
                  <button style={{ ...btnStyle(C.t2), padding:"9px 16px", fontSize:14 }} onClick={closeCamera}>
                    Đóng
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── QR / Mobile Modal ────────────────────────────────── */}
      {qrOpen && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.82)", zIndex:2000,
          display:"flex", alignItems:"center", justifyContent:"center" }}
          onClick={e => e.target===e.currentTarget && setQrOpen(false)}>
          <div style={{ background:C.bg2, border:`1px solid ${C.bd}`, borderRadius:14,
            padding:28, maxWidth:440, width:"95%" }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:16 }}>
              <h3 style={{ color:C.t0, fontWeight:700, margin:0 }}>📱 Chụp ảnh từ Điện thoại</h3>
              <button onClick={() => setQrOpen(false)} style={{ background:"none", border:"none", color:C.t2, cursor:"pointer", fontSize:18 }}>✕</button>
            </div>

            {!localIp && (
              <div style={{ padding:"10px 14px", background:`${C.amberL}15`,
                border:`1px solid ${C.amberL}40`, borderRadius:8, marginBottom:14 }}>
                <p style={{ color:C.amberL, fontSize:12, fontWeight:600 }}>
                  ⚠️ Chưa lấy được IP LAN. Backend cần expose /api/local-ip
                </p>
              </div>
            )}

            <div style={{ display:"flex", justifyContent:"center", padding:16,
              background:"#ffffff", borderRadius:12, marginBottom:14 }}>
              {qrUrl
                ? <QRCodeSVG value={qrUrl} size={220} level="M"/>
                : <div style={{ width:220, height:220, background:"#f0f0f0", display:"flex",
                    alignItems:"center", justifyContent:"center", fontSize:13, color:"#888" }}>
                    Cần IP LAN để tạo QR
                  </div>
              }
            </div>

            {qrUrl && (
              <div onClick={() => { navigator.clipboard?.writeText(qrUrl); }}
                title="Click để copy"
                style={{ background:C.bg3, padding:"8px 12px", borderRadius:8,
                  fontFamily:"monospace", fontSize:10, color:C.t1, wordBreak:"break-all",
                  cursor:"pointer", marginBottom:12, border:`1px solid ${C.bd}` }}>
                {qrUrl}
              </div>
            )}

            <div style={{ background:C.bg3, borderRadius:8, padding:"10px 14px" }}>
              <p style={{ color:C.t2, fontSize:12, lineHeight:1.6, margin:0 }}>
                📡 <strong>Điện thoại cùng WiFi</strong> với máy tính.<br/>
                Quét QR → Trang camera mở → Chụp → Ảnh đồng bộ realtime qua Socket.IO.<br/>
                {sockStatus === "connected" && (
                  <span style={{ color:C.tealL }}>✅ {peerCount} thiết bị đang kết nối</span>
                )}
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
