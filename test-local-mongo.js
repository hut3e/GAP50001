const { MongoClient } = require("mongodb");
async function run() {
  const client = new MongoClient("mongodb://127.0.0.1:27017");
  await client.connect();
  const db = client.db("iso50001gap");
  
  // Insert a test document
  const res = await db.collection("test").insertOne({ _id: 1, name: "test", responses: {} });
  
  // Update it using the EXACT logic I used in my code
  const updateData = { responses: { "4.1.1": { score: 1, note: "hello" } } };
  
  try {
     await db.collection("test").updateOne({ _id: 1 }, { $set: updateData });
     console.log("UPDATE SUCCESS!");
  } catch (err) {
     console.log("UPDATE FAILED!!!", err.message);
  }
  
  const doc = await db.collection("test").findOne({ _id: 1 });
  console.log("FETCHED DOC RESPONSES:", doc.responses);
  
  await db.collection("test").deleteOne({ _id: 1 });
  await client.close();
}
run();
