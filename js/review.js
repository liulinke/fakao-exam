// 错题本：列表 / 重做
(function () {
  const $ = id => document.getElementById(id);
  let redoList = [], cur = 0, picked = [], revealed = false;

  function renderList() {
    const w = FK.wrongAll();
    const sort = $("r-sort").value, subj = $("r-subject").value;
    let items = Object.keys(w).map(qid => ({ qid, q: FK_QINDEX[qid], ...w[qid] })).filter(x => x.q);
    if (subj !== "all") items = items.filter(x => x.q.subject === subj);
    items.sort((a, b) => sort === "count" ? b.count - a.count : sort === "time" ? b.lastAt - a.lastAt : (b.starred - a.starred) || b.count - a.count);
    $("r-count").textContent = `共 ${items.length} 道错题`;
    const tb = $("r-body");
    tb.innerHTML = items.map(x => `
      <tr>
        <td><span class="tag">${FK.esc(x.q.subjectName)}</span>${FK.esc(x.q.stem.slice(0, 40))}…</td>
        <td>${x.count}次</td>
        <td>${new Date(x.lastAt).toLocaleDateString()}</td>
        <td>
          <button class="btn ghost" style="padding:2px 8px" data-star="${x.qid}">${x.starred ? "★" : "☆"}</button>
          <button class="btn ghost" style="padding:2px 8px" data-view="${x.qid}">看解析</button>
          <button class="btn ghost" style="padding:2px 8px" data-del="${x.qid}">移除</button>
        </td>
      </tr>`).join("") || `<tr><td colspan="4" class="muted">暂无错题，去练习或模拟考吧</td></tr>`;
    tb.querySelectorAll("[data-star]").forEach(b => b.onclick = () => {
      const w2 = FK.wrongAll(); w2[b.dataset.star].starred = !w2[b.dataset.star].starred;
      FK.store.set("wrong", w2); renderList();
    });
    tb.querySelectorAll("[data-del]").forEach(b => b.onclick = () => { FK.removeWrong(b.dataset.del); renderList(); });
    tb.querySelectorAll("[data-view]").forEach(b => b.onclick = () => {
      const q = FK_QINDEX[b.dataset.view];
      $("v-box").innerHTML = FK_QRENDER.render(q, { reveal: true, picked: [] });
      FK_QRENDER.bind($("v-box"), q, [], () => {});
      $("view-card").style.display = "";
      $("view-card").scrollIntoView({ behavior: "smooth" });
    });
    // 重做按钮状态
    $("btn-redo").disabled = items.length === 0;
    $("btn-redo").onclick = () => startRedo(items.map(x => x.qid));
  }

  // 科目筛选下拉
  const selS = $("r-subject");
  for (const s in FK_CONFIG.subjects) {
    const o = document.createElement("option");
    o.value = s; o.textContent = FK_CONFIG.subjects[s].name;
    selS.appendChild(o);
  }
  selS.onchange = renderList;
  $("r-sort").onchange = renderList;
  $("v-close").onclick = () => $("view-card").style.display = "none";

  // ---- 重做 ----
  function startRedo(qids) {
    redoList = FK.shuffle(qids); cur = 0;
    $("list-card").style.display = "none";
    $("redo-card").style.display = "";
    showRedo();
  }
  function showRedo() {
    revealed = false; picked = [];
    const q = FK_QINDEX[redoList[cur]];
    $("redo-progress").textContent = `错题重做 ${cur + 1} / ${redoList.length}（答对2次自动移出，加星的除外）`;
    const box = $("redo-box");
    box.innerHTML = FK_QRENDER.render(q, { picked, reveal: false });
    FK_QRENDER.bind(box, q, picked, () => {
      box.querySelectorAll(".opt").forEach(el => el.classList.toggle("sel", picked.includes(el.dataset.k)));
      if (q.type === "single") confirmRedo();
    });
    $("redo-confirm").style.display = q.type === "single" ? "none" : "";
    $("redo-next").style.display = "none";
  }
  function confirmRedo() {
    if (revealed || !picked.length) return;
    revealed = true;
    const q = FK_QINDEX[redoList[cur]];
    const g = FK_GRADER.grade(q, picked, false);
    g.correct ? FK.wrongRedoRight(q.id) : FK.addWrong(q.id);
    const box = $("redo-box");
    box.innerHTML = FK_QRENDER.render(q, { picked, reveal: true });
    FK_QRENDER.bind(box, q, [], () => {});
    $("redo-confirm").style.display = "none";
    $("redo-next").style.display = "";
    $("redo-next").textContent = cur === redoList.length - 1 ? "完成" : "下一题 →";
  }
  $("redo-confirm").onclick = confirmRedo;
  $("redo-next").onclick = () => {
    if (cur === redoList.length - 1) { $("redo-card").style.display = "none"; $("list-card").style.display = ""; renderList(); return; }
    cur++; showRedo();
  };
  $("redo-quit").onclick = () => { $("redo-card").style.display = "none"; $("list-card").style.display = ""; renderList(); };

  renderList();
})();
