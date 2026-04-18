const mongoose = require("mongoose");
const Survey = require("./backend/models/Survey");
mongoose.connect("mongodb://127.0.0.1:27017/iso50001gap").then(async () => {
    let s = new Survey({ meta: { ref_no: "TEST-404" }, client: { name: "Test" } });
    await s.save();
    
    let dbS = await Survey.findById(s._id);
    const updateData = { responses: { "4.1.1": { score: 2, note: "Test Note with dot", id: "4.1.1" } } };
    Object.assign(dbS, updateData);
    if ("responses" in updateData) dbS.markModified("responses");
    await dbS.save();
    
    const finalS = await Survey.findById(s._id).lean();
    console.log("Keys:", Object.keys(finalS.responses || {}));
    console.log("Data:", (finalS.responses || {})["4.1.1"]);
    process.exit(0);
}).catch(e => { console.error(e); process.exit(1); });
