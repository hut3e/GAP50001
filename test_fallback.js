const GAP_CHECKLIST = [ { id: "4.1.1" }, { id: "4.1.2"} ];
const imagesByClauseId = {};
const survey = {
    responses: {
        "4.1.1": { score: 1, note: "dgsdgsdfgf" }
    }
};

(async function applyLiteFallbacks(survey) {
    survey.responses = survey.responses || {};
    GAP_CHECKLIST.forEach(item => {
       const resp = survey.responses[item.id] || {};
       let currNote = resp.note || "";
       const eviList = [ ...(imagesByClauseId[item.id] || []), ...(imagesByClauseId[item.clause] || []) ];
       if (eviList.length > 0) {
          const appended = eviList.map(e => e.note || e.originalName).filter(Boolean).join("\n- ");
          if (appended) currNote += (currNote ? "\n- " : "") + appended;
       }
       if (!survey.responses[item.id]) survey.responses[item.id] = {};
       survey.responses[item.id].note = currNote;
    });
})(survey);

console.log(JSON.stringify(survey.responses, null, 2));
