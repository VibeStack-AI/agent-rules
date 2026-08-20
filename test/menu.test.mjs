// 菜单键位行为测试：npm test
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { PassThrough } from 'node:stream'

// 伪造 TTY，让 select() 走 raw mode 分支
const fakeIn = new PassThrough()
fakeIn.isTTY = true
fakeIn.setRawMode = () => {}
Object.defineProperty(process, 'stdin', { value: fakeIn, configurable: true })
process.stdout.isTTY = true
process.env.NO_COLOR = '1' // 必须在导入 ui.mjs 前设置

const { select } = await import('../src/menu.mjs')

const ITEMS = [
  { label: 'A', value: 'a' },
  { label: 'B', value: 'b' },
  { label: 'C', value: 'c' },
]

const press = (...keys) => keys.forEach((k, i) => setTimeout(() => fakeIn.write(k), 10 * (i + 1)))

const DOWN = '\x1b[B'
const UP = '\x1b[A'
const ENTER = '\r'

test('回车选中第一项', async () => {
  press(ENTER)
  assert.equal(await select('t', ITEMS), 'a')
})

test('方向键下移', async () => {
  press(DOWN, ENTER)
  assert.equal(await select('t', ITEMS), 'b')
})

test('上移到顶部时环绕', async () => {
  press(UP, ENTER)
  assert.equal(await select('t', ITEMS), 'c')
})

test('数字键直选', async () => {
  press('2')
  assert.equal(await select('t', ITEMS), 'b')
})

test('超出范围的数字键被忽略', async () => {
  press('9', ENTER)
  assert.equal(await select('t', ITEMS), 'a')
})

test('q 取消返回 null', async () => {
  press('q')
  assert.equal(await select('t', ITEMS), null)
})

test('Esc 取消返回 null', async () => {
  press('\x1b')
  assert.equal(await select('t', ITEMS), null)
})
