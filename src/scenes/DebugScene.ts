import {
  Container,
  FederatedPointerEvent,
  Graphics,
  Rectangle,
  Text,
  Ticker,
} from 'pixi.js'
import { COLORS } from '../constants/colors'
import { GravityField } from '../game/GravityField'
import { TrailLayer } from '../game/Trail'
import {
  PATTERNS,
  PatternContext,
  SpawnBulletInput,
} from '../game/patterns'
import {
  Bullet,
  BulletFlags,
  VIEW_HEIGHT,
  VIEW_WIDTH,
} from '../types/GameState'

const TOOLBAR_HEIGHT = 110
const PATTERN_BUTTON_SIZE = 36
const PATTERN_BUTTONS_PER_ROW = 12
const PLAY_AREA_TOP = TOOLBAR_HEIGHT

type DebugBullet = Bullet & { trailColor: number }

type ToolbarButton = {
  container: Container
  bg: Graphics
  label: Text
  width: number
  active: () => boolean
  labelText: () => string
  onClick: () => void
}

export class DebugScene extends Container {
  onBack: (() => void) | null = null

  private toolbar = new Container()
  private playLayer = new Container()
  private trailLayer = new TrailLayer()
  private gravity = new GravityField()
  private entityGraphics = new Graphics()
  private originMarker = new Graphics()
  private statusText!: Text
  private originPoint = { x: VIEW_WIDTH / 2, y: PLAY_AREA_TOP + 160 }
  private bullets: DebugBullet[] = []
  private scheduled: { fireAt: number; fn: () => void }[] = []
  private nextId = 1
  private elapsedMs = 0
  private spiralAngle = { value: 0 }
  private rotationAngle = { value: 0 }
  private activePatternLabel = '弾幕ボタンを押してプレビュー'
  private gravityEnabled = true
  private toolbarButtons: ToolbarButton[] = []

  constructor() {
    super()
    this.addChild(this.playLayer)
    this.playLayer.addChild(this.trailLayer.container)
    this.playLayer.addChild(this.gravity.container)
    this.playLayer.addChild(this.entityGraphics)
    this.playLayer.addChild(this.originMarker)

    this.addChild(this.toolbar)
    this.buildToolbar()

    this.eventMode = 'static'
    this.hitArea = { contains: () => true }
    this.on('pointerdown', this.handlePointer.bind(this))
  }

  reset(): void {
    this.bullets = []
    this.scheduled = []
    this.elapsedMs = 0
    this.spiralAngle.value = 0
    this.rotationAngle.value = 0
    this.activePatternLabel = '弾幕ボタンを押してプレビュー'
    this.trailLayer.clear()
    this.entityGraphics.clear()
    this.updateStatusText()
  }

  update(ticker: Ticker): void {
    const dtMs = ticker.deltaMS
    this.elapsedMs += dtMs

    this.gravity.update(dtMs)
    this.processScheduled()
    this.updateBullets(dtMs)
    this.redrawBullets()
    this.drawOriginMarker()
  }

  private buildToolbar(): void {
    const bg = new Graphics()
    bg.rect(0, 0, VIEW_WIDTH, TOOLBAR_HEIGHT).fill({
      color: 0x111122,
      alpha: 0.95,
    })
    this.toolbar.addChild(bg)

    // Row 1: 35 pattern buttons (12 wide x 3 rows)
    for (let i = 0; i < PATTERNS.length; i += 1) {
      const pattern = PATTERNS[i]
      const col = i % PATTERN_BUTTONS_PER_ROW
      const row = Math.floor(i / PATTERN_BUTTONS_PER_ROW)
      const x = 8 + col * (PATTERN_BUTTON_SIZE + 2)
      const y = 6 + row * (PATTERN_BUTTON_SIZE + 2)
      this.addPatternButton(pattern.id, pattern.label, x, y)
    }

    // Row 4 (bottom): toolbar buttons
    const bottomY = 6 + 3 * (PATTERN_BUTTON_SIZE + 2)
    let nextX = 8
    nextX = this.addToolbarButton({
      x: nextX,
      y: bottomY,
      width: 80,
      labelText: () => '弾クリア',
      active: () => false,
      onClick: () => this.clearBullets(),
    })
    nextX = this.addToolbarButton({
      x: nextX,
      y: bottomY,
      width: 100,
      labelText: () => (this.gravityEnabled ? '重力 ON' : '重力 OFF'),
      active: () => this.gravityEnabled,
      onClick: () => this.toggleGravity(),
    })
    nextX = this.addToolbarButton({
      x: nextX,
      y: bottomY,
      width: 70,
      labelText: () => '戻る',
      active: () => false,
      onClick: () => this.onBack?.(),
    })

    this.statusText = new Text({
      text: this.activePatternLabel,
      style: { fontFamily: 'sans-serif', fontSize: 14, fill: 0xffffff },
    })
    this.statusText.x = nextX + 16
    this.statusText.y = bottomY + 8
    this.toolbar.addChild(this.statusText)
  }

  private addPatternButton(id: number, label: string, x: number, y: number): void {
    const container = new Container()
    container.x = x
    container.y = y
    container.eventMode = 'static'
    container.cursor = 'pointer'
    container.hitArea = new Rectangle(0, 0, PATTERN_BUTTON_SIZE, PATTERN_BUTTON_SIZE)

    const bg = new Graphics()
    bg.rect(0, 0, PATTERN_BUTTON_SIZE, PATTERN_BUTTON_SIZE).fill({ color: 0x223344 })
    bg.rect(0, 0, PATTERN_BUTTON_SIZE, PATTERN_BUTTON_SIZE).stroke({
      width: 1,
      color: 0x4488cc,
    })

    const text = new Text({
      text: String(id).padStart(2, '0'),
      style: { fontFamily: 'sans-serif', fontSize: 14, fill: 0xffffff },
    })
    text.anchor.set(0.5)
    text.x = PATTERN_BUTTON_SIZE / 2
    text.y = PATTERN_BUTTON_SIZE / 2

    container.addChild(bg)
    container.addChild(text)
    container.on('pointerdown', (event: FederatedPointerEvent) => {
      event.stopPropagation()
      this.firePattern(id, label)
    })

    this.toolbar.addChild(container)
  }

  private addToolbarButton(spec: {
    x: number
    y: number
    width: number
    labelText: () => string
    active: () => boolean
    onClick: () => void
  }): number {
    const { x, y, width, labelText, active, onClick } = spec
    const container = new Container()
    container.x = x
    container.y = y
    container.eventMode = 'static'
    container.cursor = 'pointer'
    container.hitArea = new Rectangle(0, 0, width, PATTERN_BUTTON_SIZE)

    const bg = new Graphics()
    this.drawToolbarButtonBg(bg, width, active())

    const label = new Text({
      text: labelText(),
      style: { fontFamily: 'sans-serif', fontSize: 14, fill: 0xffffff },
    })
    label.anchor.set(0.5)
    label.x = width / 2
    label.y = PATTERN_BUTTON_SIZE / 2

    container.addChild(bg)
    container.addChild(label)
    container.on('pointerdown', (event: FederatedPointerEvent) => {
      event.stopPropagation()
      onClick()
    })

    this.toolbar.addChild(container)

    this.toolbarButtons.push({ container, bg, label, width, labelText, active, onClick })
    return x + width + 6
  }

  private drawToolbarButtonBg(g: Graphics, width: number, active: boolean): void {
    g.clear()
    g.rect(0, 0, width, PATTERN_BUTTON_SIZE).fill({
      color: active ? 0x4488cc : 0x223344,
    })
    g.rect(0, 0, width, PATTERN_BUTTON_SIZE).stroke({
      width: 1,
      color: 0x4488cc,
    })
  }

  private refreshToolbar(): void {
    for (const button of this.toolbarButtons) {
      this.drawToolbarButtonBg(button.bg, button.width, button.active())
      const newText = button.labelText()
      if (button.label.text !== newText) {
        button.label.text = newText
      }
    }
  }

  private handlePointer(event: FederatedPointerEvent): void {
    const y = event.global.y
    if (y < TOOLBAR_HEIGHT) return
    this.originPoint = { x: event.global.x, y: event.global.y }
  }

  private firePattern(id: number, label: string): void {
    this.clearBullets()
    const pattern = PATTERNS.find(p => p.id === id)
    if (!pattern) return
    this.activePatternLabel = `Pattern ${String(id).padStart(2, '0')}: ${label}`
    this.updateStatusText()

    // Place a virtual "player" below the origin so direction-aimed patterns
    // (fan, baseAngle, homing, etc.) fire downward for inspection.
    const ctx: PatternContext = {
      enemy: { x: this.originPoint.x, y: this.originPoint.y },
      player: { x: this.originPoint.x, y: this.originPoint.y + 200 },
      now: this.elapsedMs,
      spawn: input => this.spawnBullet(input),
      scheduleDelay: (delayMs, fn) =>
        this.scheduled.push({ fireAt: this.elapsedMs + delayMs, fn }),
      spiralAngleRef: this.spiralAngle,
      rotationAngleRef: this.rotationAngle,
    }
    pattern.fire(ctx)
  }

  private clearBullets(): void {
    for (const bullet of this.bullets) {
      this.trailLayer.remove(bullet.id)
    }
    this.bullets = []
    this.scheduled = []
    this.entityGraphics.clear()
  }

  private toggleGravity(): void {
    this.gravityEnabled = !this.gravityEnabled
    this.gravity.setEnabled(this.gravityEnabled)
    this.refreshToolbar()
    this.updateStatusText()
  }

  private spawnBullet(input: SpawnBulletInput): Bullet | null {
    const bullet: DebugBullet = {
      id: this.nextId++,
      x: input.x,
      y: input.y,
      vx: input.vx,
      vy: input.vy,
      radius: (input.size ?? 4) + 2,
      alive: true,
      color: input.color ?? COLORS.enemyBullet,
      trailColor: input.color ?? COLORS.enemyBullet,
      size: input.size ?? 4,
      spawnedAt: this.elapsedMs,
      lifespan: input.lifespan ?? 8000,
      flags: input.flags ?? {},
      data: {
        homingDelay: input.homingDelay,
        wavePhase: input.wavePhase,
      },
    }
    if (bullet.flags.twoStage) {
      bullet.data.stageSwitchAt = this.elapsedMs + 500
    }
    this.bullets.push(bullet)
    return bullet
  }

  private processScheduled(): void {
    if (this.scheduled.length === 0) return
    const remaining: { fireAt: number; fn: () => void }[] = []
    for (const item of this.scheduled) {
      if (item.fireAt <= this.elapsedMs) item.fn()
      else remaining.push(item)
    }
    this.scheduled = remaining
  }

  private updateBullets(dtMs: number): void {
    const dt = dtMs / 1000
    this.bullets = this.bullets.filter(bullet => {
      this.gravity.applyTo(bullet, dtMs)
      this.applyFlags(bullet, dtMs)
      bullet.x += bullet.vx * dt
      bullet.y += bullet.vy * dt
      const age = this.elapsedMs - bullet.spawnedAt
      if (
        age > bullet.lifespan ||
        bullet.x < -40 ||
        bullet.x > VIEW_WIDTH + 40 ||
        bullet.y < PLAY_AREA_TOP - 40 ||
        bullet.y > VIEW_HEIGHT + 40
      ) {
        this.trailLayer.remove(bullet.id)
        return false
      }
      return true
    })
  }

  private applyFlags(bullet: DebugBullet, dtMs: number): void {
    const flags: BulletFlags = bullet.flags
    if (flags.accelerating) {
      bullet.vx *= 1 + 0.002 * dtMs
      bullet.vy *= 1 + 0.002 * dtMs
    }
    if (flags.decelerating) {
      bullet.vx *= 1 - 0.002 * dtMs
      bullet.vy *= 1 - 0.002 * dtMs
    }
    if (flags.wave) {
      const phase = (bullet.data.wavePhase ?? 0) + 0.1
      bullet.data.wavePhase = phase
      const angle = Math.atan2(bullet.vy, bullet.vx) + Math.sin(phase) * 0.05
      const speed = Math.hypot(bullet.vx, bullet.vy)
      bullet.vx = Math.cos(angle) * speed
      bullet.vy = Math.sin(angle) * speed
    }
    if (flags.converging) {
      this.turn(bullet, VIEW_WIDTH / 2, VIEW_HEIGHT / 2, 0.02, 1)
    }
    if (flags.diverging) {
      this.turnAway(bullet, VIEW_WIDTH / 2, VIEW_HEIGHT / 2, 0.02, 1.005)
    }
    if (flags.twoStage && !bullet.data.secondStage) {
      const switchAt = bullet.data.stageSwitchAt ?? 0
      if (this.elapsedMs >= switchAt) {
        // In debug, just reverse direction so the change is visible.
        bullet.vx = -bullet.vx
        bullet.vy = -bullet.vy
        bullet.data.secondStage = true
      }
    }
  }

  private turn(
    bullet: DebugBullet,
    tx: number,
    ty: number,
    rate: number,
    scale: number
  ): void {
    const angleTo = Math.atan2(ty - bullet.y, tx - bullet.x)
    const current = Math.atan2(bullet.vy, bullet.vx)
    let diff = angleTo - current
    while (diff > Math.PI) diff -= Math.PI * 2
    while (diff < -Math.PI) diff += Math.PI * 2
    const newAngle = current + Math.sign(diff) * Math.min(Math.abs(diff), rate)
    const speed = Math.hypot(bullet.vx, bullet.vy) * scale
    bullet.vx = Math.cos(newAngle) * speed
    bullet.vy = Math.sin(newAngle) * speed
  }

  private turnAway(
    bullet: DebugBullet,
    fx: number,
    fy: number,
    rate: number,
    scale: number
  ): void {
    const angleAway = Math.atan2(bullet.y - fy, bullet.x - fx)
    const current = Math.atan2(bullet.vy, bullet.vx)
    let diff = angleAway - current
    while (diff > Math.PI) diff -= Math.PI * 2
    while (diff < -Math.PI) diff += Math.PI * 2
    const newAngle = current + Math.sign(diff) * Math.min(Math.abs(diff), rate)
    const speed = Math.hypot(bullet.vx, bullet.vy) * scale
    bullet.vx = Math.cos(newAngle) * speed
    bullet.vy = Math.sin(newAngle) * speed
  }

  private redrawBullets(): void {
    for (const bullet of this.bullets) {
      this.trailLayer.add(bullet.id, bullet.x, bullet.y, bullet.trailColor, bullet.size)
    }
    this.trailLayer.update()

    const g = this.entityGraphics
    g.clear()
    for (const bullet of this.bullets) {
      g.circle(bullet.x, bullet.y, bullet.size).fill({ color: bullet.color })
    }
  }

  private drawOriginMarker(): void {
    const g = this.originMarker
    g.clear()
    g.circle(this.originPoint.x, this.originPoint.y, 14).stroke({
      width: 1,
      color: 0x00ffff,
      alpha: 0.9,
    })
    g.moveTo(this.originPoint.x - 18, this.originPoint.y)
      .lineTo(this.originPoint.x + 18, this.originPoint.y)
      .moveTo(this.originPoint.x, this.originPoint.y - 18)
      .lineTo(this.originPoint.x, this.originPoint.y + 18)
      .stroke({ width: 1, color: 0x00ffff, alpha: 0.9 })
  }

  private updateStatusText(): void {
    const gravity = this.gravityEnabled ? '重力 ON' : '重力 OFF'
    const next = `${this.activePatternLabel}  /  ${gravity}  /  クリックで原点移動`
    if (this.statusText.text !== next) {
      this.statusText.text = next
    }
  }
}
