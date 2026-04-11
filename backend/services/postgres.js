const { Pool } = require("pg");

const pool = new Pool({
  host: process.env.POSTGRES_HOST || "127.0.0.1",
  port: parseInt(process.env.POSTGRES_PORT, 10) || 5432,
  user: process.env.POSTGRES_USER || "admin",
  password: process.env.POSTGRES_PASSWORD || "adminpassword",
  database: process.env.POSTGRES_DB || "iso50001gap",
  max: 10,
  idleTimeoutMillis: 30000,
});

async function initDB() {
  try {
    const client = await pool.connect();
    // Tạo bảng surveys nếu chưa có
    await client.query(`
      CREATE TABLE IF NOT EXISTS surveys (
        id VARCHAR(255) PRIMARY KEY,
        ref_no VARCHAR(255),
        client_name VARCHAR(255),
        data JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS clients (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255),
        site VARCHAR(255),
        industry VARCHAR(255),
        annual_energy VARCHAR(255),
        cert_status VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS auditors (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255),
        org VARCHAR(255),
        role VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    client.release();
    console.log("PostgreSQL connected — table: surveys (JSONB enabled)");
  } catch (err) {
    console.error("PostgreSQL connection/init error:", err.message);
  }
}

/**
 * Đồng bộ lưu Realtime vào PostgreSQL song song với MongoDB
 * @param {Object} surveyDoc - Đối tượng Survey đã lean() hoặc plain JS object
 */
async function syncSurveyToPostgres(surveyDoc) {
  if (!surveyDoc || !surveyDoc._id) return;
  const idStr = String(surveyDoc._id);
  const refNo = surveyDoc.meta?.ref_no || "";
  const clientName = surveyDoc.client?.name || "";
  
  // Dọn dẹp sơ bộ trước khi lưu
  const jsonbData = { ...surveyDoc };
  if (jsonbData._id) delete jsonbData._id;

  try {
    const query = `
      INSERT INTO surveys (id, ref_no, client_name, data, updated_at)
      VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
      ON CONFLICT (id) 
      DO UPDATE SET 
        ref_no = EXCLUDED.ref_no,
        client_name = EXCLUDED.client_name,
        data = EXCLUDED.data,
        updated_at = EXCLUDED.updated_at;
    `;
    const values = [idStr, refNo, clientName, JSON.stringify(jsonbData)];
    await pool.query(query, values);
  } catch (err) {
    console.error("[Postgres Sync] Lỗi đồng bộ Survey ID:", idStr, err.message);
  }
}

async function syncClientToPostgres(doc) {
  if (!doc || !doc._id) return;
  try {
    const query = `
      INSERT INTO clients (id, name, site, industry, annual_energy, cert_status, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
      ON CONFLICT (id) DO UPDATE SET 
        name = EXCLUDED.name, site = EXCLUDED.site, industry = EXCLUDED.industry,
        annual_energy = EXCLUDED.annual_energy, cert_status = EXCLUDED.cert_status, updated_at = EXCLUDED.updated_at;
    `;
    await pool.query(query, [String(doc._id), doc.name, doc.site||"", doc.industry||"", doc.annual_energy||"", doc.cert_status||""]);
  } catch(e) { console.error("Sync client PG error", e.message); }
}

async function syncAuditorToPostgres(doc) {
  if (!doc || !doc._id) return;
  try {
    const query = `
      INSERT INTO auditors (id, name, org, role, updated_at)
      VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
      ON CONFLICT (id) DO UPDATE SET 
        name = EXCLUDED.name, org = EXCLUDED.org, role = EXCLUDED.role, updated_at = EXCLUDED.updated_at;
    `;
    await pool.query(query, [String(doc._id), doc.name, doc.org||"", doc.role||""]);
  } catch(e) { console.error("Sync auditor PG error", e.message); }
}

module.exports = { pool, initDB, syncSurveyToPostgres, syncClientToPostgres, syncAuditorToPostgres };
