import { Container, FederatedPointerEvent } from 'pixi.js'

export type InputState = {
  left: boolean
  right: boolean
  up: boolean
  down: boolean
  shoot: boolean
}

export type PointerAction =
  | { type: 'move'; x: number; y: number }
  | { type: 'shoot'; x: number; y: number }

export class Input {
  readonly state: InputState = {
    left: false,
    right: false,
    up: false,
    down: false,
    shoot: false,
  }

  private readonly onActionCallbacks: ((action: PointerAction) => void)[] = []
  private removeKeyboardListeners: (() => void) | null = null

  attachKeyboard(): void {
    if (this.removeKeyboardListeners) return
    const onDown = (event: KeyboardEvent) => {
      switch (event.code) {
        case 'ArrowLeft':
          this.state.left = true
          break
        case 'ArrowRight':
          this.state.right = true
          break
        case 'ArrowUp':
          this.state.up = true
          break
        case 'ArrowDown':
          this.state.down = true
          break
        case 'Space':
          event.preventDefault()
          this.state.shoot = true
          break
      }
    }
    const onUp = (event: KeyboardEvent) => {
      switch (event.code) {
        case 'ArrowLeft':
          this.state.left = false
          break
        case 'ArrowRight':
          this.state.right = false
          break
        case 'ArrowUp':
          this.state.up = false
          break
        case 'ArrowDown':
          this.state.down = false
          break
        case 'Space':
          this.state.shoot = false
          break
      }
    }
    window.addEventListener('keydown', onDown)
    window.addEventListener('keyup', onUp)
    this.removeKeyboardListeners = () => {
      window.removeEventListener('keydown', onDown)
      window.removeEventListener('keyup', onUp)
    }
  }

  resetState(): void {
    this.state.left = false
    this.state.right = false
    this.state.up = false
    this.state.down = false
    this.state.shoot = false
  }

  detachKeyboard(): void {
    this.removeKeyboardListeners?.()
    this.removeKeyboardListeners = null
    this.resetState()
  }

  attachPointer(target: Container, viewWidth: number, viewHeight: number, edgeThreshold = 100): void {
    target.eventMode = 'static'
    target.hitArea = { contains: () => true }

    const isEdge = (x: number, y: number) =>
      x < edgeThreshold ||
      x > viewWidth - edgeThreshold ||
      y < edgeThreshold ||
      y > viewHeight - edgeThreshold

    const onDown = (event: FederatedPointerEvent) => {
      const x = event.global.x
      const y = event.global.y
      const type = isEdge(x, y) ? 'shoot' : 'move'
      this.emit({ type, x, y })
    }
    target.on('pointerdown', onDown)
  }

  onAction(callback: (action: PointerAction) => void): void {
    this.onActionCallbacks.push(callback)
  }

  private emit(action: PointerAction): void {
    for (const cb of this.onActionCallbacks) cb(action)
  }
}
