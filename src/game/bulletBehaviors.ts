import { Bullet } from '../types/GameState'

export type BulletBehaviorContext = {
  nowMs: number
  dtMs: number
  homingTarget?: { x: number; y: number }
  convergePoint?: { x: number; y: number }
  twoStageTarget?: { x: number; y: number; speed: number }
  /**
   * 二段階弾の secondStage 切替時に新たに採用する終端方向。
   * twoStageTarget を渡さない場合はベクトル反転 (DebugScene 用)。
   */
  twoStageBehavior?: 'aim' | 'reverse'
}

const HOMING_TURN_PER_FRAME = 0.05
const CONVERGE_TURN_PER_FRAME = 0.02
const DIVERGE_SPEED_GAIN = 1.005
const ACCELERATE_RATE_PER_MS = 0.002
const WAVE_PHASE_INCREMENT = 0.1
const WAVE_ANGLE_AMPLITUDE = 0.05

const angleDiff = (from: number, to: number): number => {
  let diff = to - from
  while (diff > Math.PI) diff -= Math.PI * 2
  while (diff < -Math.PI) diff += Math.PI * 2
  return diff
}

const rotateBy = (
  bullet: Bullet,
  desiredAngle: number,
  turnRate: number,
  speedScale = 1
): void => {
  const currentAngle = Math.atan2(bullet.vy, bullet.vx)
  const diff = angleDiff(currentAngle, desiredAngle)
  const newAngle = currentAngle + Math.sign(diff) * Math.min(Math.abs(diff), turnRate)
  const speed = Math.hypot(bullet.vx, bullet.vy) * speedScale
  bullet.vx = Math.cos(newAngle) * speed
  bullet.vy = Math.sin(newAngle) * speed
}

export const applyBulletBehaviors = (
  bullet: Bullet,
  ctx: BulletBehaviorContext
): void => {
  const flags = bullet.flags

  if (flags.homing && ctx.homingTarget) {
    const homingDelay = bullet.data.homingDelay ?? 0
    const age = ctx.nowMs - bullet.spawnedAt
    if (age >= homingDelay) {
      const angleToTarget = Math.atan2(
        ctx.homingTarget.y - bullet.y,
        ctx.homingTarget.x - bullet.x
      )
      rotateBy(bullet, angleToTarget, HOMING_TURN_PER_FRAME)
    }
  }

  if (flags.accelerating) {
    bullet.vx *= 1 + ACCELERATE_RATE_PER_MS * ctx.dtMs
    bullet.vy *= 1 + ACCELERATE_RATE_PER_MS * ctx.dtMs
  }

  if (flags.decelerating) {
    bullet.vx *= 1 - ACCELERATE_RATE_PER_MS * ctx.dtMs
    bullet.vy *= 1 - ACCELERATE_RATE_PER_MS * ctx.dtMs
  }

  if (flags.wave) {
    const phase = (bullet.data.wavePhase ?? 0) + WAVE_PHASE_INCREMENT
    bullet.data.wavePhase = phase
    const currentAngle = Math.atan2(bullet.vy, bullet.vx)
    const waveOffset = Math.sin(phase) * WAVE_ANGLE_AMPLITUDE
    const newAngle = currentAngle + waveOffset
    const speed = Math.hypot(bullet.vx, bullet.vy)
    bullet.vx = Math.cos(newAngle) * speed
    bullet.vy = Math.sin(newAngle) * speed
  }

  if (flags.converging && ctx.convergePoint) {
    const angleToCenter = Math.atan2(
      ctx.convergePoint.y - bullet.y,
      ctx.convergePoint.x - bullet.x
    )
    rotateBy(bullet, angleToCenter, CONVERGE_TURN_PER_FRAME)
  }

  if (flags.diverging && ctx.convergePoint) {
    const angleAway = Math.atan2(
      bullet.y - ctx.convergePoint.y,
      bullet.x - ctx.convergePoint.x
    )
    rotateBy(bullet, angleAway, CONVERGE_TURN_PER_FRAME, DIVERGE_SPEED_GAIN)
  }

  if (flags.twoStage && !bullet.data.secondStage) {
    const switchAt = bullet.data.stageSwitchAt ?? 0
    if (ctx.nowMs >= switchAt) {
      if (ctx.twoStageBehavior === 'reverse' || !ctx.twoStageTarget) {
        bullet.vx = -bullet.vx
        bullet.vy = -bullet.vy
      } else {
        const angle = Math.atan2(
          ctx.twoStageTarget.y - bullet.y,
          ctx.twoStageTarget.x - bullet.x
        )
        bullet.vx = Math.cos(angle) * ctx.twoStageTarget.speed
        bullet.vy = Math.sin(angle) * ctx.twoStageTarget.speed
      }
      bullet.data.secondStage = true
    }
  }
}
