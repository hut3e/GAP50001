const fetch = require("node-fetch");
async function run() {
  try {
    const list = await (await fetch("http://localhost:5002/api/surveys")).json();
    if (!list.length) return console.log("No surveys");
    const doc = list[0];
    const updated = { ...doc, travel_logs: [...(doc.travel_logs || []), { who: "FrontendTest", depart_date: "2024-01-01" }] };
    console.log("SENDING:", updated.travel_logs);
    
    const putRes = await fetch("http://localhost:5002/api/surveys/" + doc._id, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updated)
    });
    
    const data = await putRes.json();
    console.log("RECEIVED:", data.travel_logs);
    
    const list2 = await (await fetch("http://localhost:5002/api/surveys")).json();
    console.log("NEW LIST0 TRAVEL LOGS:", list2.find(x => x._id === doc._id).travel_logs);
  } catch(e) { console.error(e); }
  process.exit();
}
run();
