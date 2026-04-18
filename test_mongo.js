const mongoose = require("mongoose");
const Survey = require("./backend/models/Survey");
mongoose.connect("mongodb://127.0.0.1:27017/iso50001gap").then(async () => {
    let s = await Survey.findOne().sort({ createdAt: -1 });
    if (!s) s = new Survey({ meta: { ref_no: "TEST-123" }, client: { name: "Test" } });
    
    // Simulate frontend payload
    const updateData = { responses: { "4.1": { score: 2, note: "Test Note" } } };
    Object.assign(s, updateData);
    if ("responses" in updateData) s.markModified("responses");
    await s.save();
    
    // Fetch it again
    const s2 = await Survey.findById(s._id).lean();
    console.log("Responses 4.1 note:", s2.responses["4.1"]?.note);
    process.exit(0);
});
