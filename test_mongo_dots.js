const mongoose = require("mongoose");
let originalFlatten = mongoose.set; // just checking what happens

const testDoc = new mongoose.Document({}, new mongoose.Schema({ responses: mongoose.Schema.Types.Mixed }, {strict:false}));
testDoc.responses = { "4.1.1": { score: 1, note: "abc" } };
testDoc.markModified("responses");
const delta = testDoc.$__getUpdate();
console.log(JSON.stringify(delta, null, 2));
