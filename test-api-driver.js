const mongoose = require('mongoose');

async function test() {
  const res = await fetch('http://localhost:5002/api/surveys', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      meta: { ref_no: 'TEST-DOTS-789' },
      client: { name: 'Test' },
      responses: { '4.1.1': { score: 3 } }
    })
  });
  const data = await res.json();
  console.log('CREATED ID:', data._id);

  await mongoose.connect('mongodb://mongo:27017/iso50001gap');
  const doc = await mongoose.connection.db.collection('surveys').findOne({
    _id: new mongoose.Types.ObjectId(data._id)
  });
  console.log('RESPONSES KEYS:', Object.keys(doc.responses || {}));
  console.log('4.1.1 IN DB:', doc.responses['4.1.1']);

  process.exit(0);
}
test();
