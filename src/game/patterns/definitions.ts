import {
  angleTo,
  baseAngle,
  fan,
  ring,
  rotating,
  spiral,
} from './helpers'
import { DEFAULT_BULLET_SPEED, Pattern } from './types'

const SPEED = DEFAULT_BULLET_SPEED

export const PATTERNS: readonly Pattern[] = [
  {
    id: 1,
    label: '扇状弾幕(5-way)',
    fire: ctx => fan(ctx, 5, 0.3, SPEED),
  },
  {
    id: 2,
    label: '円形弾幕(8方向)',
    fire: ctx => ring(ctx, 8, SPEED),
  },
  {
    id: 3,
    label: '円形弾幕(16方向)',
    fire: ctx => ring(ctx, 16, SPEED),
  },
  {
    id: 4,
    label: '円形弾幕(24方向)',
    fire: ctx => ring(ctx, 24, SPEED),
  },
  {
    id: 5,
    label: '円形弾幕(32方向)',
    fire: ctx => ring(ctx, 32, SPEED),
  },
  {
    id: 6,
    label: 'シングルスパイラル',
    fire: ctx => spiral(ctx, 1, SPEED),
  },
  {
    id: 7,
    label: 'ダブルスパイラル',
    fire: ctx => spiral(ctx, 2, SPEED),
  },
  {
    id: 8,
    label: 'トリプルスパイラル',
    fire: ctx => spiral(ctx, 3, SPEED),
  },
  {
    id: 9,
    label: '波状弾幕',
    fire: ctx => {
      const base = baseAngle(ctx)
      for (let i = 0; i < 5; i += 1) {
        const waveOffset = Math.sin(i * 0.5) * 0.5
        const angle = base + waveOffset
        ctx.spawn({
          x: ctx.enemy.x,
          y: ctx.enemy.y,
          vx: Math.cos(angle) * SPEED,
          vy: Math.sin(angle) * SPEED,
          flags: { wave: true },
          wavePhase: i * 0.5,
        })
      }
    },
  },
  {
    id: 10,
    label: 'ランダム弾幕',
    fire: ctx => {
      for (let i = 0; i < 10; i += 1) {
        const angle = Math.random() * Math.PI * 2
        const speed = SPEED * (0.7 + Math.random() * 0.6)
        ctx.spawn({
          x: ctx.enemy.x,
          y: ctx.enemy.y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
        })
      }
    },
  },
  {
    id: 11,
    label: '収束弾幕',
    fire: ctx => {
      for (let i = 0; i < 8; i += 1) {
        const angle = (Math.PI * 2 * i) / 8
        ctx.spawn({
          x: ctx.enemy.x,
          y: ctx.enemy.y,
          vx: Math.cos(angle) * SPEED,
          vy: Math.sin(angle) * SPEED,
          flags: { converging: true },
        })
      }
    },
  },
  {
    id: 12,
    label: '拡散弾幕',
    fire: ctx => {
      for (let i = 0; i < 8; i += 1) {
        const angle = (Math.PI * 2 * i) / 8
        ctx.spawn({
          x: ctx.enemy.x,
          y: ctx.enemy.y,
          vx: Math.cos(angle) * SPEED * 0.5,
          vy: Math.sin(angle) * SPEED * 0.5,
          flags: { diverging: true },
        })
      }
    },
  },
  {
    id: 13,
    label: '十字型',
    fire: ctx => {
      const angles = [0, Math.PI / 2, Math.PI, (Math.PI * 3) / 2]
      for (const angle of angles) {
        ctx.spawn({
          x: ctx.enemy.x,
          y: ctx.enemy.y,
          vx: Math.cos(angle) * SPEED,
          vy: Math.sin(angle) * SPEED,
        })
      }
    },
  },
  {
    id: 14,
    label: 'X字型',
    fire: ctx => {
      const angles = [
        Math.PI / 4,
        (Math.PI * 3) / 4,
        (Math.PI * 5) / 4,
        (Math.PI * 7) / 4,
      ]
      for (const angle of angles) {
        ctx.spawn({
          x: ctx.enemy.x,
          y: ctx.enemy.y,
          vx: Math.cos(angle) * SPEED,
          vy: Math.sin(angle) * SPEED,
        })
      }
    },
  },
  {
    id: 15,
    label: '米字型',
    fire: ctx => ring(ctx, 8, SPEED),
  },
  {
    id: 16,
    label: 'ホーミング弾',
    fire: ctx => {
      for (let i = 0; i < 3; i += 1) {
        const angle = (Math.PI * 2 * i) / 3
        ctx.spawn({
          x: ctx.enemy.x,
          y: ctx.enemy.y,
          vx: Math.cos(angle) * SPEED * 0.8,
          vy: Math.sin(angle) * SPEED * 0.8,
          flags: { homing: true },
          homingDelay: 0,
        })
      }
    },
  },
  {
    id: 17,
    label: '加速弾',
    fire: ctx => {
      const base = baseAngle(ctx)
      for (let i = 0; i < 5; i += 1) {
        const angle = base + (i - 2) * 0.2
        ctx.spawn({
          x: ctx.enemy.x,
          y: ctx.enemy.y,
          vx: Math.cos(angle) * SPEED * 0.5,
          vy: Math.sin(angle) * SPEED * 0.5,
          flags: { accelerating: true },
        })
      }
    },
  },
  {
    id: 18,
    label: '減速弾',
    fire: ctx => {
      const base = baseAngle(ctx)
      for (let i = 0; i < 5; i += 1) {
        const angle = base + (i - 2) * 0.2
        ctx.spawn({
          x: ctx.enemy.x,
          y: ctx.enemy.y,
          vx: Math.cos(angle) * SPEED * 1.5,
          vy: Math.sin(angle) * SPEED * 1.5,
          flags: { decelerating: true },
        })
      }
    },
  },
  {
    id: 19,
    label: '二段階弾幕',
    fire: ctx => {
      for (let i = 0; i < 4; i += 1) {
        const angle = (Math.PI * 2 * i) / 4
        ctx.spawn({
          x: ctx.enemy.x,
          y: ctx.enemy.y,
          vx: Math.cos(angle) * SPEED,
          vy: Math.sin(angle) * SPEED,
          flags: { twoStage: true },
        })
      }
    },
  },
  {
    id: 20,
    label: '時間差弾幕',
    fire: ctx => {
      const base = baseAngle(ctx)
      for (let i = 0; i < 5; i += 1) {
        ctx.scheduleDelay(i * 100, () => {
          ctx.spawn({
            x: ctx.enemy.x,
            y: ctx.enemy.y,
            vx: Math.cos(base) * SPEED,
            vy: Math.sin(base) * SPEED,
          })
        })
      }
    },
  },
  {
    id: 21,
    label: '密集弾幕',
    fire: ctx => {
      const base = baseAngle(ctx)
      for (let i = 0; i < 20; i += 1) {
        const angle = base + (i - 10) * 0.05
        ctx.spawn({
          x: ctx.enemy.x,
          y: ctx.enemy.y,
          vx: Math.cos(angle) * SPEED,
          vy: Math.sin(angle) * SPEED,
        })
      }
    },
  },
  {
    id: 22,
    label: 'まばら弾幕',
    fire: ctx => {
      const base = baseAngle(ctx)
      for (let i = 0; i < 4; i += 1) {
        const angle = base + (i - 2) * 0.8
        ctx.spawn({
          x: ctx.enemy.x,
          y: ctx.enemy.y,
          vx: Math.cos(angle) * SPEED,
          vy: Math.sin(angle) * SPEED,
        })
      }
    },
  },
  {
    id: 23,
    label: '扇形集中',
    fire: ctx => fan(ctx, 7, 0.15, SPEED),
  },
  {
    id: 24,
    label: '扇形分散',
    fire: ctx => fan(ctx, 7, 0.5, SPEED),
  },
  {
    id: 25,
    label: 'ダブル円形',
    fire: ctx => {
      const counts = [8, 8]
      const speeds = [SPEED, SPEED * 0.6]
      counts.forEach((count, index) => ring(ctx, count, speeds[index]))
    },
  },
  {
    id: 26,
    label: 'トリプル円形',
    fire: ctx => {
      const counts = [6, 6, 6]
      const speeds = [SPEED, SPEED * 0.7, SPEED * 0.4]
      counts.forEach((count, index) => ring(ctx, count, speeds[index]))
    },
  },
  {
    id: 27,
    label: 'バースト弾',
    fire: ctx => {
      for (let burst = 0; burst < 3; burst += 1) {
        const burstIndex = burst
        ctx.scheduleDelay(burst * 150, () => {
          for (let i = 0; i < 8; i += 1) {
            const angle = (Math.PI * 2 * i) / 8 + burstIndex * 0.2
            ctx.spawn({
              x: ctx.enemy.x,
              y: ctx.enemy.y,
              vx: Math.cos(angle) * SPEED,
              vy: Math.sin(angle) * SPEED,
            })
          }
        })
      }
    },
  },
  {
    id: 28,
    label: 'ストリーム弾',
    fire: ctx => {
      const base = baseAngle(ctx)
      for (let i = 0; i < 10; i += 1) {
        ctx.scheduleDelay(i * 50, () => {
          const angle = base + (Math.random() - 0.5) * 0.1
          ctx.spawn({
            x: ctx.enemy.x,
            y: ctx.enemy.y,
            vx: Math.cos(angle) * SPEED,
            vy: Math.sin(angle) * SPEED,
          })
        })
      }
    },
  },
  {
    id: 29,
    label: '直線自機狙い',
    fire: ctx => {
      const angle = baseAngle(ctx)
      ctx.spawn({
        x: ctx.enemy.x,
        y: ctx.enemy.y,
        vx: Math.cos(angle) * SPEED,
        vy: Math.sin(angle) * SPEED,
      })
    },
  },
  {
    id: 30,
    label: '予測弾',
    fire: ctx => {
      const predictTime = 0.5
      const predictX = ctx.player.x
      const predictY = ctx.player.y
      const angle = angleTo(
        ctx.enemy.x,
        ctx.enemy.y,
        predictX,
        predictY + predictTime
      )
      for (let i = 0; i < 3; i += 1) {
        const spreadAngle = angle + (i - 1) * 0.15
        ctx.spawn({
          x: ctx.enemy.x,
          y: ctx.enemy.y,
          vx: Math.cos(spreadAngle) * SPEED,
          vy: Math.sin(spreadAngle) * SPEED,
        })
      }
    },
  },
  {
    id: 31,
    label: '爆発型',
    fire: ctx => {
      for (let i = 0; i < 16; i += 1) {
        const angle = (Math.PI * 2 * i) / 16
        const speed = SPEED * 1.2 * (0.8 + Math.random() * 0.4)
        ctx.spawn({
          x: ctx.enemy.x,
          y: ctx.enemy.y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
        })
      }
    },
  },
  {
    id: 32,
    label: '回転弾幕(時計)',
    fire: ctx => rotating(ctx, 6, 0.1, SPEED),
  },
  {
    id: 33,
    label: '回転弾幕(反時計)',
    fire: ctx => rotating(ctx, 6, -0.1, SPEED),
  },
  {
    id: 34,
    label: '花弁状',
    fire: ctx => {
      const petals = 5
      for (let i = 0; i < petals * 3; i += 1) {
        const petalAngle = (Math.PI * 2 * Math.floor(i / 3)) / petals
        const offset = (i % 3) * 0.2
        const angle = petalAngle + offset
        const petalSpeed = SPEED * (1 - (i % 3) * 0.2)
        ctx.spawn({
          x: ctx.enemy.x,
          y: ctx.enemy.y,
          vx: Math.cos(angle) * petalSpeed,
          vy: Math.sin(angle) * petalSpeed,
        })
      }
    },
  },
  {
    id: 35,
    label: 'ランダムホーミング',
    fire: ctx => {
      for (let i = 0; i < 5; i += 1) {
        const angle = Math.random() * Math.PI * 2
        ctx.spawn({
          x: ctx.enemy.x,
          y: ctx.enemy.y,
          vx: Math.cos(angle) * SPEED * 0.7,
          vy: Math.sin(angle) * SPEED * 0.7,
          flags: { homing: true },
          homingDelay: 500 + Math.random() * 500,
        })
      }
    },
  },
]
