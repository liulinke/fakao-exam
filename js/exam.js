// 模拟考试：真实考场模式（绝对时间计时、不可暂停、全屏、自动交卷）
(function () {
  const $ = id => document.getElementById(id);
  let S = null;          // 考试状态（同步持久化到 fk_exam_active）
  let tick = null, qEnterAt = 0, warned = { w30: false, w10: false, w5: false };

  function save() { FK.store.set("exam_active", S); }
  function deadline() { return S.startedAt + S.durationSec * 1000 + (S.pausedMs || 0); }
  function remaining() { return (deadline() - Date.now()) / 1000; }

  // ---------- 初始化 ----------
  const existing = FK.store.get("exam_active", null);
  const paperId = FK.qs("paper") || (existing && existing.paperId) || "j1";

  if (existing) {
    if (Date.now() < existing.startedAt + existing.durationSec * 1000 + (existing.pausedMs || 0)) {
      $("resume-box").style.display = "";
      $("ready-box").style.display = "none";
      $("resume-info").textContent = `${FK_CONFIG.papers[existing.paperId].name} · 剩余 ${FK.fmtTime((existing.startedAt + existing.durationSec * 1000 + (existing.pausedMs || 0) - Date.now()) / 1000)}（关闭页面期间时间照常流逝）`;
      $("btn-resume").onclick = () => { S = existing; startUI(); };
      $("btn-void").onclick = () => { if (confirm("作废本次考试？将不计入成绩记录。")) { FK.store.del("exam_active"); location.reload(); } };
    } else { // 已超时：按现有作答自动交卷
      S = existing; submit(true); return;
    }
  } else {
    setupReady();
  }

  function setupReady() {
    const sel = $("sel-paper"), selScale = $("sel-scale"), selMode = $("sel-mode");
    sel.value = paperId;
    function refreshScale() {
      const canFull = FK_PAPER.feasible(sel.value, "full");
      selScale.querySelector('option[value="full"]').disabled = !canFull;
      if (!canFull) selScale.value = "half";
      $("scale-hint").textContent = canFull ? "" : "当前题库尚不足以组整卷，先提供半卷模拟（题库扩充后自动解锁）";
    }
    refreshScale();
    sel.onchange = refreshScale;
    $("btn-start").onclick = () => {
      if (!$("agree").checked) { alert("请先阅读并勾选考试须知"); return; }
      const built = FK_PAPER.build(sel.value, selScale.value);
      if (!built.qids.length) { alert("题库不足，无法组卷"); return; }
      S = {
        paperId: sel.value, scale: selScale.value, mode: selMode.value,
        startedAt: 0, durationSec: FK_CONFIG.scales[selScale.value].minutes * 60,
        pausedMs: 0, qids: built.qids, answers: {}, marks: [], times: {}, cur: 0
      };
      // 3秒倒计时开考
      $("ready-box").style.display = "none";
      $("countdown-box").style.display = "";
      let n = 3;
      $("cd-num").textContent = n;
      const cd = setInterval(() => {
        n--;
        if (n > 0) { $("cd-num").textContent = n; return; }
        clearInterval(cd);
        S.startedAt = Date.now(); save();
        if (S.mode === "real" && FK.settings.fullscreen) {
          document.documentElement.requestFullscreen && document.documentElement.requestFullscreen().catch(() => {});
        }
        startUI();
      }, 1000);
    };
  }

  // ---------- 考试界面 ----------
  function startUI() {
    $("resume-box") && ($("resume-box").style.display = "none");
    $("countdown-box").style.display = "none";
    $("exam-ui").style.display = "";
    $("paper-name").textContent = FK_CONFIG.papers[S.paperId].name + (S.scale === "half" ? "·半卷" : "") + (S.mode === "real" ? "" : "（练习考）");
    $("btn-pause").style.display = S.mode === "relax" ? "" : "none";
    renderSheet(); show(S.cur);
    tick = setInterval(onTick, 500);
    onTick();

    document.addEventListener("fullscreenchange", () => {
      if (S && S.mode === "real" && FK.settings.fullscreen && !document.fullscreenElement && remaining() > 3)
        $("fs-warn").style.display = "";
    });
    $("fs-warn-close").onclick = () => $("fs-warn").style.display = "none";
    $("fs-warn-back").onclick = () => { $("fs-warn").style.display = "none"; document.documentElement.requestFullscreen().catch(() => {}); };

    document.addEventListener("keydown", e => {
      if (!S || $("exam-ui").style.display === "none") return;
      const L = FK_QRENDER.keyToLetter(e);
      if (L) pick(L);
      else if (e.key === "ArrowRight") nav(1);
      else if (e.key === "ArrowLeft") nav(-1);
      else if (e.key.toLowerCase() === "m") toggleMark();
    });
    window.addEventListener("beforeunload", e => {
      if (S && remaining() > 0) { e.preventDefault(); e.returnValue = "考试进行中，离开后计时不会停止！"; }
    });
  }

  function onTick() {
    const r = remaining();
    const t = $("timer");
    t.textContent = FK.fmtTime(r);
    t.className = "timer" + (r <= 300 ? " warn5" : r <= 600 ? " warn10" : r <= 1800 ? " warn30" : "");
    if (r <= 1800 && !warned.w30) { warned.w30 = true; notice("剩余 30 分钟"); }
    if (r <= 600 && !warned.w10) { warned.w10 = true; notice("剩余 10 分钟，请把握时间"); }
    if (r <= 300 && !warned.w5) { warned.w5 = true; notice("剩余 5 分钟！未作答题目在答题卡中闪烁提示"); blinkUnanswered(); }
    if (r <= 0) { submit(true); }
  }
  function notice(msg) { const n = $("notice"); n.textContent = msg; n.style.display = ""; setTimeout(() => n.style.display = "none", 5000); }

  function pauseToggle() { // 仅练习考模式
    if (S.pausedAt) { S.pausedMs = (S.pausedMs || 0) + (Date.now() - S.pausedAt); delete S.pausedAt; $("btn-pause").textContent = "暂停"; $("pause-mask").style.display = "none"; tick = setInterval(onTick, 500); }
    else { S.pausedAt = Date.now(); clearInterval(tick); $("btn-pause").textContent = "继续"; $("pause-mask").style.display = ""; }
    save();
  }
  $("btn-pause").onclick = () => pauseToggle();
  $("pause-mask").onclick = () => pauseToggle();

  // ---------- 题目切换与作答 ----------
  function logTime() {
    if (!qEnterAt) return;
    const qid = S.qids[S.cur];
    S.times[qid] = (S.times[qid] || 0) + Math.round((Date.now() - qEnterAt) / 1000);
  }
  function show(i) {
    logTime();
    S.cur = Math.max(0, Math.min(S.qids.length - 1, i));
    qEnterAt = Date.now(); save();
    const qid = S.qids[S.cur], q = FK_QINDEX[qid];
    const box = $("q-box");
    box.innerHTML = FK_QRENDER.render(q, { no: S.cur + 1, picked: S.answers[qid] || [], reveal: false, showMeta: false })
      + `<div style="margin-top:14px;display:flex;gap:10px;flex-wrap:wrap">
           <button class="btn ghost" id="b-prev" ${S.cur === 0 ? "disabled" : ""}>← 上一题</button>
           <button class="btn ghost" id="b-mark">${S.marks.includes(qid) ? "取消标记" : "标记本题 (M)"}</button>
           <button class="btn secondary" id="b-next" ${S.cur === S.qids.length - 1 ? "disabled" : ""}>下一题 →</button>
         </div>`;
    const picked = S.answers[qid] || (S.answers[qid] = []);
    FK_QRENDER.bind(box, q, picked, () => {
      save(); rerenderOptions(q, picked); refreshCell(S.cur);
      $("progress").textContent = `已答 ${answeredCount()}/${S.qids.length}`;
    });
    $("b-prev").onclick = () => nav(-1);
    $("b-next").onclick = () => nav(1);
    $("b-mark").onclick = toggleMark;
    highlightCur();
    $("progress").textContent = `已答 ${answeredCount()}/${S.qids.length}`;
  }
  function rerenderOptions(q, picked) {
    const set = new Set(picked);
    document.querySelectorAll("#q-box .opt").forEach(el => el.classList.toggle("sel", set.has(el.dataset.k)));
  }
  function pick(letter) {
    const qid = S.qids[S.cur], q = FK_QINDEX[qid];
    const picked = S.answers[qid] || (S.answers[qid] = []);
    if (q.type === "single") { picked.length = 0; picked.push(letter); }
    else { const i = picked.indexOf(letter); i >= 0 ? picked.splice(i, 1) : picked.push(letter); }
    save(); rerenderOptions(q, picked); refreshCell(S.cur);
    $("progress").textContent = `已答 ${answeredCount()}/${S.qids.length}`;
  }
  function nav(d) { show(S.cur + d); }
  function toggleMark() {
    const qid = S.qids[S.cur];
    const i = S.marks.indexOf(qid);
    i >= 0 ? S.marks.splice(i, 1) : S.marks.push(qid);
    save(); refreshCell(S.cur); show(S.cur);
  }
  function answeredCount() { return S.qids.filter(id => (S.answers[id] || []).length).length; }

  // ---------- 答题卡 ----------
  function renderSheet() {
    const g = $("sheet-grid"); g.innerHTML = "";
    let lastType = "";
    S.qids.forEach((qid, i) => {
      const q = FK_QINDEX[qid];
      if (q.type !== lastType) {
        lastType = q.type;
        const lab = document.createElement("div");
        lab.className = "sec-label"; lab.style.gridColumn = "1/-1";
        lab.textContent = FK_CONFIG.typeNames[q.type];
        g.appendChild(lab);
      }
      const c = document.createElement("div");
      c.className = "cell"; c.id = "cell-" + i; c.textContent = i + 1;
      c.onclick = () => { show(i); if (window.innerWidth <= 760) $("sheet").classList.remove("open"); };
      g.appendChild(c);
    });
    S.qids.forEach((_, i) => refreshCell(i));
    $("drawer-handle").onclick = () => $("sheet").classList.toggle("open");
  }
  function refreshCell(i) {
    const qid = S.qids[i], c = $("cell-" + i);
    if (!c) return;
    c.classList.toggle("answered", (S.answers[qid] || []).length > 0);
    c.classList.toggle("marked", S.marks.includes(qid));
  }
  function highlightCur() {
    document.querySelectorAll(".cell.cur").forEach(c => c.classList.remove("cur"));
    const c = $("cell-" + S.cur); c && c.classList.add("cur");
  }
  function blinkUnanswered() {
    S.qids.forEach((qid, i) => {
      if (!(S.answers[qid] || []).length) { const c = $("cell-" + i); c && c.classList.add("blinkme"); }
    });
  }

  // ---------- 交卷 ----------
  $("btn-submit").onclick = () => {
    const un = S.qids.length - answeredCount();
    if (!confirm(`确认交卷？${un > 0 ? `还有 ${un} 题未作答。` : "已全部作答。"}剩余时间 ${FK.fmtTime(remaining())}`)) return;
    submit(false);
  };
  function submit(auto) {
    logTime();
    clearInterval(tick);
    const g = FK_GRADER.gradePaper(S.qids, S.answers, FK.settings.lenientInd);
    g.wrong.forEach(qid => FK.addWrong(qid));
    const rec = {
      ts: Date.now(), paperId: S.paperId, scale: S.scale, mode: S.mode,
      usedSec: Math.min(S.durationSec, Math.round((Date.now() - S.startedAt - (S.pausedMs || 0)) / 1000)),
      qids: S.qids, answers: S.answers, times: S.times,
      score: g.score, max: g.max, bySubject: g.bySubject, byType: g.byType, wrongCount: g.wrong.length,
      autoSubmit: !!auto
    };
    const idx = FK.pushExamRecord(rec);
    FK.store.del("exam_active");
    S = null;
    document.fullscreenElement && document.exitFullscreen().catch(() => {});
    location.href = "result.html?rec=" + idx;
  }
})();
