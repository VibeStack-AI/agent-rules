<h1 align="center">agent-rules</h1>

<p align="center">
  一份规则，同时驱动 <b>Claude Code</b> 与 <b>Codex CLI</b>。
</p>

<p align="center">
  <a href="https://github.com/VibeStack-AI/agent-rules/actions/workflows/check.yml"><img alt="check" src="https://github.com/VibeStack-AI/agent-rules/actions/workflows/check.yml/badge.svg"></a>
  <a href="https://www.npmjs.com/package/@vibestack-ai/agent-rules"><img alt="npm" src="https://img.shields.io/npm/v/@vibestack-ai/agent-rules.svg"></a>
  <a href="./LICENSE"><img alt="license" src="https://img.shields.io/badge/license-MIT-blue.svg"></a>
  <img alt="platform" src="https://img.shields.io/badge/Claude%20Code%20%7C%20Codex%20CLI-supported-brightgreen">
</p>

---

## 这是什么

同时用 Claude Code 和 Codex CLI 时，两边的全局规则要各维护一份，改一处忘一处，行为很快就漂移。

本仓库把规则收敛成**单一事实源**（`rules/core.md`），由脚本生成两个平台各自的格式，再一条 `npx` 命令写到位：

```
rules/core.md ──┬── + Claude 头部与平台补充 ──► dist/claude/CLAUDE.md ──► ~/.claude/CLAUDE.md
                └── + Codex 平台补充        ──► dist/codex/AGENTS.md ──► ~/.codex/AGENTS.md
```

规则内容是一套面向有经验开发者的中文工程约束：**先读后改、修根因不修症状、禁止靠猜修 Bug、危险操作必须确认、改完必须验证**。

## 快速开始

无需克隆仓库，一条命令：

```bash
npx @vibestack-ai/agent-rules
```

进入后是一个方向键菜单，只有两件事可做：

```
 ╔═╗╔═╗╔═╗╔╗╔╔╦╗  ╦═╗╦ ╦╦  ╔═╗╔═╗
 ╠═╣║ ╦║╣ ║║║ ║   ╠╦╝║ ║║  ║╣ ╚═╗
 ╩ ╩╚═╝╚═╝╝╚╝ ╩   ╩╚═╚═╝╩═╝╚═╝╚═╝ v1.0.0
 一份规则，同时驱动 Claude Code 与 Codex CLI

请选择要做的事：
  ↑/↓ 移动，数字键直选，Enter 确认，q 退出

❯ 安装 / 更新全局规则（Claude Code + Codex CLI）
  安装 CodeGraph 集成
  退出
```

`↑`/`↓`（或 `k`/`j`）移动，`Enter` 确认，也可以直接按 `1`/`2` 选中，`q` 或 `Esc` 退出。
执行完一项后自动回到菜单，可以接着做下一件事。菜单零依赖实现；终端不支持 raw
mode 时自动降级成数字输入，非交互环境（CI、管道）则直接打印帮助，不会卡住等待输入。

也可以直接指定子命令：

```bash
npx @vibestack-ai/agent-rules rules                    # 安装 / 更新全局规则
npx @vibestack-ai/agent-rules rules --target claude    # 只装 Claude Code
npx @vibestack-ai/agent-rules codegraph                # 安装 CodeGraph 集成
```

安装后重开一个会话，Claude Code 和 Codex CLI 就会加载同一套规则。

> 需要 Node.js 18 或更高版本；版本过低时 CLI 会直接提示，不会留下半成品。

## 更新

**再跑一次同样的命令即可** —— `npx` 每次都会拉取最新版本，规则内容一致时会跳过写入：

```bash
npx @vibestack-ai/agent-rules@latest rules --yes
```

## CLI 参数

| 命令 / 参数 | 说明 |
| --- | --- |
| `rules` | 把规则写入 `~/.claude/CLAUDE.md` 与 `~/.codex/AGENTS.md` |
| `codegraph` | 调用 CodeGraph CLI 完成全局集成，然后重新写回本项目规则 |
| `--target claude｜codex｜all` | 操作目标，默认 `all` |
| `-y` / `--yes` | 跳过确认（脚本化 / CI 场景） |
| `-v` / `--version`、`-h` / `--help` | 版本 / 帮助 |

行为约定：

- **只写全局规则文件**，不碰项目级 `CLAUDE.md` / `AGENTS.md`，不改 `settings.json` / `config.toml`。
- 环境变量 `CLAUDE_HOME` / `CODEX_HOME` 可改写安装位置，便于测试。

## 你现有的规则会怎样

**不会丢。** 覆盖前一定先备份，备份成功才写入；备份失败直接中止，不动原文件。

而且**在你确认之前**就会逐个平台列出将要发生什么，不是先动手再告诉你：

```
==> 安装全局规则：Claude Code + Codex CLI
   Claude Code -> ~/.claude/CLAUDE.md
     内容有变化，覆盖前先备份
   Codex CLI -> ~/.codex/AGENTS.md
     新建（无需备份）
   备份位置：<平台目录>/backup/20260819-192101/
 ? 继续？ [y/N]
```

全部已是最新时连确认都不问，直接提示「规则已是最新，无需改动」。

| 目标文件的状态 | 行为 |
| --- | --- |
| 不存在 | 直接写入，无备份 |
| 已存在且内容相同 | 提示「已是最新，跳过」，**不写入、不产生备份** |
| 已存在且内容不同 | 先备份 → 再覆盖 |
| 是软链（旧版本或其他工具建的） | 备份其指向的实际内容 → 删除软链 → 写入普通文件 |

备份按时间戳分目录存放，不会污染平台目录：

```
~/.claude/backup/20260819-184823/CLAUDE.md
~/.codex/backup/20260819-184823/AGENTS.md
```

每次备份终端都会打印还原命令，直接复制执行即可回到原状：

```bash
cp "~/.claude/backup/20260819-184823/CLAUDE.md" "~/.claude/CLAUDE.md"
```

由于内容相同即跳过，反复执行更新不会堆积无意义的备份目录；同一秒内重复运行会自动加序号
（`20260819-192101-2`），不会覆盖上一次的备份。

备份失败（例如目录只读）会**中止本次安装并返回非零退出码**，原文件保持不动。

## CodeGraph 集成

[CodeGraph](https://github.com/colbymchenry/codegraph) 为 Claude Code 和 Codex
提供本地代码知识图谱。仓库根目录存在有效的 `.codegraph/` 索引时，本项目的规则会要求
Agent 优先通过 `codegraph_explore` 理解符号、调用链和变更影响范围，再决定读取或修改哪些文件。

CodeGraph 是独立的上游工具，**本项目不负责安装它**。先按上游文档装好 `codegraph` 命令，再执行：

```bash
npx @vibestack-ai/agent-rules codegraph
```

该子命令做两件事：

1. 运行 `codegraph install --target=claude,codex --location=global --yes`；
2. 由于 CodeGraph 安装器会改写全局规则文件，随后自动重新写回本项目规则，保持单一事实源。

每个项目自行决定是否建立本地索引：

```bash
cd /path/to/project
codegraph init
codegraph status
```

`.codegraph/` 中的数据库、日志和守护进程文件属于机器本地数据，不应提交。CodeGraph
负责减少代码结构理解偏差，但不替代需求约束、测试、代码审查或 CI。

## 目录结构

```
agent-rules/
├── rules/                        # 单一事实源，只改这里
│   ├── core.md                   #   双平台共享的全部规则
│   └── platform/
│       ├── claude.header.md      #   Claude 的 YAML frontmatter
│       ├── claude.md             #   Claude 专属补充
│       └── codex.md              #   Codex 专属补充
├── dist/                         # 由 rules/ 生成，已提交并随 npm 包分发，勿手改
│   ├── claude/CLAUDE.md          #   → ~/.claude/CLAUDE.md
│   └── codex/AGENTS.md           #   → ~/.codex/AGENTS.md
├── bin/cli.mjs                   # npx 入口：参数解析 + 交互菜单
├── src/
│   ├── rules.mjs                 #   功能一：安装 / 更新全局规则（含备份）
│   ├── codegraph.mjs             #   功能二：CodeGraph 集成
│   ├── menu.mjs                  #   方向键菜单（零依赖，可降级为数字输入）
│   └── ui.mjs                    #   终端输出与确认
├── test/menu.test.mjs            # 菜单键位测试（node --test）
├── scripts/
│   ├── lib.sh                    #   共用函数与路径定义
│   └── sync.sh                   #   由 rules/ 生成 / 校验 dist/
├── projects/                     # 收录的开源项目（见 projects/README.md）
├── Makefile                      # 本地开发快捷命令
└── .github/workflows/check.yml   # 一致性校验 + shellcheck + CLI 冒烟测试
```

## 修改规则（贡献者）

```bash
git clone https://github.com/VibeStack-AI/agent-rules.git
cd agent-rules

# 1. 改 rules/core.md（双平台共享）或 rules/platform/*.md（单平台）
# 2. 重新生成 dist/
make sync
# 3. 用本地代码安装验证
make install
```

| 命令 | 作用 |
| --- | --- |
| `make help` | 列出所有命令 |
| `make sync` | 改完 `rules/` 后重新生成 `dist/` |
| `make check` | 校验 `dist/` 与 `rules/` 是否一致（CI 用） |
| `make test` | 运行单元测试（菜单键位） |
| `make install` | 用本地代码安装 / 更新全局规则 |
| `make codegraph` | 用本地代码安装 CodeGraph 集成 |

> 直接编辑 `dist/` 下的文件会在下次 `make sync` 时被覆盖，CI 也会报 `dist/ 与 rules/ 不一致`。提交时 `dist/` 与 `rules/` 一起提交。

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

## 规则概览

`rules/core.md` 的各个部分：

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
会覆盖，但覆盖前一定先备份到 `~/.claude/backup/<时间戳>/CLAUDE.md`，备份失败会直接中止。
详见 [你现有的规则会怎样](#你现有的规则会怎样)。

**Q：怎么更新到最新规则？**
再跑一次 `npx @vibestack-ai/agent-rules@latest rules`。内容没变时会提示“已是最新，跳过”。

**Q：之前是软链安装的，现在怎么办？**
直接再跑一次 `rules`。CLI 会先把软链指向的内容备份下来，再替换成普通文件，并在终端提示。

**Q：想给某个项目单独定规则？**
在项目根目录建 `CLAUDE.md`（Claude Code）和 `AGENTS.md`（Codex CLI），项目级优先于全局。

**Q：`make check` 报 `dist/ 与 rules/ 不一致`？**
说明手改了 `dist/` 或改完 `rules/` 忘了同步。跑 `make sync` 后重新提交。

## 收录的开源项目

见 [`projects/README.md`](./projects/README.md)。

## License

[MIT](./LICENSE)
