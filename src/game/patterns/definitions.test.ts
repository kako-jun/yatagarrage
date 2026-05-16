import { describe, expect, it } from 'vitest'
import { PATTERNS } from './definitions'
import { PatternContext, SpawnBulletInput } from './types'

const makeCtx = (): {
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
  }
  return { ctx, spawned, scheduled }
}

const findPattern = (id: number) => {
  const pattern = PATTERNS.find(p => p.id === id)
  if (!pattern) throw new Error(`pattern ${id} missing`)
  return pattern
}

describe('PATTERNS registry', () => {
  it('contains exactly 35 patterns', () => {
    expect(PATTERNS).toHaveLength(35)
  })

  it('has unique ids from 1 to 35', () => {
    const ids = PATTERNS.map(p => p.id).sort((a, b) => a - b)
    expect(ids).toEqual(Array.from({ length: 35 }, (_, i) => i + 1))
  })

  it('every pattern has a non-empty label', () => {
    for (const pattern of PATTERNS) {
      expect(pattern.label.length).toBeGreaterThan(0)
    }
  })

  it('every pattern fire() does not throw with a clean context', () => {
    for (const pattern of PATTERNS) {
      const { ctx } = makeCtx()
      expect(() => pattern.fire(ctx)).not.toThrow()
    }
  })
})

describe('deterministic patterns spawn count', () => {
  const expectedCount: Record<number, number> = {
    1: 5,
    2: 8,
    3: 16,
    4: 24,
    5: 32,
    6: 1,
    7: 2,
    8: 3,
    9: 5,
    11: 8,
    12: 8,
    13: 4,
    14: 4,
    15: 8,
    16: 3,
    17: 5,
    18: 5,
    19: 4,
    21: 20,
    22: 4,
    23: 7,
    24: 7,
    25: 16,
    26: 18,
    29: 1,
    30: 3,
    31: 16,
    32: 6,
    33: 6,
    34: 15,
  }

  for (const [id, count] of Object.entries(expectedCount)) {
    it(`pattern ${id} spawns ${count} bullets`, () => {
      const { ctx, spawned } = makeCtx()
      findPattern(Number(id)).fire(ctx)
      expect(spawned).toHaveLength(count)
    })
  }
})

describe('non-deterministic patterns', () => {
  it('pattern 10 (random) spawns 10 bullets', () => {
    const { ctx, spawned } = makeCtx()
    findPattern(10).fire(ctx)
    expect(spawned).toHaveLength(10)
  })

  it('pattern 35 (random homing) spawns 5 bullets all with homing flag', () => {
    const { ctx, spawned } = makeCtx()
    findPattern(35).fire(ctx)
    expect(spawned).toHaveLength(5)
    for (const bullet of spawned) {
      expect(bullet.flags?.homing).toBe(true)
      expect(bullet.homingDelay).toBeGreaterThanOrEqual(500)
      expect(bullet.homingDelay).toBeLessThanOrEqual(1000)
    }
  })
})

describe('scheduled patterns', () => {
  it('pattern 20 (timed) schedules 5 delays at 100ms intervals', () => {
    const { ctx, scheduled } = makeCtx()
    findPattern(20).fire(ctx)
    expect(scheduled.map(s => s.delayMs)).toEqual([0, 100, 200, 300, 400])
  })

  it('pattern 27 (burst) schedules 3 bursts at 150ms intervals', () => {
    const { ctx, scheduled } = makeCtx()
    findPattern(27).fire(ctx)
    expect(scheduled.map(s => s.delayMs)).toEqual([0, 150, 300])
  })

  it('pattern 28 (stream) schedules 10 shots at 50ms intervals', () => {
    const { ctx, scheduled } = makeCtx()
    findPattern(28).fire(ctx)
    expect(scheduled).toHaveLength(10)
    expect(scheduled[0].delayMs).toBe(0)
    expect(scheduled[9].delayMs).toBe(450)
  })
})

describe('flag-bearing patterns', () => {
  it('pattern 9 (wave) marks every bullet with wave flag', () => {
    const { ctx, spawned } = makeCtx()
    findPattern(9).fire(ctx)
    for (const bullet of spawned) {
      expect(bullet.flags?.wave).toBe(true)
      expect(bullet.wavePhase).toBeTypeOf('number')
    }
  })

  it('pattern 11 (converging) marks every bullet with converging flag', () => {
    const { ctx, spawned } = makeCtx()
    findPattern(11).fire(ctx)
    for (const bullet of spawned) {
      expect(bullet.flags?.converging).toBe(true)
    }
  })

  it('pattern 12 (diverging) marks every bullet with diverging flag', () => {
    const { ctx, spawned } = makeCtx()
    findPattern(12).fire(ctx)
    for (const bullet of spawned) {
      expect(bullet.flags?.diverging).toBe(true)
    }
  })

  it('pattern 16 (homing) marks every bullet with homing flag', () => {
    const { ctx, spawned } = makeCtx()
    findPattern(16).fire(ctx)
    for (const bullet of spawned) {
      expect(bullet.flags?.homing).toBe(true)
    }
  })

  it('pattern 17 (accelerating) marks every bullet with accelerating flag', () => {
    const { ctx, spawned } = makeCtx()
    findPattern(17).fire(ctx)
    for (const bullet of spawned) {
      expect(bullet.flags?.accelerating).toBe(true)
    }
  })

  it('pattern 18 (decelerating) marks every bullet with decelerating flag', () => {
    const { ctx, spawned } = makeCtx()
    findPattern(18).fire(ctx)
    for (const bullet of spawned) {
      expect(bullet.flags?.decelerating).toBe(true)
    }
  })

  it('pattern 19 (twoStage) marks every bullet with twoStage flag', () => {
    const { ctx, spawned } = makeCtx()
    findPattern(19).fire(ctx)
    for (const bullet of spawned) {
      expect(bullet.flags?.twoStage).toBe(true)
    }
  })
})

describe('aimed patterns', () => {
  it('pattern 29 (straight aim) spawns a single bullet heading toward player', () => {
    const { ctx, spawned } = makeCtx()
    findPattern(29).fire(ctx)
    expect(spawned).toHaveLength(1)
    const angle = Math.atan2(spawned[0].vy, spawned[0].vx)
    expect(angle).toBeCloseTo(Math.PI / 2)
  })

  it('pattern 30 (predict) uses playerVelocity to lead the target', () => {
    const { ctx, spawned } = makeCtx()
    ctx.playerVelocity = { vx: 100, vy: 0 }
    findPattern(30).fire(ctx)
    expect(spawned).toHaveLength(3)
    // Predicted target: player + velocity * 0.5 = (400+50, 500) → angle from (400,100)
    const expected = Math.atan2(500 - 100, 450 - 400)
    const center = Math.atan2(spawned[1].vy, spawned[1].vx)
    expect(center).toBeCloseTo(expected)
  })

  it('pattern 30 (predict) falls back to current player position when velocity missing', () => {
    const { ctx, spawned } = makeCtx()
    findPattern(30).fire(ctx)
    const expected = Math.atan2(500 - 100, 400 - 400)
    const center = Math.atan2(spawned[1].vy, spawned[1].vx)
    expect(center).toBeCloseTo(expected)
  })
})

describe('geometric patterns', () => {
  const angles = (spawned: { vx: number; vy: number }[]) =>
    spawned
      .map(b => {
        const a = Math.atan2(b.vy, b.vx)
        return a < 0 ? a + Math.PI * 2 : a
      })
      .sort((a, b) => a - b)

  it('pattern 13 (cross) shoots 0 / π/2 / π / 3π/2', () => {
    const { ctx, spawned } = makeCtx()
    findPattern(13).fire(ctx)
    const got = angles(spawned)
    const want = [0, Math.PI / 2, Math.PI, (Math.PI * 3) / 2]
    expect(got.length).toBe(4)
    for (let i = 0; i < 4; i += 1) expect(got[i]).toBeCloseTo(want[i])
  })

  it('pattern 14 (X) shoots π/4 / 3π/4 / 5π/4 / 7π/4', () => {
    const { ctx, spawned } = makeCtx()
    findPattern(14).fire(ctx)
    const got = angles(spawned)
    const want = [
      Math.PI / 4,
      (Math.PI * 3) / 4,
      (Math.PI * 5) / 4,
      (Math.PI * 7) / 4,
    ]
    expect(got.length).toBe(4)
    for (let i = 0; i < 4; i += 1) expect(got[i]).toBeCloseTo(want[i])
  })

  it('pattern 15 (asterisk) shoots 8 evenly spaced angles', () => {
    const { ctx, spawned } = makeCtx()
    findPattern(15).fire(ctx)
    const got = angles(spawned)
    expect(got.length).toBe(8)
    for (let i = 0; i < 8; i += 1) {
      expect(got[i]).toBeCloseTo((Math.PI * 2 * i) / 8)
    }
  })

  it('pattern 2 (ring 8) shoots 8 evenly spaced angles', () => {
    const { ctx, spawned } = makeCtx()
    findPattern(2).fire(ctx)
    const got = angles(spawned)
    expect(got.length).toBe(8)
    for (let i = 0; i < 8; i += 1) {
      expect(got[i]).toBeCloseTo((Math.PI * 2 * i) / 8)
    }
  })

  it('pattern 5 (ring 32) shoots 32 evenly spaced angles', () => {
    const { ctx, spawned } = makeCtx()
    findPattern(5).fire(ctx)
    const got = angles(spawned)
    expect(got.length).toBe(32)
    for (let i = 0; i < 32; i += 1) {
      expect(got[i]).toBeCloseTo((Math.PI * 2 * i) / 32)
    }
  })
})
