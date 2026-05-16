import { Bullet, BulletFlags } from '../types/GameState'

export const PATTERN_COUNT = 35

export type SpawnBulletInput = {
  x: number
  y: number
  vx: number
  vy: number
  color?: number
  size?: number
  lifespan?: number
  flags?: BulletFlags
  homingDelay?: number
  wavePhase?: number
}

export type PatternContext = {
  enemy: { x: number; y: number }
  player: { x: number; y: number }
  now: number
  spawn: (input: SpawnBulletInput) => Bullet | null
  scheduleDelay: (delayMs: number, fn: () => void) => void
  spiralAngleRef: { value: number }
  rotationAngleRef: { value: number }
}

const DEFAULT_SPEED = 200

const angleTo = (ax: number, ay: number, bx: number, by: number): number =>
  Math.atan2(by - ay, bx - ax)

const baseAngle = (ctx: PatternContext): number =>
  angleTo(ctx.enemy.x, ctx.enemy.y, ctx.player.x, ctx.player.y)

const fan = (ctx: PatternContext, count: number, spread: number, speed: number): void => {
  const base = baseAngle(ctx)
  for (let i = 0; i < count; i += 1) {
    const angle = base + (i - (count - 1) / 2) * spread
    ctx.spawn({
      x: ctx.enemy.x,
      y: ctx.enemy.y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
    })
  }
}

const ring = (ctx: PatternContext, count: number, speed: number, color?: number): void => {
  for (let i = 0; i < count; i += 1) {
    const angle = (Math.PI * 2 * i) / count
    ctx.spawn({
      x: ctx.enemy.x,
      y: ctx.enemy.y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      color,
    })
  }
}

const spiral = (ctx: PatternContext, arms: number, speed: number): void => {
  ctx.spiralAngleRef.value += 0.2
  const offset = ctx.spiralAngleRef.value
  for (let i = 0; i < arms; i += 1) {
    const angle = offset + (Math.PI * 2 * i) / arms
    ctx.spawn({
      x: ctx.enemy.x,
      y: ctx.enemy.y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
    })
  }
}

const rotating = (ctx: PatternContext, count: number, rotationSpeed: number, speed: number): void => {
  ctx.rotationAngleRef.value += rotationSpeed
  const offset = ctx.rotationAngleRef.value
  for (let i = 0; i < count; i += 1) {
    const angle = offset + (Math.PI * 2 * i) / count
    ctx.spawn({
      x: ctx.enemy.x,
      y: ctx.enemy.y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
    })
  }
}

export const PATTERN_DESCRIPTIONS: Record<number, string> = {
  1: '扇状弾幕(5-way)',
  2: '円形弾幕(8方向)',
  3: '円形弾幕(16方向)',
  4: '円形弾幕(24方向)',
  5: '円形弾幕(32方向)',
  6: 'シングルスパイラル',
  7: 'ダブルスパイラル',
  8: 'トリプルスパイラル',
  9: '波状弾幕',
  10: 'ランダム弾幕',
  11: '収束弾幕',
  12: '拡散弾幕',
  13: '十字型',
  14: 'X字型',
  15: '米字型',
  16: 'ホーミング弾',
  17: '加速弾',
  18: '減速弾',
  19: '二段階弾幕',
  20: '時間差弾幕',
  21: '密集弾幕',
  22: 'まばら弾幕',
  23: '扇形集中',
  24: '扇形分散',
  25: 'ダブル円形',
  26: 'トリプル円形',
  27: 'バースト弾',
  28: 'ストリーム弾',
  29: '直線自機狙い',
  30: '予測弾',
  31: '爆発型',
  32: '回転弾幕(時計)',
  33: '回転弾幕(反時計)',
  34: '花弁状',
  35: 'ランダム方向ホーミング',
}

export const firePattern = (patternId: number, ctx: PatternContext): void => {
  const speed = DEFAULT_SPEED
  switch (patternId) {
    case 1:
      fan(ctx, 5, 0.3, speed)
      return
    case 2:
      ring(ctx, 8, speed)
      return
    case 3:
      ring(ctx, 16, speed)
      return
    case 4:
      ring(ctx, 24, speed)
      return
    case 5:
      ring(ctx, 32, speed)
      return
    case 6:
      spiral(ctx, 1, speed)
      return
    case 7:
      spiral(ctx, 2, speed)
      return
    case 8:
      spiral(ctx, 3, speed)
      return
    case 9: {
      const base = baseAngle(ctx)
      for (let i = 0; i < 5; i += 1) {
        const waveOffset = Math.sin(i * 0.5) * 0.5
        const angle = base + waveOffset
        ctx.spawn({
          x: ctx.enemy.x,
          y: ctx.enemy.y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          flags: { wave: true },
          wavePhase: i * 0.5,
        })
      }
      return
    }
    case 10: {
      for (let i = 0; i < 10; i += 1) {
        const angle = Math.random() * Math.PI * 2
        const randomSpeed = speed * (0.7 + Math.random() * 0.6)
        ctx.spawn({
          x: ctx.enemy.x,
          y: ctx.enemy.y,
          vx: Math.cos(angle) * randomSpeed,
          vy: Math.sin(angle) * randomSpeed,
        })
      }
      return
    }
    case 11: {
      for (let i = 0; i < 8; i += 1) {
        const angle = (Math.PI * 2 * i) / 8
        ctx.spawn({
          x: ctx.enemy.x,
          y: ctx.enemy.y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          flags: { converging: true },
        })
      }
      return
    }
    case 12: {
      for (let i = 0; i < 8; i += 1) {
        const angle = (Math.PI * 2 * i) / 8
        ctx.spawn({
          x: ctx.enemy.x,
          y: ctx.enemy.y,
          vx: Math.cos(angle) * speed * 0.5,
          vy: Math.sin(angle) * speed * 0.5,
          flags: { diverging: true },
        })
      }
      return
    }
    case 13: {
      const angles = [0, Math.PI / 2, Math.PI, (Math.PI * 3) / 2]
      for (const angle of angles) {
        ctx.spawn({
          x: ctx.enemy.x,
          y: ctx.enemy.y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
        })
      }
      return
    }
    case 14: {
      const angles = [Math.PI / 4, (Math.PI * 3) / 4, (Math.PI * 5) / 4, (Math.PI * 7) / 4]
      for (const angle of angles) {
        ctx.spawn({
          x: ctx.enemy.x,
          y: ctx.enemy.y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
        })
      }
      return
    }
    case 15:
      ring(ctx, 8, speed)
      return
    case 16: {
      for (let i = 0; i < 3; i += 1) {
        const angle = (Math.PI * 2 * i) / 3
        ctx.spawn({
          x: ctx.enemy.x,
          y: ctx.enemy.y,
          vx: Math.cos(angle) * speed * 0.8,
          vy: Math.sin(angle) * speed * 0.8,
          flags: { homing: true },
          homingDelay: 0,
        })
      }
      return
    }
    case 17: {
      const base = baseAngle(ctx)
      for (let i = 0; i < 5; i += 1) {
        const angle = base + (i - 2) * 0.2
        ctx.spawn({
          x: ctx.enemy.x,
          y: ctx.enemy.y,
          vx: Math.cos(angle) * speed * 0.5,
          vy: Math.sin(angle) * speed * 0.5,
          flags: { accelerating: true },
        })
      }
      return
    }
    case 18: {
      const base = baseAngle(ctx)
      for (let i = 0; i < 5; i += 1) {
        const angle = base + (i - 2) * 0.2
        ctx.spawn({
          x: ctx.enemy.x,
          y: ctx.enemy.y,
          vx: Math.cos(angle) * speed * 1.5,
          vy: Math.sin(angle) * speed * 1.5,
          flags: { decelerating: true },
        })
      }
      return
    }
    case 19: {
      for (let i = 0; i < 4; i += 1) {
        const angle = (Math.PI * 2 * i) / 4
        ctx.spawn({
          x: ctx.enemy.x,
          y: ctx.enemy.y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          flags: { twoStage: true },
        })
      }
      return
    }
    case 20: {
      const base = baseAngle(ctx)
      for (let i = 0; i < 5; i += 1) {
        ctx.scheduleDelay(i * 100, () => {
          ctx.spawn({
            x: ctx.enemy.x,
            y: ctx.enemy.y,
            vx: Math.cos(base) * speed,
            vy: Math.sin(base) * speed,
          })
        })
      }
      return
    }
    case 21: {
      const base = baseAngle(ctx)
      for (let i = 0; i < 20; i += 1) {
        const angle = base + (i - 10) * 0.05
        ctx.spawn({
          x: ctx.enemy.x,
          y: ctx.enemy.y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
        })
      }
      return
    }
    case 22: {
      const base = baseAngle(ctx)
      for (let i = 0; i < 4; i += 1) {
        const angle = base + (i - 2) * 0.8
        ctx.spawn({
          x: ctx.enemy.x,
          y: ctx.enemy.y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
        })
      }
      return
    }
    case 23:
      fan(ctx, 7, 0.15, speed)
      return
    case 24:
      fan(ctx, 7, 0.5, speed)
      return
    case 25: {
      const counts = [8, 8]
      const speeds = [speed, speed * 0.6]
      counts.forEach((count, index) => {
        ring(ctx, count, speeds[index])
      })
      return
    }
    case 26: {
      const counts = [6, 6, 6]
      const speeds = [speed, speed * 0.7, speed * 0.4]
      counts.forEach((count, index) => {
        ring(ctx, count, speeds[index])
      })
      return
    }
    case 27: {
      for (let burst = 0; burst < 3; burst += 1) {
        const burstIndex = burst
        ctx.scheduleDelay(burst * 150, () => {
          for (let i = 0; i < 8; i += 1) {
            const angle = (Math.PI * 2 * i) / 8 + burstIndex * 0.2
            ctx.spawn({
              x: ctx.enemy.x,
              y: ctx.enemy.y,
              vx: Math.cos(angle) * speed,
              vy: Math.sin(angle) * speed,
            })
          }
        })
      }
      return
    }
    case 28: {
      const base = baseAngle(ctx)
      for (let i = 0; i < 10; i += 1) {
        ctx.scheduleDelay(i * 50, () => {
          const angle = base + (Math.random() - 0.5) * 0.1
          ctx.spawn({
            x: ctx.enemy.x,
            y: ctx.enemy.y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
          })
        })
      }
      return
    }
    case 29: {
      const angle = baseAngle(ctx)
      ctx.spawn({
        x: ctx.enemy.x,
        y: ctx.enemy.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
      })
      return
    }
    case 30: {
      const predictTime = 0.5
      const predictX = ctx.player.x
      const predictY = ctx.player.y
      const angle = angleTo(ctx.enemy.x, ctx.enemy.y, predictX, predictY + predictTime)
      for (let i = 0; i < 3; i += 1) {
        const spreadAngle = angle + (i - 1) * 0.15
        ctx.spawn({
          x: ctx.enemy.x,
          y: ctx.enemy.y,
          vx: Math.cos(spreadAngle) * speed,
          vy: Math.sin(spreadAngle) * speed,
        })
      }
      return
    }
    case 31: {
      for (let i = 0; i < 16; i += 1) {
        const angle = (Math.PI * 2 * i) / 16
        const randomSpeed = speed * 1.2 * (0.8 + Math.random() * 0.4)
        ctx.spawn({
          x: ctx.enemy.x,
          y: ctx.enemy.y,
          vx: Math.cos(angle) * randomSpeed,
          vy: Math.sin(angle) * randomSpeed,
        })
      }
      return
    }
    case 32:
      rotating(ctx, 6, 0.1, speed)
      return
    case 33:
      rotating(ctx, 6, -0.1, speed)
      return
    case 34: {
      const petals = 5
      for (let i = 0; i < petals * 3; i += 1) {
        const petalAngle = (Math.PI * 2 * Math.floor(i / 3)) / petals
        const offset = (i % 3) * 0.2
        const angle = petalAngle + offset
        const petalSpeed = speed * (1 - (i % 3) * 0.2)
        ctx.spawn({
          x: ctx.enemy.x,
          y: ctx.enemy.y,
          vx: Math.cos(angle) * petalSpeed,
          vy: Math.sin(angle) * petalSpeed,
        })
      }
      return
    }
    case 35: {
      for (let i = 0; i < 5; i += 1) {
        const angle = Math.random() * Math.PI * 2
        ctx.spawn({
          x: ctx.enemy.x,
          y: ctx.enemy.y,
          vx: Math.cos(angle) * speed * 0.7,
          vy: Math.sin(angle) * speed * 0.7,
          flags: { homing: true },
          homingDelay: 500 + Math.random() * 500,
        })
      }
      return
    }
    default:
      fan(ctx, 5, 0.3, speed)
  }
}
