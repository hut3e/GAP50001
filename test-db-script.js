const mongoose = require('mongoose');
mongoose.connect('mongodb://mongo:27017/iso50001gap').then(async () => {
  const doc = await mongoose.connection.db.collection('surveys').findOne({}, {sort:{createdAt:-1}});
  console.log('responses keys:', Object.keys(doc.responses||{}));
  console.log('4.1.1:', JSON.stringify(doc.responses && doc.responses['4.1.1']));
  process.exit(0);
}).catch(console.error);
