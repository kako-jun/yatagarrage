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
  {
    id: '005-circle-8',
    label: '005: 円形8方向',
    description: '8方向へ均等に発射',
    script: ({ origin, spawn }) => {
      const bullets = 8
      const speed = 200
      for (let i = 0; i < bullets; i += 1) {
        const angle = (360 / bullets) * i
        const rad = Phaser.Math.DegToRad(angle)
        spawn({
          x: origin.x,
          y: origin.y,
          vx: Math.cos(rad) * speed,
          vy: Math.sin(rad) * speed,
          color: 0xff6666,
        })
      }
    },
  },
  {
    id: '006-circle-16',
    label: '006: 円形16方向',
    description: '16方向へ均等に発射',
    script: ({ origin, spawn }) => {
      const bullets = 16
      const speed = 200
      for (let i = 0; i < bullets; i += 1) {
        const angle = (360 / bullets) * i
        const rad = Phaser.Math.DegToRad(angle)
        spawn({
          x: origin.x,
          y: origin.y,
          vx: Math.cos(rad) * speed,
          vy: Math.sin(rad) * speed,
          color: 0xff8866,
        })
      }
    },
  },
  {
    id: '007-circle-24',
    label: '007: 円形24方向',
    description: '24方向へ均等に発射',
    script: ({ origin, spawn }) => {
      const bullets = 24
      const speed = 200
      for (let i = 0; i < bullets; i += 1) {
        const angle = (360 / bullets) * i
        const rad = Phaser.Math.DegToRad(angle)
        spawn({
          x: origin.x,
          y: origin.y,
          vx: Math.cos(rad) * speed,
          vy: Math.sin(rad) * speed,
          color: 0xffaa66,
        })
      }
    },
  },
  {
    id: '008-circle-32',
    label: '008: 円形32方向',
    description: '32方向へ均等に発射（密集）',
    script: ({ origin, spawn }) => {
      const bullets = 32
      const speed = 200
      for (let i = 0; i < bullets; i += 1) {
        const angle = (360 / bullets) * i
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
    id: '009-double-spiral',
    label: '009: ダブルスパイラル',
    description: '2本の螺旋',
    script: ({ origin, spawn, registerTimer, scene }) => {
      const speed = 220
      let angle = 0
      const timer = scene.time.addEvent({
        delay: 80,
        repeat: 40,
        callback: () => {
          for (let i = 0; i < 2; i++) {
            const rad = Phaser.Math.DegToRad(angle + i * 180)
            spawn({
              x: origin.x,
              y: origin.y,
              vx: Math.cos(rad) * speed,
              vy: Math.sin(rad) * speed,
              color: 0xff66ff,
            })
          }
          angle += 15
        },
      })
      registerTimer(timer)
    },
  },
  {
    id: '010-triple-spiral',
    label: '010: トリプルスパイラル',
    description: '3本の螺旋',
    script: ({ origin, spawn, registerTimer, scene }) => {
      const speed = 220
      let angle = 0
      const timer = scene.time.addEvent({
        delay: 80,
        repeat: 40,
        callback: () => {
          for (let i = 0; i < 3; i++) {
            const rad = Phaser.Math.DegToRad(angle + i * 120)
            spawn({
              x: origin.x,
              y: origin.y,
              vx: Math.cos(rad) * speed,
              vy: Math.sin(rad) * speed,
              color: 0xaa66ff,
            })
          }
          angle += 15
        },
      })
      registerTimer(timer)
    },
  },
  {
    id: '011-wave',
    label: '011: 波状弾幕',
    description: '波のように揺れる弾',
    script: ({ origin, spawn }) => {
      for (let i = 0; i < 5; i++) {
        const waveOffset = Math.sin(i * 0.5) * 50
        const speed = 200
        spawn({
          x: origin.x + waveOffset,
          y: origin.y,
          vx: 0,
          vy: speed,
          color: 0x66ffff,
        })
      }
    },
  },
  {
    id: '012-random',
    label: '012: ランダム弾幕',
    description: 'ランダムな方向と速度',
    script: ({ origin, spawn }) => {
      for (let i = 0; i < 10; i++) {
        const angle = Math.random() * 360
        const speed = 150 + Math.random() * 100
        const rad = Phaser.Math.DegToRad(angle)
        spawn({
          x: origin.x,
          y: origin.y,
          vx: Math.cos(rad) * speed,
          vy: Math.sin(rad) * speed,
          color: 0xffffff,
        })
      }
    },
  },
  {
    id: '013-cross',
    label: '013: 十字型',
    description: '上下左右の4方向',
    script: ({ origin, spawn }) => {
      const angles = [0, 90, 180, 270]
      const speed = 200
      angles.forEach(angle => {
        const rad = Phaser.Math.DegToRad(angle)
        spawn({
          x: origin.x,
          y: origin.y,
          vx: Math.cos(rad) * speed,
          vy: Math.sin(rad) * speed,
          color: 0xff0000,
        })
      })
    },
  },
  {
    id: '014-x-pattern',
    label: '014: X字型',
    description: '斜め4方向',
    script: ({ origin, spawn }) => {
      const angles = [45, 135, 225, 315]
      const speed = 200
      angles.forEach(angle => {
        const rad = Phaser.Math.DegToRad(angle)
        spawn({
          x: origin.x,
          y: origin.y,
          vx: Math.cos(rad) * speed,
          vy: Math.sin(rad) * speed,
          color: 0xff4400,
        })
      })
    },
  },
  {
    id: '015-asterisk',
    label: '015: 米字型',
    description: '十字+X字の8方向',
    script: ({ origin, spawn }) => {
      const speed = 200
      for (let i = 0; i < 8; i++) {
        const angle = i * 45
        const rad = Phaser.Math.DegToRad(angle)
        spawn({
          x: origin.x,
          y: origin.y,
          vx: Math.cos(rad) * speed,
          vy: Math.sin(rad) * speed,
          color: 0xff8800,
        })
      }
    },
  },
  {
    id: '016-dense',
    label: '016: 密集弾幕',
    description: '狭い範囲に密集',
    script: ({ origin, spawn }) => {
      const bullets = 20
      const speed = 200
      for (let i = 0; i < bullets; i++) {
        const angle = 75 + (i - bullets / 2) * 3
        const rad = Phaser.Math.DegToRad(angle)
        spawn({
          x: origin.x,
          y: origin.y,
          vx: Math.cos(rad) * speed,
          vy: Math.sin(rad) * speed,
          color: 0xffdd00,
        })
      }
    },
  },
  {
    id: '017-sparse',
    label: '017: まばら弾幕',
    description: '広い範囲にまばら',
    script: ({ origin, spawn }) => {
      const bullets = 4
      const speed = 200
      for (let i = 0; i < bullets; i++) {
        const angle = 20 + i * 40
        const rad = Phaser.Math.DegToRad(angle)
        spawn({
          x: origin.x,
          y: origin.y,
          vx: Math.cos(rad) * speed,
          vy: Math.sin(rad) * speed,
          color: 0xffff00,
        })
      }
    },
  },
  {
    id: '018-fan-narrow',
    label: '018: 扇形集中',
    description: '狭い角度で7発',
    script: ({ origin, spawn }) => {
      const bullets = 7
      const speed = 200
      for (let i = 0; i < bullets; i++) {
        const angle = 75 + (i - 3) * 8
        const rad = Phaser.Math.DegToRad(angle)
        spawn({
          x: origin.x,
          y: origin.y,
          vx: Math.cos(rad) * speed,
          vy: Math.sin(rad) * speed,
          color: 0xaaff00,
        })
      }
    },
  },
  {
    id: '019-fan-wide',
    label: '019: 扇形分散',
    description: '広い角度で7発',
    script: ({ origin, spawn }) => {
      const bullets = 7
      const speed = 200
      for (let i = 0; i < bullets; i++) {
        const angle = 45 + (i - 3) * 25
        const rad = Phaser.Math.DegToRad(angle)
        spawn({
          x: origin.x,
          y: origin.y,
          vx: Math.cos(rad) * speed,
          vy: Math.sin(rad) * speed,
          color: 0x88ff00,
        })
      }
    },
  },
  {
    id: '020-double-circle',
    label: '020: ダブル円形',
    description: '異なる速度で2重の円形',
    script: ({ origin, spawn }) => {
      const bullets = 8
      const speeds = [200, 120]
      speeds.forEach(speed => {
        for (let i = 0; i < bullets; i++) {
          const angle = (360 / bullets) * i
          const rad = Phaser.Math.DegToRad(angle)
          spawn({
            x: origin.x,
            y: origin.y,
            vx: Math.cos(rad) * speed,
            vy: Math.sin(rad) * speed,
            color: speed > 150 ? 0x00ff88 : 0x00ffdd,
          })
        }
      })
    },
  },
  {
    id: '021-triple-circle',
    label: '021: トリプル円形',
    description: '異なる速度で3重の円形',
    script: ({ origin, spawn }) => {
      const bullets = 6
      const speeds = [200, 140, 80]
      speeds.forEach(speed => {
        for (let i = 0; i < bullets; i++) {
          const angle = (360 / bullets) * i
          const rad = Phaser.Math.DegToRad(angle)
          spawn({
            x: origin.x,
            y: origin.y,
            vx: Math.cos(rad) * speed,
            vy: Math.sin(rad) * speed,
            color: speed > 150 ? 0x00ff44 : speed > 100 ? 0x00ff99 : 0x00ffff,
          })
        }
      })
    },
  },
  {
    id: '022-burst',
    label: '022: バースト弾',
    description: '3回に分けて8方向へバースト',
    script: ({ origin, spawn, registerTimer, scene }) => {
      const bullets = 8
      const speed = 200
      let burstCount = 0
      const timer = scene.time.addEvent({
        delay: 150,
        repeat: 2,
        callback: () => {
          for (let i = 0; i < bullets; i++) {
            const angle = (360 / bullets) * i + burstCount * 10
            const rad = Phaser.Math.DegToRad(angle)
            spawn({
              x: origin.x,
              y: origin.y,
              vx: Math.cos(rad) * speed,
              vy: Math.sin(rad) * speed,
              color: 0x00ddff,
            })
          }
          burstCount++
        },
      })
      registerTimer(timer)
    },
  },
  {
    id: '023-stream',
    label: '023: ストリーム弾',
    description: '連続して10発を高速発射',
    script: ({ origin, spawn, registerTimer, scene }) => {
      const speed = 220
      const timer = scene.time.addEvent({
        delay: 50,
        repeat: 9,
        callback: () => {
          const angle = 90 + (Math.random() - 0.5) * 10
          const rad = Phaser.Math.DegToRad(angle)
          spawn({
            x: origin.x,
            y: origin.y,
            vx: Math.cos(rad) * speed,
            vy: Math.sin(rad) * speed,
            color: 0x00aaff,
          })
        },
      })
      registerTimer(timer)
    },
  },
  {
    id: '024-explosion',
    label: '024: 爆発型',
    description: '16方向へランダム速度で爆発',
    script: ({ origin, spawn }) => {
      const bullets = 16
      for (let i = 0; i < bullets; i++) {
        const angle = (360 / bullets) * i
        const speed = 160 + Math.random() * 80
        const rad = Phaser.Math.DegToRad(angle)
        spawn({
          x: origin.x,
          y: origin.y,
          vx: Math.cos(rad) * speed,
          vy: Math.sin(rad) * speed,
          color: 0xff6600,
        })
      }
    },
  },
  {
    id: '025-rotating-cw',
    label: '025: 回転弾幕(時計)',
    description: '6方向が時計回りに回転',
    script: ({ origin, spawn, registerTimer, scene }) => {
      const bullets = 6
      const speed = 200
      let rotation = 0
      const timer = scene.time.addEvent({
        delay: 100,
        repeat: 30,
        callback: () => {
          for (let i = 0; i < bullets; i++) {
            const angle = (360 / bullets) * i + rotation
            const rad = Phaser.Math.DegToRad(angle)
            spawn({
              x: origin.x,
              y: origin.y,
              vx: Math.cos(rad) * speed,
              vy: Math.sin(rad) * speed,
              color: 0xff00ff,
            })
          }
          rotation += 6
        },
      })
      registerTimer(timer)
    },
  },
  {
    id: '026-rotating-ccw',
    label: '026: 回転弾幕(反時計)',
    description: '6方向が反時計回りに回転',
    script: ({ origin, spawn, registerTimer, scene }) => {
      const bullets = 6
      const speed = 200
      let rotation = 0
      const timer = scene.time.addEvent({
        delay: 100,
        repeat: 30,
        callback: () => {
          for (let i = 0; i < bullets; i++) {
            const angle = (360 / bullets) * i + rotation
            const rad = Phaser.Math.DegToRad(angle)
            spawn({
              x: origin.x,
              y: origin.y,
              vx: Math.cos(rad) * speed,
              vy: Math.sin(rad) * speed,
              color: 0xdd00ff,
            })
          }
          rotation -= 6
        },
      })
      registerTimer(timer)
    },
  },
  {
    id: '027-flower',
    label: '027: 花弁状',
    description: '5つの花弁のような形状',
    script: ({ origin, spawn }) => {
      const petals = 5
      const speed = 200
      for (let i = 0; i < petals * 3; i++) {
        const petalAngle = (360 / petals) * Math.floor(i / 3)
        const offset = (i % 3) * 12
        const angle = petalAngle + offset
        const petalSpeed = speed * (1 - (i % 3) * 0.2)
        const rad = Phaser.Math.DegToRad(angle)
        spawn({
          x: origin.x,
          y: origin.y,
          vx: Math.cos(rad) * petalSpeed,
          vy: Math.sin(rad) * petalSpeed,
          color: 0xff99ff,
        })
      }
    },
  },
  {
    id: '028-laser-wave',
    label: '028: レーザー波',
    description: '横一列に並ぶレーザー状',
    script: ({ origin, spawn }) => {
      const bullets = 15
      const speed = 250
      for (let i = 0; i < bullets; i++) {
        const offsetX = (i - 7) * 15
        spawn({
          x: origin.x + offsetX,
          y: origin.y,
          vx: 0,
          vy: speed,
          color: 0x00ffff,
          size: 6,
        })
      }
    },
  },
  {
    id: '029-pinwheel',
    label: '029: 風車型',
    description: '風車のような回転パターン',
    script: ({ origin, spawn, registerTimer, scene }) => {
      const arms = 4
      const speed = 180
      let angle = 0
      const timer = scene.time.addEvent({
        delay: 60,
        repeat: 50,
        callback: () => {
          for (let i = 0; i < arms; i++) {
            const baseAngle = (360 / arms) * i + angle
            for (let j = 0; j < 3; j++) {
              const offset = j * 15
              const rad = Phaser.Math.DegToRad(baseAngle + offset)
              spawn({
                x: origin.x,
                y: origin.y,
                vx: Math.cos(rad) * speed,
                vy: Math.sin(rad) * speed,
                color: 0xffaa00,
              })
            }
          }
          angle += 8
        },
      })
      registerTimer(timer)
    },
  },
  {
    id: '030-snake',
    label: '030: 蛇行弾',
    description: '蛇のように曲がりながら進む',
    script: ({ origin, spawn, registerTimer, scene }) => {
      const speed = 200
      let phase = 0
      const timer = scene.time.addEvent({
        delay: 100,
        repeat: 20,
        callback: () => {
          const angle = 90 + Math.sin(phase) * 30
          const rad = Phaser.Math.DegToRad(angle)
          spawn({
            x: origin.x,
            y: origin.y,
            vx: Math.cos(rad) * speed,
            vy: Math.sin(rad) * speed,
            color: 0x99ff00,
          })
          phase += 0.5
        },
      })
      registerTimer(timer)
    },
  },
  {
    id: '031-star',
    label: '031: 星型',
    description: '星のような5方向',
    script: ({ origin, spawn }) => {
      const points = 5
      const speed = 200
      for (let i = 0; i < points; i++) {
        const angle = -90 + (360 / points) * i
        const rad = Phaser.Math.DegToRad(angle)
        spawn({
          x: origin.x,
          y: origin.y,
          vx: Math.cos(rad) * speed,
          vy: Math.sin(rad) * speed,
          color: 0xffff00,
          size: 8,
        })
      }
    },
  },
  {
    id: '032-cone-up',
    label: '032: 上向き円錐',
    description: '上方向へ円錐状に拡散',
    script: ({ origin, spawn }) => {
      const bullets = 12
      const speed = 220
      for (let i = 0; i < bullets; i++) {
        const angle = -120 + (i / (bullets - 1)) * 60
        const rad = Phaser.Math.DegToRad(angle)
        spawn({
          x: origin.x,
          y: origin.y,
          vx: Math.cos(rad) * speed,
          vy: Math.sin(rad) * speed,
          color: 0x66ffaa,
        })
      }
    },
  },
  {
    id: '033-cone-down',
    label: '033: 下向き円錐',
    description: '下方向へ円錐状に拡散',
    script: ({ origin, spawn }) => {
      const bullets = 12
      const speed = 220
      for (let i = 0; i < bullets; i++) {
        const angle = 60 + (i / (bullets - 1)) * 60
        const rad = Phaser.Math.DegToRad(angle)
        spawn({
          x: origin.x,
          y: origin.y,
          vx: Math.cos(rad) * speed,
          vy: Math.sin(rad) * speed,
          color: 0x66aaff,
        })
      }
    },
  },
  {
    id: '034-curtain',
    label: '034: カーテン弾',
    description: '縦に並ぶカーテン状',
    script: ({ origin, spawn, registerTimer, scene }) => {
      let offset = -200
      const timer = scene.time.addEvent({
        delay: 100,
        repeat: 20,
        callback: () => {
          spawn({
            x: origin.x + offset,
            y: origin.y,
            vx: 0,
            vy: 180,
            color: 0xaaaaff,
          })
          offset += 20
        },
      })
      registerTimer(timer)
    },
  },
  {
    id: '035-chaos',
    label: '035: カオス',
    description: '完全ランダムな弾幕',
    script: ({ origin, spawn, registerTimer, scene }) => {
      const timer = scene.time.addEvent({
        delay: 50,
        repeat: 30,
        callback: () => {
          const angle = Math.random() * 360
          const speed = 100 + Math.random() * 150
          const rad = Phaser.Math.DegToRad(angle)
          spawn({
            x: origin.x + (Math.random() - 0.5) * 100,
            y: origin.y + (Math.random() - 0.5) * 100,
            vx: Math.cos(rad) * speed,
            vy: Math.sin(rad) * speed,
            color: Math.random() * 0xffffff,
            size: 4 + Math.random() * 6,
          })
        },
      })
      registerTimer(timer)
    },
  },
]
