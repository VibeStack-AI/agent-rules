#!/usr/bin/env bash
# 把规则文件安装到 ~/.claude/CLAUDE.md 与 ~/.codex/AGENTS.md。
#
#   install.sh [--target claude|codex|all] [--mode link|copy] [--dry-run] [--yes] [--uninstall]
#
#   --target    安装目标，默认 all
#   --mode      link=软链到本仓库（仓库更新即生效，默认）；copy=复制快照
#   --dry-run   只打印将要执行的操作
#   --yes       跳过交互确认
#   --uninstall 移除本仓库安装的软链

source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/lib.sh"

TARGET=all
MODE=link
DRY_RUN=false
ASSUME_YES=false
UNINSTALL=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    --target) TARGET="${2:-}"; shift 2 ;;
    --mode) MODE="${2:-}"; shift 2 ;;
    --dry-run) DRY_RUN=true; shift ;;
    --yes|-y) ASSUME_YES=true; shift ;;
    --uninstall) UNINSTALL=true; shift ;;
    -h|--help) sed -n '2,11p' "${BASH_SOURCE[0]}" | sed 's/^# \{0,1\}//'; exit 0 ;;
    *) die "未知参数：$1（-h 查看用法）" ;;
  esac
done

[[ "$TARGET" =~ ^(claude|codex|all)$ ]] || die "--target 只能是 claude / codex / all"
[[ "$MODE" =~ ^(link|copy)$ ]] || die "--mode 只能是 link / copy"

run() {
  if [[ "$DRY_RUN" == true ]]; then
    dim "[dry-run] $*"
  else
    "$@"
  fi
}

confirm() {
  [[ "$ASSUME_YES" == true || "$DRY_RUN" == true ]] && return 0
  local reply
  printf '%s' "${C_YELLOW}?${C_RESET} 继续？[y/N] "
  read -r reply </dev/tty || reply=n
  [[ "$reply" =~ ^[Yy]$ ]]
}

# install_one <名称> <源文件> <目标文件> <目标目录>
install_one() {
  local name="$1" src="$2" dst="$3" home="$4"

  if [[ ! -d "$home" ]]; then
    warn "${name}：未检测到 ${home}，将创建该目录"
    run mkdir -p "$home"
  fi

  if is_link_to "$dst" "$src"; then
    ok "${name}：已是本仓库软链，跳过（${dst}）"
    return 0
  fi

  if [[ -e "$dst" || -L "$dst" ]]; then
    if [[ -L "$dst" ]]; then
      warn "${name}：${dst} 是指向 $(readlink "$dst") 的软链，将被替换"
      run rm -f "$dst"
    else
      local backup
      if [[ "$DRY_RUN" == true ]]; then
        dim "[dry-run] 备份 ${dst} -> ${dst}.bak.<时间戳>"
      else
        backup="$(backup_file "$dst")"
        warn "${name}：已备份原文件 -> ${backup}"
      fi
      run rm -f "$dst"
    fi
  fi

  if [[ "$MODE" == link ]]; then
    run ln -s "$src" "$dst"
    ok "${name}：软链 ${dst} -> ${src#$REPO_ROOT/}"
  else
    run cp "$src" "$dst"
    ok "${name}：已复制 ${src#$REPO_ROOT/} -> ${dst}"
  fi
}

# uninstall_one <名称> <源文件> <目标文件>
uninstall_one() {
  local name="$1" src="$2" dst="$3"
  if is_link_to "$dst" "$src"; then
    run rm -f "$dst"
    ok "${name}：已移除软链 ${dst}"
    local newest
    newest="$(ls -1t "${dst}".bak.* 2>/dev/null | head -1 || true)"
    [[ -n "$newest" ]] && dim "如需恢复原文件：mv \"$newest\" \"$dst\""
  else
    warn "${name}：${dst} 不是本仓库安装的软链，未做改动"
  fi
}

# 缺产物时先生成，保证 curl 直装路径可用
if [[ ! -f "$CLAUDE_RULES_SRC" || ! -f "$CODEX_RULES_SRC" ]]; then
  info "dist/ 缺失，先运行 sync"
  "${REPO_ROOT}/scripts/sync.sh"
fi

if [[ "$UNINSTALL" == true ]]; then
  info "卸载目标：${TARGET}"
  confirm || die "已取消"
  [[ "$TARGET" == claude || "$TARGET" == all ]] && uninstall_one "Claude Code" "$CLAUDE_RULES_SRC" "$CLAUDE_RULES_DST"
  [[ "$TARGET" == codex  || "$TARGET" == all ]] && uninstall_one "Codex CLI"   "$CODEX_RULES_SRC"  "$CODEX_RULES_DST"
  exit 0
fi

info "安装目标：${TARGET}　模式：${MODE}"
[[ "$TARGET" == claude || "$TARGET" == all ]] && dim "Claude Code -> ${CLAUDE_RULES_DST}"
[[ "$TARGET" == codex  || "$TARGET" == all ]] && dim "Codex CLI   -> ${CODEX_RULES_DST}"
dim "已存在的真实文件会自动备份为 <文件>.bak.<时间戳>"
confirm || die "已取消"

[[ "$TARGET" == claude || "$TARGET" == all ]] && install_one "Claude Code" "$CLAUDE_RULES_SRC" "$CLAUDE_RULES_DST" "$CLAUDE_HOME"
[[ "$TARGET" == codex  || "$TARGET" == all ]] && install_one "Codex CLI"   "$CODEX_RULES_SRC"  "$CODEX_RULES_DST"  "$CODEX_HOME"

echo
ok "完成。用 ${C_BLUE}make status${C_RESET} 查看当前状态。"
