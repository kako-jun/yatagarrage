import { PATTERNS } from './definitions'
import { fan } from './helpers'
import { DEFAULT_BULLET_SPEED, PatternContext } from './types'

export { PATTERNS } from './definitions'
export type { Pattern, PatternContext, SpawnBulletInput } from './types'

export const PATTERN_COUNT = PATTERNS.length

export const PATTERN_DESCRIPTIONS: Record<number, string> = Object.fromEntries(
  PATTERNS.map(p => [p.id, p.label])
)

export const firePattern = (patternId: number, ctx: PatternContext): void => {
  const pattern = PATTERNS.find(p => p.id === patternId)
  if (pattern) {
    pattern.fire(ctx)
    return
  }
  fan(ctx, 5, 0.3, DEFAULT_BULLET_SPEED)
}
