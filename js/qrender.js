// 题目渲染组件：考试页 / 练习页 / 错题本 / 成绩回看 共用
// opts: {no, picked:[], reveal:boolean, onPick(letter), showMeta:boolean}
window.FK_QRENDER = {
  render(q, opts) {
    const o = opts || {}, picked = new Set(o.picked || []);
    const ansSet = new Set(q.answer);
    const multi = q.type !== "single";
    const typeName = window.FK_CONFIG.typeNames[q.type];
    let html = "";
    if (o.showMeta !== false) {
      html += `<div class="muted"><span class="tag">${FK.esc(typeName)}</span><span class="tag">${FK.esc(q.subjectName)}</span>${q.chapter ? `<span class="tag">${FK.esc(q.chapter)}</span>` : ""}难度 ${"★".repeat(q.difficulty || 3)}</div>`;
    }
    html += `<div class="q-stem">${o.no ? `<span class="q-no">${o.no}.</span>` : ""}${FK.esc(q.stem)}${multi ? `<span class="muted">（${q.type === "multi" ? "多选" : "不定项"}）</span>` : ""}</div>`;
    for (const k of ["A", "B", "C", "D"]) {
      let cls = "opt";
      if (o.reveal) {
        if (ansSet.has(k)) cls += " right";
        else if (picked.has(k)) cls += " wrong";
      } else if (picked.has(k)) cls += " sel";
      html += `<div class="${cls}" data-k="${k}"><span class="k">${k}</span><span>${FK.esc(q.options[k])}</span></div>`;
    }
    if (o.reveal) {
      const my = [...picked].sort().join("") || "未作答";
      const right = my === q.answer.slice().sort().join("");
      html += `<div class="analysis">
        <div class="verdict ${right ? "ok" : "bad"}">${right ? "✓ 回答正确" : "✗ 回答错误"}　正确答案：${q.answer.join("")}　你的答案：${my}</div>
        <div>${FK.esc(q.analysis)}</div>
        ${q.lawBasis && q.lawBasis.length ? `<div class="law">依据：${q.lawBasis.map(FK.esc).join("；")}</div>` : ""}
        <div class="law"><a href="#" data-report="${q.id}">题目有误？点此报错</a></div>
      </div>`;
    }
    return html;
  },
  // 绑定选项点击。container 内已渲染 render() 输出
  bind(container, q, picked, onChange) {
    container.querySelectorAll(".opt").forEach(el => {
      el.addEventListener("click", () => {
        const k = el.dataset.k;
        if (q.type === "single") { picked.length = 0; picked.push(k); }
        else {
          const i = picked.indexOf(k);
          i >= 0 ? picked.splice(i, 1) : picked.push(k);
        }
        onChange && onChange(picked);
      });
    });
    const rep = container.querySelector("[data-report]");
    if (rep) rep.addEventListener("click", e => {
      e.preventDefault();
      const list = FK.store.get("reported", []);
      if (!list.includes(q.id)) { list.push(q.id); FK.store.set("reported", list); }
      rep.textContent = "已记录，可在统计页导出报错列表";
    });
  },
  // 键盘：A-D/1-4 选择
  keyToLetter(e) {
    const m = { "1": "A", "2": "B", "3": "C", "4": "D", a: "A", b: "B", c: "C", d: "D" };
    return m[e.key.toLowerCase()];
  }
};
