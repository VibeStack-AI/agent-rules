// 功能一：把全局规则文件安装/更新到 Claude Code 与 Codex CLI。
import { existsSync, lstatSync, mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { confirm, dim, fail, info, ok, warn } from './ui.mjs'
const PKG_ROOT = dirname(dirname(fileURLToPath(import.meta.url)))

export const TARGETS = {
  claude: {
    name: 'Claude Code',
    src: join(PKG_ROOT, 'dist', 'claude', 'CLAUDE.md'),
    dir: () => process.env.CLAUDE_HOME || join(homedir(), '.claude'),
    file: 'CLAUDE.md',
  },
  codex: {
    name: 'Codex CLI',
    src: join(PKG_ROOT, 'dist', 'codex', 'AGENTS.md'),
    dir: () => process.env.CODEX_HOME || join(homedir(), '.codex'),
    file: 'AGENTS.md',
  },
}

export const resolveTargets = (target) =>
  target === 'all' ? Object.keys(TARGETS) : [target]

const dest = (key) => join(TARGETS[key].dir(), TARGETS[key].file)

const timestamp = () =>
  new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+Z$/, '').replace('T', '-')

const exists = (p) => {
  try {
    lstatSync(p)
    return true
  } catch {
    return false
  }
}

const sameContent = (a, b) => {
  try {
    return readFileSync(a, 'utf8') === readFileSync(b, 'utf8')
  } catch {
    return false
  }
}

// 同一秒内重复运行时追加序号，避免后一次备份覆盖前一次。
function uniqueStamp(keys) {
  const base = timestamp()
  let stamp = base
  for (let n = 2; keys.some((k) => existsSync(join(TARGETS[k].dir(), 'backup', stamp))); n++) {
    stamp = `${base}-${n}`
  }
  return stamp
}

// 备份已存在的规则文件到 <平台目录>/backup/<时间戳>/，返回备份路径。
// 软链也会备份其指向的实际内容，避免替换后原内容无处可寻。
// stamp 由本次运行统一生成，保证预览里显示的路径与实际落盘路径一致。
function backup(key, stamp) {
  const dst = dest(key)
  const dir = join(TARGETS[key].dir(), 'backup', stamp)
  const path = join(dir, TARGETS[key].file)
  mkdirSync(dir, { recursive: true })
  writeFileSync(path, readFileSync(dst))
  return path
}

// 判断某个平台当前处于什么状态，供确认前预览与实际写入共用。
// missing=源文件缺失 blocked=平台目录被普通文件占用 create=新建
// same=已是最新 update=覆盖 link=原为软链
function inspect(key) {
  const dir = TARGETS[key].dir()
  const dst = dest(key)
  if (!existsSync(TARGETS[key].src)) return 'missing'
  if (exists(dir) && !statSync(dir, { throwIfNoEntry: false })?.isDirectory()) return 'blocked'
  if (!exists(dst)) return 'create'
  if (lstatSync(dst).isSymbolicLink()) return 'link'
  return sameContent(TARGETS[key].src, dst) ? 'same' : 'update'
}

const PLAN_LABEL = {
  missing: '规则源文件缺失',
  blocked: '平台目录被同名文件占用，无法写入',
  create: '新建（无需备份）',
  same: '已是最新，将跳过',
  update: '内容有变化，覆盖前先备份',
  link: '当前是软链，备份其内容后替换为普通文件',
}

// 安装单个平台。state 由 inspect() 得出，调用方已在确认前展示过。
function installOne(key, state, stamp) {
  const { name, src } = TARGETS[key]
  const dst = dest(key)

  if (state === 'missing') {
    fail(`${name}：缺少规则源文件 ${src}`)
    return false
  }
  if (state === 'blocked') {
    fail(`${name}：${TARGETS[key].dir()} 是一个文件，不是目录`)
    dim(`请先移走或删除它，再重新运行：mv "${TARGETS[key].dir()}" "${TARGETS[key].dir()}.bak"`)
    return false
  }
  if (state === 'same') {
    ok(`${name}：已是最新，跳过`)
    return true
  }

  try {
    mkdirSync(dirname(dst), { recursive: true })
  } catch (err) {
    fail(`${name}：创建目录 ${dirname(dst)} 失败（${err.message}）`)
    return false
  }

  if (state !== 'create') {
    let saved = ''
    try {
      saved = backup(key, stamp)
    } catch (err) {
      fail(`${name}：备份 ${dst} 失败，已中止（${err.message}）`)
      return false
    }
    warn(`${name}：原文件已备份 -> ${saved}`)
    dim(`还原：cp "${saved}" "${dst}"`)
    rmSync(dst)
  }

  try {
    writeFileSync(dst, readFileSync(src))
  } catch (err) {
    fail(`${name}：写入 ${dst} 失败（${err.message}）`)
    return false
  }
  ok(`${name}：已写入 ${dst}`)
  return true
}

export async function installRules({ target = 'all', yes = false } = {}) {
  const keys = resolveTargets(target)
  const plan = keys.map((key) => ({ key, state: inspect(key) }))
  const stamp = uniqueStamp(keys)

  info(`安装全局规则：${keys.map((k) => TARGETS[k].name).join(' + ')}`)
  for (const { key, state } of plan) {
    dim(`${TARGETS[key].name} -> ${dest(key)}`)
    dim(`  ${PLAN_LABEL[state]}`)
  }

  // 全部已是最新时没有任何写入动作，不必再打断用户确认
  if (plan.every(({ state }) => state === 'same')) {
    console.log()
    ok('规则已是最新，无需改动。')
    return true
  }
  // 只有 update / link 会真正产生备份
  if (plan.some(({ state }) => state === 'update' || state === 'link')) {
    dim(`备份位置：<平台目录>/backup/${stamp}/`)
  }

  if (!(await confirm('继续？', yes))) {
    warn('已取消，未改动任何文件')
    return false
  }

  const results = plan.map(({ key, state }) => installOne(key, state, stamp))
  console.log()
  if (results.every(Boolean)) {
    ok('完成。重开一个会话即可加载新规则。')
    return true
  }
  const failed = plan.filter((_, i) => !results[i]).map(({ key }) => TARGETS[key].name)
  fail(`以下平台未完成：${failed.join('、')}（其余平台已按上面的结果处理）`)
  return false
}
