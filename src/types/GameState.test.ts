import { describe, expect, it } from 'vitest'
import {
  createInitialGameState,
  PLAY_AREA_BOTTOM,
  PLAY_AREA_LEFT,
  PLAY_AREA_RIGHT,
  VIEW_HEIGHT,
  VIEW_WIDTH,
} from './GameState'

describe('createInitialGameState', () => {
  it('starts with score 0 and game not over', () => {
    const state = createInitialGameState()
    expect(state.score).toBe(0)
    expect(state.gameOver).toBe(false)
  })

  it('places the player inside the play area', () => {
    const { player } = createInitialGameState()
    expect(player.x).toBeGreaterThanOrEqual(PLAY_AREA_LEFT)
    expect(player.x).toBeLessThanOrEqual(PLAY_AREA_RIGHT)
    expect(player.y).toBeLessThanOrEqual(PLAY_AREA_BOTTOM)
  })

  it('starts the player alive with non-zero radius', () => {
    const { player } = createInitialGameState()
    expect(player.alive).toBe(true)
    expect(player.radius).toBeGreaterThan(0)
  })

  it('initializes invincibility to 2500 ms', () => {
    const state = createInitialGameState()
    expect(state.invincibleUntilMs).toBe(2500)
  })

  it('schedules first enemy spawn ~1000ms after start (enemySpawnAt=1500)', () => {
    const state = createInitialGameState()
    expect(state.enemySpawnAt).toBe(1500)
  })

  it('starts with empty entity arrays', () => {
    const state = createInitialGameState()
    expect(state.bullets).toEqual([])
    expect(state.enemies).toEqual([])
    expect(state.enemyBullets).toEqual([])
  })
})

describe('view constants', () => {
  it('exposes 800x600 view', () => {
    expect(VIEW_WIDTH).toBe(800)
    expect(VIEW_HEIGHT).toBe(600)
  })

  it('reserves a left UI band and a bottom UI band', () => {
    expect(PLAY_AREA_LEFT).toBeGreaterThan(0)
    expect(PLAY_AREA_BOTTOM).toBeLessThan(VIEW_HEIGHT)
  })
})
