
const mongoose = require("mongoose");
const Survey = require("./models/Survey");
const { initDB, syncSurveyToPostgres } = require("./services/postgres");

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/iso50001gap";

async function run() {
  await initDB();
  await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 8000 });
  console.log("Connected to MongoDB for sync.");

  const surveys = await Survey.find().lean();
  console.log(`Found ${surveys.length} surveys in MongoDB.`);

  for (const survey of surveys) {
    if (!survey.meta) survey.meta = {};
    if (!survey.client) survey.client = {};
    // Fallback names for empty ones
    survey.meta.ref_no = survey.meta.ref_no || `UNKNOWN-${survey._id}`;
    survey.client.name = survey.client.name || `CLIENT-${survey._id}`;
    
    await syncSurveyToPostgres(survey);
  }
  
  console.log("Done syncing to PostgreSQL.");
  process.exit(0);
}

run();
