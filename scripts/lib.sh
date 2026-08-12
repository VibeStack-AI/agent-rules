#!/usr/bin/env bash
# 共用函数库。仅供 scripts/ 下其他脚本 source，不单独执行。

set -euo pipefail

if [[ -t 1 ]]; then
  C_RESET=$'\033[0m'; C_RED=$'\033[31m'; C_GREEN=$'\033[32m'
  C_YELLOW=$'\033[33m'; C_BLUE=$'\033[34m'; C_DIM=$'\033[2m'
else
  C_RESET=''; C_RED=''; C_GREEN=''; C_YELLOW=''; C_BLUE=''; C_DIM=''
fi

info()  { printf '%s\n' "${C_BLUE}==>${C_RESET} $*"; }
ok()    { printf '%s\n' "${C_GREEN} ✓${C_RESET} $*"; }
warn()  { printf '%s\n' "${C_YELLOW} !${C_RESET} $*" >&2; }
dim()   { printf '%s\n' "${C_DIM}   $*${C_RESET}"; }
die()   { printf '%s\n' "${C_RED} ✗${C_RESET} $*" >&2; exit 1; }

# 仓库根目录：脚本所在目录的上一级
_lib_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${_lib_dir}/.." && pwd)"
readonly REPO_ROOT

# 安装目标
CLAUDE_HOME="${CLAUDE_HOME:-$HOME/.claude}"
CODEX_HOME="${CODEX_HOME:-$HOME/.codex}"
CLAUDE_RULES_DST="${CLAUDE_HOME}/CLAUDE.md"
CODEX_RULES_DST="${CODEX_HOME}/AGENTS.md"

# 生成产物
CLAUDE_RULES_SRC="${REPO_ROOT}/dist/claude/CLAUDE.md"
CODEX_RULES_SRC="${REPO_ROOT}/dist/codex/AGENTS.md"

timestamp() { date +%Y%m%d-%H%M%S; }

# 备份已存在且非本仓库软链的文件，返回备份路径
backup_file() {
  local target="$1" backup
  backup="${target}.bak.$(timestamp)"
  cp -p "$target" "$backup"
  printf '%s' "$backup"
}

# 判断 $1 是否为指向 $2 的软链
is_link_to() {
  local link="$1" want="$2"
  [[ -L "$link" ]] || return 1
  [[ "$(readlink "$link")" == "$want" ]]
}
