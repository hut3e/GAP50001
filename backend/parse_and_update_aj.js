const fs = require('fs');
const mongoose = require('mongoose');

const text = fs.readFileSync('/Users/admin/Downloads/NEW_DOCUMENTATION.txt', 'utf8');
const lines = text.split('\n');

const validClauses = [
  "4.1","4.2","4.3","4.4",
  "5.1","5.2","5.3",
  "6.1","6.2","6.3.1","6.3.2","6.3.3","6.4","6.5","6.6",
  "7.1","7.2","7.3","7.4","7.5",
  "8.1","8.2","8.3",
  "9.1.1","9.1.2","9.2","9.3",
  "10.1","10.2"
];

const data = {};
let currentClause = null;
let currentField = 0; // 0: note, 1: recommendation, 2: ghi chu

for (let i = 0; i < lines.length; i++) {
  let line = lines[i].trim();
  if(!line) continue;
  
  // Try to find a clause header like "4.2." or "8.1."
  let match = line.match(/^(\d+\.\d+(\.\d+)?)\.?/);
  if (match) {
    let cl = match[1];
    if (validClauses.includes(cl)) {
      currentClause = cl;
      data[cl] = { note: "", recommendation: "", extra_notes: [] };
      currentField = 0;
      continue;
    }
  }

  // Not a clause header, but maybe a main header like "5. Vai trò của Lãnh đạo"? Ignore.
  if (line.match(/^\d+\.\s+[A-Z]/u) && !line.match(/^\d+\.\d+/)) continue;

  if (currentClause) {
    if (currentField === 0) {
      if (line.startsWith("Hoàn toàn tương đồng") || line.toLowerCase().includes("hoàn toàn tương đồng")) {
        data[currentClause].extra_notes.push(line);
        currentField = 2;
      } else if (line.match(/^(Thực hiện|Thiết lập|Xây dựng|Phân công|Đào tạo|Rà soát|Ban hành|Bổ sung)/) && !line.includes("Công ty")) {
        // usually recommendation
        data[currentClause].recommendation += (data[currentClause].recommendation ? "\n" : "") + line;
        currentField = 1;
      } else {
        data[currentClause].note += (data[currentClause].note ? "\n" : "") + line;
      }
    } else if (currentField === 1) {
      if (line.startsWith("Hoàn toàn tương đồng") || line.toLowerCase().includes("hoàn toàn tương đồng")) {
        data[currentClause].extra_notes.push(line);
        currentField = 2;
      } else {
        data[currentClause].recommendation += (data[currentClause].recommendation ? "\n" : "") + line;
      }
    } else if (currentField === 2) {
      data[currentClause].extra_notes.push(line);
    }
  }
}

mongoose.connect('mongodb://localhost:27017/iso50001gap', {useNewUrlParser: true, useUnifiedTopology: true}).then(async () => {
  const survey = await mongoose.connection.collection('surveys').findOne({ _id: new mongoose.Types.ObjectId('69d1586b78d2a4d27b562dd6') });
  if(survey) {
     const responses = survey.responses || {};
     for(let cl in data) {
        if(!responses[cl]) responses[cl] = { score: 0 };
        if(data[cl].note) responses[cl].note = data[cl].note;
        if(data[cl].recommendation) responses[cl].recommendation = data[cl].recommendation;
        data[cl].extra_notes.forEach(note => {
            if(!responses[cl].extra_notes) responses[cl].extra_notes = [];
            if(!responses[cl].extra_notes.includes(note)) responses[cl].extra_notes.push(note);
        });
        if(data[cl].note && data[cl].note.includes("chưa") && !data[cl].note.includes("đã")) {
           responses[cl].score = responses[cl].score || 2;
        } else if (data[cl].note && data[cl].note.includes("chưa")) {
           responses[cl].score = responses[cl].score || 3;
        } else if (data[cl].note && data[cl].note.includes("đã")) {
           responses[cl].score = responses[cl].score || 4;
        }
     }
     await mongoose.connection.collection('surveys').updateOne({ _id: survey._id }, { $set: { responses: responses } });
     console.log("Updated A&J Survey responses successfully.");
  }
  process.exit(0);
});
