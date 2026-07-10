// 公共：localStorage 封装、主题、导航、工具函数
window.FK = (function () {
  const P = "fk_";
  const store = {
    get(k, d) { try { const v = localStorage.getItem(P + k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { localStorage.setItem(P + k, JSON.stringify(v)); },
    del(k) { localStorage.removeItem(P + k); }
  };

  const settings = Object.assign(
    { dark: null, lenientInd: false, excludeRecent: true, fullscreen: true },
    store.get("settings", {})
  );
  function saveSettings() { store.set("settings", settings); }

  // ---- 主题 ----
  function applyTheme() {
    const dark = settings.dark === null
      ? window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches
      : settings.dark;
    document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
  }
  function toggleTheme() {
    const cur = document.documentElement.getAttribute("data-theme") === "dark";
    settings.dark = !cur; saveSettings(); applyTheme();
  }

  // ---- 错题 ----
  function wrongAll() { return store.get("wrong", {}); }
  function addWrong(qid) {
    const w = wrongAll();
    const e = w[qid] || { count: 0, lastAt: 0, starred: false, rightStreak: 0 };
    e.count++; e.lastAt = Date.now(); e.rightStreak = 0;
    w[qid] = e; store.set("wrong", w);
  }
  function wrongRedoRight(qid) { // 重做答对：连对2次自动移出
    const w = wrongAll(); const e = w[qid];
    if (!e) return;
    e.rightStreak = (e.rightStreak || 0) + 1;
    if (e.rightStreak >= 2 && !e.starred) delete w[qid]; else w[qid] = e;
    store.set("wrong", w);
  }
  function removeWrong(qid) { const w = wrongAll(); delete w[qid]; store.set("wrong", w); }

  // ---- 练习进度 ----
  function practiceLog(qid, right) {
    const p = store.get("practice", {});
    const e = p[qid] || { r: 0, w: 0 };
    right ? e.r++ : e.w++; e.last = Date.now();
    p[qid] = e; store.set("practice", p);
    const day = new Date().toISOString().slice(0, 10);
    const daily = store.get("daily", {});
    daily[day] = (daily[day] || 0) + 1; store.set("daily", daily);
  }

  // ---- 考试记录 ----
  function examRecords() { return store.get("exam_records", []); }
  function pushExamRecord(rec) {
    const rs = examRecords(); rs.push(rec);
    while (rs.length > 30) rs.shift();
    store.set("exam_records", rs); return rs.length - 1;
  }

  // ---- 导入导出 ----
  const KEYS = ["settings", "exam_records", "wrong", "practice", "daily", "exam_active", "reported"];
  function exportData() {
    const out = {}; KEYS.forEach(k => out[k] = store.get(k, null));
    const blob = new Blob([JSON.stringify({ fk_export: 1, at: Date.now(), data: out }, null, 1)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "fakao-backup-" + new Date().toISOString().slice(0, 10) + ".json";
    a.click();
  }
  function importData(file, cb) {
    const r = new FileReader();
    r.onload = () => {
      try {
        const j = JSON.parse(r.result);
        if (!j.fk_export) throw new Error("格式不对");
        KEYS.forEach(k => { if (j.data[k] !== null && j.data[k] !== undefined) store.set(k, j.data[k]); });
        cb(null);
      } catch (e) { cb(e); }
    };
    r.readAsText(file);
  }

  // ---- 工具 ----
  function shuffle(a) {
    a = a.slice();
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1));[a[i], a[j]] = [a[j], a[i]]; }
    return a;
  }
  function fmtTime(sec) {
    sec = Math.max(0, Math.round(sec));
    const h = Math.floor(sec / 3600), m = Math.floor(sec % 3600 / 60), s = sec % 60;
    return [h, m, s].map(n => String(n).padStart(2, "0")).join(":");
  }
  function esc(s) { return String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c])); }
  function qs(name) { return new URLSearchParams(location.search).get(name); }

  // ---- 页面头部 ----
  function renderNav(active) {
    const items = [["index", "首页"], ["practice", "练习"], ["review", "错题本"], ["stats", "统计"], ["guide", "备考指南"]];
    const nav = document.getElementById("nav");
    if (!nav) return;
    nav.innerHTML = items.map(([id, label]) =>
      `<a href="${id}.html" class="${id === active ? 'active' : ''}">${label}</a>`).join("") +
      `<button class="theme-btn" onclick="FK.toggleTheme()" title="切换深浅色">◐</button>`;
  }

  applyTheme();
  return { store, settings, saveSettings, toggleTheme, wrongAll, addWrong, wrongRedoRight, removeWrong, practiceLog, examRecords, pushExamRecord, exportData, importData, shuffle, fmtTime, esc, qs, renderNav };
})();

// ---- PWA：注册 Service Worker，实现离线可用 + 可安装到主屏幕 ----
if ("serviceWorker" in navigator && (location.protocol === "http:" || location.protocol === "https:")) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  });
}
