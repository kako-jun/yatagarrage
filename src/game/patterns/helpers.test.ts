import { describe, expect, it } from 'vitest'
import { angleTo, baseAngle, fan, ring, rotating, spiral } from './helpers'
import { PatternContext, SpawnBulletInput } from './types'

const makeCtx = (
  overrides: Partial<PatternContext> = {}
): {
  ctx: PatternContext
  spawned: SpawnBulletInput[]
  scheduled: { delayMs: number; fn: () => void }[]
} => {
  const spawned: SpawnBulletInput[] = []
  const scheduled: { delayMs: number; fn: () => void }[] = []
  const ctx: PatternContext = {
    enemy: { x: 400, y: 100 },
    player: { x: 400, y: 500 },
    now: 0,
    spawn: input => {
      spawned.push(input)
      return null
    },
    scheduleDelay: (delayMs, fn) => scheduled.push({ delayMs, fn }),
    spiralAngleRef: { value: 0 },
    rotationAngleRef: { value: 0 },
    ...overrides,
  }
  return { ctx, spawned, scheduled }
}

describe('angleTo', () => {
  it('returns 0 for points on positive X axis', () => {
    expect(angleTo(0, 0, 10, 0)).toBeCloseTo(0)
  })

  it('returns PI/2 for points directly below', () => {
    expect(angleTo(0, 0, 0, 10)).toBeCloseTo(Math.PI / 2)
  })

  it('returns PI for points on negative X axis', () => {
    expect(angleTo(0, 0, -10, 0)).toBeCloseTo(Math.PI)
  })

  it('returns -PI/2 for points directly above', () => {
    expect(angleTo(0, 0, 0, -10)).toBeCloseTo(-Math.PI / 2)
  })
})

describe('baseAngle', () => {
  it('returns the angle from enemy to player', () => {
    const { ctx } = makeCtx({
      enemy: { x: 400, y: 100 },
      player: { x: 400, y: 500 },
    })
    expect(baseAngle(ctx)).toBeCloseTo(Math.PI / 2)
  })
})

describe('fan', () => {
  it('spawns the requested number of bullets', () => {
    const { ctx, spawned } = makeCtx()
    fan(ctx, 5, 0.3, 200)
    expect(spawned).toHaveLength(5)
  })

  it('centers bullets around baseAngle', () => {
    const { ctx, spawned } = makeCtx()
    fan(ctx, 3, 0.2, 200)
    const angles = spawned.map(b => Math.atan2(b.vy, b.vx))
    const base = Math.PI / 2
    expect(angles[0]).toBeCloseTo(base - 0.2)
    expect(angles[1]).toBeCloseTo(base)
    expect(angles[2]).toBeCloseTo(base + 0.2)
  })

  it('spawns bullets at enemy position', () => {
    const { ctx, spawned } = makeCtx()
    fan(ctx, 3, 0.2, 200)
    for (const bullet of spawned) {
      expect(bullet.x).toBe(400)
      expect(bullet.y).toBe(100)
    }
  })
})

describe('ring', () => {
  it('spawns count bullets evenly around the circle', () => {
    const { ctx, spawned } = makeCtx()
    ring(ctx, 8, 200)
    expect(spawned).toHaveLength(8)
    const speeds = spawned.map(b => Math.hypot(b.vx, b.vy))
    for (const speed of speeds) {
      expect(speed).toBeCloseTo(200)
    }
  })

  it('distributes bullets at 360/count degree intervals', () => {
    const { ctx, spawned } = makeCtx()
    ring(ctx, 4, 100)
    const angles = spawned.map(b => Math.atan2(b.vy, b.vx))
    expect(angles[0]).toBeCloseTo(0)
    expect(angles[1]).toBeCloseTo(Math.PI / 2)
    expect(angles[2]).toBeCloseTo(Math.PI)
    expect(angles[3]).toBeCloseTo(-Math.PI / 2)
  })

  it('forwards color to each spawn call', () => {
    const { ctx, spawned } = makeCtx()
    ring(ctx, 3, 100, 0xff0000)
    for (const bullet of spawned) {
      expect(bullet.color).toBe(0xff0000)
    }
  })
})

describe('spiral', () => {
  it('advances spiralAngleRef by 0.2 each call', () => {
    const { ctx } = makeCtx()
    spiral(ctx, 2, 100)
    expect(ctx.spiralAngleRef.value).toBeCloseTo(0.2)
    spiral(ctx, 2, 100)
    expect(ctx.spiralAngleRef.value).toBeCloseTo(0.4)
  })

  it('spawns one bullet per arm', () => {
    const { ctx, spawned } = makeCtx()
    spiral(ctx, 3, 100)
    expect(spawned).toHaveLength(3)
  })
})

describe('rotating', () => {
  it('advances rotationAngleRef by rotationSpeed', () => {
    const { ctx } = makeCtx()
    rotating(ctx, 6, 0.1, 200)
    expect(ctx.rotationAngleRef.value).toBeCloseTo(0.1)
    rotating(ctx, 6, -0.05, 200)
    expect(ctx.rotationAngleRef.value).toBeCloseTo(0.05)
  })

  it('spawns count bullets', () => {
    const { ctx, spawned } = makeCtx()
    rotating(ctx, 6, 0.1, 200)
    expect(spawned).toHaveLength(6)
  })
})
