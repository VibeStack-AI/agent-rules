SHELL := /bin/bash
.DEFAULT_GOAL := help

SCRIPTS := ./scripts

.PHONY: help sync check test install codegraph

help: ## 显示所有可用命令
	@printf '\033[34magent-rules\033[0m —— Claude Code / Codex CLI 全局规则\n\n'
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) \
		| awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[32m%-12s\033[0m %s\n", $$1, $$2}'
	@printf '\n'

sync: ## 改完 rules/ 后重新生成 dist/
	@$(SCRIPTS)/sync.sh

check: ## 校验 dist/ 与 rules/ 是否一致（CI 用）
	@$(SCRIPTS)/sync.sh --check

test: ## 运行单元测试（菜单键位）
	@npm test

install: ## 用本地代码安装 / 更新全局规则
	@node bin/cli.mjs rules

codegraph: ## 用本地代码安装 CodeGraph 集成
	@node bin/cli.mjs codegraph
