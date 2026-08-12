## 平台补充：Codex CLI

- 规则加载优先级：项目 `./AGENTS.md` > 全局 `~/.codex/AGENTS.md`。冲突时以项目规则为准。
- 自定义 prompt 放在 `~/.codex/prompts/*.md`，在会话中以 `/文件名` 调用；与 Claude 的 `~/.claude/commands/` 一一对应维护。
- 模型、审批策略、沙箱级别、MCP server 统一写在 `~/.codex/config.toml`。
- `approval_policy` 与 `sandbox_mode` 是危险操作的第一道防线；本规则中的「危险操作确认」是第二道，二者不互相替代。
- `config.toml` 含本机项目路径与 `trust_level`，属于机器相关配置，不得提交；仓库内一律使用 `config.example.toml` 占位。
- 凭证存放于 `~/.codex/auth.json`，任何情况下都不读取、不展示、不提交。
