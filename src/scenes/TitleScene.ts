import {
  Container,
  FederatedPointerEvent,
  Graphics,
  Rectangle,
  Text,
} from 'pixi.js'
import { COLORS } from '../constants/colors'
import { VIEW_HEIGHT, VIEW_WIDTH } from '../types/GameState'

export class TitleScene extends Container {
  constructor(onStart: () => void, onDebug?: () => void) {
    super()
    this.eventMode = 'static'

    const bg = new Graphics()
    bg.rect(0, 0, VIEW_WIDTH, VIEW_HEIGHT).fill({ color: COLORS.background })
    bg.eventMode = 'static'
    bg.on('pointerdown', () => onStart())
    this.addChild(bg)

    const title = new Text({
      text: 'Yatagarrage',
      style: {
        fontFamily: 'serif',
        fontSize: 64,
        fill: 0xff6600,
        fontWeight: 'bold',
      },
    })
    title.anchor.set(0.5)
    title.x = VIEW_WIDTH / 2
    title.y = 180
    this.addChild(title)

    const subtitle = new Text({
      text: 'Hanabi Sparkout',
      style: {
        fontFamily: 'serif',
        fontSize: 28,
        fill: 0xffaa66,
        fontStyle: 'italic',
      },
    })
    subtitle.anchor.set(0.5)
    subtitle.x = VIEW_WIDTH / 2
    subtitle.y = 240
    this.addChild(subtitle)

    const instructions = new Text({
      text: '矢印キー: 移動 / Space: 射撃\n外周タップ: 射撃 / 中央タップ: 移動',
      style: {
        fontFamily: 'sans-serif',
        fontSize: 18,
        fill: 0xcccccc,
        align: 'center',
      },
    })
    instructions.anchor.set(0.5)
    instructions.x = VIEW_WIDTH / 2
    instructions.y = 360
    this.addChild(instructions)

    const start = new Text({
      text: 'クリック / Enter で開始',
      style: {
        fontFamily: 'sans-serif',
        fontSize: 24,
        fill: 0xffffff,
      },
    })
    start.anchor.set(0.5)
    start.x = VIEW_WIDTH / 2
    start.y = 460
    this.addChild(start)

    if (onDebug) {
      const debugButton = new Container()
      debugButton.x = VIEW_WIDTH - 130
      debugButton.y = VIEW_HEIGHT - 50
      debugButton.eventMode = 'static'
      debugButton.cursor = 'pointer'
      debugButton.hitArea = new Rectangle(0, 0, 110, 32)
      const debugBg = new Graphics()
      debugBg.rect(0, 0, 110, 32).fill({ color: 0x223344 })
      debugBg.rect(0, 0, 110, 32).stroke({ width: 1, color: 0x4488cc })
      const debugLabel = new Text({
        text: 'Debug Mode',
        style: { fontFamily: 'sans-serif', fontSize: 14, fill: 0xffffff },
      })
      debugLabel.anchor.set(0.5)
      debugLabel.x = 55
      debugLabel.y = 16
      debugButton.addChild(debugBg)
      debugButton.addChild(debugLabel)
      debugButton.on('pointerdown', (event: FederatedPointerEvent) => {
        event.stopPropagation()
        onDebug()
      })
      this.addChild(debugButton)
    }

    let blinkPhase = 0
    const tick = () => {
      blinkPhase += 0.05
      start.alpha = 0.5 + Math.sin(blinkPhase) * 0.5
      if (this.visible) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)

    const onKey = (event: KeyboardEvent) => {
      if (!this.visible) return
      if (event.code === 'Space' || event.code === 'Enter') {
        event.preventDefault()
        onStart()
      }
    }
    window.addEventListener('keydown', onKey)
    this.on('destroyed', () => window.removeEventListener('keydown', onKey))
  }
}
