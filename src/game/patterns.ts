import Phaser from 'phaser'

export type SpawnBulletFn = (options: {
  x: number
  y: number
  vx: number
  vy: number
  color?: number
  size?: number
  lifespan?: number
}) => void

export type PatternContext = {
  scene: Phaser.Scene
  origin: Phaser.Math.Vector2
  spawn: SpawnBulletFn
  registerTimer: (timer: Phaser.Time.TimerEvent) => void
}

export type DanmakuPattern = {
  id: string
  label: string
  description?: string
  script: (ctx: PatternContext) => void
}

export const DANMAKU_PATTERNS: DanmakuPattern[] = [
  {
    id: '001-line-rain',
    label: '001: 直線弾雨',
    description: '正面からまっすぐ降り注ぐ基本パターン',
    script: ({ origin, spawn }) => {
      const startX = origin.x - 180
      const step = 30
      for (let i = 0; i < 13; i += 1) {
        spawn({
          x: startX + i * step,
          y: origin.y,
          vx: 0,
          vy: 260,
          color: 0xffff66,
        })
      }
    },
  },
  {
    id: '002-fan-spread',
    label: '002: 扇状拡散',
    description: '前方にゆるく拡散する中距離弾',
    script: ({ origin, spawn }) => {
      const bullets = 18
      const startAngle = -70
      const endAngle = 70
      for (let i = 0; i < bullets; i += 1) {
        const angle = Phaser.Math.Linear(
          startAngle,
          endAngle,
          i / (bullets - 1)
        )
        const speed = 240
        const rad = Phaser.Math.DegToRad(angle)
        spawn({
          x: origin.x,
          y: origin.y,
          vx: Math.cos(rad) * speed,
          vy: Math.sin(rad) * speed,
          color: 0xffcc66,
        })
      }
    },
  },
  {
    id: '003-ring-burst',
    label: '003: 全方位リング',
    description: '一斉に放射される全方位弾',
    script: ({ origin, spawn }) => {
      const bullets = 26
      const speed = 200
      for (let i = 0; i < bullets; i += 1) {
        const angle = (360 / bullets) * i
        const rad = Phaser.Math.DegToRad(angle)
        spawn({
          x: origin.x,
          y: origin.y,
          vx: Math.cos(rad) * speed,
          vy: Math.sin(rad) * speed,
          color: 0x99e6ff,
        })
      }
    },
  },
  {
    id: '004-spiral',
    label: '004: スパイラル',
    description: '角度が回転する連続発射',
    script: ({ origin, spawn, registerTimer, scene }) => {
      const speed = 220
      let angle = -90
      const timer = scene.time.addEvent({
        delay: 70,
        repeat: 35,
        callback: () => {
          const rad = Phaser.Math.DegToRad(angle)
          spawn({
            x: origin.x,
            y: origin.y,
            vx: Math.cos(rad) * speed,
            vy: Math.sin(rad) * speed,
            color: 0xff88ff,
          })
          angle += 12
        },
      })
      registerTimer(timer)
    },
  },
]
