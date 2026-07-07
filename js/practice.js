// 科目练习：筛选 → 逐题作答 → 即时判分展示解析
(function () {
  const $ = id => document.getElementById(id);
  let list = [], cur = 0, picked = [], revealed = false, right = 0, wrongN = 0;

  // 科目下拉
  const selS = $("f-subject");
  for (const s in FK_CONFIG.subjects) {
    const n = (FK_BANK[s] || []).length;
    if (!n) continue;
    const o = document.createElement("option");
    o.value = s; o.textContent = `${FK_CONFIG.subjects[s].name}（${n}题）`;
    selS.appendChild(o);
  }
  const pre = FK.qs("subject");
  if (pre && FK_BANK[pre]) selS.value = pre;
  refreshChapters();
  selS.onchange = refreshChapters;

  function refreshChapters() {
    const box = $("f-chapters");
    box.innerHTML = "";
    FK_BANK_UTIL.chapters(selS.value).forEach(ch => {
      const id = "ch-" + ch;
      box.insertAdjacentHTML("beforeend",
        `<label class="chk"><input type="checkbox" value="${FK.esc(ch)}" checked> ${FK.esc(ch)}</label>`);
    });
  }

  $("btn-go").onclick = () => {
    const chosen = new Set([...$("f-chapters").querySelectorAll("input:checked")].map(i => i.value));
    const type = $("f-type").value, diff = $("f-diff").value;
    const onlyNew = $("f-new").checked;
    const done = FK.store.get("practice", {});
    list = (FK_BANK[selS.value] || []).filter(q =>
      chosen.has(q.chapter) &&
      (type === "all" || q.type === type) &&
      (diff === "all" || (diff === "easy" ? (q.difficulty || 3) <= 2 : diff === "mid" ? (q.difficulty || 3) === 3 : (q.difficulty || 3) >= 4)) &&
      (!onlyNew || !done[q.id])
    );
    if ($("f-order").value === "random") list = FK.shuffle(list);
    if (!list.length) { alert("没有符合条件的题目"); return; }
    cur = 0; right = 0; wrongN = 0;
    $("filter-card").style.display = "none";
    $("q-card").style.display = "";
    show();
  };

  function show() {
    revealed = false; picked = [];
    const q = list[cur];
    $("p-progress").textContent = `${cur + 1} / ${list.length}　本轮正确 ${right} 错 ${wrongN}`;
    const box = $("p-box");
    box.innerHTML = FK_QRENDER.render(q, { no: cur + 1, picked, reveal: false });
    FK_QRENDER.bind(box, q, picked, () => {
      box.querySelectorAll(".opt").forEach(el => el.classList.toggle("sel", picked.includes(el.dataset.k)));
      if (q.type === "single") submitAnswer(); // 单选点即判
    });
    $("btn-confirm").style.display = q.type === "single" ? "none" : "";
    $("btn-next").style.display = "none";
  }

  function submitAnswer() {
    if (revealed) return;
    if (!picked.length) { alert("请先选择答案"); return; }
    revealed = true;
    const q = list[cur];
    const g = FK_GRADER.grade(q, picked, false);
    g.correct ? right++ : (wrongN++, FK.addWrong(q.id));
    FK.practiceLog(q.id, g.correct);
    const box = $("p-box");
    box.innerHTML = FK_QRENDER.render(q, { no: cur + 1, picked, reveal: true });
    FK_QRENDER.bind(box, q, [], () => {});
    $("btn-confirm").style.display = "none";
    $("btn-next").style.display = "";
    $("btn-next").textContent = cur === list.length - 1 ? "完成本轮" : "下一题 →";
    $("p-progress").textContent = `${cur + 1} / ${list.length}　本轮正确 ${right} 错 ${wrongN}`;
  }

  function next() {
    if (cur === list.length - 1) {
      alert(`本轮完成：${list.length} 题，正确 ${right}，正确率 ${Math.round(right / list.length * 100)}%`);
      $("filter-card").style.display = "";
      $("q-card").style.display = "none";
      return;
    }
    cur++; show();
  }

  $("btn-confirm").onclick = submitAnswer;
  $("btn-next").onclick = next;
  $("btn-quit").onclick = () => { $("filter-card").style.display = ""; $("q-card").style.display = "none"; };

  document.addEventListener("keydown", e => {
    if ($("q-card").style.display === "none") return;
    if (e.key === "Enter") { revealed ? next() : submitAnswer(); return; }
    if (revealed) { if (e.key === "ArrowRight") next(); return; }
    const L = FK_QRENDER.keyToLetter(e);
    if (!L) return;
    const q = list[cur];
    if (q.type === "single") { picked.length = 0; picked.push(L); submitAnswer(); }
    else {
      const i = picked.indexOf(L); i >= 0 ? picked.splice(i, 1) : picked.push(L);
      document.querySelectorAll("#p-box .opt").forEach(el => el.classList.toggle("sel", picked.includes(el.dataset.k)));
    }
  });
})();
