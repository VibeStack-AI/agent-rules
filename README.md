<h1 align="center">agent-rules</h1>

<p align="center">
  一份规则，同时驱动 <b>Claude Code</b> 与 <b>Codex CLI</b>。
</p>

<p align="center">
  <a href="https://github.com/VibeStack-AI/agent-rules/actions/workflows/check.yml"><img alt="check" src="https://github.com/VibeStack-AI/agent-rules/actions/workflows/check.yml/badge.svg"></a>
  <a href="./LICENSE"><img alt="license" src="https://img.shields.io/badge/license-MIT-blue.svg"></a>
  <img alt="platform" src="https://img.shields.io/badge/Claude%20Code%20%7C%20Codex%20CLI-supported-brightgreen">
</p>

---

## 这是什么

同时用 Claude Code 和 Codex CLI 时，两边的全局规则要各维护一份，改一处忘一处，行为很快就漂移。

本仓库把规则收敛成**单一事实源**（`rules/core.md`），由脚本生成两个平台各自的格式，再一条命令安装到位：

```
rules/core.md ──┬── + Claude 头部与平台补充 ──► dist/claude/CLAUDE.md ──► ~/.claude/CLAUDE.md
                └── + Codex 平台补充        ──► dist/codex/AGENTS.md ──► ~/.codex/AGENTS.md
```

规则内容是一套面向有经验开发者的中文工程约束：**先读后改、修根因不修症状、禁止靠猜修 Bug、危险操作必须确认、改完必须验证**。

## 特性

- **单一事实源** —— 规则只写一遍，`make sync` 生成双平台版本，CI 校验永不漂移。
- **平台差异隔离** —— 共性规则在 `core.md`，Claude / Codex 各自的文件优先级、目录约定放在 `rules/platform/`。
- **一条命令安装** —— `make install` 搞定两个平台，默认软链，改仓库即改全局规则。
- **不丢原文件** —— 已有的 `CLAUDE.md` / `AGENTS.md` 自动备份为 `.bak.<时间戳>`，可一键卸载还原。
- **可反悔** —— `--dry-run` 预览、`make status` 查状态、`make diff` 看差异、`make uninstall` 撤销。
- **凭证零提交** —— `.gitignore` 兜底拦截 `settings.json` / `config.toml` / `auth.json` / `.env`。

## 快速开始

```bash
# 1. 克隆
git clone https://github.com/VibeStack-AI/agent-rules.git
cd agent-rules

# 2. 预览将要发生什么（不写任何文件）
./scripts/install.sh --dry-run

# 3. 安装到两个平台
make install

# 4. 确认结果
make status
```

安装后重开一个会话，Claude Code 和 Codex CLI 就会加载同一套规则。

**只装一边：**

```bash
make install-claude    # 只装 Claude Code
make install-codex     # 只装 Codex CLI
```

**不想建软链**（要一份独立快照、或仓库可能被移动）：

```bash
make install-copy
```

> 软链模式下 `git pull` 后规则立即生效；复制模式下需要重新 `make install-copy`。

## 命令速查

| 命令 | 作用 |
| --- | --- |
| `make help` | 列出所有命令 |
| `make sync` | 改完 `rules/` 后重新生成 `dist/` |
| `make check` | 校验 `dist/` 与 `rules/` 是否一致（CI 用） |
| `make install` | 安装到 Claude Code + Codex CLI（软链） |
| `make install-claude` | 只安装到 Claude Code |
| `make install-codex` | 只安装到 Codex CLI |
| `make install-copy` | 以复制方式安装 |
| `make status` | 查看两个平台的安装状态 |
| `make diff` | 对比已安装文件与仓库内容 |
| `make uninstall` | 移除本仓库安装的软链 |

脚本也可以直接调用，参数更细：

```bash
./scripts/install.sh --target claude --mode copy --dry-run
./scripts/install.sh --target all --uninstall
./scripts/sync.sh --check
CLAUDE_HOME=/tmp/x ./scripts/install.sh --yes   # 用环境变量改安装位置，便于测试
```

| 参数 | 说明 |
| --- | --- |
| `--target claude｜codex｜all` | 安装目标，默认 `all` |
| `--mode link｜copy` | 软链或复制，默认 `link` |
| `--dry-run` | 只打印将执行的操作，不写文件 |
| `--yes` / `-y` | 跳过交互确认（脚本化场景用） |
| `--uninstall` | 移除本仓库安装的软链 |

## 目录结构

```
agent-rules/
├── rules/                        # 单一事实源，只改这里
│   ├── core.md                   #   双平台共享的全部规则
│   └── platform/
│       ├── claude.header.md      #   Claude 的 YAML frontmatter
│       ├── claude.md             #   Claude 专属补充
│       └── codex.md              #   Codex 专属补充
├── dist/                         # 由 rules/ 生成，已提交，勿手改
│   ├── claude/CLAUDE.md          #   → ~/.claude/CLAUDE.md
│   └── codex/AGENTS.md           #   → ~/.codex/AGENTS.md
├── scripts/
│   ├── lib.sh                    #   共用函数与路径定义
│   ├── sync.sh                   #   生成 / 校验 dist/
│   ├── install.sh                #   安装 / 卸载
│   └── status.sh                 #   状态检查
├── projects/                     # 收录的开源项目（见 projects/README.md）
├── Makefile                      # 快捷命令入口
└── .github/workflows/check.yml   # 一致性校验 + shellcheck + 安装冒烟测试
```

## 双平台适配说明

两个平台读的是不同文件、不同格式，脚本负责抹平差异：

| | Claude Code | Codex CLI |
| --- | --- | --- |
| 全局规则文件 | `~/.claude/CLAUDE.md` | `~/.codex/AGENTS.md` |
| 项目级规则 | `./CLAUDE.md` | `./AGENTS.md` |
| YAML frontmatter | 需要（`name` / `description`） | 不需要 |
| 自定义命令 | `~/.claude/commands/*.md` | `~/.codex/prompts/*.md` |
| 子代理 | `~/.claude/agents/*.md` | —— |
| 配置文件 | `~/.claude/settings.json` | `~/.codex/config.toml` |

两边的**项目级规则都优先于全局规则**，所以本仓库的规则是基线，具体项目可以在自己的 `CLAUDE.md` / `AGENTS.md` 里覆盖。

## 自定义规则

1. 改 `rules/core.md`（双平台共享）或 `rules/platform/*.md`（单平台）。
2. 跑 `make sync` 重新生成 `dist/`。
3. 软链模式下已经生效；复制模式下再跑一次 `make install-copy`。
4. 提交时 `dist/` 和 `rules/` 一起提交，CI 会校验两者一致。

> 直接编辑 `dist/` 下的文件会在下次 `make sync` 时被覆盖，CI 也会报 `dist/ 与 rules/ 不一致`。

## 规则概览

`rules/core.md` 的七个部分：

| 章节 | 核心约束 |
| --- | --- |
| 语言与沟通 | 默认简体中文；直接给结论；低风险信息缺失时说明假设继续，不打断 |
| 执行原则 | 推进到问题真正解决；先读后改；修根因；只做当前需要的 |
| Bug 与卡住时处理 | 禁止靠猜；禁止静默 fallback / 吞错 / 假成功；同一错误 3 次无效尝试后转查证流程 |
| 危险操作确认 | 删除、批量改、`git commit/push/reset --hard`、生产 API、依赖升级等必须先确认 |
| 工具与路径 | 路径加引号；`rg` 优先；能并行就并行；有 `.codegraph/` 先用 CodeGraph |
| 安全基线 | 不硬编码凭证；不读不输出 `.env` 真实值；参数化查询；边界校验 |
| 代码质量 | KISS / YAGNI / DRY / SOLID；最小 diff；依赖注入；命名常量替代魔法数字 |
| 结构性修复触发器 | 重复逻辑、多数据源、跨模块行为等按结构性问题处理，不叠绕过逻辑 |
| 验证与收尾 | 测试 → 类型/lint → 构建 → smoke；交付前自查 diff 有无症状补丁与隐藏 fallback |

## 安全说明

本仓库**只收录规则文本，不收录任何真实配置**。以下文件已在 `.gitignore` 中拦截，任何情况下都不要提交：

| 文件 | 原因 |
| --- | --- |
| `~/.claude/settings.json` | 含 `ANTHROPIC_AUTH_TOKEN` 等环境变量 |
| `~/.codex/config.toml` | 含本机项目路径、`trust_level`、MCP 配置 |
| `~/.codex/auth.json` | 登录凭证 |
| `.env` / `.env.*` | 各类密钥 |

需要分享配置结构时，提供 `settings.example.json`、`config.example.toml` 这类占位符版本，敏感值一律写成 `<YOUR_TOKEN_HERE>`。

> 如果曾经不慎提交过真实令牌，**改 `.gitignore` 不够**——必须去服务商后台吊销并重新签发，同时清理 Git 历史。

## 常见问题

**Q：会覆盖我现有的 `~/.claude/CLAUDE.md` 吗？**
会替换，但替换前自动备份成 `~/.claude/CLAUDE.md.bak.<时间戳>`，卸载时脚本会提示恢复命令。想先看效果就加 `--dry-run`。

**Q：软链和复制怎么选？**
长期用软链，`git pull` 后自动生效。仓库目录会挪动、或需要一份冻结快照时用复制。

**Q：仓库被移动或删除后规则失效了？**
软链模式下路径写死在链接里。移动仓库后到新位置重跑 `make install` 即可。

**Q：想给某个项目单独定规则？**
在项目根目录建 `CLAUDE.md`（Claude Code）和 `AGENTS.md`（Codex CLI），项目级优先于全局。

**Q：`make check` 报 `dist/ 与 rules/ 不一致`？**
说明手改了 `dist/` 或改完 `rules/` 忘了同步。跑 `make sync` 后重新提交。

## 收录的开源项目

见 [`projects/README.md`](./projects/README.md)。

## License

[MIT](./LICENSE)
