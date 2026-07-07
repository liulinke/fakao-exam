// 统计分析：科目雷达、成绩曲线、刷题热力、薄弱章节（自绘 canvas，零依赖）
(function () {
  const $ = id => document.getElementById(id);
  const css = v => getComputedStyle(document.documentElement).getPropertyValue(v).trim();

  // ---- 汇总各科正确率（练习 + 考试） ----
  function subjectAccuracy() {
    const acc = {}; // subj -> {r, n}
    const p = FK.store.get("practice", {});
    for (const qid in p) {
      const q = FK_QINDEX[qid]; if (!q) continue;
      const a = acc[q.subject] || (acc[q.subject] = { r: 0, n: 0 });
      a.r += p[qid].r; a.n += p[qid].r + p[qid].w;
    }
    FK.examRecords().forEach(rec => {
      rec.qids.forEach(qid => {
        const q = FK_QINDEX[qid]; if (!q) return;
        const g = FK_GRADER.grade(q, rec.answers[qid], false);
        const a = acc[q.subject] || (acc[q.subject] = { r: 0, n: 0 });
        a.r += g.correct ? 1 : 0; a.n += 1;
      });
    });
    return acc;
  }

  // ---- 雷达图 ----
  function radar() {
    const acc = subjectAccuracy();
    const subs = Object.keys(acc).filter(s => acc[s].n >= 3);
    const cv = $("radar"), ctx = cv.getContext("2d");
    const W = cv.width = 460, H = cv.height = 380, cx = W / 2, cy = H / 2 + 8, R = 130;
    ctx.clearRect(0, 0, W, H);
    if (subs.length < 3) { ctx.fillStyle = css("--muted"); ctx.font = "14px sans-serif"; ctx.fillText("每科答满3题后生成雷达图", cx - 90, cy); return; }
    const n = subs.length;
    ctx.strokeStyle = css("--border"); ctx.fillStyle = css("--muted"); ctx.font = "12px sans-serif";
    for (let ring = 1; ring <= 4; ring++) {
      ctx.beginPath();
      for (let i = 0; i <= n; i++) {
        const a = -Math.PI / 2 + i * 2 * Math.PI / n, r = R * ring / 4;
        i ? ctx.lineTo(cx + r * Math.cos(a), cy + r * Math.sin(a)) : ctx.moveTo(cx + r * Math.cos(a), cy + r * Math.sin(a));
      }
      ctx.stroke();
    }
    subs.forEach((s, i) => {
      const a = -Math.PI / 2 + i * 2 * Math.PI / n;
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + R * Math.cos(a), cy + R * Math.sin(a)); ctx.stroke();
      const lx = cx + (R + 18) * Math.cos(a), ly = cy + (R + 14) * Math.sin(a);
      ctx.textAlign = Math.abs(Math.cos(a)) < .3 ? "center" : Math.cos(a) > 0 ? "left" : "right";
      const name = FK_CONFIG.subjects[s].name.replace(/（.*）/, "");
      ctx.fillText(`${name} ${Math.round(acc[s].r / acc[s].n * 100)}%`, lx, ly);
    });
    ctx.beginPath();
    subs.forEach((s, i) => {
      const a = -Math.PI / 2 + i * 2 * Math.PI / n, r = R * (acc[s].r / acc[s].n);
      i ? ctx.lineTo(cx + r * Math.cos(a), cy + r * Math.sin(a)) : ctx.moveTo(cx + r * Math.cos(a), cy + r * Math.sin(a));
    });
    ctx.closePath();
    ctx.strokeStyle = css("--primary"); ctx.lineWidth = 2; ctx.stroke();
    ctx.globalAlpha = .18; ctx.fillStyle = css("--primary"); ctx.fill(); ctx.globalAlpha = 1;
  }

  // ---- 成绩曲线 ----
  function scoreLine() {
    const recs = FK.examRecords().filter(r => r.mode !== undefined);
    const cv = $("line"), ctx = cv.getContext("2d");
    const W = cv.width = 460, H = cv.height = 240;
    ctx.clearRect(0, 0, W, H);
    if (!recs.length) { ctx.fillStyle = css("--muted"); ctx.font = "14px sans-serif"; ctx.fillText("暂无模拟考记录", 170, 120); return; }
    const pad = 34, iw = W - pad * 2, ih = H - pad * 2;
    ctx.strokeStyle = css("--border"); ctx.fillStyle = css("--muted"); ctx.font = "11px sans-serif";
    [0, 50, 100, 150].forEach(v => {
      const y = H - pad - ih * v / 150;
      ctx.beginPath(); ctx.moveTo(pad, y); ctx.lineTo(W - pad, y); ctx.stroke();
      ctx.fillText(v, 8, y + 4);
    });
    // 合格参考线 90（按整卷折算）
    const yPass = H - pad - ih * 90 / 150;
    ctx.strokeStyle = css("--ok"); ctx.setLineDash([4, 4]);
    ctx.beginPath(); ctx.moveTo(pad, yPass); ctx.lineTo(W - pad, yPass); ctx.stroke(); ctx.setLineDash([]);
    ctx.strokeStyle = css("--primary"); ctx.lineWidth = 2; ctx.beginPath();
    recs.forEach((r, i) => {
      const norm = r.max ? r.score / r.max * 150 : 0; // 折算为整卷150分制
      const x = pad + (recs.length === 1 ? iw / 2 : iw * i / (recs.length - 1));
      const y = H - pad - ih * norm / 150;
      i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    });
    ctx.stroke();
    ctx.fillStyle = css("--primary");
    recs.forEach((r, i) => {
      const norm = r.max ? r.score / r.max * 150 : 0;
      const x = pad + (recs.length === 1 ? iw / 2 : iw * i / (recs.length - 1));
      const y = H - pad - ih * norm / 150;
      ctx.beginPath(); ctx.arc(x, y, 3.5, 0, 7); ctx.fill();
    });
    $("line-note").textContent = "分数已折算为整卷150分制；绿虚线为单卷90分达标参考线";
  }

  // ---- 刷题热力（近12周） ----
  function heat() {
    const daily = FK.store.get("daily", {});
    const box = $("heat"); box.innerHTML = "";
    const days = 12 * 7;
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(Date.now() - i * 864e5).toISOString().slice(0, 10);
      const n = daily[d] || 0;
      const el = document.createElement("i");
      el.className = n >= 30 ? "l3" : n >= 10 ? "l2" : n > 0 ? "l1" : "";
      el.title = `${d}：${n} 题`;
      box.appendChild(el);
    }
  }

  // ---- 薄弱章节 ----
  function weak() {
    const agg = {}; // subj|chapter -> {r,n}
    const p = FK.store.get("practice", {});
    const add = (q, correct) => {
      const k = q.subject + "|" + q.chapter;
      const a = agg[k] || (agg[k] = { r: 0, n: 0, q });
      a.r += correct ? 1 : 0; a.n++;
    };
    for (const qid in p) { const q = FK_QINDEX[qid]; if (q) { for (let i = 0; i < p[qid].r; i++) add(q, true); for (let i = 0; i < p[qid].w; i++) add(q, false); } }
    FK.examRecords().forEach(rec => rec.qids.forEach(qid => {
      const q = FK_QINDEX[qid]; if (!q) return;
      add(q, FK_GRADER.grade(q, rec.answers[qid], false).correct);
    }));
    const rows = Object.values(agg).filter(a => a.n >= 3)
      .map(a => ({ ...a, rate: a.r / a.n })).sort((x, y) => x.rate - y.rate).slice(0, 10);
    $("weak-body").innerHTML = rows.map(a => `
      <div class="bar-row">
        <span class="lab">${FK.esc(a.q.subjectName)} · ${FK.esc(a.q.chapter)}</span>
        <div class="bar-track"><div class="bar-fill" style="width:${Math.round(a.rate * 100)}%;background:${a.rate < .5 ? "var(--bad)" : a.rate < .75 ? "var(--warn)" : "var(--ok)"}"></div></div>
        <span class="muted">${Math.round(a.rate * 100)}% (${a.n}题)</span>
        <a href="practice.html?subject=${a.q.subject}">去练习</a>
      </div>`).join("") || `<p class="muted">每章节答满3题后显示薄弱点排行</p>`;
  }

  // ---- 数据管理 ----
  $("btn-export").onclick = FK.exportData;
  $("file-import").onchange = e => {
    if (!e.target.files[0]) return;
    FK.importData(e.target.files[0], err => { alert(err ? "导入失败：" + err.message : "导入成功"); location.reload(); });
  };
  $("btn-report").onclick = () => {
    const list = FK.store.get("reported", []);
    if (!list.length) { alert("暂无报错记录"); return; }
    const blob = new Blob([JSON.stringify(list, null, 1)], { type: "application/json" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "reported-questions.json"; a.click();
  };
  $("chk-lenient").checked = FK.settings.lenientInd;
  $("chk-lenient").onchange = e => { FK.settings.lenientInd = e.target.checked; FK.saveSettings(); };
  $("chk-exclude").checked = FK.settings.excludeRecent;
  $("chk-exclude").onchange = e => { FK.settings.excludeRecent = e.target.checked; FK.saveSettings(); };
  $("chk-fs").checked = FK.settings.fullscreen;
  $("chk-fs").onchange = e => { FK.settings.fullscreen = e.target.checked; FK.saveSettings(); };

  radar(); scoreLine(); heat(); weak();
  new MutationObserver(() => { radar(); scoreLine(); }).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
})();
