// 零依赖的方向键选择菜单。终端不支持 raw mode 时降级为数字输入。
import readline from 'node:readline'
import { stdin, stdout } from 'node:process'

import { ask, blue, cyan, dimC, green, isInteractive } from './ui.mjs'

const POINTER = '❯'
const CURSOR_UP = (n) => `\x1b[${n}A`
const CLEAR_LINE = '\x1b[2K'

function render(items, active, firstPaint) {
  if (!firstPaint) stdout.write(CURSOR_UP(items.length))
  for (const [i, item] of items.entries()) {
    const selected = i === active
    const label = selected ? `${green(POINTER)} ${cyan(item.label)}` : `  ${item.label}`
    stdout.write(`${CLEAR_LINE}${label}\n`)
  }
}

// 数字输入降级：非 TTY 或不支持 raw mode 时使用。
async function selectByNumber(title, items) {
  console.log(blue(title))
  for (const [i, item] of items.entries()) console.log(`  ${green(String(i + 1))}) ${item.label}`)
  console.log()
  const answer = await ask(`请输入序号 [1-${items.length}]: `, '')
  const index = Number.parseInt(answer, 10) - 1
  return items[index]?.value ?? null
}

/**
 * 展示菜单并返回选中项的 value；用户取消（q / Esc / Ctrl-C）时返回 null。
 * items: [{ label, value }]
 */
export async function select(title, items) {
  if (!isInteractive() || typeof stdin.setRawMode !== 'function') {
    return selectByNumber(title, items)
  }

  console.log(blue(title))
  console.log(dimC('  ↑/↓ 移动，数字键直选，Enter 确认，q 退出'))
  console.log()

  return new Promise((resolve) => {
    let active = 0
    render(items, active, true)

    readline.emitKeypressEvents(stdin)
    stdin.setRawMode(true)
    stdin.resume()

    const finish = (value) => {
      stdin.off('keypress', onKeypress)
      stdin.setRawMode(false)
      stdin.pause()
      console.log()
      resolve(value)
    }

    function onKeypress(_str, key = {}) {
      const name = key.name ?? ''
      if (name === 'up' || name === 'k') active = (active - 1 + items.length) % items.length
      else if (name === 'down' || name === 'j') active = (active + 1) % items.length
      else if (name === 'return' || name === 'space') return finish(items[active].value)
      else if (name === 'escape' || name === 'q' || (key.ctrl && name === 'c')) return finish(null)
      else if (/^[1-9]$/.test(name) && Number(name) <= items.length) {
        active = Number(name) - 1
        render(items, active, false)
        return finish(items[active].value)
      } else return
      render(items, active, false)
    }

    stdin.on('keypress', onKeypress)
  })
}
