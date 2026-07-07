#!/usr/bin/env bash
# 法考模拟 一键部署脚本（在 VM 上运行）
# 用法: sudo bash deploy_fakao.sh [DOCROOT]
#   DOCROOT 可选，不填则自动探测。示例: sudo bash deploy_fakao.sh /var/www/html
set -euo pipefail

TARBALL="${TARBALL:-fakaomoni.tar.gz}"
[ -f "$TARBALL" ] || { echo "找不到 $TARBALL，请把它和本脚本放在同一目录再运行"; exit 1; }

# ---------- 1. 探测当前 Web 服务器 ----------
echo ">> 正在检测 80 端口上的 Web 服务器..."
SRV="$(ss -ltnp 2>/dev/null | grep -E ':80\b' | grep -oE 'nginx|apache2|httpd' | head -1 || true)"
if [ -n "$SRV" ]; then echo "   检测到正在运行: $SRV"; else echo "   80 端口暂无 Web 服务，稍后可选择安装 Apache"; fi

# ---------- 2. 确定站点根目录 DOCROOT ----------
DOCROOT="${1:-}"
if [ -z "$DOCROOT" ]; then
  for d in /var/www/html /usr/share/nginx/html /var/www/liulinke.com /www/wwwroot/www.liulinke.com; do
    [ -d "$d" ] && DOCROOT="$d" && break
  done
fi
[ -n "$DOCROOT" ] || { echo "!! 未能自动确定站点根目录，请重跑并手动指定，如: sudo bash deploy_fakao.sh /你的/网站根目录"; exit 1; }
echo ">> 使用站点根目录: $DOCROOT"
echo "   （请确认这就是 www.liulinke.com 对外提供文件的目录；不确定就先 Ctrl+C，用下面命令核实）"
echo "   nginx:  grep -R root /etc/nginx/ ; apache: grep -R DocumentRoot /etc/apache2 /etc/httpd 2>/dev/null"
sleep 2

# ---------- 3. 部署文件 ----------
APP="$DOCROOT/p/fakaomoni"
echo ">> 部署到 $APP/ ..."
mkdir -p "$APP"
tar -xzf "$TARBALL" -C "$APP"

echo ">> 写入跳转文件 $DOCROOT/p/fakaomoni.html ..."
cat > "$DOCROOT/p/fakaomoni.html" <<'HTML'
<!DOCTYPE html>
<html lang="zh-CN"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta http-equiv="refresh" content="0; url=/p/fakaomoni/">
<link rel="canonical" href="/p/fakaomoni/"><title>法考客观题模拟</title></head>
<body style="font-family:-apple-system,'PingFang SC',sans-serif;text-align:center;padding-top:20vh;color:#333">
正在进入「法考客观题模拟」…<br><br>若未自动跳转，请点击 <a href="/p/fakaomoni/">这里</a>。
</body></html>
HTML

# ---------- 4. 权限 ----------
chmod -R a+rX "$DOCROOT/p"
if id www-data >/dev/null 2>&1; then chown -R www-data:www-data "$DOCROOT/p" 2>/dev/null || true
elif id apache  >/dev/null 2>&1; then chown -R apache:apache   "$DOCROOT/p" 2>/dev/null || true
elif id nginx   >/dev/null 2>&1; then chown -R nginx:nginx     "$DOCROOT/p" 2>/dev/null || true
fi

echo ""
echo "✅ 部署完成！"
echo "   入口(带跳转): https://www.liulinke.com/p/fakaomoni.html"
echo "   实际应用地址 : https://www.liulinke.com/p/fakaomoni/"
echo ""
echo "如果打不开，检查："
echo "  1) DOCROOT 是否正确（见上）"
echo "  2) 防火墙/安全组是否放行 80、443"
echo "  3) .js 是否返回正确类型:  curl -sI https://www.liulinke.com/p/fakaomoni/js/app.js | grep -i content-type"
