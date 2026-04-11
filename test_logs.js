const mongoose = require("mongoose");
const Survey = require("./backend/models/Survey");

async function run() {
  await mongoose.connect("mongodb://localhost:27017/gap50001", { useNewUrlParser: true, useUnifiedTopology: true });
  const survey = await Survey.findOne();
  if (!survey) { console.log("No survey found"); return; }
  console.log("Before:", { travel: survey.travel_logs, hotel: survey.hotel_logs });
  
  survey.travel_logs = [{ who: "Test Auditor", depart_date: "2024-01-01" }];
  survey.markModified("travel_logs");
  await survey.save();
  
  const updated = await Survey.findById(survey._id).lean();
  console.log("After:", { travel: updated.travel_logs, hotel: updated.hotel_logs });
  process.exit();
}
run();
