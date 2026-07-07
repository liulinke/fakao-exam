#!/bin/bash
# 将法考模拟考试网站的部署包和部署脚本推送到远程 VM
# 目标路径为 nginx 的 /usr/share/nginx/html/p 目录

set -e  # 出错时立即退出

# 切换到脚本所在目录（即 deploy 目录），保证无论从哪里执行脚本都能找到文件
cd "$(dirname "$0")"

# 远程服务器信息
VM_HOST="root@39.105.114.207"
VM_PATH="/usr/share/nginx/html/p/fakaomoni/."

echo "正在推送文件到 ${VM_HOST}:${VM_PATH} ..."

scp -r ../*  "${VM_HOST}:${VM_PATH}"root@39.105.114.207:/usr/share/nginx/html/p/fakaomoni/.

echo "推送完成。"
