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

# 生成产物（npm 包随包分发，由 CLI 写入 ~/.claude 与 ~/.codex）
CLAUDE_RULES_SRC="${REPO_ROOT}/dist/claude/CLAUDE.md"
CODEX_RULES_SRC="${REPO_ROOT}/dist/codex/AGENTS.md"
