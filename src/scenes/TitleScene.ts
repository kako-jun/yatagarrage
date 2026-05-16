import { Container, Graphics, Text, FederatedPointerEvent } from 'pixi.js'
import { COLORS } from '../constants/colors'
import { VIEW_HEIGHT, VIEW_WIDTH } from '../types/GameState'

export class TitleScene extends Container {
  constructor(onStart: () => void) {
    super()
    this.eventMode = 'static'
    this.hitArea = { contains: () => true }

    const bg = new Graphics()
    bg.rect(0, 0, VIEW_WIDTH, VIEW_HEIGHT).fill({ color: COLORS.background })
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
      text: 'クリック / タップで開始',
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

    let blinkPhase = 0
    const tick = () => {
      blinkPhase += 0.05
      start.alpha = 0.5 + Math.sin(blinkPhase) * 0.5
      if (this.visible) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)

    this.on('pointerdown', (_event: FederatedPointerEvent) => {
      onStart()
    })

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
