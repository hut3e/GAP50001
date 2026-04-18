const mongoose = require("mongoose");
const Survey = require("./backend/models/Survey");
async function run() {
  await mongoose.connect("mongodb://root:H9M2Bexj5@localhost:27017/iso50001gap?authSource=admin");
  const gap = await Survey.findOne().sort({ createdAt: -1 }).lean();
  console.log("SURVEY ID:", gap._id);
  console.log("RESPONSES keys:", Object.keys(gap.responses || {}));
  console.log("4.1.1 ->", gap.responses["4.1.1"]);
  process.exit();
}
run();
