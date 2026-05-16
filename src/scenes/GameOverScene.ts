import { Container, Graphics, Text, FederatedPointerEvent } from 'pixi.js'
import { COLORS } from '../constants/colors'
import { VIEW_HEIGHT, VIEW_WIDTH } from '../types/GameState'

export class GameOverScene extends Container {
  private scoreText: Text

  constructor(onRestart: () => void) {
    super()
    this.eventMode = 'static'
    this.hitArea = { contains: () => true }

    const bg = new Graphics()
    bg.rect(0, 0, VIEW_WIDTH, VIEW_HEIGHT).fill({
      color: COLORS.background,
      alpha: 0.95,
    })
    this.addChild(bg)

    const gameOver = new Text({
      text: 'GAME OVER',
      style: {
        fontFamily: 'serif',
        fontSize: 72,
        fill: 0xff3344,
        fontWeight: 'bold',
      },
    })
    gameOver.anchor.set(0.5)
    gameOver.x = VIEW_WIDTH / 2
    gameOver.y = 220
    this.addChild(gameOver)

    this.scoreText = new Text({
      text: 'スコア: 0',
      style: { fontFamily: 'sans-serif', fontSize: 32, fill: 0xffffff },
    })
    this.scoreText.anchor.set(0.5)
    this.scoreText.x = VIEW_WIDTH / 2
    this.scoreText.y = 320
    this.addChild(this.scoreText)

    const hint = new Text({
      text: 'クリック / タップで再スタート',
      style: { fontFamily: 'sans-serif', fontSize: 22, fill: 0xcccccc },
    })
    hint.anchor.set(0.5)
    hint.x = VIEW_WIDTH / 2
    hint.y = 420
    this.addChild(hint)

    this.on('pointerdown', (_event: FederatedPointerEvent) => onRestart())

    const onKey = (event: KeyboardEvent) => {
      if (!this.visible) return
      if (event.code === 'Space' || event.code === 'Enter') {
        event.preventDefault()
        onRestart()
      }
    }
    window.addEventListener('keydown', onKey)
    this.on('destroyed', () => window.removeEventListener('keydown', onKey))
  }

  setScore(score: number): void {
    this.scoreText.text = `スコア: ${score}`
  }
}
