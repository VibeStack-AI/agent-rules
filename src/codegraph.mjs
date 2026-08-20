// 功能二：调用 CodeGraph CLI 完成全局集成，并恢复本项目的规则文件。
import { spawnSync } from 'node:child_process'

import { installRules } from './rules.mjs'
import { confirm, dim, fail, info, ok, warn } from './ui.mjs'

const CODEGRAPH_REPO = 'https://github.com/colbymchenry/codegraph'

// 只区分「命令不存在」和「命令存在」：不同版本的 --version 行为不一定一致，
// 因此仅把 ENOENT 当作未安装，其他情况交给后续真正的 install 命令报错。
const hasCodegraph = () => spawnSync('codegraph', ['--version']).error?.code !== 'ENOENT'

export async function installCodegraph({ target = 'all', yes = false } = {}) {
  if (!hasCodegraph()) {
    fail('未找到 codegraph 命令。')
    dim(`CodeGraph 是独立的上游工具，请先按其文档安装：${CODEGRAPH_REPO}`)
    return false
  }

  const targets = target === 'all' ? 'claude,codex' : target
  info(`为 ${targets} 配置 CodeGraph（全局）`)
  dim(`codegraph install --target=${targets} --location=global --yes`)
  dim('CodeGraph 安装器会改写全局规则文件，完成后本工具会重新写回本项目规则')

  if (!(await confirm('继续？', yes))) {
    warn('已取消')
    return false
  }

  const result = spawnSync(
    'codegraph',
    ['install', `--target=${targets}`, '--location=global', '--yes'],
    { stdio: 'inherit' },
  )
  if (result.status !== 0) {
    fail(`codegraph install 失败（退出码 ${result.status ?? 'unknown'}）`)
    return false
  }
  ok('CodeGraph 集成完成')

  console.log()
  info('重新写回规则文件，保持单一事实源')
  return installRules({ target, yes: true })
}
