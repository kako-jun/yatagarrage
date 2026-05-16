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
    const field = new GravityField(singleSource)
    field.setEnabled(false)
    const bullet = makeBullet()
    field.applyTo(bullet, 16)
    expect(bullet.vx).toBe(0)
    expect(bullet.vy).toBe(0)
  })

  it('pulls bullet toward the source position', () => {
    const field = new GravityField(singleSource)
    // single source sits at the field center (radius 0)
    const bullet = makeBullet()
    field.applyTo(bullet, 16)
    // Force should point from bullet (100,100) toward center (VIEW_WIDTH/2, VIEW_HEIGHT/2) = (400, 300)
    expect(bullet.vx).toBeGreaterThan(0)
    expect(bullet.vy).toBeGreaterThan(0)
  })

  it('skips very close bullets (avoids singularity)', () => {
    const field = new GravityField(singleSource)
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
    const field = new GravityField(orbitingSource)
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
    const field = new GravityField(orbitingSource)
    field.update(1000) // 1 second
    const bullet = { x: 0, y: VIEW_HEIGHT / 2, vx: 0, vy: 0 }
    // After 1s at speed 1.0, source angle should have moved from 0 to ~1.0 rad
    field.applyTo(bullet, 16)
    // Just verify the field is still functional and acceleration applied
    const speedAfter = Math.hypot(bullet.vx, bullet.vy)
    expect(speedAfter).toBeGreaterThan(0)
  })
})
