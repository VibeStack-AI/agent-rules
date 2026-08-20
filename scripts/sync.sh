#!/usr/bin/env bash
# 从 rules/ 生成 dist/ 下的 Claude 与 Codex 规则文件。
#
#   sync.sh            重新生成 dist/
#   sync.sh --check    只校验 dist/ 是否与 rules/ 一致（CI 用，有漂移则退出码 1）

# shellcheck source=scripts/lib.sh
source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/lib.sh"

CHECK_ONLY=false
while [[ $# -gt 0 ]]; do
  case "$1" in
    --check) CHECK_ONLY=true; shift ;;
    -h|--help) sed -n '2,6p' "${BASH_SOURCE[0]}" | sed 's/^# \{0,1\}//'; exit 0 ;;
    *) die "未知参数：$1（可用：--check）" ;;
  esac
done

# 生成产物：npm 包随包分发，由 CLI 写入 ~/.claude 与 ~/.codex
CLAUDE_RULES_SRC="${REPO_ROOT}/dist/claude/CLAUDE.md"
CODEX_RULES_SRC="${REPO_ROOT}/dist/codex/AGENTS.md"

CORE="${REPO_ROOT}/rules/core.md"
CLAUDE_HEADER="${REPO_ROOT}/rules/platform/claude.header.md"
CLAUDE_PLATFORM="${REPO_ROOT}/rules/platform/claude.md"
CODEX_PLATFORM="${REPO_ROOT}/rules/platform/codex.md"

for f in "$CORE" "$CLAUDE_HEADER" "$CLAUDE_PLATFORM" "$CODEX_PLATFORM"; do
  [[ -f "$f" ]] || die "缺少源文件：${f#"$REPO_ROOT"/}"
done

BANNER='<!-- 由 rules/ 生成，请勿直接编辑；改 rules/ 后运行 make sync -->'

# build <目标文件> <平台补充> [头部文件]
build() {
  local out="$1" platform="$2" header="${3:-}"
  mkdir -p "$(dirname "$out")"
  {
    [[ -n "$header" ]] && cat "$header"
    printf '%s\n\n' "$BANNER"
    cat "$CORE"
    printf '\n'
    cat "$platform"
  } > "$out"
}

if [[ "$CHECK_ONLY" == true ]]; then
  tmp="$(mktemp -d)"
  trap 'rm -rf "$tmp"' EXIT
  build "${tmp}/CLAUDE.md" "$CLAUDE_PLATFORM" "$CLAUDE_HEADER"
  build "${tmp}/AGENTS.md" "$CODEX_PLATFORM"

  drift=0
  diff -u "$CLAUDE_RULES_SRC" "${tmp}/CLAUDE.md" || drift=1
  diff -u "$CODEX_RULES_SRC" "${tmp}/AGENTS.md" || drift=1
  if [[ $drift -eq 1 ]]; then
    die "dist/ 与 rules/ 不一致，请运行 make sync 后提交"
  fi
  ok "dist/ 与 rules/ 一致"
  exit 0
fi

build "$CLAUDE_RULES_SRC" "$CLAUDE_PLATFORM" "$CLAUDE_HEADER"
build "$CODEX_RULES_SRC" "$CODEX_PLATFORM"
ok "已生成 dist/claude/CLAUDE.md（$(wc -l < "$CLAUDE_RULES_SRC" | tr -d ' ') 行）"
ok "已生成 dist/codex/AGENTS.md（$(wc -l < "$CODEX_RULES_SRC" | tr -d ' ') 行）"
