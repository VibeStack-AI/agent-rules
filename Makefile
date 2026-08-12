SHELL := /bin/bash
.DEFAULT_GOAL := help

SCRIPTS := ./scripts

.PHONY: help sync check install install-claude install-codex install-copy status diff uninstall

help: ## 显示所有可用命令
	@printf '\033[34magent-rules\033[0m —— Claude Code / Codex CLI 全局规则\n\n'
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) \
		| awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[32m%-16s\033[0m %s\n", $$1, $$2}'
	@printf '\n'

sync: ## 从 rules/ 重新生成 dist/ 下的双平台规则文件
	@$(SCRIPTS)/sync.sh

check: ## 校验 dist/ 与 rules/ 是否一致（CI 用）
	@$(SCRIPTS)/sync.sh --check

install: ## 安装到 Claude Code 与 Codex CLI（软链方式）
	@$(SCRIPTS)/install.sh --target all

install-claude: ## 只安装到 Claude Code
	@$(SCRIPTS)/install.sh --target claude

install-codex: ## 只安装到 Codex CLI
	@$(SCRIPTS)/install.sh --target codex

install-copy: ## 以复制方式安装（不建软链，快照式）
	@$(SCRIPTS)/install.sh --target all --mode copy

status: ## 查看当前安装状态
	@$(SCRIPTS)/status.sh

diff: ## 对比已安装文件与本仓库的差异
	@diff -u "$$HOME/.claude/CLAUDE.md" dist/claude/CLAUDE.md && echo "Claude Code: 无差异" || true
	@diff -u "$$HOME/.codex/AGENTS.md" dist/codex/AGENTS.md && echo "Codex CLI: 无差异" || true

uninstall: ## 移除本仓库安装的软链
	@$(SCRIPTS)/install.sh --target all --uninstall
