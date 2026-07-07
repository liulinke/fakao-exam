// 成绩报告：总分、分科/题型得分率、耗时分析、逐题回看
(function () {
  const $ = id => document.getElementById(id);
  const recs = FK.examRecords();
  let idx = parseInt(FK.qs("rec"), 10);
  if (isNaN(idx) || !recs[idx]) idx = recs.length - 1;
  const rec = recs[idx];
  if (!rec) { document.querySelector(".wrap").innerHTML = '<div class="card"><p>暂无考试记录。</p><a class="btn" href="exam.html">去模拟考试</a></div>'; return; }

  const cfgP = FK_CONFIG.papers[rec.paperId];
  const normScore = Math.round(rec.score / rec.max * 150 * 10) / 10;
  const pass = normScore >= 90;
  $("r-title").textContent = `${cfgP.name}${rec.scale === "half" ? "·半卷" : ""} · ${new Date(rec.ts).toLocaleString()}${rec.autoSubmit ? "（到时自动交卷）" : ""}`;
  $("r-score").innerHTML = `${rec.score} <span class="muted" style="font-size:16px">/ ${rec.max}</span>`;
  $("r-verdict").innerHTML = `折算150分制约 <strong>${normScore}</strong> 分 · ${pass ? '<span style="color:var(--ok)">达到单卷90分参考线 ✓</span>' : '<span style="color:var(--bad)">未达单卷90分参考线</span>'}（合格线为两卷合计180分）`;
  $("r-time").textContent = `用时 ${FK.fmtTime(rec.usedSec)} ｜ 错题 ${rec.wrongCount} 道（已进入错题本）`;

  // 分科得分
  $("r-subjects").innerHTML = Object.values(rec.bySubject).map(s => `
    <div class="bar-row">
      <span class="lab">${FK.esc(s.name)}</span>
      <div class="bar-track"><div class="bar-fill" style="width:${Math.round(s.got / s.max * 100)}%"></div></div>
      <span class="muted">${s.got}/${s.max}</span>
    </div>`).join("");
  // 题型得分
  $("r-types").innerHTML = Object.keys(rec.byType).map(t => {
    const x = rec.byType[t];
    return `<div class="bar-row"><span class="lab">${FK_CONFIG.typeNames[t]}</span>
      <div class="bar-track"><div class="bar-fill" style="width:${Math.round(x.got / x.max * 100)}%"></div></div>
      <span class="muted">${x.got}/${x.max}</span></div>`;
  }).join("");

  // 耗时最长10题
  const slow = rec.qids.map((qid, i) => ({ qid, i, t: rec.times[qid] || 0 }))
    .sort((a, b) => b.t - a.t).slice(0, 10).filter(x => x.t > 0);
  $("r-slow").innerHTML = slow.map(x => {
    const q = FK_QINDEX[x.qid];
    return `<tr><td>第${x.i + 1}题</td><td>${q ? FK.esc(q.subjectName) : ""}</td><td>${FK.fmtTime(x.t)}</td><td><a href="#rq-${x.i}">查看</a></td></tr>`;
  }).join("") || '<tr><td colspan="4" class="muted">无耗时数据</td></tr>';
  const perQ = rec.usedSec / rec.qids.length;
  $("r-pace").textContent = `平均每题 ${Math.round(perQ)} 秒（真实考场节奏约 108 秒/题）`;

  // 逐题回看
  let filterWrong = false;
  function renderAll() {
    const box = $("r-questions");
    box.innerHTML = "";
    rec.qids.forEach((qid, i) => {
      const q = FK_QINDEX[qid];
      if (!q) return;
      const g = FK_GRADER.grade(q, rec.answers[qid], FK.settings.lenientInd);
      if (filterWrong && g.correct) return;
      const div = document.createElement("div");
      div.className = "card"; div.id = "rq-" + i;
      div.innerHTML = FK_QRENDER.render(q, { no: i + 1, picked: rec.answers[qid] || [], reveal: true });
      FK_QRENDER.bind(div, q, [], () => {});
      box.appendChild(div);
    });
  }
  $("chk-wrong-only").onchange = e => { filterWrong = e.target.checked; renderAll(); };
  renderAll();
})();
