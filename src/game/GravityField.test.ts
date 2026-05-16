import { describe, expect, it } from 'vitest'
import { GravityField, GravitySourceConfig } from './GravityField'
import { VIEW_HEIGHT, VIEW_WIDTH } from '../types/GameState'

const singleSource: GravitySourceConfig[] = [
  {
    id: 'test',
    radius: 0,
    speed: 0,
    strength: 1_000_000,
    size: 10,
    color: 0xffffff,
    angle: 0,
  },
]

const makeBullet = () => ({ x: 100, y: 100, vx: 0, vy: 0 })

describe('GravityField.applyTo', () => {
  it('does nothing when disabled', () => {
    const field = new GravityField({ configs: singleSource })
    field.setEnabled(false)
    const bullet = makeBullet()
    field.applyTo(bullet, 16)
    expect(bullet.vx).toBe(0)
    expect(bullet.vy).toBe(0)
  })

  it('pulls bullet toward the source position', () => {
    const field = new GravityField({ configs: singleSource })
    // single source sits at the field center (radius 0)
    const bullet = makeBullet()
    field.applyTo(bullet, 16)
    // Force should point from bullet (100,100) toward center (VIEW_WIDTH/2, VIEW_HEIGHT/2) = (400, 300)
    expect(bullet.vx).toBeGreaterThan(0)
    expect(bullet.vy).toBeGreaterThan(0)
  })

  it('skips very close bullets (avoids singularity)', () => {
    const field = new GravityField({ configs: singleSource })
    const bullet = { x: VIEW_WIDTH / 2 + 1, y: VIEW_HEIGHT / 2 + 1, vx: 0, vy: 0 }
    field.applyTo(bullet, 16)
    expect(bullet.vx).toBe(0)
    expect(bullet.vy).toBe(0)
  })
})

describe('GravityField.update', () => {
  it('does nothing when disabled', () => {
    const orbitingSource: GravitySourceConfig[] = [
      {
        id: 'orbit',
        radius: 100,
        speed: 1.0,
        strength: 1_000_000,
        size: 10,
        color: 0xffffff,
        angle: 0,
      },
    ]
    const field = new GravityField({ configs: orbitingSource })
    field.setEnabled(false)
    const initialChildCount = field.container.children.length
    // shouldn't throw, and source markers don't get repositioned
    field.update(100)
    expect(field.container.children.length).toBe(initialChildCount)
  })

  it('moves orbiting source by speed * dt radians per second', () => {
    const orbitingSource: GravitySourceConfig[] = [
      {
        id: 'orbit',
        radius: 100,
        speed: 1.0,
        strength: 1_000_000,
        size: 10,
        color: 0xffffff,
        angle: 0,
      },
    ]
    const field = new GravityField({ configs: orbitingSource })
    // 1 second update at speed 1.0 rad/s → angle = 1.0 rad
    field.update(1000)
    // Source center is (VIEW_WIDTH/2, VIEW_HEIGHT/2) = (400, 300)
    // After 1 rad, source position should be roughly:
    //   x = 400 + cos(1) * 100 ≈ 454.03
    //   y = 300 + sin(1) * 100 ≈ 384.15
    // Marker is the first child added (one source = one marker)
    const marker = field.container.children[0] as { x: number; y: number }
    expect(marker.x).toBeCloseTo(400 + Math.cos(1) * 100, 1)
    expect(marker.y).toBeCloseTo(300 + Math.sin(1) * 100, 1)
  })

  it('uses custom center when provided', () => {
    const orbitingSource: GravitySourceConfig[] = [
      {
        id: 'orbit',
        radius: 50,
        speed: 0,
        strength: 100_000,
        size: 6,
        color: 0xffffff,
        angle: 0,
      },
    ]
    const field = new GravityField({
      center: { x: 200, y: 200 },
      configs: orbitingSource,
    })
    field.update(0)
    const marker = field.container.children[0] as { x: number; y: number }
    expect(marker.x).toBeCloseTo(200 + 50, 1)
    expect(marker.y).toBeCloseTo(200, 1)
  })
})
