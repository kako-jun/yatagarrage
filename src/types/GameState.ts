export const VIEW_WIDTH = 800
export const VIEW_HEIGHT = 600

export const PLAY_AREA_LEFT = 60
export const PLAY_AREA_RIGHT = VIEW_WIDTH
export const PLAY_AREA_TOP = 0
export const PLAY_AREA_BOTTOM = 560

export type Vec2 = { x: number; y: number }

export type Entity = {
  id: number
  x: number
  y: number
  vx: number
  vy: number
  radius: number
  alive: boolean
}

export type Bullet = Entity & {
  color: number
  size: number
  spawnedAt: number
  lifespan: number
  flags: BulletFlags
  data: BulletData
}

export type BulletFlags = {
  homing?: boolean
  accelerating?: boolean
  decelerating?: boolean
  wave?: boolean
  converging?: boolean
  diverging?: boolean
  twoStage?: boolean
}

export type BulletData = {
  homingDelay?: number
  wavePhase?: number
  stageSwitchAt?: number
  secondStage?: boolean
}

export type Enemy = Entity & {
  patternId: number
  spawnedAt: number
  shootIntervalMs: number
  nextShootAt: number
  spiralAngle: number
  rotationAngle: number
}

export type PlayerBullet = Entity & {
  color: number
}

export type GameState = {
  score: number
  gameOver: boolean
  elapsedMs: number
  player: {
    x: number
    y: number
    vx: number
    vy: number
    radius: number
    alive: boolean
  }
  bullets: PlayerBullet[]
  enemies: Enemy[]
  enemyBullets: Bullet[]
  lastFiredAt: number
  enemySpawnAt: number
  invincibleUntilMs: number
}

export const createInitialGameState = (): GameState => ({
  score: 0,
  gameOver: false,
  elapsedMs: 0,
  player: {
    x: (PLAY_AREA_LEFT + PLAY_AREA_RIGHT) / 2,
    y: PLAY_AREA_BOTTOM - 50,
    vx: 0,
    vy: 0,
    radius: 12,
    alive: true,
  },
  bullets: [],
  enemies: [],
  enemyBullets: [],
  lastFiredAt: 0,
  enemySpawnAt: 1500,
  invincibleUntilMs: 2500,
})
