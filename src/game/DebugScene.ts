import Phaser from 'phaser'
import { GravityField } from './gravityField'
import { DANMAKU_PATTERNS, SpawnBulletFn } from './patterns'

type DebugEvents =
  | 'debug-fire-pattern'
  | 'debug-clear'
  | 'debug-set-gravity'
  | 'debug-set-gravity-count'
  | 'debug-set-gravity-strength'

export class DebugScene extends Phaser.Scene {
  private bullets?: Phaser.Physics.Arcade.Group
  private origin = new Phaser.Math.Vector2(400, 160)
  private originMarker?: Phaser.GameObjects.Graphics
  private statusText?: Phaser.GameObjects.Text
  private timers: Phaser.Time.TimerEvent[] = []
  private gravityField?: GravityField
  private gravityEnabled = true
  private activePatternLabel?: string

  constructor() {
    super({ key: 'DebugScene' })
  }

  create() {
    this.add.text(16, 16, 'デバッグモード - 弾幕プレビュー', {
      fontSize: '20px',
      color: '#ffffff',
    })

    this.statusText = this.add.text(16, 46, '', {
      fontSize: '16px',
      color: '#cccccc',
    })

    this.bullets = this.physics.add.group({ maxSize: 400 })
    this.originMarker = this.add.graphics()
    this.gravityField = new GravityField(this)

    const storedGravity = this.registry.get('debug-gravity-enabled')
    if (typeof storedGravity === 'boolean') {
      this.gravityEnabled = storedGravity
      this.gravityField.setEnabled(storedGravity)
    }

    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      this.origin.set(pointer.x, pointer.y)
    })

    this.game.events.on(
      'debug-fire-pattern' as DebugEvents,
      this.firePattern,
      this
    )
    this.game.events.on('debug-clear' as DebugEvents, this.resetBullets, this)
    this.game.events.on(
      'debug-set-gravity' as DebugEvents,
      this.setGravityEnabled,
      this
    )
    this.game.events.on(
      'debug-set-gravity-count' as DebugEvents,
      this.setGravitySourceCount,
      this
    )
    this.game.events.on(
      'debug-set-gravity-strength' as DebugEvents,
      this.setGravityStrength,
      this
    )

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.game.events.off(
        'debug-fire-pattern' as DebugEvents,
        this.firePattern,
        this
      )
      this.game.events.off(
        'debug-clear' as DebugEvents,
        this.resetBullets,
        this
      )
      this.game.events.off(
        'debug-set-gravity' as DebugEvents,
        this.setGravityEnabled,
        this
      )
      this.game.events.off(
        'debug-set-gravity-count' as DebugEvents,
        this.setGravitySourceCount,
        this
      )
      this.game.events.off(
        'debug-set-gravity-strength' as DebugEvents,
        this.setGravityStrength,
        this
      )
      this.clearTimers()
      this.resetBullets()
      this.gravityField?.destroy()
    })

    this.updateStatusText()
  }

  update(_time: number, delta: number) {
    this.drawOriginMarker()
    this.gravityField?.update(delta)
    this.updateBullets()
  }

  private drawOriginMarker() {
    if (!this.originMarker) return
    this.originMarker.clear()
    this.originMarker.lineStyle(1, 0x00ffff, 0.9)
    this.originMarker.strokeCircle(this.origin.x, this.origin.y, 14)
    this.originMarker.beginPath()
    this.originMarker.moveTo(this.origin.x - 18, this.origin.y)
    this.originMarker.lineTo(this.origin.x + 18, this.origin.y)
    this.originMarker.moveTo(this.origin.x, this.origin.y - 18)
    this.originMarker.lineTo(this.origin.x, this.origin.y + 18)
    this.originMarker.strokePath()
  }

  private updateBullets() {
    this.bullets?.children.each(child => {
      const bullet = child as Phaser.Physics.Arcade.Sprite
      if (!bullet.body) return true

      const lifespan = bullet.getData('lifespan') as number | undefined
      const spawnTime = bullet.getData('spawnedAt') as number | undefined

      if (
        bullet.y < -20 ||
        bullet.y > 620 ||
        bullet.x < -20 ||
        bullet.x > 820 ||
        (lifespan &&
          spawnTime !== undefined &&
          this.time.now - spawnTime > lifespan)
      ) {
        this.destroyBullet(bullet)
        return true
      }

      this.gravityField?.applyTo(bullet)

      const color = (bullet.getData('color') as number) ?? 0xffff00
      const size = (bullet.getData('size') as number) ?? 5
      let graphics = bullet.getData('graphics') as
        | Phaser.GameObjects.Graphics
        | undefined

      if (!graphics) {
        graphics = this.add.graphics()
        bullet.setData('graphics', graphics)
      }

      graphics.clear()
      graphics.fillStyle(color, 1)
      graphics.fillCircle(bullet.x, bullet.y, size)
      return true
    })
  }

  private destroyBullet(bullet: Phaser.Physics.Arcade.Sprite) {
    const graphics = bullet.getData('graphics') as
      | Phaser.GameObjects.Graphics
      | undefined
    if (graphics) graphics.destroy()
    bullet.destroy()
  }

  private clearTimers() {
    this.timers.forEach(timer => timer.remove(false))
    this.timers = []
  }

  private resetBullets() {
    this.clearTimers()
    this.bullets?.children.each(child => {
      const bullet = child as Phaser.Physics.Arcade.Sprite
      this.destroyBullet(bullet)
      return true
    })
  }

  private spawnBullet: SpawnBulletFn = ({
    x,
    y,
    vx,
    vy,
    color = 0xffff00,
    size = 5,
    lifespan = 4000,
  }) => {
    if (!this.bullets) return
    const bullet = this.bullets.get(x, y, '') as Phaser.Physics.Arcade.Sprite
    if (!bullet) return

    bullet.setActive(true)
    bullet.setVisible(true)
    bullet.setVelocity(vx, vy)
    bullet.body?.setSize(size * 2, size * 2)
    bullet.setData('color', color)
    bullet.setData('size', size)
    bullet.setData('lifespan', lifespan)
    bullet.setData('spawnedAt', this.time.now)
  }

  private firePattern(patternId: string) {
    const pattern = DANMAKU_PATTERNS.find(p => p.id === patternId)
    if (!pattern) return

    this.resetBullets()
    const label = `${pattern.label}${
      pattern.description ? ` - ${pattern.description}` : ''
    }`
    this.updateStatusText(label)

    pattern.script({
      scene: this,
      origin: this.origin.clone(),
      spawn: this.spawnBullet,
      registerTimer: timer => this.timers.push(timer),
    })
  }

  private setGravityEnabled(enabled: boolean) {
    this.gravityEnabled = enabled
    this.gravityField?.setEnabled(enabled)
    this.updateStatusText()
  }

  private setGravitySourceCount(count: number) {
    this.gravityField?.setActiveSourceCount(count)
    this.updateStatusText()
  }

  private setGravityStrength(index: number, strength: number) {
    this.gravityField?.setSourceStrength(index, strength)
    this.updateStatusText()
  }

  private updateStatusText(patternLabel?: string) {
    if (patternLabel !== undefined) {
      this.activePatternLabel = patternLabel
    }

    const patternText = this.activePatternLabel
      ? `プレビュー: ${this.activePatternLabel}`
      : '弾幕ボタンを押してプレビューを開始'
    const gravityText = `重力: ${this.gravityEnabled ? 'ON' : 'OFF'}`
    const hintText = 'クリックで原点移動 / 「弾をクリア」でリセット'

    this.statusText?.setText(`${patternText}\n${gravityText} / ${hintText}`)
  }
}
