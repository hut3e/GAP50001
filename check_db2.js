require("mongoose").connect(process.env.MONGO_URI || "mongodb://admin:secret@iso50001-mongo:27017/iso50001gap?authSource=admin").then(async () => {
  const db = require("mongoose").connection.db;
  const doc = await db.collection("surveys").findOne({}, {sort:{createdAt:-1}});
  console.log("RAW DOC KEYS:", Object.keys(doc));
  console.log("RESPONSES TYPE:", typeof doc.responses);
  if (doc.responses) {
     console.log("RESPONSES KEYS:", Object.keys(doc.responses));
     console.log("4.1.1:", doc.responses["4.1.1"]);
  }
  process.exit(0);
}).catch(e => { console.error(e); process.exit(1); });
