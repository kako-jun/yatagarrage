import { Container, Graphics, Text, Ticker } from 'pixi.js'
import { COLORS } from '../constants/colors'
import { GravityField } from '../game/GravityField'
import { Input } from '../game/Input'
import { TrailLayer } from '../game/Trail'
import { firePattern, PATTERN_COUNT } from '../game/patterns'
import {
  Bullet,
  BulletFlags,
  Enemy,
  GameState,
  PLAY_AREA_BOTTOM,
  PLAY_AREA_LEFT,
  PLAY_AREA_RIGHT,
  PLAY_AREA_TOP,
  PlayerBullet,
  VIEW_HEIGHT,
  VIEW_WIDTH,
} from '../types/GameState'

const PLAYER_FIRE_RATE_MS = 200
const PLAYER_SPEED = 300
const PLAYER_BULLET_SPEED = 500
const ENEMY_SPAWN_INTERVAL_MS = 1000
const ENEMY_FALL_SPEED_MIN = 100
const ENEMY_FALL_SPEED_MAX = 200
const ENEMY_FIRE_INTERVAL_MIN = 800
const ENEMY_FIRE_INTERVAL_MAX = 1500
const BULLET_DEFAULT_LIFESPAN_MS = 6000
const BULLET_DEFAULT_RADIUS = 4
const ENEMY_RADIUS = 15

type ScheduledCallback = { fireAt: number; fn: () => void }

export class GameScene extends Container {
  onGameOver: ((score: number) => void) | null = null

  private state: GameState | null = null
  private input: Input
  private gravity: GravityField
  private playLayer = new Container()
  private trailLayer = new TrailLayer()
  private entityGraphics = new Graphics()
  private uiLayer = new Container()
  private scoreText!: Text
  private stageText!: Text
  private debugText!: Text
  private moveIndicator = new Graphics()
  private shootIndicator = new Graphics()
  private indicatorClearAt = 0
  private nextEntityId = 1
  private scheduled: ScheduledCallback[] = []
  private pendingMove: { x: number; y: number; duration: number; t: number } | null = null

  constructor() {
    super()
    this.input = new Input()
    this.gravity = new GravityField()

    this.addChild(this.playLayer)
    this.playLayer.addChild(this.trailLayer.container)
    this.playLayer.addChild(this.gravity.container)
    this.playLayer.addChild(this.entityGraphics)
    this.playLayer.addChild(this.moveIndicator)
    this.playLayer.addChild(this.shootIndicator)

    this.buildUI()
    this.addChild(this.uiLayer)

    this.input.attachKeyboard()
    this.input.attachPointer(this, VIEW_WIDTH, VIEW_HEIGHT)
    this.input.onAction(action => {
      if (!this.state || this.state.gameOver) return
      if (action.type === 'shoot') {
        this.fireBulletAt(action.x, action.y)
        this.drawShootIndicator(action.x, action.y)
      } else {
        this.startTweenMove(action.x, action.y)
        this.drawMoveIndicator(action.x, action.y)
      }
    })
  }

  initWithState(state: GameState): void {
    this.state = state
    this.scheduled = []
    this.pendingMove = null
    this.nextEntityId = 1
    this.trailLayer.clear()
    this.moveIndicator.clear()
    this.shootIndicator.clear()
    this.entityGraphics.clear()
    this.updateUI()
  }

  update(ticker: Ticker): void {
    if (!this.state) return
    const deltaMs = ticker.deltaMS
    if (this.state.gameOver) return

    this.state.elapsedMs += deltaMs

    this.gravity.update(deltaMs)
    this.processScheduled()
    this.handlePlayerControls(deltaMs)
    this.updateBullets(deltaMs)
    this.updateEnemies(deltaMs)
    this.updateEnemyBullets(deltaMs)
    this.spawnEnemiesIfNeeded()
    this.checkCollisions()
    this.updateTrailsAndDraw()
    this.tickIndicators()
    this.updateDebugText()

    if (!this.state.player.alive && !this.state.gameOver) {
      this.state.gameOver = true
      this.onGameOver?.(this.state.score)
    }
  }

  private buildUI(): void {
    const leftBar = new Graphics()
    leftBar.rect(0, 0, PLAY_AREA_LEFT, VIEW_HEIGHT).fill({
      color: COLORS.uiBar,
      alpha: COLORS.uiBarAlpha,
    })
    this.uiLayer.addChild(leftBar)

    const bottomBar = new Graphics()
    bottomBar.rect(0, PLAY_AREA_BOTTOM, VIEW_WIDTH, VIEW_HEIGHT - PLAY_AREA_BOTTOM).fill({
      color: COLORS.uiBar,
      alpha: COLORS.uiBarAlpha,
    })
    this.uiLayer.addChild(bottomBar)

    this.stageText = new Text({
      text: 'S\nT\nA\nG\nE\n\n1',
      style: { fontFamily: 'sans-serif', fontSize: 18, fill: 0xffffff, align: 'center' },
    })
    this.stageText.anchor.set(0.5)
    this.stageText.x = PLAY_AREA_LEFT / 2
    this.stageText.y = VIEW_HEIGHT / 2
    this.uiLayer.addChild(this.stageText)

    this.scoreText = new Text({
      text: 'スコア: 0',
      style: { fontFamily: 'sans-serif', fontSize: 22, fill: 0xffffff, fontWeight: 'bold' },
    })
    this.scoreText.x = PLAY_AREA_LEFT + 16
    this.scoreText.y = 12
    this.uiLayer.addChild(this.scoreText)

    this.debugText = new Text({
      text: 'Debug: Ready',
      style: { fontFamily: 'sans-serif', fontSize: 14, fill: 0xffffff },
    })
    this.debugText.x = PLAY_AREA_LEFT + 10
    this.debugText.y = PLAY_AREA_BOTTOM + 10
    this.uiLayer.addChild(this.debugText)
  }

  private updateUI(): void {
    if (!this.state) return
    this.scoreText.text = `スコア: ${this.state.score}`
  }

  private handlePlayerControls(deltaMs: number): void {
    if (!this.state) return
    const dt = deltaMs / 1000
    const state = this.state
    const player = state.player

    const ks = this.input.state
    let vx = 0
    let vy = 0
    if (ks.left) vx -= 1
    if (ks.right) vx += 1
    if (ks.up) vy -= 1
    if (ks.down) vy += 1
    if (vx !== 0 || vy !== 0) {
      const norm = 1 / Math.sqrt(vx * vx + vy * vy)
      player.vx = vx * PLAYER_SPEED * norm
      player.vy = vy * PLAYER_SPEED * norm
      this.pendingMove = null
    } else if (this.pendingMove === null) {
      player.vx = 0
      player.vy = 0
    }

    if (this.pendingMove !== null) {
      const move = this.pendingMove
      move.t += dt
      if (move.t >= move.duration) {
        player.x = move.x
        player.y = move.y
        this.pendingMove = null
      } else {
        const remaining = move.duration - (move.t - dt)
        const stepFrac = dt / remaining
        player.x += (move.x - player.x) * stepFrac
        player.y += (move.y - player.y) * stepFrac
      }
    } else {
      player.x += player.vx * dt
      player.y += player.vy * dt
    }

    player.x = clamp(player.x, PLAY_AREA_LEFT + player.radius, PLAY_AREA_RIGHT - player.radius)
    player.y = clamp(player.y, PLAY_AREA_TOP + player.radius, PLAY_AREA_BOTTOM - player.radius)

    if (ks.shoot && state.elapsedMs - state.lastFiredAt >= PLAYER_FIRE_RATE_MS) {
      this.firePlayerBullet(player.x, player.y - 20)
      state.lastFiredAt = state.elapsedMs
    }
  }

  private startTweenMove(x: number, y: number): void {
    if (!this.state) return
    const player = this.state.player
    const dx = x - player.x
    const dy = y - player.y
    const distance = Math.sqrt(dx * dx + dy * dy)
    const duration = Math.max(distance / PLAYER_SPEED, 0.1)
    this.pendingMove = { x, y, duration, t: 0 }
    player.vx = 0
    player.vy = 0
  }

  private firePlayerBullet(x: number, y: number): void {
    if (!this.state) return
    const bullet: PlayerBullet = {
      id: this.nextEntityId++,
      x,
      y,
      vx: 0,
      vy: -PLAYER_BULLET_SPEED,
      radius: 5,
      alive: true,
      color: COLORS.playerBullet,
    }
    this.state.bullets.push(bullet)
  }

  private fireBulletAt(targetX: number, targetY: number): void {
    if (!this.state) return
    const state = this.state
    if (state.elapsedMs - state.lastFiredAt < PLAYER_FIRE_RATE_MS) return
    const player = state.player
    const angle = Math.atan2(targetY - player.y, targetX - player.x)
    const bullet: PlayerBullet = {
      id: this.nextEntityId++,
      x: player.x,
      y: player.y,
      vx: Math.cos(angle) * PLAYER_BULLET_SPEED,
      vy: Math.sin(angle) * PLAYER_BULLET_SPEED,
      radius: 5,
      alive: true,
      color: COLORS.playerBullet,
    }
    state.bullets.push(bullet)
    state.lastFiredAt = state.elapsedMs
  }

  private updateBullets(deltaMs: number): void {
    if (!this.state) return
    const dt = deltaMs / 1000
    const state = this.state
    state.bullets = state.bullets.filter(bullet => {
      bullet.x += bullet.vx * dt
      bullet.y += bullet.vy * dt
      if (
        bullet.x < PLAY_AREA_LEFT - 10 ||
        bullet.x > PLAY_AREA_RIGHT + 10 ||
        bullet.y < PLAY_AREA_TOP - 10 ||
        bullet.y > PLAY_AREA_BOTTOM + 10
      ) {
        this.trailLayer.remove(bullet.id)
        return false
      }
      return true
    })
  }

  private spawnEnemiesIfNeeded(): void {
    if (!this.state) return
    const state = this.state
    if (state.elapsedMs - state.enemySpawnAt < ENEMY_SPAWN_INTERVAL_MS) return
    state.enemySpawnAt = state.elapsedMs
    this.spawnEnemy()
  }

  private spawnEnemy(): void {
    if (!this.state) return
    const x = PLAY_AREA_LEFT + 50 + Math.random() * (PLAY_AREA_RIGHT - PLAY_AREA_LEFT - 100)
    const enemy: Enemy = {
      id: this.nextEntityId++,
      x,
      y: PLAY_AREA_TOP - 20,
      vx: 0,
      vy: ENEMY_FALL_SPEED_MIN + Math.random() * (ENEMY_FALL_SPEED_MAX - ENEMY_FALL_SPEED_MIN),
      radius: ENEMY_RADIUS,
      alive: true,
      patternId: 1 + Math.floor(Math.random() * PATTERN_COUNT),
      spawnedAt: this.state.elapsedMs,
      shootIntervalMs:
        ENEMY_FIRE_INTERVAL_MIN +
        Math.random() * (ENEMY_FIRE_INTERVAL_MAX - ENEMY_FIRE_INTERVAL_MIN),
      nextShootAt: this.state.elapsedMs + 1500,
      spiralAngle: 0,
      rotationAngle: 0,
    }
    this.state.enemies.push(enemy)
  }

  private updateEnemies(deltaMs: number): void {
    if (!this.state) return
    const dt = deltaMs / 1000
    const state = this.state
    state.enemies = state.enemies.filter(enemy => {
      enemy.x += enemy.vx * dt
      enemy.y += enemy.vy * dt
      if (enemy.y > PLAY_AREA_BOTTOM + 30) {
        this.trailLayer.remove(enemy.id)
        return false
      }
      if (state.elapsedMs >= enemy.nextShootAt) {
        this.enemyShoot(enemy)
        enemy.nextShootAt = state.elapsedMs + enemy.shootIntervalMs
      }
      return true
    })
  }

  private enemyShoot(enemy: Enemy): void {
    if (!this.state) return
    const state = this.state
    const player = state.player
    const spiralRef = { value: enemy.spiralAngle }
    const rotationRef = { value: enemy.rotationAngle }
    firePattern(enemy.patternId, {
      enemy: { x: enemy.x, y: enemy.y },
      player: { x: player.x, y: player.y },
      now: state.elapsedMs,
      spawn: input => this.spawnEnemyBullet(input),
      scheduleDelay: (delayMs, fn) =>
        this.scheduled.push({ fireAt: state.elapsedMs + delayMs, fn }),
      spiralAngleRef: spiralRef,
      rotationAngleRef: rotationRef,
    })
    enemy.spiralAngle = spiralRef.value
    enemy.rotationAngle = rotationRef.value
  }

  private spawnEnemyBullet(input: {
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
  }): Bullet | null {
    if (!this.state) return null
    const bullet: Bullet = {
      id: this.nextEntityId++,
      x: input.x,
      y: input.y,
      vx: input.vx,
      vy: input.vy,
      radius: (input.size ?? BULLET_DEFAULT_RADIUS) + 2,
      alive: true,
      color: input.color ?? COLORS.enemyBullet,
      size: input.size ?? BULLET_DEFAULT_RADIUS,
      spawnedAt: this.state.elapsedMs,
      lifespan: input.lifespan ?? BULLET_DEFAULT_LIFESPAN_MS,
      flags: input.flags ?? {},
      data: {
        homingDelay: input.homingDelay,
        wavePhase: input.wavePhase,
      },
    }
    if (bullet.flags.twoStage) {
      bullet.data.stageSwitchAt = this.state.elapsedMs + 500
    }
    this.state.enemyBullets.push(bullet)
    return bullet
  }

  private updateEnemyBullets(deltaMs: number): void {
    if (!this.state) return
    const dt = deltaMs / 1000
    const state = this.state
    const player = state.player
    state.enemyBullets = state.enemyBullets.filter(bullet => {
      this.gravity.applyTo(bullet, deltaMs)
      this.applyBulletBehaviors(bullet, deltaMs, player)
      bullet.x += bullet.vx * dt
      bullet.y += bullet.vy * dt
      const age = state.elapsedMs - bullet.spawnedAt
      if (
        age > bullet.lifespan ||
        bullet.x < PLAY_AREA_LEFT - 60 ||
        bullet.x > PLAY_AREA_RIGHT + 60 ||
        bullet.y < PLAY_AREA_TOP - 60 ||
        bullet.y > PLAY_AREA_BOTTOM + 60
      ) {
        this.trailLayer.remove(bullet.id)
        return false
      }
      return true
    })
  }

  private applyBulletBehaviors(bullet: Bullet, deltaMs: number, player: GameState['player']): void {
    const flags = bullet.flags
    if (flags.homing) {
      const homingDelay = bullet.data.homingDelay ?? 0
      const age = (this.state?.elapsedMs ?? 0) - bullet.spawnedAt
      if (age >= homingDelay) {
        const angleToPlayer = Math.atan2(player.y - bullet.y, player.x - bullet.x)
        const currentAngle = Math.atan2(bullet.vy, bullet.vx)
        const speed = Math.hypot(bullet.vx, bullet.vy)
        const turn = 0.05
        const diff = angleDiff(currentAngle, angleToPlayer)
        const newAngle = currentAngle + Math.sign(diff) * Math.min(Math.abs(diff), turn)
        bullet.vx = Math.cos(newAngle) * speed
        bullet.vy = Math.sin(newAngle) * speed
      }
    }
    if (flags.accelerating) {
      bullet.vx *= 1 + 0.002 * deltaMs
      bullet.vy *= 1 + 0.002 * deltaMs
    }
    if (flags.decelerating) {
      bullet.vx *= 1 - 0.002 * deltaMs
      bullet.vy *= 1 - 0.002 * deltaMs
    }
    if (flags.wave) {
      const phase = (bullet.data.wavePhase ?? 0) + 0.1
      bullet.data.wavePhase = phase
      const currentAngle = Math.atan2(bullet.vy, bullet.vx)
      const waveOffset = Math.sin(phase) * 0.05
      const newAngle = currentAngle + waveOffset
      const speed = Math.hypot(bullet.vx, bullet.vy)
      bullet.vx = Math.cos(newAngle) * speed
      bullet.vy = Math.sin(newAngle) * speed
    }
    if (flags.converging) {
      this.turnTowards(bullet, VIEW_WIDTH / 2, VIEW_HEIGHT / 2, 0.02, 1)
    }
    if (flags.diverging) {
      this.turnAwayFrom(bullet, VIEW_WIDTH / 2, VIEW_HEIGHT / 2, 0.02, 1.005)
    }
    if (flags.twoStage && !bullet.data.secondStage) {
      const switchAt = bullet.data.stageSwitchAt ?? 0
      if ((this.state?.elapsedMs ?? 0) >= switchAt) {
        const angle = Math.atan2(player.y - bullet.y, player.x - bullet.x)
        const speed = 250
        bullet.vx = Math.cos(angle) * speed
        bullet.vy = Math.sin(angle) * speed
        bullet.data.secondStage = true
      }
    }
  }

  private turnTowards(
    bullet: Bullet,
    targetX: number,
    targetY: number,
    turnRate: number,
    speedScale: number
  ): void {
    const angleToTarget = Math.atan2(targetY - bullet.y, targetX - bullet.x)
    const currentAngle = Math.atan2(bullet.vy, bullet.vx)
    const diff = angleDiff(currentAngle, angleToTarget)
    const newAngle = currentAngle + Math.sign(diff) * Math.min(Math.abs(diff), turnRate)
    const speed = Math.hypot(bullet.vx, bullet.vy) * speedScale
    bullet.vx = Math.cos(newAngle) * speed
    bullet.vy = Math.sin(newAngle) * speed
  }

  private turnAwayFrom(
    bullet: Bullet,
    fromX: number,
    fromY: number,
    turnRate: number,
    speedScale: number
  ): void {
    const angleFrom = Math.atan2(bullet.y - fromY, bullet.x - fromX)
    const currentAngle = Math.atan2(bullet.vy, bullet.vx)
    const diff = angleDiff(currentAngle, angleFrom)
    const newAngle = currentAngle + Math.sign(diff) * Math.min(Math.abs(diff), turnRate)
    const speed = Math.hypot(bullet.vx, bullet.vy) * speedScale
    bullet.vx = Math.cos(newAngle) * speed
    bullet.vy = Math.sin(newAngle) * speed
  }

  private processScheduled(): void {
    if (!this.state) return
    const now = this.state.elapsedMs
    if (this.scheduled.length === 0) return
    const remaining: ScheduledCallback[] = []
    for (const item of this.scheduled) {
      if (item.fireAt <= now) {
        item.fn()
      } else {
        remaining.push(item)
      }
    }
    this.scheduled = remaining
  }

  private checkCollisions(): void {
    if (!this.state) return
    const state = this.state
    const player = state.player
    const invincible = state.elapsedMs < state.invincibleUntilMs

    for (let i = state.enemies.length - 1; i >= 0; i -= 1) {
      const enemy = state.enemies[i]
      for (let j = state.bullets.length - 1; j >= 0; j -= 1) {
        const bullet = state.bullets[j]
        if (overlapsCircle(bullet, enemy)) {
          state.bullets.splice(j, 1)
          state.enemies.splice(i, 1)
          this.trailLayer.remove(bullet.id)
          this.trailLayer.remove(enemy.id)
          state.score += 10
          this.updateUI()
          break
        }
      }
    }

    if (invincible) return

    for (const enemy of state.enemies) {
      if (overlapsCircle(player, enemy)) {
        player.alive = false
        return
      }
    }

    for (const bullet of state.enemyBullets) {
      if (overlapsCircle(player, { x: bullet.x, y: bullet.y, radius: bullet.size + 2 })) {
        player.alive = false
        return
      }
    }
  }

  private updateTrailsAndDraw(): void {
    if (!this.state) return
    const state = this.state
    const player = state.player

    if (player.alive) this.trailLayer.add(0, player.x, player.y, COLORS.player, 4)
    for (const bullet of state.bullets) {
      this.trailLayer.add(bullet.id, bullet.x, bullet.y, COLORS.playerBullet, 3)
    }
    for (const enemy of state.enemies) {
      this.trailLayer.add(enemy.id, enemy.x, enemy.y, COLORS.enemy, 4)
    }
    for (const bullet of state.enemyBullets) {
      this.trailLayer.add(bullet.id, bullet.x, bullet.y, bullet.color, bullet.size)
    }
    this.trailLayer.update()

    const g = this.entityGraphics
    g.clear()
    if (player.alive) {
      const blink = state.elapsedMs < state.invincibleUntilMs
        ? 0.5 + 0.5 * Math.sin(state.elapsedMs * 0.02)
        : 1
      g.poly([
        player.x,
        player.y - 15,
        player.x - 13,
        player.y + 12,
        player.x + 13,
        player.y + 12,
      ]).fill({ color: COLORS.player, alpha: blink })
    }
    for (const bullet of state.bullets) {
      g.circle(bullet.x, bullet.y, 5).fill({ color: bullet.color })
    }
    for (const enemy of state.enemies) {
      g.rect(enemy.x - enemy.radius, enemy.y - enemy.radius, enemy.radius * 2, enemy.radius * 2).fill({
        color: COLORS.enemy,
      })
    }
    for (const bullet of state.enemyBullets) {
      g.circle(bullet.x, bullet.y, bullet.size).fill({ color: bullet.color })
    }
  }

  private drawMoveIndicator(x: number, y: number): void {
    this.moveIndicator.clear()
    this.moveIndicator.circle(x, y, 20).fill({ color: COLORS.moveIndicator, alpha: 0.3 })
    this.indicatorClearAt = (this.state?.elapsedMs ?? 0) + 500
  }

  private drawShootIndicator(x: number, y: number): void {
    if (!this.state) return
    this.shootIndicator.clear()
    this.shootIndicator
      .moveTo(this.state.player.x, this.state.player.y)
      .lineTo(x, y)
      .stroke({ width: 2, color: COLORS.shootIndicator, alpha: 0.8 })
    this.indicatorClearAt = this.state.elapsedMs + 200
  }

  private tickIndicators(): void {
    if (!this.state) return
    if (this.state.elapsedMs >= this.indicatorClearAt) {
      this.moveIndicator.clear()
      this.shootIndicator.clear()
    }
  }

  private updateDebugText(): void {
    if (!this.state) return
    const state = this.state
    this.debugText.text = `Pos(${Math.floor(state.player.x)},${Math.floor(state.player.y)}) | B:${state.bullets.length} E:${state.enemies.length} EB:${state.enemyBullets.length}`
  }
}

const clamp = (value: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, value))

const overlapsCircle = (
  a: { x: number; y: number; radius: number },
  b: { x: number; y: number; radius: number }
): boolean => {
  const dx = a.x - b.x
  const dy = a.y - b.y
  const r = a.radius + b.radius
  return dx * dx + dy * dy <= r * r
}

const angleDiff = (from: number, to: number): number => {
  let diff = to - from
  while (diff > Math.PI) diff -= Math.PI * 2
  while (diff < -Math.PI) diff += Math.PI * 2
  return diff
}
