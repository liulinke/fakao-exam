// 题库注册与索引。data/bank/*.js 通过 registerBank(subject, questions) 注册
window.FK_BANK = {};          // subject -> [question]
window.FK_QINDEX = {};        // qid -> question

window.registerBank = function (subject, questions) {
  const meta = window.FK_CONFIG.subjects[subject];
  questions.forEach(q => {
    q.subject = subject;
    q.subjectName = meta ? meta.name : subject;
    window.FK_QINDEX[q.id] = q;
  });
  window.FK_BANK[subject] = (window.FK_BANK[subject] || []).concat(questions);
};

window.FK_BANK_UTIL = {
  bySubject(s) { return window.FK_BANK[s] || []; },
  get(qid) { return window.FK_QINDEX[qid]; },
  chapters(s) {
    const set = new Set();
    (window.FK_BANK[s] || []).forEach(q => set.add(q.chapter));
    return [...set];
  },
  total() { return Object.keys(window.FK_QINDEX).length; },
  countBySubject() {
    const out = {};
    for (const s in window.FK_BANK) out[s] = window.FK_BANK[s].length;
    return out;
  }
};
