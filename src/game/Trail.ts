import { Container, Graphics } from 'pixi.js'

export type TrailPoint = {
  x: number
  y: number
  alpha: number
  color: number
  radius: number
}

export class TrailLayer {
  readonly container = new Container()
  private graphics = new Graphics()
  private readonly trails = new Map<number, TrailPoint[]>()
  private readonly maxLength = 10
  private readonly decay = 0.1

  constructor() {
    this.container.addChild(this.graphics)
  }

  add(id: number, x: number, y: number, color: number, radius = 3): void {
    let trail = this.trails.get(id)
    if (!trail) {
      trail = []
      this.trails.set(id, trail)
    }
    trail.push({ x, y, alpha: 1, color, radius })
    while (trail.length > this.maxLength) trail.shift()
  }

  remove(id: number): void {
    this.trails.delete(id)
  }

  clear(): void {
    this.trails.clear()
    this.graphics.clear()
  }

  update(): void {
    this.graphics.clear()
    for (const trail of this.trails.values()) {
      for (let i = trail.length - 1; i >= 0; i--) {
        const point = trail[i]
        point.alpha -= this.decay
        if (point.alpha <= 0) {
          trail.splice(i, 1)
          continue
        }
        this.graphics.circle(point.x, point.y, point.radius).fill({
          color: point.color,
          alpha: point.alpha * 0.5,
        })
      }
    }
  }
}
