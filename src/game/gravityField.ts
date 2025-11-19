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

      this.sources.push({
        config,
        angle,
        marker,
        position: new Phaser.Math.Vector2(this.center.x, this.center.y),
      })
    })
  }

  setEnabled(value: boolean) {
    this.enabled = value
    this.sources.forEach(source => {
      source.marker.setVisible(value)
    })
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

      const pulse =
        0.9 + Math.sin(this.scene.time.now * 0.005 + source.angle) * 0.15
      source.marker.setScale(pulse)
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
    })
  }
}
