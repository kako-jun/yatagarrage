import { Bullet, BulletFlags } from '../../types/GameState'

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
  /** プレイヤーの現在速度 (px/s)。予測弾などに使う。デフォルト 0。 */
  playerVelocity?: { vx: number; vy: number }
  now: number
  spawn: (input: SpawnBulletInput) => Bullet | null
  scheduleDelay: (delayMs: number, fn: () => void) => void
  spiralAngleRef: { value: number }
  rotationAngleRef: { value: number }
}

export type Pattern = {
  id: number
  label: string
  fire: (ctx: PatternContext) => void
}

export const DEFAULT_BULLET_SPEED = 200
