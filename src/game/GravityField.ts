import { Container, Graphics } from 'pixi.js'
import { VIEW_HEIGHT, VIEW_WIDTH } from '../types/GameState'

export type GravitySourceConfig = {
  id: string
  radius: number
  speed: number
  strength: number
  size: number
  color: number
  angle: number
}

type GravitySourceState = {
  config: GravitySourceConfig
  angle: number
  x: number
  y: number
  marker: Graphics
}

const defaultConfigs = (): GravitySourceConfig[] => [
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
  readonly container = new Container()
  private readonly sources: GravitySourceState[] = []
  private enabled = true
  private elapsed = 0
  private readonly centerX = VIEW_WIDTH / 2
  private readonly centerY = VIEW_HEIGHT / 2

  constructor(configs: GravitySourceConfig[] = defaultConfigs()) {
    for (const config of configs) {
      const marker = new Graphics()
      this.drawMarker(marker, config.color, config.size, 1)
      marker.x = this.centerX
      marker.y = this.centerY
      this.container.addChild(marker)

      this.sources.push({
        config,
        angle: config.angle,
        x: this.centerX,
        y: this.centerY,
        marker,
      })
    }
  }

  setEnabled(value: boolean): void {
    this.enabled = value
    for (const source of this.sources) {
      source.marker.visible = value
    }
  }

  update(deltaMs: number): void {
    if (!this.enabled) return
    this.elapsed += deltaMs
    const dt = deltaMs / 1000
    for (const source of this.sources) {
      source.angle += source.config.speed * dt
      source.x = this.centerX + Math.cos(source.angle) * source.config.radius
      source.y = this.centerY + Math.sin(source.angle) * source.config.radius
      source.marker.x = source.x
      source.marker.y = source.y
      const pulse = 1 + Math.sin(this.elapsed * 0.005 + source.angle) * 0.15
      source.marker.scale.set(pulse)
    }
  }

  applyTo(bullet: { x: number; y: number; vx: number; vy: number }, deltaMs: number): void {
    if (!this.enabled) return
    const dt = deltaMs / 1000
    for (const source of this.sources) {
      const dx = source.x - bullet.x
      const dy = source.y - bullet.y
      const distSq = dx * dx + dy * dy
      if (distSq < 64) continue
      const invDist = 1 / Math.sqrt(distSq)
      const acceleration = (source.config.strength / distSq) * dt
      bullet.vx += dx * invDist * acceleration
      bullet.vy += dy * invDist * acceleration
    }
  }

  private drawMarker(g: Graphics, color: number, size: number, alpha: number): void {
    g.circle(0, 0, size).fill({ color, alpha: 0.65 * alpha })
    g.circle(0, 0, size).stroke({ width: 1, color: 0xffffff, alpha: 0.4 })
  }
}
