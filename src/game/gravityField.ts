import Phaser from 'phaser'

export type GravitySourceConfig = {
  id: string
  radius: number
  speed: number // radians per second
  strength: number
  size: number
  color: number
  angle?: number
}

type GravitySourceState = {
  config: GravitySourceConfig
  angle: number
  position: Phaser.Math.Vector2
  marker: Phaser.GameObjects.Arc
  label?: Phaser.GameObjects.Text
  originalStrength?: number
}

const createDefaultConfigs = (): GravitySourceConfig[] => [
  {
    id: 'alpha',
    radius: 170,
    speed: 0.4,
    strength: 1600000,
    size: 10,
    color: 0x66d9ff,
    angle: 0,
  },
  {
    id: 'beta',
    radius: 240,
    speed: -0.28,
    strength: 1200000,
    size: 12,
    color: 0xff8ad9,
    angle: Math.PI * 0.6,
  },
  {
    id: 'gamma',
    radius: 120,
    speed: 0.65,
    strength: 900000,
    size: 8,
    color: 0x86ffad,
    angle: Math.PI * 1.3,
  },
]

export class GravityField {
  private readonly sources: GravitySourceState[] = []
  private enabled = true
  private lastDelta = 16
  private readonly scratch = new Phaser.Math.Vector2()
  private readonly center: Phaser.Math.Vector2

  constructor(
    private readonly scene: Phaser.Scene,
    options?: {
      center?: Phaser.Math.Vector2
      configs?: GravitySourceConfig[]
    }
  ) {
    this.center =
      options?.center?.clone() ??
      new Phaser.Math.Vector2(scene.scale.width / 2, scene.scale.height / 2)

    const configs = options?.configs ?? createDefaultConfigs()

    configs.forEach((config, index) => {
      const angle =
        config.angle ?? (index / Math.max(configs.length, 1)) * Phaser.Math.PI2
      const marker = scene.add.circle(
        this.center.x,
        this.center.y,
        config.size,
        config.color,
        0.65
      )
      marker.setDepth(75)
      marker.setStrokeStyle(1, 0xffffff, 0.4)

      // 重力源の番号テキストを作成
      const label = scene.add.text(
        this.center.x,
        this.center.y,
        `${index + 1}`,
        {
          fontSize: '14px',
          color: '#ffffff',
          fontStyle: 'bold',
        }
      )
      label.setOrigin(0.5, 0.5)
      label.setDepth(76)

      this.sources.push({
        config,
        angle,
        marker,
        label,
        position: new Phaser.Math.Vector2(this.center.x, this.center.y),
      })
    })
  }

  setEnabled(value: boolean) {
    this.enabled = value
    this.sources.forEach(source => {
      source.marker.setVisible(value)
      source.label?.setVisible(value)
    })
  }

  setActiveSourceCount(count: number) {
    const clampedCount = Math.max(0, Math.min(count, this.sources.length))
    this.sources.forEach((source, index) => {
      const isActive = index < clampedCount
      source.marker.setVisible(isActive && this.enabled)
      source.label?.setVisible(isActive && this.enabled)
      // 非アクティブな重力源の強さを0にすることで、弾道に影響しないようにする
      if (!isActive) {
        if (source.originalStrength === undefined) {
          source.originalStrength = source.config.strength
        }
        source.config.strength = 0
      } else {
        if (source.originalStrength !== undefined) {
          source.config.strength = source.originalStrength
        }
      }
    })
  }

  setSourceStrength(index: number, strength: number) {
    if (index >= 0 && index < this.sources.length) {
      this.sources[index].config.strength = strength
      this.sources[index].originalStrength = strength
    }
  }

  getSourceCount(): number {
    return this.sources.length
  }

  getSourceStrength(index: number): number {
    if (index >= 0 && index < this.sources.length) {
      return this.sources[index].config.strength
    }
    return 0
  }

  update(delta: number) {
    this.lastDelta = delta
    if (!this.enabled) return

    this.sources.forEach(source => {
      source.angle += source.config.speed * (delta / 1000)
      const x = this.center.x + Math.cos(source.angle) * source.config.radius
      const y = this.center.y + Math.sin(source.angle) * source.config.radius
      source.position.set(x, y)
      source.marker.setPosition(x, y)

      // ラベルの位置も更新
      source.label?.setPosition(x, y)

      // 重力の強さに応じてサイズを変更（0-3000000 → 0.5-2.5倍）
      const strengthRatio = Math.abs(source.config.strength) / 1600000
      const baseScale = 0.5 + Math.min(strengthRatio, 2.0)
      const pulse = Math.sin(this.scene.time.now * 0.005 + source.angle) * 0.15
      source.marker.setScale(baseScale + pulse)

      // 強さに応じて透明度も調整
      const alpha = source.config.strength === 0 ? 0.2 : 0.65
      source.marker.setAlpha(alpha)
      source.label?.setAlpha(alpha)
    })
  }

  applyTo(sprite: Phaser.Physics.Arcade.Sprite) {
    if (!this.enabled || !sprite.body) return
    const body = sprite.body as Phaser.Physics.Arcade.Body
    const dt = this.lastDelta / 1000

    this.sources.forEach(source => {
      this.scratch.set(
        source.position.x - sprite.x,
        source.position.y - sprite.y
      )
      const distSq = this.scratch.lengthSq()
      if (distSq < 64 || distSq === 0) return
      const invDist = 1 / Math.sqrt(distSq)
      const dirX = this.scratch.x * invDist
      const dirY = this.scratch.y * invDist
      const acceleration = (source.config.strength / distSq) * dt
      body.velocity.x += dirX * acceleration
      body.velocity.y += dirY * acceleration
    })
  }

  destroy() {
    this.sources.forEach(source => {
      source.marker.destroy()
      source.label?.destroy()
    })
  }
}
