#!/usr/bin/env bash
# 显示 Claude Code / Codex CLI 当前的规则安装状态。

source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/lib.sh"

# report <名称> <本仓库源文件> <目标文件>
report() {
  local name="$1" src="$2" dst="$3"
  printf '%s\n' "${C_BLUE}${name}${C_RESET}  ${C_DIM}${dst}${C_RESET}"

  if [[ -L "$dst" ]]; then
    local link_target; link_target="$(readlink "$dst")"
    if [[ "$link_target" == "$src" ]]; then
      ok "已通过本仓库软链安装（仓库更新即生效）"
    else
      warn "软链指向其他位置：${link_target}"
    fi
  elif [[ -f "$dst" ]]; then
    if [[ -f "$src" ]] && diff -q "$src" "$dst" >/dev/null 2>&1; then
      ok "独立文件，内容与本仓库一致"
    else
      warn "独立文件，内容与本仓库不一致（make diff 查看差异）"
    fi
  else
    warn "未安装"
  fi
  echo
}

info "仓库：${REPO_ROOT}"
echo
report "Claude Code" "$CLAUDE_RULES_SRC" "$CLAUDE_RULES_DST"
report "Codex CLI"   "$CODEX_RULES_SRC"  "$CODEX_RULES_DST"

for cli in claude codex; do
  if command -v "$cli" >/dev/null 2>&1; then
    ok "检测到 ${cli} CLI：$(command -v "$cli")"
  else
    dim "未检测到 ${cli} CLI"
  fi
done
