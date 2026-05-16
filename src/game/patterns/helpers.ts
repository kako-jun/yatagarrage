import { PatternContext } from './types'

export const angleTo = (
  ax: number,
  ay: number,
  bx: number,
  by: number
): number => Math.atan2(by - ay, bx - ax)

export const baseAngle = (ctx: PatternContext): number =>
  angleTo(ctx.enemy.x, ctx.enemy.y, ctx.player.x, ctx.player.y)

export const fan = (
  ctx: PatternContext,
  count: number,
  spread: number,
  speed: number
): void => {
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

export const ring = (
  ctx: PatternContext,
  count: number,
  speed: number,
  color?: number
): void => {
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

export const spiral = (
  ctx: PatternContext,
  arms: number,
  speed: number
): void => {
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

export const rotating = (
  ctx: PatternContext,
  count: number,
  rotationSpeed: number,
  speed: number
): void => {
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
