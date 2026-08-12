# projects/

存放收录的开源项目，与 `rules/` 下的全局规则相互独立。

## 收录方式

**方式一：Git submodule（推荐，保留上游历史与更新能力）**

```bash
git submodule add <仓库地址> projects/<项目名>
git submodule update --init --recursive   # 克隆本仓库后拉取
git submodule update --remote             # 更新到上游最新
```

**方式二：直接放置目录**

适合已经改动过、不再跟随上游的项目。直接把目录放进 `projects/<项目名>/`，并在下表登记。

## 收录清单

| 项目 | 说明 | 收录方式 | 许可证 |
| --- | --- | --- | --- |
| _（待补充）_ | | | |

## 约定

- 每个项目目录内保留上游原始 `LICENSE`，本仓库根目录的 MIT 许可证不覆盖这些项目。
- 若对上游做了改动，在该项目目录下新建 `NOTES.md` 记录改了什么、为什么改。
- 提交前确认项目内不含 `.env`、`auth.json`、私钥等真实凭证。
