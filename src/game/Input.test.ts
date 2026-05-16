// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from 'vitest'
import { Input } from './Input'

const fire = (type: 'keydown' | 'keyup', code: string) => {
  window.dispatchEvent(new KeyboardEvent(type, { code }))
}

describe('Input keyboard', () => {
  let activeInput: Input | null = null

  afterEach(() => {
    activeInput?.detachKeyboard()
    activeInput = null
  })

  it('starts with all keys released', () => {
    const input = new Input()
    activeInput = input
    expect(input.state).toEqual({
      left: false,
      right: false,
      up: false,
      down: false,
      shoot: false,
    })
  })

  it('updates state on arrow key down/up', () => {
    const input = new Input()
    activeInput = input
    input.attachKeyboard()

    fire('keydown', 'ArrowLeft')
    expect(input.state.left).toBe(true)

    fire('keyup', 'ArrowLeft')
    expect(input.state.left).toBe(false)

    fire('keydown', 'ArrowRight')
    fire('keydown', 'ArrowUp')
    fire('keydown', 'ArrowDown')
    expect(input.state.right).toBe(true)
    expect(input.state.up).toBe(true)
    expect(input.state.down).toBe(true)
  })

  it('sets shoot on Space and clears on key up', () => {
    const input = new Input()
    activeInput = input
    input.attachKeyboard()
    fire('keydown', 'Space')
    expect(input.state.shoot).toBe(true)
    fire('keyup', 'Space')
    expect(input.state.shoot).toBe(false)
  })

  it('ignores unrelated keys', () => {
    const input = new Input()
    activeInput = input
    input.attachKeyboard()
    fire('keydown', 'KeyA')
    expect(input.state).toEqual({
      left: false,
      right: false,
      up: false,
      down: false,
      shoot: false,
    })
  })

  it('detachKeyboard stops handling events and clears state', () => {
    const input = new Input()
    activeInput = input
    input.attachKeyboard()
    fire('keydown', 'ArrowLeft')
    fire('keydown', 'Space')
    input.detachKeyboard()
    expect(input.state).toEqual({
      left: false,
      right: false,
      up: false,
      down: false,
      shoot: false,
    })
    // After detach, new events do not flip state back on
    fire('keydown', 'ArrowLeft')
    expect(input.state.left).toBe(false)
  })
})
