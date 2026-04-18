/**
 * ISO 50001 GAP — Survey CRUD API (MongoDB)
 */
const express = require("express");
const mongoose = require("mongoose");
const Survey = require("../models/Survey");
const { checkAndSendEvents } = require("../services/surveyEvents");
const { syncSurveyToPostgres } = require("../services/postgres");
const Job = require("../models/Job");
const Evidence = require("../models/Evidence");
const ExcelJS = require("exceljs");
const { GAP_CHECKLIST } = require("../gap.constants");
const path = require("path");
const fs = require("fs");

async function syncSurveyToJob(survey) {
  try {
    if (!survey.audit_plan || !survey.audit_plan.from_date) return;
    const ap = survey.audit_plan;
    const auditors = (ap.auditors || []).map(a => a.name || a).filter(Boolean).join(", ");
    
    // Convert to native Dates
    const start_date = new Date(ap.from_date);
    const end_date = ap.to_date ? new Date(ap.to_date) : start_date;
    
    // Ignore invalid dates
    if (isNaN(start_date.getTime())) return;
    
    const payload = {
      title: `[Kế hoạch GAP] ${survey.client?.name || "Khách hàng"} - ${survey.meta?.ref_no || ""}`,
      assignee: auditors,
      start_date,
      end_date,
      survey_id: survey._id,
    };
    
    await Job.findOneAndUpdate(
      { survey_id: survey._id },
      { $set: payload },
      { upsert: true, new: true }
    );
  } catch (err) {
    console.error("[syncSurveyToJob] Error:", err);
  }
}

async function applyLiteFallbacks(survey) {
  try {
    const images = await Evidence.find({ surveyId: survey._id, type: "image", source: { $ne: "document" } }).lean();
    const imagesByClauseId = {};
    images.forEach(img => {
      const c = img.context || {};
      const clauseId = img.clauseId || c.clause;
      if (clauseId) {
        if (!imagesByClauseId[clauseId]) imagesByClauseId[clauseId] = [];
        imagesByClauseId[clauseId].push(img);
      }
    });

    survey.responses = survey.responses || {};
    GAP_CHECKLIST.forEach(item => {
       const resp = survey.responses[item.id] || {};
       let currNote = resp.note || "";
       const eviList = [ ...(imagesByClauseId[item.id] || []), ...(imagesByClauseId[item.clause] || []) ];
       if (eviList.length > 0) {
          const appended = eviList.map(e => e.note || e.originalName).filter(Boolean).join("\\n- ");
          if (appended) currNote += (currNote ? "\\n- " : "") + appended;
       }
       if (!survey.responses[item.id]) survey.responses[item.id] = {};
       survey.responses[item.id].note = currNote;
    });

    let siteItems = Array.isArray(survey.lite_site_assessments) ? [...survey.lite_site_assessments] : [];
    if (siteItems.length === 0 && survey.site_assessments && survey.site_assessments.length > 0) {
        survey.site_assessments.forEach(zone => {
            let imgsHtml = "";
            let imagesArray = [];
            images.filter(img => img.context?.zone === zone.id).forEach(img => {
               const imgPath = path.resolve(__dirname, "../uploads", img.path || `${img.surveyId}/${img.filename}`);
               if (fs.existsSync(imgPath)) {
                  const base64Str = fs.readFileSync(imgPath, { encoding: 'base64' });
                  const base64 = "data:image/jpeg;base64," + base64Str;
                  imgsHtml += `<img src="${base64}" />`;
                  imagesArray.push(base64);
               }
            });
            if (zone.notes || imagesArray.length > 0) {
               siteItems.push({ area: zone.name, area_type: zone.zone_type || "Khu vực", status: zone.notes || "", risk: "", opportunity: "", images_html: imgsHtml, images: imagesArray });
            }
            (zone.equipment || []).forEach(eq => {
               let eqImgsHtml = "";
               let eqImagesArray = [];
               images.filter(img => img.context?.equipment === eq.id).forEach(img => {
                   const imgPath = path.resolve(__dirname, "../uploads", img.path || `${img.surveyId}/${img.filename}`);
                   if (fs.existsSync(imgPath)) {
                      const base64Str = fs.readFileSync(imgPath, { encoding: 'base64' });
                      const base64 = "data:image/jpeg;base64," + base64Str;
                      eqImgsHtml += `<img src="${base64}" />`;
                      eqImagesArray.push(base64);
                   }
               });
               if (eq.finding || eq.recommendation || eqImagesArray.length > 0) {
                   siteItems.push({ area: eq.name, area_type: eq.type || "Thiết bị", status: eq.finding || "", risk: "", opportunity: eq.recommendation || "", images_html: eqImgsHtml, images: eqImagesArray });
               }
            });
         });
         survey.lite_site_assessments = siteItems;
    }
  } catch (err) {
    console.error("[applyLiteFallbacks] Fallback parsing error:", err);
  }
}

const router = express.Router();

function mongoConnected() {
  return mongoose.connection.readyState === 1;
}

function requireMongo(req, res, next) {
  if (!mongoConnected()) {
    return res.status(503).json({
      error: "MongoDB chưa kết nối. Khởi động MongoDB (cổng 27017) và khởi động lại backend.",
      code: "MONGO_DISCONNECTED",
    });
  }
  next();
}

// GET /api/surveys/ref/:ref_no — by ref_no (phải đặt trước /:id)
router.get("/ref/:ref_no", requireMongo, async (req, res) => {
  try {
    const doc = await Survey.findOne({ "meta.ref_no": req.params.ref_no }).lean();
    if (!doc) return res.status(404).json({ error: "Survey not found" });
    res.json(doc);
  } catch (err) {
    const msg = err.message || "";
    if (/buffering|connection|timeout|ECONNREFUSED|MongoNetworkError/i.test(msg))
      return res.status(503).json({ error: "MongoDB chưa kết nối hoặc phản hồi chậm.", code: "MONGO_DISCONNECTED" });
    res.status(500).json({ error: msg });
  }
});

function safeRegex(str) {
  try {
    return new RegExp(String(str).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
  } catch (_) {
    return null;
  }
}

// GET /api/surveys — list (optional ?client= & ?ref_no=)
router.get("/", requireMongo, async (req, res) => {
  try {
    const { client, ref_no, limit = 50 } = req.query;
    const q = {};
    if (client && String(client).trim()) {
      const re = safeRegex(client);
      if (re) q["client.name"] = re;
    }
    if (ref_no && String(ref_no).trim()) {
      const re = safeRegex(ref_no);
      if (re) q["meta.ref_no"] = re;
    }
    const list = await Survey.find(q).sort({ createdAt: -1 }).limit(Number(limit)).lean();
    res.json(list);
  } catch (err) {
    console.error("[surveys list]", err);
    const msg = err.message || "";
    if (/buffering|connection|timeout|ECONNREFUSED|MongoNetworkError/i.test(msg))
      return res.status(503).json({ error: "MongoDB chưa kết nối hoặc phản hồi chậm.", code: "MONGO_DISCONNECTED" });
    res.status(500).json({ error: msg || "Lỗi tải danh sách phiên." });
  }
});

// GET /api/surveys/:id/export-excel
router.get("/:id/export-excel", requireMongo, async (req, res) => {
  try {
    const survey = await Survey.findById(req.params.id).lean();
    if (!survey) return res.status(404).json({ error: "Survey not found" });

    // Fetch images linked to this survey
    const images = await Evidence.find({ surveyId: survey._id, type: "image", source: { $ne: "document" } }).lean();

    // Mapping evidence by context id
    const imagesByZoneId = {};
    const imagesByEqId = {};
    const imagesByClauseId = {};
    images.forEach(img => {
      const c = img.context || {};
      const clauseId = img.clauseId || c.clause;
      
      if (c.equipment) {
        if (!imagesByEqId[c.equipment]) imagesByEqId[c.equipment] = [];
        imagesByEqId[c.equipment].push(img);
      } else if (c.zone) {
        if (!imagesByZoneId[c.zone]) imagesByZoneId[c.zone] = [];
        imagesByZoneId[c.zone].push(img);
      }
      
      if (clauseId) {
        if (!imagesByClauseId[clauseId]) imagesByClauseId[clauseId] = [];
        imagesByClauseId[clauseId].push(img);
      }
    });

    // Load Template
    const templatePath = path.resolve(__dirname, "../templates/Template_Export_Excel.xlsx");
    if (!fs.existsSync(templatePath)) {
      return res.status(500).json({ error: "Template_Export_Excel.xlsx not found in backend/templates directory" });
    }

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(templatePath);
    const sheet = workbook.getWorksheet(1);
    
    // Cập nhật ngày khảo sát cho tiêu đề Excel
    const dateStr = survey.meta?.survey_date ? ` (${survey.meta.survey_date})` : "";
    const titleCell = sheet.getCell('A1');
    if (titleCell) {
      titleCell.value = `TỔNG HỢP HÌNH ẢNH, KHUYẾN NGHỊ ĐỢT KHẢO SÁT${dateStr}`;
    }

    // Prepare rows
    let rowIndex = 3; // Data starts at row 3
    let stt = 1;

    const rowItems = []; // flatten site_assessments
    (survey.site_assessments || []).forEach(zone => {
      // Zone level notes if any
      if (zone.notes && String(zone.notes).trim()) {
        rowItems.push({
          type: 'zone',
          zoneObj: zone,
          id: zone.id,
          name1: zone.name || "Khu vực",
          name2: "Đánh giá chung khu vực",
          finding: zone.notes || "",
          rec: "",
          images: imagesByZoneId[zone.id] || []
        });
      }
      
      // Equipment level
      (zone.equipment || []).forEach(eq => {
        rowItems.push({
          type: 'equipment',
          zoneObj: zone,
          eqObj: eq,
          id: eq.id,
          name1: zone.name || "",
          name2: eq.name || "",
          finding: eq.finding || "",
          rec: eq.recommendation || "",
          images: imagesByEqId[eq.id] || []
        });
      });
    });

    // Cào dữ liệu Khuyến nghị (Action Plan) theo Clause
    const actionPlanByClauseId = {};
    (survey.action_plan || []).forEach(ap => {
      if (ap.clause) actionPlanByClauseId[ap.clause] = ap.action;
    });

    // Gắn thêm dữ liệu các Điểu khoản (Clauses)
    GAP_CHECKLIST.forEach(item => {
      const resp = (survey.responses || {})[item.id];
      const imgs = [ ...(imagesByClauseId[item.id] || []), ...(imagesByClauseId[item.clause] || []) ];
      
      // Xoá mảng để nếu vòng lặp đi ngang qua sub-clause tiếp theo (e.g. 10.2.2) thì không in lại ảnh cũ
      delete imagesByClauseId[item.id];
      delete imagesByClauseId[item.clause];

      const note = resp && resp.note ? String(resp.note).trim() : "";
      const rec = actionPlanByClauseId[item.id] ? String(actionPlanByClauseId[item.id]).trim() : "";
      
      if (imgs.length > 0) {
        // Tách mỗi ảnh thành 1 dòng để đảm bảo không xót bất cứ ảnh nào
        imgs.forEach((img, index) => {
          rowItems.push({
            type: 'clause',
            id: item.id,
            name1: `Điều khoản ${item.clause}`,
            name2: `${item.id} - ${item.title}`,
            finding: index === 0 ? note : "", // Chỉ in Hiện trạng 1 lần ở dòng đầu
            rec: index === 0 ? rec : "", // Chỉ in Khuyến nghị 1 lần
            images: [img], // Mỗi dòng giữ 1 ảnh
            imgNote: img.note || img.originalName || "" // Ghi chú của ảnh
          });
        });
      } else {
        // Không có ảnh nhưng vẫn in ra để giữ lại tiêu đề khoản
        rowItems.push({
          type: 'clause',
          id: item.id,
          name1: `Điều khoản ${item.clause}`,
          name2: `${item.id} - ${item.title}`,
          finding: note,
          rec: rec,
          images: [],
          imgNote: ""
        });
      }
    });

    for (const item of rowItems) {
      const row = sheet.getRow(rowIndex);
      row.getCell(1).value = stt++;
      row.getCell(2).value = item.name1;
      row.getCell(3).value = item.name2;
      row.getCell(4).value = { richText: [{ text: item.finding }] }; // use richText for wraps
      row.getCell(5).value = { richText: [{ text: item.rec }] };
      row.getCell(7).value = { richText: [{ text: item.imgNote || "" }] }; // Set Ghi chú của Cột 7

      // Style setting (wrap text, center STT)
      row.getCell(1).alignment = { vertical: 'middle', horizontal: 'center' };
      row.getCell(2).alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
      row.getCell(3).alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
      row.getCell(4).alignment = { vertical: 'top', horizontal: 'left', wrapText: true };
      row.getCell(5).alignment = { vertical: 'top', horizontal: 'left', wrapText: true };
      row.getCell(7).alignment = { vertical: 'top', horizontal: 'left', wrapText: true }; // Ghi chú

      // Insert Image into Column 6 (F)
      if (item.images && item.images.length > 0) {
        const img = item.images[0];
        const imgPath = path.resolve(__dirname, "../uploads", img.path || `${img.surveyId}/${img.filename}`);
        if (fs.existsSync(imgPath)) {
          let extension = img.filename.split('.').pop().toLowerCase();
          if (extension === 'jpg') extension = 'jpeg'; // exceljs uses jpeg
          
          try {
            const imageId = workbook.addImage({
              filename: imgPath,
              extension: extension === 'png' ? 'png' : 'jpeg',
            });
            
            // We want to insert the image into Col F (index 5, 0-indexed column 5)
            sheet.addImage(imageId, {
               tl: { col: 5.1, row: rowIndex - 1 + 0.1 },
               ext: { width: 140, height: 110 }
            });
            row.height = 100; // Set row height to easily fit image
          } catch(e) {
            console.error("Error adding image to excel", e);
          }
        }
      }

      // Add borders
      for(let c = 1; c <= 7; c++) {
        row.getCell(c).border = {
          top: {style:'thin'}, left: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'}
        };
      }
      
      rowIndex++;
    }

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename=Export_Excel_${survey.meta?.ref_no || 'GAP'}.xlsx`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    if (err.name === "CastError") return res.status(400).json({ error: "Invalid id" });
    const msg = err.message || "";
    console.error("[surveys export excel]", err);
    res.status(500).json({ error: msg || "Lỗi tạo báo cáo Excel." });
  }
});
router.get("/:id", requireMongo, async (req, res) => {
  try {
    const doc = await Survey.findById(req.params.id).lean();
    if (!doc) return res.status(404).json({ error: "Survey not found" });
    res.json(doc);
  } catch (err) {
    if (err.name === "CastError") return res.status(400).json({ error: "Invalid id" });
    const msg = err.message || "";
    if (/buffering|connection|timeout|ECONNREFUSED|MongoNetworkError/i.test(msg))
      return res.status(503).json({ error: "MongoDB chưa kết nối hoặc phản hồi chậm.", code: "MONGO_DISCONNECTED" });
    res.status(500).json({ error: msg || "Lỗi tải phiên." });
  }
});

// POST /api/surveys — create (tạo DB iso50001gap khi ghi document đầu tiên)
router.post("/", requireMongo, async (req, res) => {
  try {
    const body = req.body || {};
    if (!body.meta?.ref_no) return res.status(400).json({ error: "meta.ref_no required" });
    const clientName = body.client?.name != null ? String(body.client.name).trim() : "";
    if (!clientName) return res.status(400).json({ error: "client.name required" });
    const existing = await Survey.findOne({ "meta.ref_no": body.meta.ref_no }).maxTimeMS(15000);
    if (existing) return res.status(409).json({ error: "ref_no already exists", id: existing._id });
    // Bypass Mongoose deep casting for the same dot-notation drop bug in responses
    body.createdAt = new Date();
    body.updatedAt = body.createdAt;
    const result = await Survey.collection.insertOne(body);
    const surveyLean = await Survey.findById(result.insertedId).lean();
    
    // Create an instance solely for response fallback backwards compatibility if needed
    const survey = new Survey(surveyLean);
    // Real-time Telegram notification hook (no await to prevent blocking)
    checkAndSendEvents(null, surveyLean);
    // Real-time Postgres synchronization
    syncSurveyToPostgres(surveyLean);
    // Sync to Job collection for Calendar visualization
    syncSurveyToJob(surveyLean);
    res.status(201).json(survey);
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ error: "ref_no duplicate" });
    console.error("[surveys POST]", err);
    const msg = err.message || "";
    if (/buffering|connection|timeout|ECONNREFUSED|MongoNetworkError/i.test(msg))
      return res.status(503).json({ error: "MongoDB chưa kết nối hoặc phản hồi chậm.", code: "MONGO_DISCONNECTED" });
    res.status(500).json({ error: msg || "Lỗi tạo phiên." });
  }
});

// PUT /api/surveys/:id — update
router.put("/:id", requireMongo, async (req, res) => {
  try {
    const oldSurvey = await Survey.findById(req.params.id);
    if (!oldSurvey) return res.status(404).json({ error: "Survey not found" });

    // Cần copy trạng thái cũ để check Telegram changes trước khi bị biến đổi
    const originalSurveyLean = oldSurvey.toObject();

    // Core Fix: Strip _id and immutable timestamps from req.body
    const updateData = { ...req.body };
    delete updateData._id;
    delete updateData.createdAt;
    delete updateData.updatedAt;
    delete updateData.__v;
    updateData.updatedAt = new Date();

    // Must use native MongoDB update to prevent Mongoose Mixed Schema from silently stripping 
    // object keys that contain dots (e.g. "4.1.1" in responses). 
    // MongoDB 5.0+ natively supports dotted keys in objects, but Mongoose still drops them during cast.
    await Survey.collection.updateOne(
      { _id: oldSurvey._id },
      { $set: updateData }
    );
    
    // Convert to plain object for the hook & response directly from DB natively
    const surveyLean = await Survey.findById(oldSurvey._id).lean();

    // Real-time Telegram notification hook
    checkAndSendEvents(originalSurveyLean, surveyLean);
    // Real-time Postgres synchronization
    syncSurveyToPostgres(surveyLean);
    // Sync to Job collection for Calendar visualization
    syncSurveyToJob(surveyLean);
    res.json(surveyLean);
  } catch (err) {
    if (err.name === "CastError") return res.status(400).json({ error: "Invalid id" });
    console.error("[surveys PUT]", err);
    const msg = err.message || "";
    if (/buffering|connection|timeout|ECONNREFUSED|MongoNetworkError/i.test(msg))
      return res.status(503).json({ error: "MongoDB chưa kết nối hoặc phản hồi chậm.", code: "MONGO_DISCONNECTED" });
    res.status(500).json({ error: msg || "Lỗi cập nhật phiên." });
  }
});

// PATCH /api/surveys/:id/kanban-status — cập nhật trạng thái Kanban
router.patch("/:id/kanban-status", requireMongo, async (req, res) => {
  try {
    const { status } = req.body || {};
    const VALID = ["planning", "in_progress", "review", "completed", "overdue"];
    if (!status || !VALID.includes(status)) {
      return res.status(400).json({ error: `status phải là một trong: ${VALID.join(", ")}` });
    }
    const oldSurvey = await Survey.findById(req.params.id).lean();

    const survey = await Survey.findByIdAndUpdate(
      req.params.id,
      { $set: { kanban_status: status } },
      { new: true, runValidators: false, maxTimeMS: 10000 }
    ).lean();
    if (!survey) return res.status(404).json({ error: "Survey not found" });
    
    // Real-time Telegram config for status change
    checkAndSendEvents(oldSurvey, survey);
    // Real-time Postgres synchronization
    syncSurveyToPostgres(survey);

    // Emit realtime qua Socket.IO nếu có
    const io = req.app?.get("io");
    if (io) io.emit("kanban:status-changed", { id: survey._id, status, survey });
    res.json({ ok: true, id: survey._id, status, survey });
  } catch (err) {
    if (err.name === "CastError") return res.status(400).json({ error: "Invalid id" });
    const msg = err.message || "";
    if (/buffering|connection|timeout|ECONNREFUSED|MongoNetworkError/i.test(msg))
      return res.status(503).json({ error: "MongoDB chưa kết nối.", code: "MONGO_DISCONNECTED" });
    res.status(500).json({ error: msg });
  }
});

// DELETE /api/surveys/:id
router.delete("/:id", requireMongo, async (req, res) => {
  try {
    const survey = await Survey.findByIdAndDelete(req.params.id);
    if (!survey) return res.status(404).json({ error: "Survey not found" });
    res.json({ deleted: true, id: req.params.id });
  } catch (err) {
    if (err.name === "CastError") return res.status(400).json({ error: "Invalid id" });
    const msg = err.message || "";
    if (/buffering|connection|timeout|ECONNREFUSED|MongoNetworkError/i.test(msg))
      return res.status(503).json({ error: "MongoDB chưa kết nối hoặc phản hồi chậm.", code: "MONGO_DISCONNECTED" });
    res.status(500).json({ error: msg });
  }
});

// GET /api/surveys/:id/export-docx — Full GAP Report (DOCX)
router.get("/:id/export-docx", requireMongo, async (req, res) => {
  try {
    const survey = await Survey.findById(req.params.id).lean();
    if (!survey) return res.status(404).json({ error: "Survey not found" });

    // Fetch evidence images linked to this survey
    const evidenceList = await Evidence.find({
      surveyId: survey._id,
      type: "image",
      source: { $ne: "document" },
    }).lean();

    const { GAP_CHECKLIST } = require("../gap.constants");
    const { generateGapReport } = require("../gap.generator");

    const buffer = await generateGapReport(survey, evidenceList, GAP_CHECKLIST);

    const refNo = (survey.meta?.ref_no || "GAP").replace(/[^A-Za-z0-9_\-]/g, "_");
    const filename = `ISO50001_GAP_${refNo}.docx`;
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
    res.setHeader("Content-Disposition", `attachment; filename=${filename}`);
    res.send(buffer);
  } catch (err) {
    if (err.name === "CastError") return res.status(400).json({ error: "Invalid id" });
    const msg = err.message || "";
    console.error("[surveys export-docx]", err);
    res.status(500).json({ error: msg || "Lỗi tạo báo cáo Full DOCX." });
  }
});

router.get("/:id/export-lite-docx", requireMongo, async (req, res) => {

  try {
    const survey = await Survey.findById(req.params.id).lean();
    if (!survey) return res.status(404).json({ error: "Survey not found" });

    const { GAP_CHECKLIST } = require("../gap.constants");
    const { generateGapReportLite } = require("../gap.docx.lite.js");

    await applyLiteFallbacks(survey);

    const customGaps = Array.isArray(survey.lite_custom_gaps) ? survey.lite_custom_gaps : [];
    const liteOverrides = survey.lite_overrides || {};
    const customItems = customGaps.map(c => ({ id: c.id, clause: c.clause, title: c.title, isCustom: true }));
    const standardItems = GAP_CHECKLIST.filter(c => !liteOverrides[c.id]?.deleted).map(c => {
      if (liteOverrides[c.id]?.title) {
        return { ...c, title: liteOverrides[c.id].title, isEdited: true };
      }
      return c;
    });
    const checklist = [...standardItems, ...customItems];

    const buffer = await generateGapReportLite(survey, checklist);

    const filename = `Lite_Report_${survey.meta?.ref_no || "GAP"}.docx`;
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
    res.setHeader("Content-Disposition", `attachment; filename=${filename}`);
    res.send(buffer);
  } catch (err) {
    if (err.name === "CastError") return res.status(400).json({ error: "Invalid id" });
    const msg = err.message || "";
    console.error("[surveys export lite docx]", err);
    res.status(500).json({ error: msg || "Lỗi tạo báo cáo Lite DOCX." });
  }
});

router.get("/:id/export-lite-html", requireMongo, async (req, res) => {
  try {
    const survey = await Survey.findById(req.params.id).lean();
    if (!survey) return res.status(404).json({ error: "Survey not found" });

    const d = survey;
    d.client = d.client || {};
    d.verifier = d.verifier || {};
    
    await applyLiteFallbacks(d);

    d.lite_site_assessments = Array.isArray(d.lite_site_assessments) ? d.lite_site_assessments : [];
    
    let auditors = Array.isArray(d.audit_plan?.auditors) && d.audit_plan.auditors.length > 0 ? d.audit_plan.auditors : [];
    if (auditors.length === 0) {
      if (d.verifier?.lead) auditors.push({ name: d.verifier.lead, role: 'Trưởng đoàn', certificate: d.verifier?.cert_no || '' });
      if (d.verifier?.team) {
         d.verifier.team.split(';').map(s=>s.trim()).filter(Boolean).forEach(t => {
             auditors.push({ name: t, role: 'Thành viên', certificate: '' });
         });
      }
    }
    const contactPersons = Array.isArray(d.client.contact_persons) ? d.client.contact_persons : [];
    
    // BASIC INFO
    let basicHtml = `
      <h3>1. THÔNG TIN CHUNG VỀ DOANH NGHIỆP PHÁT THẢI / SỬ DỤNG NĂNG LƯỢNG</h3>
      <table>
        <tr><th width="30%">Tên công ty:</th><td contenteditable="true">${d.client.name||"—"}</td></tr>
        <tr><th>Cơ sở / Nhà máy:</th><td contenteditable="true">${d.client.site||"—"}</td></tr>
        <tr><th>Địa chỉ:</th><td contenteditable="true">${d.client.address||"—"}</td></tr>
        <tr><th>Ngành nghề:</th><td contenteditable="true">${d.client.industry||"—"}</td></tr>
        <tr><th>Năng lượng tiêu thụ (TOE/năm):</th><td contenteditable="true">${d.client.annual_energy||"—"}</td></tr>
        <tr><th>Người đại diện pháp luật:</th><td contenteditable="true">${d.client.representative_name||"—"} - ${d.client.representative_position||"—"}</td></tr>
        <tr><th>Người liên hệ:</th><td contenteditable="true">${contactPersons.map(c => `${c.full_name||""} - ${c.position||""} - ${c.phone||""} - ${c.email||""}`).join("<br/>")||"—"}</td></tr>
      </table>
      
      <br/>
      <h3>2. THÔNG TIN CHUNG VỀ TỔ CHỨC ĐÁNH GIÁ GAP ISO 50001 (LITE)</h3>
      <table>
        <tr><th width="30%">Tên tổ chức tư vấn/đánh giá:</th><td contenteditable="true">${d.verifier.org||"—"}</td></tr>
        <tr><th>Số chứng chỉ:</th><td contenteditable="true">${d.verifier.cert_no||"—"}</td></tr>
        <tr><th>Chương trình:</th><td contenteditable="true">${d.verifier.program||"—"}</td></tr>
      </table>
      
      <h4>2.1. Đoàn chuyên gia thực hiện Khảo sát</h4>
      <table>
        <tr><th width="5%">STT</th><th>Họ và tên</th><th>Vai trò</th><th>Chứng chỉ Năng lượng</th></tr>
        ${auditors.length ? auditors.map((a,i) => `<tr><td style="text-align:center">${i+1}</td><td contenteditable="true" style="font-weight:bold">${a.name||"—"}</td><td contenteditable="true">${a.role||"—"}</td><td contenteditable="true">${a.certificate||"—"}</td></tr>`).join("") : '<tr><td colspan="4" style="text-align:center;color:#888;">Chưa có dữ liệu</td></tr>'}
      </table>
    `;

    // GAP TABLE
    const { GAP_CHECKLIST } = require("../gap.constants");
        const customGaps = Array.isArray(survey.lite_custom_gaps) ? survey.lite_custom_gaps : [];
    const liteOverrides = survey.lite_overrides || {};
    const customItems = customGaps.map(c => ({ id: c.id, clause: c.clause, title: c.title, isCustom: true }));
    const standardItems = GAP_CHECKLIST.filter(c => !liteOverrides[c.id]?.deleted).map(c => {
      if (liteOverrides[c.id]?.title) {
        return { ...c, title: liteOverrides[c.id].title, isEdited: true };
      }
      return c;
    });
    const checklist = [...standardItems, ...customItems];

    let gapRows = "";
    checklist.forEach((item, i) => {
      const resp = (d.responses || {})[item.id] || {};
      const sc = resp.score || 0;
      const note = resp.note || "";
      const scColor = sc === 1 ? "#d32f2f" : sc === 2 ? "#ed6c02" : sc >= 4 ? "#2e7d32" : "#555";
      const clauseColor = item.isCustom ? "#9c27b0" : "#222";
      gapRows += `<tr><td style="text-align:center">${i+1}</td><td style="text-align:center;font-weight:bold;color:${clauseColor}">${item.id||`CUS-${item.clause}`}</td><td contenteditable="true">${item.title}</td><td contenteditable="true">${note.replace(/\\n/g, "<br/>")}</td><td contenteditable="true" style="text-align:center;font-weight:bold;color:${scColor}">${sc ? sc+"/5.0" : "—"}</td></tr>`;
    });
    
    // RISKS
    let riskRows = "";
    let rIdx = 1;
    const siteItems = d.lite_site_assessments || [];
    
    siteItems.forEach((e) => {
      let imgsHtml = e.images_html || "";
      const eqImages = e.images || [];
      if (eqImages.length > 0) {
        eqImages.forEach(imgBase64 => {
           if (imgBase64.startsWith("data:image/")) {
             imgsHtml += `<img src="${imgBase64}" />`;
           }
        });
      }

      let detailsHtml = "";
      if (e.status) detailsHtml += `- Hiện trạng: ${e.status}<br/>`;
      if (e.risk) detailsHtml += `- Rủi ro: ${e.risk}<br/>`;
      if (e.opportunity) detailsHtml += `- Cơ hội cải tiến: ${e.opportunity}`;

      riskRows += `<tr>
        <td style="text-align:center" class="stt">${rIdx++}</td>
        <td contenteditable="true" style="font-weight:bold">${e.area||"—"}</td>
        <td contenteditable="true">${e.area_type||"—"}</td>
        <td contenteditable="true">${detailsHtml || "—"}</td>
        <td tabindex="0" onpaste="handlePaste(event, this)" style="text-align: center; vertical-align: middle; padding: 5px; cursor: pointer;">
          <div style="font-size: 11px; color:#999; margin-bottom:5px;" class="no-print">[Click và nhấn Ctrl+V paste ảnh]</div>
          ${imgsHtml}
        </td>
        <td class="no-print" style="text-align: center;">
          <button onclick="deleteRow(this)" style="background:#e53935; color:#fff; border:none; padding:6px 10px; border-radius:4px; font-size:12px; cursor:pointer;" title="Xoá dòng này">Xoá</button>
        </td>
      </tr>`;
    });

    // ─── Dashboard Analytics ───────────────────────────────────────
    const CLAUSE_KEYS_D = ["4","5","6","7","8","9","10"];
    const CLAUSE_NAMES_D = {"4":"Bối cảnh tổ chức","5":"Lãnh đạo","6":"Hoạch định","7":"Hỗ trợ","8":"Vận hành","9":"Đánh giá kết quả","10":"Cải tiến"};
    const SC_COLORS = ["#718096","#dc2626","#ea580c","#d97706","#059669","#0d9488"];
    const SC_BG_D   = ["#F5F5F5","#FFF5F5","#FFFAF0","#FEFCE8","#F0FFF4","#F0FDFA"];
    const SC_LBL_D  = ["N/A","Chưa triển khai","Mới bắt đầu","Đang phát triển","Phần lớn đáp ứng","Hoàn toàn đáp ứng"];
    const respD = d.responses || {};
    const allScoredD = checklist.filter(i => (respD[i.id]?.score || 0) > 0);
    const avgScoreD  = allScoredD.length ? allScoredD.reduce((a,i)=>a+(respD[i.id]?.score||0),0)/allScoredD.length : 0;
    const maxScoreD  = allScoredD.length ? Math.max(...allScoredD.map(i=>respD[i.id]?.score||0)) : 0;
    const minScoreD  = allScoredD.length ? Math.min(...allScoredD.map(i=>respD[i.id]?.score||0)) : 0;
    const pctD       = checklist.length ? Math.round(allScoredD.length/checklist.length*100) : 0;
    const kpiColD    = avgScoreD>=4?"#0d9488":avgScoreD>=3?"#059669":avgScoreD>=2?"#d97706":"#dc2626";
    const kpiLabelD  = avgScoreD>=4.5?"XUẤT SẮC":avgScoreD>=3.5?"TỐT":avgScoreD>=2.5?"TRUNG BÌNH":avgScoreD>0?"YẾU":"CHƯA ĐÁNH GIÁ";

    const kpiCards = [
      { icon:"📋", label:"Tổng điều khoản",  val: checklist.length,                                                col:"#2563eb" },
      { icon:"✅", label:"Đã đánh giá",       val: allScoredD.length,                                              col:"#0d9488" },
      { icon:"⏳", label:"Chưa đánh giá",     val: checklist.length - allScoredD.length,                           col:"#d97706" },
      { icon:"⭐", label:"Điểm TB",            val: avgScoreD>0?avgScoreD.toFixed(2)+"/5":"—",                     col: kpiColD },
      { icon:"🔝", label:"Điểm cao nhất",      val: maxScoreD>0?maxScoreD+"/5":"—",                                col:"#059669" },
      { icon:"🔻", label:"Điểm thấp nhất",     val: minScoreD>0?minScoreD+"/5":"—",                                col:"#dc2626" },
      { icon:"📈", label:"Tỷ lệ hoàn thành",  val: pctD+"%",                                                      col:"#7c3aed" },
      { icon:"🏆", label:"Xếp loại",           val: kpiLabelD,                                                     col: kpiColD },
    ].map(k=>`
      <div style="background:${k.col}11;border:2px solid ${k.col}33;border-radius:12px;padding:18px 14px;text-align:center;display:flex;flex-direction:column;align-items:center;gap:6px;">
        <div style="font-size:28px">${k.icon}</div>
        <div style="font-size:22px;font-weight:800;color:${k.col};font-family:'Georgia',serif;line-height:1">${k.val}</div>
        <div style="font-size:11px;color:#555;text-transform:uppercase;letter-spacing:0.05em;font-weight:600">${k.label}</div>
      </div>`).join("");

    const clauseRows = CLAUSE_KEYS_D.map(clause => {
      const cItems = checklist.filter(i => String(i.clause||"").split(".")[0] === clause);
      if (!cItems.length) return "";
      const cScored = cItems.filter(i => (respD[i.id]?.score||0) > 0);
      const cAvg = cScored.length ? cScored.reduce((a,i)=>a+(respD[i.id]?.score||0),0)/cScored.length : 0;
      const cPct = cItems.length ? Math.round(cScored.length/cItems.length*100) : 0;
      const cScoreRound = Math.round(cAvg);
      const cCol = SC_COLORS[cScoreRound]||"#718096";
      const cBg  = SC_BG_D[cScoreRound]||"#F5F5F5";
      const barPct = (cAvg/5*100).toFixed(0);
      return `<tr style="background:${cBg}">
        <td style="text-align:center;font-weight:800;color:#1B3564;font-size:15px">§${clause}</td>
        <td style="font-weight:600">${CLAUSE_NAMES_D[clause]||clause}</td>
        <td style="text-align:center"><span style="color:${cScored.length===cItems.length?"#059669":"#d97706"};font-weight:700">${cScored.length}</span>/${cItems.length}</td>
        <td style="text-align:center;font-weight:800;font-size:16px;color:${cCol}">${cAvg>0?cAvg.toFixed(2):"—"}<span style="font-size:11px;color:#888">/5</span></td>
        <td><div style="background:#e5e5e5;border-radius:6px;height:12px;overflow:hidden"><div style="height:100%;width:${barPct}%;background:linear-gradient(90deg,${cCol},${cCol}88);border-radius:6px;transition:width .3s"></div></div><div style="font-size:10px;color:${cCol};text-align:right;margin-top:2px">${barPct}%</div></td>
        <td style="text-align:center"><span style="display:inline-block;padding:3px 10px;border-radius:6px;background:${cCol}18;color:${cCol};font-weight:700;font-size:12px;white-space:nowrap">${SC_LBL_D[cScoreRound]||"—"}</span></td>
      </tr>`;
    }).join("");

    const distRows = [1,2,3,4,5].map(s => {
      const cnt = checklist.filter(i=>(respD[i.id]?.score||0)===s).length;
      const pct2 = checklist.length?Math.round(cnt/checklist.length*100):0;
      const col = SC_COLORS[s], bg = SC_BG_D[s];
      return `<tr style="background:${bg}">
        <td style="text-align:center;font-weight:800;color:${col};font-size:16px">${s}<span style="font-size:11px;font-weight:400">/5</span></td>
        <td style="font-weight:600;color:${col}">${SC_LBL_D[s]}</td>
        <td style="text-align:center;font-weight:800;color:${col}">${cnt}</td>
        <td style="text-align:center;font-weight:700;color:${col}">${pct2}%</td>
        <td><div style="background:#e5e5e5;border-radius:6px;height:10px;overflow:hidden"><div style="height:100%;width:${pct2}%;background:linear-gradient(90deg,${col},${col}88);border-radius:6px"></div></div></td>
      </tr>`;
    }).join("");

    const dashboardHtml = `
      <div style="page-break-before:auto;margin:30px 0">
        <h3 style="color:#0d47a1;border-bottom:3px solid #1565c0;padding-bottom:8px;margin-bottom:20px">
          3.1. TỔNG HỢP &amp; PHÂN TÍCH KẾT QUẢ ĐÁNH GIÁ GAP
        </h3>

        <h4 style="color:#0277bd;margin-bottom:14px">A. CHỈ SỐ TỔNG QUAN (KPI)</h4>
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:28px">
          ${kpiCards}
        </div>

        <h4 style="color:#0277bd;margin-bottom:14px">B. ĐIỂM ĐÁNH GIÁ THEO ĐIỀU KHOẢN ISO 50001:2018</h4>
        <table style="margin-bottom:28px">
          <thead>
            <tr style="background:#1B3564;color:#fff">
              <th style="color:#fff;width:6%">§</th>
              <th style="color:#fff;width:22%">Tên nhóm điều khoản</th>
              <th style="color:#fff;width:10%;text-align:center">Đã đánh giá</th>
              <th style="color:#fff;width:10%;text-align:center">Điểm TB</th>
              <th style="color:#fff;width:22%">Thanh điểm</th>
              <th style="color:#fff;width:30%;text-align:center">Xếp loại</th>
            </tr>
          </thead>
          <tbody>
            ${clauseRows}
            <tr style="background:#e3f2fd;font-weight:700">
              <td colspan="2" style="text-align:right;color:#1B3564;padding-right:12px">📊 Tổng cộng / Trung bình</td>
              <td style="text-align:center"><span style="color:#059669">${allScoredD.length}</span>/${checklist.length}</td>
              <td style="text-align:center;font-size:18px;color:${kpiColD}">${avgScoreD>0?avgScoreD.toFixed(2):"—"}<span style="font-size:11px;color:#888">/5</span></td>
              <td><div style="background:#e5e5e5;border-radius:6px;height:14px;overflow:hidden"><div style="height:100%;width:${(avgScoreD/5*100).toFixed(0)}%;background:linear-gradient(90deg,${kpiColD},#2dd4bf);border-radius:6px"></div></div><div style="font-size:10px;text-align:right;color:${kpiColD}">${(avgScoreD/5*100).toFixed(0)}%</div></td>
              <td style="text-align:center"><span style="display:inline-block;padding:4px 14px;border-radius:8px;background:${kpiColD}22;color:${kpiColD};font-weight:800;font-size:14px">${kpiLabelD}</span></td>
            </tr>
          </tbody>
        </table>

        <h4 style="color:#0277bd;margin-bottom:14px">C. PHÂN BỐ ĐIỂM ĐÁNH GIÁ</h4>
        <table style="margin-bottom:20px">
          <thead>
            <tr style="background:#1B3564;color:#fff">
              <th style="color:#fff;width:8%;text-align:center">Điểm</th>
              <th style="color:#fff;width:25%">Ý nghĩa</th>
              <th style="color:#fff;width:8%;text-align:center">Số lượng</th>
              <th style="color:#fff;width:8%;text-align:center">Tỷ lệ</th>
              <th style="color:#fff">Phân bố trực quan</th>
            </tr>
          </thead>
          <tbody>${distRows}</tbody>
        </table>
      </div>
    `;

    const html = `
    <!DOCTYPE html>
    <html lang="vi">
    <head>
      <meta charset="UTF-8">
      <title>Báo cáo Nhanh Khảo sát GAP - ${d.client.name||""}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
        body { font-family: 'Inter', sans-serif; background-color: #f4f6f8; color: #333; padding: 30px; margin: 0; }
        .container { max-width: 1200px; margin: 0 auto; background: #fff; border-radius: 12px; padding: 40px; box-shadow: 0 10px 30px rgba(0,0,0,0.08); }
        h1.title { color: #0d47a1; text-align: center; font-size: 28px; margin-bottom: 30px; text-transform: uppercase; }
        h3 { color: #f57c00; font-size: 18px; margin-top: 40px; border-bottom: 2px solid #ffcc80; padding-bottom: 5px; }
        h4 { color: #0277bd; font-size: 16px; margin-top: 20px; }
        table { width: 100%; border-collapse: collapse; font-size: 14px; margin-bottom: 20px; }
        th { background-color: #f5f5f5; color: #333; padding: 10px; text-align: left; font-weight: 600; border: 1px solid #ddd; }
        td { padding: 10px; border: 1px solid #ddd; vertical-align: middle; line-height: 1.5; }
        td[contenteditable="true"]:focus, td[onpaste]:focus { outline: 2px solid #ff9800; background: #fff8e1; }
        img { max-width: 250px; height: auto; border-radius: 4px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); margin: 5px; object-fit: contain; }
        .footer { text-align: center; margin-top: 50px; font-size: 13px; color: #888; border-top: 1px solid #eee; padding-top: 20px; }
        @media print {
          body { background-color: #fff; padding: 0; }
          .container { box-shadow: none; max-width: 100%; padding: 0; }
          .no-print { display: none !important; }
          td { outline: none !important; }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1 class="title">BÁO CÁO NHANH KẾT QUẢ KHẢO SÁT GAP ISO 50001 (LITE)</h1>
        
        ${basicHtml}
        
        <h3>3. ĐÁNH GIÁ KHOẢNG CÁCH HỒ SƠ TÀI LIỆU VỚI ISO 50001:2018</h3>
        <table>
          <tr><th width="5%">STT</th><th width="10%">Điều khoản</th><th width="35%">Yêu cầu/Phát hiện ISO 50001:2018</th><th width="40%">Nhận xét hiện tại</th><th width="10%">Điểm</th></tr>
          ${gapRows}
        </table>
        ${dashboardHtml}
        <h3>4. ĐÁNH GIÁ KHU VỰC SỬ DỤNG NĂNG LƯỢNG (HIỆN TRƯỜNG)</h3>
        <table id="riskTable">
          <tr><th width="5%">STT</th><th width="20%">Tên khu vực / Máy</th><th width="15%">Loại</th><th width="30%">Phát hiện (Hiện trạng, Rủi ro, Cơ hội)</th><th width="22%">Hình ảnh chứng minh</th><th width="8%" class="no-print" style="text-align:center">Thao tác</th></tr>
          ${riskRows || '<tr><td colspan="6" style="text-align:center;color:#888;">Chưa có dữ liệu</td></tr>'}
        </table>
        <div class="no-print" style="text-align:right;">
          <button onclick="addRiskRow()" style="background:#4CAF50; color:#fff; border:none; padding:8px 16px; border-radius:4px; font-weight:bold; cursor:pointer;">+ Thêm dòng trống</button>
        </div>

        <div class="footer">
          Được trích xuất tự động từ Hệ thống Đánh giá GAP ISO 50001<br/>
          Mã khảo sát: ${d.meta.ref_no||""} - Ngày: ${new Date().toLocaleDateString('vi-VN')}
        </div>
      </div>
      
      <script>
        function deleteRow(btn) {
          if(!confirm('Bạn chắc chắn muốn xoá dòng báo cáo này?')) return;
          const tr = btn.closest('tr');
          if (tr) tr.parentNode.removeChild(tr);
          reindex();
        }
        function reindex() {
          const rows = document.querySelectorAll('#riskTable tbody tr');
          let i = 1;
          rows.forEach((tr) => {
            const sttCell = tr.querySelector('.stt');
            if(sttCell) { sttCell.innerText = i++; }
          });
        }
        function handlePaste(e, td) {
          const items = (e.clipboardData || e.originalEvent.clipboardData).items;
          for (let index in items) {
            const item = items[index];
            if (item.kind === 'file' && item.type.startsWith('image/')) {
              e.preventDefault(); 
              const blob = item.getAsFile();
              const reader = new FileReader();
              reader.onload = function(event) {
                const img = document.createElement('img');
                img.src = event.target.result;
                td.appendChild(img);
              };
              reader.readAsDataURL(blob);
              break;
            }
          }
        }
        function addRiskRow() {
          const tbody = document.querySelector('#riskTable tbody') || document.querySelector('#riskTable');
          if (!tbody) return;
          // Loại bỏ dòng "Chưa có dữ liệu" nếu có
          if(tbody.querySelector('td[colspan]')) {
             tbody.innerHTML = '<tr><th width="5%">STT</th><th width="20%">Tên thiết bị / Hệ thống</th><th width="15%">Loại</th><th width="30%">Phát hiện (Rủi ro & Cơ hội)</th><th width="22%">Hình ảnh chứng minh</th><th width="8%" class="no-print" style="text-align:center">Thao tác</th></tr>';
          }
          const tr = document.createElement('tr');
          tr.innerHTML = \`<td style="text-align:center" class="stt"></td>
            <td contenteditable="true" style="font-weight:bold"></td>
            <td contenteditable="true"></td>
            <td contenteditable="true"></td>
            <td tabindex="0" onpaste="handlePaste(event, this)" style="text-align: center; vertical-align: middle; padding: 5px; cursor: pointer;">
              <div style="font-size: 11px; color:#999; margin-bottom:5px;" class="no-print">[Click và nhấn Ctrl+V paste ảnh]</div>
            </td>
            <td class="no-print" style="text-align: center;">
              <button onclick="deleteRow(this)" style="background:#e53935; color:#fff; border:none; padding:6px 10px; border-radius:4px; font-size:12px; cursor:pointer;" title="Xoá dòng này">Xoá</button>
            </td>\`;
          tbody.appendChild(tr);
          reindex();
        }
      </script>
    </body>
    </html>
    `;

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename=Lite_Report_${survey.meta?.ref_no || 'GAP'}.html`);
    res.send(html);
  } catch (err) {
    if (err.name === "CastError") return res.status(400).json({ error: "Invalid id" });
    const msg = err.message || "";
    console.error("[surveys export lite html]", err);
    res.status(500).json({ error: msg || "Lỗi tạo báo cáo Lite HTML." });
  }
});

// NOTE: module.exports moved to end of file — ALL routes must be defined before export
router.get("/:id/export-html", requireMongo, async (req, res) => {
  try {
    const survey = await Survey.findById(req.params.id).lean();
    if (!survey) return res.status(404).json({ error: "Survey not found" });

    // Fetch images linked to this survey
    const images = await Evidence.find({ surveyId: survey._id, type: "image", source: { $ne: "document" } }).lean();

    const imagesByZoneId = {};
    const imagesByEqId = {};
    const imagesByClauseId = {};
    images.forEach(img => {
      const c = img.context || {};
      const clauseId = img.clauseId || c.clause;
      
      if (c.equipment) {
        if (!imagesByEqId[c.equipment]) imagesByEqId[c.equipment] = [];
        imagesByEqId[c.equipment].push(img);
      } else if (c.zone) {
        if (!imagesByZoneId[c.zone]) imagesByZoneId[c.zone] = [];
        imagesByZoneId[c.zone].push(img);
      }
      
      if (clauseId) {
        if (!imagesByClauseId[clauseId]) imagesByClauseId[clauseId] = [];
        imagesByClauseId[clauseId].push(img);
      }
    });

    const rowItems = []; 
    (survey.site_assessments || []).forEach(zone => {
      if (zone.notes && String(zone.notes).trim()) {
        rowItems.push({
          type: 'zone', id: zone.id,
          name1: zone.name || "Khu vực",
          name2: "Đánh giá chung khu vực",
          finding: zone.notes || "",
          rec: "",
          images: imagesByZoneId[zone.id] || []
        });
      }
      (zone.equipment || []).forEach(eq => {
        rowItems.push({
          type: 'equipment', id: eq.id,
          name1: zone.name || "",
          name2: eq.name || "",
          finding: eq.finding || "",
          rec: eq.recommendation || "",
          images: imagesByEqId[eq.id] || []
        });
      });
    });

    const actionPlanByClauseId = {};
    (survey.action_plan || []).forEach(ap => {
      if (ap.clause) actionPlanByClauseId[ap.clause] = ap.action;
    });

    const { GAP_CHECKLIST } = require("../gap.constants");
    GAP_CHECKLIST.forEach(item => {
      const resp = (survey.responses || {})[item.id];
      const imgs = [ ...(imagesByClauseId[item.id] || []), ...(imagesByClauseId[item.clause] || []) ];
      delete imagesByClauseId[item.id];
      delete imagesByClauseId[item.clause];
      const note = resp && resp.note ? String(resp.note).trim() : "";
      const rec = actionPlanByClauseId[item.id] ? String(actionPlanByClauseId[item.id]).trim() : "";
      
      if (imgs.length > 0) {
        imgs.forEach((img, index) => {
          rowItems.push({
            type: 'clause', id: item.id,
            name1: `Điều khoản ${item.clause}`,
            name2: `${item.id} - ${item.title}`,
            finding: index === 0 ? note : "", 
            rec: index === 0 ? rec : "", 
            images: [img], 
            imgNote: img.note || img.originalName || "" 
          });
        });
      } else if (note.length > 0 || rec.length > 0) {
        rowItems.push({
          type: 'clause', id: item.id,
          name1: `Điều khoản ${item.clause}`,
          name2: `${item.id} - ${item.title}`,
          finding: note, rec: rec, images: [], imgNote: ""
        });
      }
    });

    let trs = "";
    rowItems.forEach((item, index) => {
      let imgSrc = "";
      if (item.images && item.images.length > 0) {
        const img = item.images[0];
        const imgPath = path.resolve(__dirname, "../uploads", img.path || `${img.surveyId}/${img.filename}`);
        if (fs.existsSync(imgPath)) {
          const ext = img.filename.split('.').pop().toLowerCase() === 'png' ? 'png' : 'jpeg';
          const base64 = fs.readFileSync(imgPath, { encoding: 'base64' });
          imgSrc = `data:image/${ext};base64,${base64}`;
        }
      }
      
      const imgTag = imgSrc ? `<img src="${imgSrc}" alt="evidence" />` : "";
      const rowStyle = index % 2 === 0 ? 'background-color: #fafbfc;' : 'background-color: #ffffff;';
      
      const formatText = (txt) => {
        if (!txt) return "";
        return txt.replace(/\n/g, '<br/>').replace(/(rủi ro|high risk|nguy hiểm)/gi, '<strong style="color: #d32f2f;">$1</strong>').replace(/(cơ hội|khuyến nghị|tiết kiệm)/gi, '<strong style="color: #2e7d32;">$1</strong>');
      };

      trs += `
        <tr style="${rowStyle}">
          <td style="text-align: center; font-weight: bold;" class="stt">${index + 1}</td>
          <td contenteditable="true">${formatText(item.name1)}</td>
          <td contenteditable="true" style="font-weight: 600; color: #1565c0;">${formatText(item.name2)}</td>
          <td contenteditable="true">${formatText(item.finding)}</td>
          <td contenteditable="true" style="background-color: #f1f8e9;">${formatText(item.rec)}</td>
          <td tabindex="0" onpaste="handlePaste(event, this)" title="Paste (Ctrl+V) ảnh vào đây" style="text-align: center; vertical-align: middle; padding: 5px; cursor: pointer; border: 1px solid #ddd;">
            <div style="font-size: 11px; color:#999; margin-bottom:5px;" class="no-print">[Click và nhấn Ctrl+V paste thêm ảnh]</div>
            ${imgTag}
          </td>
          <td contenteditable="true" style="font-style: italic; color: #555;">${formatText(item.imgNote)}</td>
          <td class="no-print" style="text-align: center;">
            <button onclick="deleteRow(this)" style="background:#e53935; color:#fff; border:none; padding:6px 12px; border-radius:4px; cursor:pointer;" title="Xoá dòng này">Xoá</button>
          </td>
        </tr>
      `;
    });

    const html = `
    <!DOCTYPE html>
    <html lang="vi">
    <head>
      <meta charset="UTF-8">
      <title>Báo cáo Hiện trạng ISO 50001</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
        body {
          font-family: 'Inter', sans-serif;
          background-color: #f4f6f8;
          color: #333;
          padding: 30px;
          margin: 0;
        }
        .container {
          max-width: 1400px;
          margin: 0 auto;
          background: #fff;
          border-radius: 12px;
          padding: 30px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.08);
        }
        h1 {
          color: #0d47a1;
          text-align: center;
          font-size: 28px;
          margin-bottom: 5px;
        }
        h3 {
          color: #555;
          text-align: center;
          font-size: 16px;
          font-weight: 400;
          margin-bottom: 30px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          font-size: 14px;
          table-layout: fixed;
        }
        th {
          background-color: #1976d2;
          color: #fff;
          padding: 12px 10px;
          text-align: left;
          font-weight: 600;
          border: 1px solid #1565c0;
          position: relative;
        }
        td {
          padding: 12px 10px;
          border: 1px solid #ccc;
          vertical-align: top;
          line-height: 1.5;
          word-wrap: break-word;
        }
        td[contenteditable="true"]:focus {
          outline: 2px solid #ff9800;
          background: #fff8e1;
        }
        td:focus {
          outline: 2px solid #29b6f6;
        }
        img {
          width: 100%;
          height: auto;
          max-height: 450px;
          border-radius: 6px;
          box-shadow: 0 3px 6px rgba(0,0,0,0.15);
          object-fit: contain;
          margin-bottom: 8px;
        }
        .resizer {
          position: absolute;
          top: 0;
          right: 0;
          width: 5px;
          cursor: col-resize;
          user-select: none;
          height: 100%;
          z-index: 10;
        }
        .resizer:hover, .resizing {
          background-color: #ff9800;
        }
        .footer {
          text-align: center;
          margin-top: 30px;
          font-size: 13px;
          color: #888;
        }
        @media print {
          .no-print { display: none !important; }
          body { background-color: #fff; padding: 0; }
          .container { box-shadow: none; max-width: 100%; padding: 0; }
          td { outline: none !important; }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>BÁO CÁO HÌNH ẢNH HIỆN TRẠNG & CƠ HỘI CẢI TIẾN</h1>
        <h3>
          Nhiệm vụ kiểm toán, đánh giá độc lập<br/>
          Phiên khảo sát: ${survey.meta?.ref_no || "GAP"} - Khách hàng: ${survey.client?.name || "N/A"}<br/>
          Ngày khảo sát: ${survey.meta?.survey_date || "Chưa xác định"}
        </h3>
        <table>
          <thead>
            <tr>
              <th width="4%">STT</th>
              <th width="12%">Khu vực / Điều khoản</th>
              <th width="12%">Khu vực chi tiết</th>
              <th width="20%">Hiện trạng phát hiện</th>
              <th width="20%">Khuyến nghị / Hành động</th>
              <th width="18%" style="text-align: center;">Hình ảnh chứng minh</th>
              <th width="8%">Ghi chú ảnh</th>
              <th width="6%" class="no-print">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            ${trs}
          </tbody>
        </table>
        <div class="footer">
          Được trích xuất tự động từ Hệ thống Đánh giá GAP ISO 50001
        </div>
      </div>
      
      <script>
        function deleteRow(btn) {
          if(!confirm('Bạn chắc chắn muốn xoá dòng báo cáo này?')) return;
          const tr = btn.closest('tr');
          if (tr) tr.parentNode.removeChild(tr);
          reindex();
        }
        
        function reindex() {
          const rows = document.querySelectorAll('tbody tr');
          rows.forEach((tr, index) => {
            const sttCell = tr.querySelector('.stt');
            if(sttCell) sttCell.innerText = index + 1;
          });
        }
        
        function handlePaste(e, td) {
          const items = (e.clipboardData || e.originalEvent.clipboardData).items;
          for (let index in items) {
            const item = items[index];
            if (item.kind === 'file' && item.type.startsWith('image/')) {
              e.preventDefault(); 
              const blob = item.getAsFile();
              const reader = new FileReader();
              reader.onload = function(event) {
                const img = document.createElement('img');
                img.src = event.target.result;
                td.appendChild(img);
              };
              reader.readAsDataURL(blob);
              break;
            }
          }
        }

        // Logic Kéo chiều rộng cột (Thanh Drag)
        document.addEventListener('DOMContentLoaded', () => {
          const ths = document.querySelectorAll('th');
          ths.forEach(th => {
            const resizer = document.createElement('div');
            resizer.classList.add('resizer', 'no-print');
            th.appendChild(resizer);
            
            let x, w;
            const mouseDownHandler = function(e) {
              x = e.clientX;
              const styles = window.getComputedStyle(th);
              w = parseInt(styles.width, 10);
              document.addEventListener('mousemove', mouseMoveHandler);
              document.addEventListener('mouseup', mouseUpHandler);
              resizer.classList.add('resizing');
            };
            
            const mouseMoveHandler = function(e) {
              const dx = e.clientX - x;
              th.style.width = (w + dx) + "px";
            };
            
            const mouseUpHandler = function() {
              document.removeEventListener('mousemove', mouseMoveHandler);
              document.removeEventListener('mouseup', mouseUpHandler);
              resizer.classList.remove('resizing');
            };
            
            resizer.addEventListener('mousedown', mouseDownHandler);
          });
        });
      </script>
    </body>
    </html>
    `;

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename=Export_HTML_${survey.meta?.ref_no || 'GAP'}.html`);
    res.send(html);
  } catch (err) {
    if (err.name === "CastError") return res.status(400).json({ error: "Invalid id" });
    const msg = err.message || "";
    console.error("[surveys export html]", err);
    res.status(500).json({ error: msg || "Lỗi tạo báo cáo HTML." });
  }
});

module.exports = router;
