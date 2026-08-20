// 终端输出与交互的最小封装。无第三方依赖。
import readline from 'node:readline/promises'
import { stdin, stdout } from 'node:process'

const useColor = stdout.isTTY && !process.env.NO_COLOR
const wrap = (code) => (s) => (useColor ? `\x1b[${code}m${s}\x1b[0m` : s)

export const red = wrap(31)
export const green = wrap(32)
export const yellow = wrap(33)
export const blue = wrap(34)
export const cyan = wrap(36)
export const dimC = wrap(2)

export const info = (msg) => console.log(`${blue('==>')} ${msg}`)
export const ok = (msg) => console.log(`${green(' ✓')} ${msg}`)
export const warn = (msg) => console.log(`${yellow(' !')} ${msg}`)
export const dim = (msg) => console.log(dimC(`   ${msg}`))
export const fail = (msg) => console.error(`${red(' ✗')} ${msg}`)

export const isInteractive = () => stdin.isTTY && stdout.isTTY

// 询问一次，返回去空白后的小写输入；非交互环境返回 fallback。
// 用户按 Ctrl-C / Ctrl-D 时返回 null，由调用方当作取消处理。
export async function ask(question, fallback = '') {
  if (!isInteractive()) return fallback
  const rl = readline.createInterface({ input: stdin, output: stdout })
  const aborted = new Promise((resolve) => rl.once('SIGINT', () => resolve(null)))
  try {
    return await Promise.race([rl.question(question).then((a) => a.trim().toLowerCase()), aborted])
  } catch {
    return null // readline 被关闭（Ctrl-D）
  } finally {
    rl.close()
  }
}

// 危险/写盘操作前的确认。assumeYes 或非交互环境直接放行。
export async function confirm(question, assumeYes) {
  if (assumeYes || !isInteractive()) return true
  const answer = await ask(`${yellow('?')} ${question} [y/N] `)
  return answer === 'y' || answer === 'yes'
}
