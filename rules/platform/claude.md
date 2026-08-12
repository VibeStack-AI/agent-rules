## 平台补充：Claude Code

- 规则加载优先级：项目 `./CLAUDE.md` > 全局 `~/.claude/CLAUDE.md`。冲突时以项目规则为准。
- 子目录的 `CLAUDE.md` 只在读取该目录文件时按需加载，不要把全局约束写进子目录。
- 任务匹配已注册 Skill 时，先读取其 `SKILL.md` 再执行，并简短说明正在使用哪个 Skill。
- 自定义斜杠命令放在 `~/.claude/commands/`，子代理放在 `~/.claude/agents/`，两者都是 Markdown + YAML frontmatter。
- 权限、hooks、环境变量统一写在 `~/.claude/settings.json`；项目级覆盖写在 `./.claude/settings.json`，个人本地覆盖写在 `./.claude/settings.local.json`（应加入 `.gitignore`）。
- 敏感路径通过 `permissions.deny` 兜底拦截，例如 `Read(**/.env)`，不要只依赖提示词约束。
- 密钥只允许出现在 `settings.json` 的 `env` 中且该文件不得提交；仓库内一律使用 `settings.example.json` 占位。
