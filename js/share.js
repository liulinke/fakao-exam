// 成绩分享卡片：用 canvas 绘制分数 + 二维码，生成分享图供用户下载晒朋友圈/小红书
window.FK_SHARE = (function () {
  // 卡片二维码扫码后跳转到这里（分享引流入口）
  const BASE_URL = "https://www.liulinke.com/p/fakaomoni/";

  /**
   * 生成成绩分享卡片并渲染到指定 DOM 容器
   * @param {HTMLElement} container - 放置 canvas 的容器
   * @param {Object} rec - 考试记录对象
   */
  function render(container, rec) {
    if (!container || !rec) return;

    const cfgP = FK_CONFIG.papers[rec.paperId];
    const normScore = Math.round(rec.score / rec.max * 150 * 10) / 10;
    const pass = normScore >= 90;
    const W = 600, H = 900;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    // 创建 canvas
    const canvas = document.createElement("canvas");
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = W + "px";
    canvas.style.height = H + "px";
    canvas.style.maxWidth = "100%";
    canvas.style.borderRadius = "12px";
    canvas.style.boxShadow = "0 2px 12px rgba(0,0,0,0.1)";
    const ctx = canvas.getContext("2d");
    ctx.scale(dpr, dpr);

    // ---- 背景渐变 ----
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, "#1a5fb4");
    bg.addColorStop(0.6, "#2a7de1");
    bg.addColorStop(1, "#e7effa");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // ---- 顶部标题区 ----
    ctx.fillStyle = "rgba(255,255,255,0.95)";
    roundRect(ctx, 20, 20, W - 40, 60, 10);
    ctx.fill();
    ctx.fillStyle = "#1a5fb4";
    ctx.font = "bold 22px -apple-system, 'PingFang SC', 'Microsoft YaHei', sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("⚖ 法考模拟考试成绩", W / 2, 50);

    // ---- 分数展示区 ----
    let y = 110;
    ctx.fillStyle = "#ffffff";
    roundRect(ctx, 20, y, W - 40, 220, 12);
    ctx.fill();

    // 大分数
    ctx.fillStyle = pass ? "#2ec27e" : "#e01b24";
    ctx.font = "bold 80px -apple-system, 'PingFang SC', sans-serif";
    ctx.fillText(rec.score, W / 2 - 40, y + 80);
    ctx.fillStyle = "#6b6b6b";
    ctx.font = "28px -apple-system, 'PingFang SC', sans-serif";
    ctx.fillText("/ " + rec.max, W / 2 + 60, y + 80);

    // 折算分数 + 达标提示
    ctx.fillStyle = "#1c1c1c";
    ctx.font = "20px -apple-system, 'PingFang SC', sans-serif";
    ctx.fillText("折算150分制：" + normScore + " 分", W / 2, y + 130);
    ctx.fillStyle = pass ? "#2ec27e" : "#e01b24";
    ctx.font = "bold 18px -apple-system, 'PingFang SC', sans-serif";
    ctx.fillText(pass ? "达到单卷90分参考线 ✓" : "未达单卷90分参考线", W / 2, y + 165);
    ctx.fillStyle = "#6b6b6b";
    ctx.font = "14px -apple-system, 'PingFang SC', sans-serif";
    ctx.fillText("（合格线为两卷合计180分）", W / 2, y + 190);

    // ---- 试卷信息 + 时间 ----
    y = 350;
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    roundRect(ctx, 20, y, W - 40, 70, 10);
    ctx.fill();
    ctx.fillStyle = "#1c1c1c";
    ctx.font = "bold 18px -apple-system, 'PingFang SC', sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(cfgP.name + (rec.scale === "half" ? " · 半卷" : ""), 40, y + 28);
    ctx.fillStyle = "#6b6b6b";
    ctx.font = "15px -apple-system, 'PingFang SC', sans-serif";
    ctx.fillText(new Date(rec.ts).toLocaleString("zh-CN"), 40, y + 52);

    // ---- 分科目得分条 ----
    y = 440;
    ctx.fillStyle = "#ffffff";
    roundRect(ctx, 20, y, W - 40, 260, 12);
    ctx.fill();
    ctx.fillStyle = "#1c1c1c";
    ctx.font = "bold 18px -apple-system, 'PingFang SC', sans-serif";
    ctx.textAlign = "left";
    ctx.fillText("分科目得分", 40, y + 30);

    const subjects = Object.values(rec.bySubject);
    const barY = y + 55;
    const barH = 18;
    const barGap = 32;
    subjects.forEach(function (s, i) {
      const by = barY + i * barGap;
      ctx.fillStyle = "#1c1c1c";
      ctx.font = "15px -apple-system, 'PingFang SC', sans-serif";
      ctx.textAlign = "left";
      ctx.fillText(s.name, 40, by + barH / 2 + 5);
      const barW = W - 160;
      const barX = 200;
      ctx.fillStyle = "#e0ddd6";
      roundRect(ctx, barX, by, barW, barH, 4);
      ctx.fill();
      const fillW = Math.max(0, Math.round(barW * (s.got / s.max)));
      ctx.fillStyle = "#1a5fb4";
      roundRect(ctx, barX, by, fillW, barH, 4);
      ctx.fill();
      ctx.fillStyle = "#6b6b6b";
      ctx.font = "14px -apple-system, 'PingFang SC', sans-serif";
      ctx.textAlign = "right";
      ctx.fillText(s.got + "/" + s.max, W - 40, by + barH / 2 + 5);
    });

    // ---- 底部二维码 + 引流文案 ----
    y = 720;
    ctx.fillStyle = "#ffffff";
    roundRect(ctx, 20, y, W - 40, 160, 12);
    ctx.fill();
    ctx.fillStyle = "#1c1c1c";
    ctx.font = "bold 16px -apple-system, 'PingFang SC', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("扫码免费练习法考模拟题", W / 2, y + 25);
    ctx.fillStyle = "#6b6b6b";
    ctx.font = "14px -apple-system, 'PingFang SC', sans-serif";
    ctx.fillText("724题题库 · 模拟考试 · 错题复盘 · 学习统计", W / 2, y + 48);

    // 生成二维码（使用 qrcode.js 库）
    const qrSize = 100;
    const qrX = (W - qrSize) / 2;
    const qrY = y + 60;
    drawQRCode(ctx, qrX, qrY, qrSize, BASE_URL);

    // ---- 底部小字 ----
    ctx.fillStyle = "rgba(255,255,255,0.7)";
    ctx.font = "12px -apple-system, 'PingFang SC', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("liulinke.com/p/fakaomoni", W / 2, H - 20);

    // 插入 canvas 到容器
    container.innerHTML = "";
    container.appendChild(canvas);

    // 添加下载按钮
    const btn = document.createElement("button");
    btn.className = "btn";
    btn.textContent = "保存图片分享";
    btn.style.marginTop = "14px";
    btn.onclick = function () {
      canvas.toBlob(function (blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "fakao-score-" + rec.paperId + "-" + Date.now() + ".png";
        a.click();
        setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
      }, "image/png");
    };
    container.appendChild(btn);

    const tip = document.createElement("p");
    tip.className = "muted";
    tip.style.marginTop = "8px";
    tip.style.fontSize = "13px";
    tip.textContent = "长按图片或点击按钮保存，发到朋友圈/小红书分享你的成绩";
    container.appendChild(tip);
  }

  // ---- 辅助：圆角矩形 ----
  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  // ---- 辅助：绘制二维码 ----
  function drawQRCode(ctx, x, y, size, text) {
    // 使用全局 qrcode 对象（来自 js/vendor/qrcode.js）
    if (typeof qrcode === "undefined") return;
    const qr = qrcode(0, "M"); // typeNumber 0 = 自动，M 级纠错
    qr.addData(text);
    qr.make();
    const count = qr.getModuleCount();
    const cellSize = size / count;
    for (let r = 0; r < count; r++) {
      for (let c = 0; c < count; c++) {
        ctx.fillStyle = qr.isDark(r, c) ? "#1a5fb4" : "#ffffff";
        ctx.fillRect(x + c * cellSize, y + r * cellSize, cellSize + 1, cellSize + 1);
      }
    }
  }

  return { render: render };
})();
