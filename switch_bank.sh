#!/bin/bash
# ============================================
# 题库切换脚本 - 在原版题库(bank)和进阶题库(bank_hard)之间切换
# 使用方法: ./switch_bank.sh [命令]
# ============================================

set -e

# 切换到脚本所在目录（项目根目录）
cd "$(dirname "$0")"

BANK_DIR="data/bank"
HARD_DIR="data/bank_hard"
TMP_DIR="data/_bank_swap_tmp"
MARKER="data/.active_bank"

# -------------------------------------------
# 显示当前题库状态
# -------------------------------------------
show_status() {
  if [ -f "$MARKER" ]; then
    active=$(cat "$MARKER")
  else
    active="original"
  fi

  # 统计原版题库题目数量
  if [ -d "$BANK_DIR" ] && [ "$active" = "original" ]; then
    orig_count=$(grep -c 'id:' "$BANK_DIR"/*.js 2>/dev/null | awk -F: '{s+=$NF} END{print s+0}')
    hard_count=$(grep -c 'id:' "$HARD_DIR"/*.js 2>/dev/null | awk -F: '{s+=$NF} END{print s+0}')
  else
    orig_count=$(grep -c 'id:' "$BANK_DIR"/*.js 2>/dev/null | awk -F: '{s+=$NF} END{print s+0}')
    hard_count=$(grep -c 'id:' "$HARD_DIR"/*.js 2>/dev/null | awk -F: '{s+=$NF} END{print s+0}')
  fi

  echo "========================================="
  echo "  法考题库切换工具"
  echo "========================================="
  echo ""
  if [ "$active" = "hard" ]; then
    echo "  当前激活: 进阶题库 (bank_hard)"
    echo "  进阶题库题目数: $orig_count 道（已切到 bank/ 目录）"
    echo "  原版题库题目数: $hard_count 道（暂存在 bank_hard/ 目录）"
  else
    echo "  当前激活: 原版题库 (bank)"
    echo "  原版题库题目数: $orig_count 道"
    echo "  进阶题库题目数: $hard_count 道"
  fi
  echo ""
}

# -------------------------------------------
# 执行切换
# -------------------------------------------
do_swap() {
  # 检查两个目录是否都存在
  if [ ! -d "$BANK_DIR" ]; then
    echo "错误: 找不到 $BANK_DIR 目录"
    exit 1
  fi
  if [ ! -d "$HARD_DIR" ]; then
    echo "错误: 找不到 $HARD_DIR 目录（进阶题库未安装）"
    exit 1
  fi

  # 检查是否有残留的临时目录
  if [ -d "$TMP_DIR" ]; then
    echo "警告: 发现残留的临时目录 $TMP_DIR，正在清理..."
    rm -rf "$TMP_DIR"
  fi

  # 确定当前激活的题库
  if [ -f "$MARKER" ]; then
    current=$(cat "$MARKER")
  else
    current="original"
  fi

  # 执行目录交换
  mv "$BANK_DIR" "$TMP_DIR"
  mv "$HARD_DIR" "$BANK_DIR"
  mv "$TMP_DIR" "$HARD_DIR"

  # 更新标记文件
  if [ "$current" = "original" ]; then
    echo "hard" > "$MARKER"
    new_bank="进阶题库 (bank_hard)"
  else
    rm -f "$MARKER"
    new_bank="原版题库 (bank)"
  fi

  echo ""
  echo "✓ 切换成功！"
  echo "  当前激活: $new_bank"
  echo ""
  echo "提示:"
  echo "  - 刷新浏览器即可使用新题库"
  echo "  - 如果使用了 PWA 离线模式，建议在浏览器开发者工具中"
  echo "    清除 Service Worker 缓存，或将 sw.js 中的 CACHE_VERSION +1"
  echo "  - 再次运行 ./switch_bank.sh 可切换回原题库"
  echo ""
}

# -------------------------------------------
# 主逻辑
# -------------------------------------------
case "${1:-status}" in
  swap|switch)
    show_status
    do_swap
    show_status
    ;;
  status|info)
    show_status
    echo "用法:"
    echo "  ./switch_bank.sh swap    # 切换题库"
    echo "  ./switch_bank.sh status  # 查看当前状态（默认）"
    echo "  ./switch_bank.sh help    # 查看帮助"
    echo ""
    ;;
  help|-h|--help)
    echo "法考题库切换工具"
    echo ""
    echo "用法:"
    echo "  ./switch_bank.sh swap    # 在原版题库和进阶题库之间切换"
    echo "  ./switch_bank.sh status  # 查看当前激活的题库"
    echo "  ./switch_bank.sh help    # 显示此帮助信息"
    echo ""
    echo "说明:"
    echo "  本脚本通过交换 data/bank 和 data/bank_hard 目录来实现题库切换。"
    echo "  切换后，应用始终从 data/bank 加载题库数据，因此无需修改任何代码。"
    echo ""
    echo "  原版题库 (data/bank):        724 道精选题目，难度适中"
    echo "  进阶题库 (data/bank_hard):  1000 道难题，侧重案例分析与深度考察"
    echo ""
    echo "注意:"
    echo "  - 切换前请确保没有正在进行的模拟考试（否则成绩可能错乱）"
    echo "  - 如果使用了 Service Worker 离线缓存，切换后建议清除缓存"
    echo ""
    ;;
  *)
    echo "未知命令: $1"
    echo "运行 './switch_bank.sh help' 查看帮助"
    exit 1
    ;;
esac
