import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Input } from './Input'

// jsdom-like keyboard event simulation
class FakeKeyboardEvent {
  preventDefault = vi.fn()
  constructor(public code: string) {}
}

type Listener = (e: unknown) => void

describe('Input keyboard', () => {
  const listeners: Record<string, Listener[]> = {}
  const originalAdd = globalThis.window?.addEventListener
  const originalRemove = globalThis.window?.removeEventListener

  beforeEach(() => {
    listeners.keydown = []
    listeners.keyup = []
    // mock window event listeners
    ;(globalThis as unknown as { window: Window }).window = {
      addEventListener: (type: string, cb: Listener) => {
        listeners[type] = listeners[type] || []
        listeners[type].push(cb)
      },
      removeEventListener: (type: string, cb: Listener) => {
        listeners[type] = (listeners[type] || []).filter(c => c !== cb)
      },
    } as unknown as Window
  })

  afterEach(() => {
    if (originalAdd && originalRemove) {
      window.addEventListener = originalAdd
      window.removeEventListener = originalRemove
    }
  })

  const fire = (type: string, code: string) => {
    const event = new FakeKeyboardEvent(code)
    for (const cb of listeners[type] ?? []) cb(event)
  }

  it('starts with all keys released', () => {
    const input = new Input()
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
    input.attachKeyboard()
    fire('keydown', 'Space')
    expect(input.state.shoot).toBe(true)
    fire('keyup', 'Space')
    expect(input.state.shoot).toBe(false)
  })

  it('ignores unrelated keys', () => {
    const input = new Input()
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

  it('detachKeyboard clears all state', () => {
    const input = new Input()
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
  })
})
