// 判分器：单选1分；多选/不定项2分，须与标准答案完全一致（宽松模式下不定项少选按比例给分）
window.FK_GRADER = {
  // 返回 {score, max, correct:boolean}
  grade(q, picked, lenientInd) {
    const max = window.FK_CONFIG.typeScore[q.type];
    const ans = q.answer.slice().sort().join("");
    const got = (picked || []).slice().sort().join("");
    if (got === ans) return { score: max, max, correct: true };
    if (q.type === "indeterminate" && lenientInd && got.length > 0) {
      // 宽松：只选了部分正确项且无错选，按比例给分（四舍五入到0.5）
      const a = new Set(q.answer), hasWrong = (picked || []).some(x => !a.has(x));
      if (!hasWrong) {
        const s = Math.round((picked.length / q.answer.length) * max * 2) / 2;
        return { score: Math.min(s, max - 0.5), max, correct: false };
      }
    }
    return { score: 0, max, correct: false };
  },
  gradePaper(qids, answers, lenientInd) {
    const res = { score: 0, max: 0, bySubject: {}, byType: {}, wrong: [] };
    qids.forEach(qid => {
      const q = window.FK_QINDEX[qid];
      if (!q) return;
      const g = this.grade(q, answers[qid], lenientInd);
      res.score += g.score; res.max += g.max;
      const s = res.bySubject[q.subject] || (res.bySubject[q.subject] = { got: 0, max: 0, name: q.subjectName });
      s.got += g.score; s.max += g.max;
      const t = res.byType[q.type] || (res.byType[q.type] = { got: 0, max: 0 });
      t.got += g.score; t.max += g.max;
      if (!g.correct) res.wrong.push(qid);
    });
    return res;
  }
};
