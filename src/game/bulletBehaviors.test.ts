import { describe, expect, it } from 'vitest'
import { applyBulletBehaviors } from './bulletBehaviors'
import { Bullet, BulletFlags } from '../types/GameState'

const makeBullet = (overrides: Partial<Bullet> = {}): Bullet => ({
  id: 1,
  x: 100,
  y: 100,
  vx: 100,
  vy: 0,
  radius: 5,
  alive: true,
  color: 0xffffff,
  size: 4,
  spawnedAt: 0,
  lifespan: 4000,
  flags: {},
  data: {},
  ...overrides,
})

describe('applyBulletBehaviors', () => {
  it('does nothing when no flags are set', () => {
    const bullet = makeBullet()
    applyBulletBehaviors(bullet, { nowMs: 100, dtMs: 16 })
    expect(bullet.vx).toBe(100)
    expect(bullet.vy).toBe(0)
  })

  it('accelerates over time when accelerating', () => {
    const flags: BulletFlags = { accelerating: true }
    const bullet = makeBullet({ flags })
    applyBulletBehaviors(bullet, { nowMs: 0, dtMs: 16 })
    expect(bullet.vx).toBeCloseTo(100 * (1 + 0.002 * 16))
  })

  it('decelerates over time when decelerating', () => {
    const flags: BulletFlags = { decelerating: true }
    const bullet = makeBullet({ flags })
    applyBulletBehaviors(bullet, { nowMs: 0, dtMs: 16 })
    expect(bullet.vx).toBeCloseTo(100 * (1 - 0.002 * 16))
  })

  it('homing turns toward target after delay', () => {
    const flags: BulletFlags = { homing: true }
    const bullet = makeBullet({
      flags,
      data: { homingDelay: 100 },
      vx: 100,
      vy: 0,
      x: 0,
      y: 0,
    })
    // before delay: no rotation
    applyBulletBehaviors(bullet, {
      nowMs: 50,
      dtMs: 16,
      homingTarget: { x: 0, y: 100 },
    })
    expect(Math.atan2(bullet.vy, bullet.vx)).toBeCloseTo(0)
    // after delay: rotates toward target (90deg below)
    applyBulletBehaviors(bullet, {
      nowMs: 200,
      dtMs: 16,
      homingTarget: { x: 0, y: 100 },
    })
    const newAngle = Math.atan2(bullet.vy, bullet.vx)
    expect(newAngle).toBeGreaterThan(0)
    expect(newAngle).toBeLessThanOrEqual(0.05)
  })

  it('wave oscillates angle and advances wavePhase', () => {
    const flags: BulletFlags = { wave: true }
    const bullet = makeBullet({ flags })
    applyBulletBehaviors(bullet, { nowMs: 0, dtMs: 16 })
    expect(bullet.data.wavePhase).toBeCloseTo(0.1)
  })

  it('converging rotates toward convergePoint', () => {
    const flags: BulletFlags = { converging: true }
    const bullet = makeBullet({ flags, x: 0, y: 0, vx: 100, vy: 0 })
    applyBulletBehaviors(bullet, {
      nowMs: 0,
      dtMs: 16,
      convergePoint: { x: 0, y: 100 },
    })
    const newAngle = Math.atan2(bullet.vy, bullet.vx)
    expect(newAngle).toBeGreaterThan(0)
    expect(newAngle).toBeLessThanOrEqual(0.02 + 1e-9)
  })

  it('diverging rotates away from convergePoint and slightly accelerates', () => {
    const flags: BulletFlags = { diverging: true }
    // Bullet at (100, 0) moving +X (away from origin already), origin at (0, 0).
    // Diverging keeps it heading outward; speed grows by ~0.5% per call.
    const bullet = makeBullet({ flags, x: 100, y: 0, vx: 100, vy: 0 })
    const speedBefore = Math.hypot(bullet.vx, bullet.vy)
    applyBulletBehaviors(bullet, {
      nowMs: 0,
      dtMs: 16,
      convergePoint: { x: 0, y: 0 },
    })
    const speedAfter = Math.hypot(bullet.vx, bullet.vy)
    expect(speedAfter).toBeCloseTo(speedBefore * 1.005)
    // 既に外向きなので角度はほぼ維持される
    expect(Math.atan2(bullet.vy, bullet.vx)).toBeCloseTo(0)
  })

  it('twoStage with reverse behavior flips velocity at stage switch', () => {
    const flags: BulletFlags = { twoStage: true }
    const bullet = makeBullet({
      flags,
      vx: 100,
      vy: 50,
      data: { stageSwitchAt: 500 },
    })
    applyBulletBehaviors(bullet, {
      nowMs: 600,
      dtMs: 16,
      twoStageBehavior: 'reverse',
    })
    expect(bullet.vx).toBe(-100)
    expect(bullet.vy).toBe(-50)
    expect(bullet.data.secondStage).toBe(true)
  })

  it('twoStage with aim behavior redirects toward target', () => {
    const flags: BulletFlags = { twoStage: true }
    const bullet = makeBullet({
      flags,
      x: 0,
      y: 0,
      vx: 100,
      vy: 0,
      data: { stageSwitchAt: 500 },
    })
    applyBulletBehaviors(bullet, {
      nowMs: 600,
      dtMs: 16,
      twoStageBehavior: 'aim',
      twoStageTarget: { x: 0, y: 100, speed: 250 },
    })
    expect(bullet.vx).toBeCloseTo(0)
    expect(bullet.vy).toBeCloseTo(250)
    expect(bullet.data.secondStage).toBe(true)
  })

  it('twoStage does not retrigger after secondStage is set', () => {
    const flags: BulletFlags = { twoStage: true }
    const bullet = makeBullet({
      flags,
      vx: 100,
      vy: 0,
      data: { stageSwitchAt: 500, secondStage: true },
    })
    applyBulletBehaviors(bullet, {
      nowMs: 600,
      dtMs: 16,
      twoStageBehavior: 'reverse',
    })
    expect(bullet.vx).toBe(100) // unchanged
  })
})
