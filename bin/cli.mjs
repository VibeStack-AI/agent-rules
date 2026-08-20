#!/usr/bin/env node
// agent-rules —— 只做两件事：安装/更新全局规则、安装 CodeGraph 集成。
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const MIN_NODE_MAJOR = 18
const nodeMajor = Number(process.versions.node.split('.')[0])
if (nodeMajor < MIN_NODE_MAJOR) {
  console.error(
    `agent-rules 需要 Node.js ${MIN_NODE_MAJOR} 或更高版本，当前为 v${process.versions.node}。\n` +
      '请升级 Node 后重试（推荐 nvm install --lts）。',
  )
  process.exit(1)
}

const { installCodegraph } = await import('../src/codegraph.mjs')
const { select } = await import('../src/menu.mjs')
const { installRules, TARGETS } = await import('../src/rules.mjs')
const { blue, cyan, dimC, fail, isInteractive } = await import('../src/ui.mjs')

const PKG_ROOT = dirname(dirname(fileURLToPath(import.meta.url)))
const { version } = JSON.parse(readFileSync(join(PKG_ROOT, 'package.json'), 'utf8'))

const BANNER = `
${cyan(' ╔═╗╔═╗╔═╗╔╗╔╔╦╗  ╦═╗╦ ╦╦  ╔═╗╔═╗')}
${cyan(' ╠═╣║ ╦║╣ ║║║ ║   ╠╦╝║ ║║  ║╣ ╚═╗')}
${cyan(' ╩ ╩╚═╝╚═╝╝╚╝ ╩   ╩╚═╚═╝╩═╝╚═╝╚═╝')} ${dimC(`v${version}`)}
${dimC(' 一份规则，同时驱动 Claude Code 与 Codex CLI')}
`

const USAGE = `
${blue('agent-rules')} v${version} —— Claude Code / Codex CLI 全局规则

用法：
  npx @vibestack-ai/agent-rules              交互式菜单
  npx @vibestack-ai/agent-rules rules        安装 / 更新全局规则文件
  npx @vibestack-ai/agent-rules codegraph    安装 CodeGraph 集成并写回规则

选项：
  --target claude|codex|all   操作目标，默认 all
  -y, --yes                   跳过确认（脚本化场景）
  -v, --version               显示版本
  -h, --help                  显示本帮助

说明：
  再次运行 rules 即为更新；已存在的规则文件会先备份到
  ~/.claude/backup/<时间戳>/ 与 ~/.codex/backup/<时间戳>/。
`.trim()

const MENU_ITEMS = [
  { label: '安装 / 更新全局规则（Claude Code + Codex CLI）', value: 'rules' },
  { label: '安装 CodeGraph 集成', value: 'codegraph' },
  { label: '退出', value: 'exit' },
]

function parseArgs(argv) {
  const opts = { command: '', target: 'all', yes: false }
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === '-h' || arg === '--help') return { ...opts, command: 'help' }
    if (arg === '-v' || arg === '--version') return { ...opts, command: 'version' }
    if (arg === '-y' || arg === '--yes') opts.yes = true
    else if (arg === '--target') opts.target = argv[++i] ?? ''
    else if (arg.startsWith('--target=')) opts.target = arg.slice('--target='.length)
    else if (!arg.startsWith('-') && !opts.command) opts.command = arg
    else throw new Error(`未知参数：${arg}（-h 查看用法）`)
  }
  return opts
}

const run = (command, opts) =>
  command === 'rules' ? installRules(opts) : installCodegraph(opts)

// 交互模式：执行完一项后回到菜单，直到用户选择退出。
async function interactive(opts) {
  console.log(BANNER)
  for (;;) {
    const choice = await select('请选择要做的事：', MENU_ITEMS)
    if (!choice || choice === 'exit') return 0
    await run(choice, opts)
    console.log()
  }
}

async function main() {
  const opts = parseArgs(process.argv.slice(2))

  if (opts.target !== 'all' && !(opts.target in TARGETS)) {
    throw new Error(`--target 只能是 ${Object.keys(TARGETS).join(' / ')} / all`)
  }

  switch (opts.command) {
    case 'help':
      console.log(USAGE)
      return 0
    case 'version':
      console.log(version)
      return 0
    case 'rules':
    case 'codegraph':
      return (await run(opts.command, opts)) ? 0 : 1
    case '':
      if (!isInteractive()) {
        console.log(USAGE)
        return 0
      }
      return interactive(opts)
    default:
      throw new Error(`未知命令：${opts.command}（-h 查看用法）`)
  }
}

main()
  .then((code) => process.exit(code))
  .catch((err) => {
    fail(err.message)
    process.exit(1)
  })
