// 组卷算法：按科目配额抽题，尽量贴近题型配额，排除最近2次考过的题，试卷按 单选→多选→不定项 排列
window.FK_PAPER = {
  // 返回 {ok, qids, missing:[...]}
  build(paperId, scale) {
    const cfg = window.FK_CONFIG;
    const quotas = cfg.papers[paperId].quotas[scale];
    const targets = Object.assign({}, cfg.scales[scale].typeTargets); // 剩余题型目标
    const excludeRecent = FK.settings.excludeRecent;

    // 最近2次同卷考试用过的题
    const recent = new Set();
    if (excludeRecent) {
      FK.examRecords().filter(r => r.paperId === paperId).slice(-2)
        .forEach(r => r.qids.forEach(id => recent.add(id)));
    }

    const picked = [], missing = [];
    for (const subj in quotas) {
      const need = quotas[subj];
      let pool = (window.FK_BANK[subj] || []).slice();
      let usable = pool.filter(q => !recent.has(q.id));
      if (usable.length < need) usable = pool; // 池不够时允许重复历史题
      if (usable.length < need) {
        missing.push({ subj, name: cfg.subjects[subj].name, need, have: usable.length });
        picked.push(...FK.shuffle(usable));
        continue;
      }
      // 按剩余题型目标优先抽题
      const byType = { single: [], multi: [], indeterminate: [] };
      FK.shuffle(usable).forEach(q => byType[q.type] && byType[q.type].push(q));
      const sel = [];
      for (let i = 0; i < need; i++) {
        // 选剩余占比最高的题型
        const order = Object.keys(targets).sort((a, b) =>
          (targets[b] / cfg.scales[scale].typeTargets[b]) - (targets[a] / cfg.scales[scale].typeTargets[a]));
        let q = null;
        for (const t of order) { if (byType[t].length && targets[t] > 0) { q = byType[t].pop(); targets[t]--; break; } }
        if (!q) { // 目标已满或该型无题，任取
          for (const t of ["single", "multi", "indeterminate"]) if (byType[t].length) { q = byType[t].pop(); if (targets[t] > 0) targets[t]--; break; }
        }
        if (q) sel.push(q);
      }
      picked.push(...sel);
    }

    // 难度均衡提示（不强制换题，MVP 记录均值即可）
    const avgDiff = picked.reduce((a, q) => a + (q.difficulty || 3), 0) / (picked.length || 1);

    // 排列：单选 → 多选 → 不定项，各段内打乱
    const seg = { single: [], multi: [], indeterminate: [] };
    picked.forEach(q => seg[q.type].push(q));
    const qids = [...FK.shuffle(seg.single), ...FK.shuffle(seg.multi), ...FK.shuffle(seg.indeterminate)].map(q => q.id);

    return { ok: missing.length === 0, qids, missing, avgDiff: Math.round(avgDiff * 10) / 10 };
  },

  // 检查某卷某规格题库是否够用
  feasible(paperId, scale) {
    const quotas = window.FK_CONFIG.papers[paperId].quotas[scale];
    for (const s in quotas) if ((window.FK_BANK[s] || []).length < quotas[s]) return false;
    return true;
  }
};
