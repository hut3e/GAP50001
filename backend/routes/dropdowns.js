/**
 * ISO 50001 GAP — Dropdowns CRUD API
 * Quản lý các mục tùy chỉnh cho dropdown: equipment_type, zone_type
 *
 * Routes:
 *   GET    /api/iso50001/gap/dropdowns            — Tất cả categories (built-in + custom)
 *   GET    /api/iso50001/gap/dropdowns/:category  — Một category cụ thể
 *   POST   /api/iso50001/gap/dropdowns            — Thêm custom item
 *   PUT    /api/iso50001/gap/dropdowns/:id        — Cập nhật item (bất kỳ)
 *   DELETE /api/iso50001/gap/dropdowns/:id        — Xóa (chỉ custom item)
 *   POST   /api/iso50001/gap/dropdowns/seed       — Seed built-in items từ constants
 */
const express = require("express");
const mongoose = require("mongoose");
const DropdownItem = require("../models/DropdownItem");
const { EQUIPMENT_TYPES, ZONE_TYPES } = require("../gap.constants");

const router = express.Router();

const mongoOk = () => mongoose.connection.readyState === 1;

const VALID_CATEGORIES = ["equipment_type", "zone_type"];

// Built-in items từ constants (để merge khi DB không có hoặc chưa seed)
function getBuiltins(category) {
  if (category === "equipment_type") {
    return EQUIPMENT_TYPES.map((t, i) => ({
      category: "equipment_type",
      id: t.id, name: t.name, icon: t.icon || "⚙️",
      checks: t.checks || [], ref_std: t.ref_std || "", desc: "",
      isCustom: false, order: i, active: true,
    }));
  }
  if (category === "zone_type") {
    return ZONE_TYPES.map((t, i) => ({
      category: "zone_type",
      id: t.id, name: t.name, icon: t.icon || "🏭",
      desc: t.desc || "", checks: [], ref_std: "",
      isCustom: false, order: i, active: true,
    }));
  }
  return [];
}

// Merge built-in + custom từ DB (DB override built-in nếu cùng id)
async function getMerged(category) {
  const builtins = getBuiltins(category);
  if (!mongoOk()) return builtins;

  const dbItems = await DropdownItem.find({ category, active: true }).sort({ order: 1, createdAt: 1 }).lean();

  // Map DB items theo id để override
  const dbMap = {};
  for (const it of dbItems) dbMap[it.id] = it;

  // Merge: built-ins first (potentially overridden), then custom-only DB items
  const merged = builtins.map(b => dbMap[b.id] ? { ...b, ...dbMap[b.id] } : b);
  const customOnly = dbItems.filter(it => it.isCustom && !builtins.find(b => b.id === it.id));
  return [...merged, ...customOnly];
}

// ── GET /api/iso50001/gap/dropdowns ──────────────────────────────────
router.get("/", async (req, res) => {
  try {
    const [equipment, zone] = await Promise.all([
      getMerged("equipment_type"),
      getMerged("zone_type"),
    ]);
    res.json({ equipment_type: equipment, zone_type: zone });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── GET /api/iso50001/gap/dropdowns/:category ────────────────────────
router.get("/:category", async (req, res) => {
  const { category } = req.params;
  if (!VALID_CATEGORIES.includes(category))
    return res.status(400).json({ error: `category phải là: ${VALID_CATEGORIES.join(", ")}` });
  try {
    const items = await getMerged(category);
    res.json(items);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── POST /api/iso50001/gap/dropdowns ────────────────────────────────
// Thêm custom item mới
router.post("/", async (req, res) => {
  if (!mongoOk()) return res.status(503).json({ error: "MongoDB chưa kết nối." });
  const { category, id, name, icon, desc, checks, ref_std, order } = req.body || {};
  if (!VALID_CATEGORIES.includes(category))
    return res.status(400).json({ error: `category phải là: ${VALID_CATEGORIES.join(", ")}` });
  if (!id?.trim() || !name?.trim())
    return res.status(400).json({ error: "id và name là bắt buộc." });

  // Tạo id tự động nếu không có prefix
  const safeId = String(id).trim().toUpperCase();

  try {
    const existing = await DropdownItem.findOne({ category, id: safeId }).lean();
    if (existing) return res.status(409).json({ error: `ID "${safeId}" đã tồn tại trong category "${category}".` });

    const item = await DropdownItem.create({
      category,
      id: safeId,
      name: String(name).trim(),
      icon: icon || (category === "equipment_type" ? "⚙️" : "🏭"),
      desc: desc || "",
      checks: Array.isArray(checks) ? checks : [],
      ref_std: ref_std || "",
      order: order != null ? Number(order) : 9999,
      isCustom: true,
      active: true,
    });
    res.status(201).json(item);
  } catch (e) {
    if (e.code === 11000) return res.status(409).json({ error: `ID "${safeId}" đã tồn tại.` });
    res.status(500).json({ error: e.message });
  }
});

// ── PUT /api/iso50001/gap/dropdowns/:itemId ──────────────────────────
// Cập nhật item (built-in hoặc custom)
router.put("/:itemId", async (req, res) => {
  if (!mongoOk()) return res.status(503).json({ error: "MongoDB chưa kết nối." });
  const { itemId } = req.params;
  const { category, name, icon, desc, checks, ref_std, order, active } = req.body || {};

  if (!category || !VALID_CATEGORIES.includes(category))
    return res.status(400).json({ error: `category phải là: ${VALID_CATEGORIES.join(", ")}` });

  try {
    // Tìm trong DB hoặc tạo bản ghi override cho built-in
    let doc = await DropdownItem.findOne({ category, id: itemId });
    if (!doc) {
      // Kiểm tra xem có phải built-in không
      const builtins = getBuiltins(category);
      const builtin = builtins.find(b => b.id === itemId);
      if (!builtin) return res.status(404).json({ error: `Không tìm thấy item "${itemId}".` });
      // Tạo bản ghi DB cho built-in để lưu override
      doc = new DropdownItem({ ...builtin });
    }

    if (name  !== undefined) doc.name    = String(name).trim();
    if (icon  !== undefined) doc.icon    = icon;
    if (desc  !== undefined) doc.desc    = desc;
    if (checks !== undefined) doc.checks = Array.isArray(checks) ? checks : [];
    if (ref_std !== undefined) doc.ref_std = ref_std;
    if (order !== undefined) doc.order   = Number(order);
    if (active !== undefined) doc.active  = !!active;

    await doc.save();
    res.json(doc);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── DELETE /api/iso50001/gap/dropdowns/:itemId ───────────────────────
// Chỉ xóa custom item; built-in có thể ẩn bằng active=false
router.delete("/:itemId", async (req, res) => {
  if (!mongoOk()) return res.status(503).json({ error: "MongoDB chưa kết nối." });
  const { itemId } = req.params;
  const { category } = req.query;

  if (!category || !VALID_CATEGORIES.includes(category))
    return res.status(400).json({ error: `Truyền ?category=equipment_type|zone_type` });

  try {
    const doc = await DropdownItem.findOne({ category, id: itemId });
    if (!doc) return res.status(404).json({ error: `Không tìm thấy item "${itemId}".` });
    if (!doc.isCustom) {
      // Built-in: ẩn thay vì xóa
      doc.active = false;
      await doc.save();
      return res.json({ ok: true, hidden: true, message: "Built-in item đã được ẩn khỏi dropdown." });
    }
    await doc.deleteOne();
    res.json({ ok: true, deleted: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── POST /api/iso50001/gap/dropdowns/seed ───────────────────────────
// Seed built-in items từ constants vào DB (bỏ qua nếu đã tồn tại)
router.post("/seed", async (req, res) => {
  if (!mongoOk()) return res.status(503).json({ error: "MongoDB chưa kết nối." });
  try {
    let inserted = 0, skipped = 0;
    for (const category of VALID_CATEGORIES) {
      const builtins = getBuiltins(category);
      for (const item of builtins) {
        const exists = await DropdownItem.findOne({ category, id: item.id }).lean();
        if (exists) { skipped++; continue; }
        await DropdownItem.create(item);
        inserted++;
      }
    }
    res.json({ ok: true, inserted, skipped, total: inserted + skipped });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
