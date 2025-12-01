import Phaser from 'phaser'
import { GravityField } from './gravityField'

// 残像エフェクト用の型定義
interface TrailPoint {
  x: number
  y: number
  alpha: number
  graphics: Phaser.GameObjects.Graphics
}

export class MainScene extends Phaser.Scene {
  private player?: Phaser.Physics.Arcade.Sprite
  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys
  private spaceKey?: Phaser.Input.Keyboard.Key
  private bullets?: Phaser.Physics.Arcade.Group
  private enemies?: Phaser.Physics.Arcade.Group
  private enemyBullets?: Phaser.Physics.Arcade.Group
  private score = 0
  private scoreText?: Phaser.GameObjects.Text
  private gameOver = false
  private lastFired = 0
  private fireRate = 200 // 200msごとに発射可能
  private enemySpawnTimer?: Phaser.Time.TimerEvent
  private instructionText?: Phaser.GameObjects.Text
  private stageNameText?: Phaser.GameObjects.Text
  private debugText?: Phaser.GameObjects.Text
  private gravityField?: GravityField

  // 残像エフェクト用
  private playerTrail: TrailPoint[] = []
  private bulletTrails: Map<Phaser.Physics.Arcade.Sprite, TrailPoint[]> =
    new Map()
  private enemyTrails: Map<Phaser.Physics.Arcade.Sprite, TrailPoint[]> =
    new Map()
  private enemyBulletTrails: Map<Phaser.Physics.Arcade.Sprite, TrailPoint[]> =
    new Map()
  private maxTrailLength = 10

  // タップ移動用
  private moveIndicator?: Phaser.GameObjects.Graphics
  private shootIndicator?: Phaser.GameObjects.Graphics

  constructor() {
    super({ key: 'MainScene' })
  }

  preload() {
    // アセットがないので、スキップ
  }

  create() {
    // 背景色は設定ファイルで指定済み（黒）

    // UI帯を描画
    this.createUIBars()

    // プレイヤーを作成
    this.createPlayer()

    // 弾のグループを作成
    this.createBullets()

    // 敵のグループを作成
    this.createEnemies()

    // 敵の弾のグループを作成
    this.createEnemyBullets()

    // スコア表示
    this.scoreText = this.add.text(16, 16, 'スコア: 0', {
      fontSize: '24px',
      color: '#ffffff',
    })
    this.scoreText.setDepth(100)

    // 操作説明
    this.instructionText = this.add.text(
      400,
      16,
      '操作: 画面外周タップで射撃 / 中央部分タップで移動',
      {
        fontSize: '16px',
        color: '#aaaaaa',
      }
    )
    this.instructionText.setOrigin(0.5, 0)
    this.instructionText.setDepth(100)

    // 移動先インジケーター
    this.moveIndicator = this.add.graphics()
    this.moveIndicator.setDepth(50)

    // 射撃先インジケーター
    this.shootIndicator = this.add.graphics()
    this.shootIndicator.setDepth(50)

    // キーボード入力
    this.cursors = this.input.keyboard?.createCursorKeys()
    this.spaceKey = this.input.keyboard?.addKey(
      Phaser.Input.Keyboard.KeyCodes.SPACE
    )

    // タッチ/クリック入力
    this.input.on('pointerdown', this.handlePointerDown, this)
    this.input.on('pointermove', this.handlePointerMove, this)

    // 衝突判定
    this.physics.add.overlap(
      this.bullets!,
      this.enemies!,
      this.hitEnemy as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
      undefined,
      this
    )

    this.physics.add.overlap(
      this.player!,
      this.enemies!,
      this.hitPlayer as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
      undefined,
      this
    )

    this.physics.add.overlap(
      this.player!,
      this.enemyBullets!,
      this.hitPlayer as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
      undefined,
      this
    )

    // 敵を定期的にスポーン
    this.enemySpawnTimer = this.time.addEvent({
      delay: 1000, // 1秒ごと
      callback: this.spawnEnemy,
      callbackScope: this,
      loop: true,
    })

    this.gravityField = new GravityField(this)
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.gravityField?.destroy()
    })
  }

  private createUIBars() {
    // 左側の青い帯（縦長）
    const leftBar = this.add.graphics()
    leftBar.fillStyle(0x0000ff, 0.8)
    leftBar.fillRect(0, 0, 60, 600)
    leftBar.setDepth(1000)

    // ステージ名を縦書きで表示
    const stageName = 'STAGE 1'
    this.stageNameText = this.add.text(
      30,
      300,
      stageName.split('').join('\n'),
      {
        fontSize: '20px',
        color: '#ffffff',
        align: 'center',
      }
    )
    this.stageNameText.setOrigin(0.5, 0.5)
    this.stageNameText.setDepth(1001)

    // 下端の青い帯（横長）
    const bottomBar = this.add.graphics()
    bottomBar.fillStyle(0x0000ff, 0.8)
    bottomBar.fillRect(0, 560, 800, 40)
    bottomBar.setDepth(1000)

    // デバッグメッセージ表示
    this.debugText = this.add.text(70, 570, 'Debug: Ready', {
      fontSize: '16px',
      color: '#ffffff',
    })
    this.debugText.setDepth(1001)
  }

  private createPlayer() {
    // プレイヤー（青い三角形）
    this.player = this.physics.add.sprite(400, 550, '')
    this.player.setDisplaySize(30, 30)

    // プレイヤーの物理設定
    this.player.setCollideWorldBounds(true)
    this.player.body!.setSize(30, 30)
  }

  private createBullets() {
    this.bullets = this.physics.add.group({
      defaultKey: 'bullet',
      maxSize: 30,
    })
  }

  private createEnemies() {
    this.enemies = this.physics.add.group()
  }

  private createEnemyBullets() {
    this.enemyBullets = this.physics.add.group({
      defaultKey: 'enemyBullet',
      maxSize: 100,
    })
  }

  private spawnEnemy() {
    if (this.gameOver) return

    const x = Phaser.Math.Between(50, 750)
    const enemy = this.enemies!.create(x, -20, '')

    enemy.setDisplaySize(30, 30)
    enemy.body.setSize(30, 30)
    enemy.setVelocityY(Phaser.Math.Between(100, 200))

    // 弾幕パターンをランダムに選択（1-35）
    const patternId = Phaser.Math.Between(1, 35)
    enemy.setData('patternId', patternId)

    // 螺旋弾幕用の角度オフセット
    enemy.setData('spiralAngle', 0)

    // 敵が定期的に弾を発射するタイマーを設定
    const shootTimer = this.time.addEvent({
      delay: Phaser.Math.Between(800, 1500),
      callback: () => {
        if (enemy.active && !this.gameOver) {
          this.enemyShoot(enemy)
        }
      },
      loop: true,
    })

    // 敵が破壊されたときにタイマーを削除
    enemy.setData('shootTimer', shootTimer)
  }

  private enemyShoot(enemy: Phaser.Physics.Arcade.Sprite) {
    if (!this.enemyBullets || !this.player) return

    const patternId = enemy.getData('patternId') || 1
    const speed = 200

    switch (patternId) {
      case 1: // 扇状弾幕（5-way）
        this.shootFanPattern(enemy, 5, 0.3, speed)
        break

      case 2: // 円形弾幕（8方向）
        this.shootCirclePattern(enemy, 8, speed)
        break

      case 3: // 円形弾幕（16方向）
        this.shootCirclePattern(enemy, 16, speed)
        break

      case 4: // 円形弾幕（24方向）
        this.shootCirclePattern(enemy, 24, speed)
        break

      case 5: // 円形弾幕（32方向）
        this.shootCirclePattern(enemy, 32, speed)
        break

      case 6: // シングルスパイラル
        this.shootSpiralPattern(enemy, 1, speed)
        break

      case 7: // ダブルスパイラル
        this.shootSpiralPattern(enemy, 2, speed)
        break

      case 8: // トリプルスパイラル
        this.shootSpiralPattern(enemy, 3, speed)
        break

      case 9: // 波状弾幕
        this.shootWavePattern(enemy, speed)
        break

      case 10: // ランダム弾幕
        this.shootRandomPattern(enemy, 10, speed)
        break

      case 11: // 収束弾幕
        this.shootConvergingPattern(enemy, 8, speed)
        break

      case 12: // 拡散弾幕
        this.shootDivergingPattern(enemy, 8, speed)
        break

      case 13: // 十字型
        this.shootCrossPattern(enemy, speed)
        break

      case 14: // X字型
        this.shootXPattern(enemy, speed)
        break

      case 15: // 米字型（8方向）
        this.shootAsteriskPattern(enemy, speed)
        break

      case 16: // ホーミング弾
        this.shootHomingPattern(enemy, 3, speed * 0.8)
        break

      case 17: // 加速弾
        this.shootAcceleratingPattern(enemy, 5, speed * 0.5)
        break

      case 18: // 減速弾
        this.shootDeceleratingPattern(enemy, 5, speed * 1.5)
        break

      case 19: // 二段階弾幕
        this.shootTwoStagePattern(enemy, speed)
        break

      case 20: // 時間差弾幕
        this.shootDelayedPattern(enemy, 5, speed)
        break

      case 21: // 密集弾幕
        this.shootDensePattern(enemy, 20, speed)
        break

      case 22: // まばら弾幕
        this.shootSparsePattern(enemy, 4, speed)
        break

      case 23: // 扇形集中
        this.shootFanPattern(enemy, 7, 0.15, speed)
        break

      case 24: // 扇形分散
        this.shootFanPattern(enemy, 7, 0.5, speed)
        break

      case 25: // ダブル円形
        this.shootDoubleCirclePattern(enemy, speed)
        break

      case 26: // トリプル円形
        this.shootTripleCirclePattern(enemy, speed)
        break

      case 27: // バースト弾
        this.shootBurstPattern(enemy, speed)
        break

      case 28: // ストリーム弾
        this.shootStreamPattern(enemy, speed)
        break

      case 29: // 直線自機狙い
        this.shootStraightAimPattern(enemy, 1, speed)
        break

      case 30: // 予測弾
        this.shootPredictivePattern(enemy, 3, speed)
        break

      case 31: // 爆発型
        this.shootExplosionPattern(enemy, 16, speed * 1.2)
        break

      case 32: // 回転弾幕（時計回り）
        this.shootRotatingPattern(enemy, 6, 0.1, speed)
        break

      case 33: // 回転弾幕（反時計回り）
        this.shootRotatingPattern(enemy, 6, -0.1, speed)
        break

      case 34: // 花弁状
        this.shootFlowerPattern(enemy, 5, speed)
        break

      case 35: // ランダム方向ホーミング
        this.shootRandomHomingPattern(enemy, 5, speed * 0.7)
        break

      default:
        this.shootFanPattern(enemy, 5, 0.3, speed)
    }
  }

  // パターン1: 扇状弾幕
  private shootFanPattern(
    enemy: Phaser.Physics.Arcade.Sprite,
    count: number,
    spread: number,
    speed: number
  ) {
    const baseAngle = Phaser.Math.Angle.Between(
      enemy.x,
      enemy.y,
      this.player!.x,
      this.player!.y
    )

    for (let i = 0; i < count; i++) {
      const bullet = this.enemyBullets!.get(enemy.x, enemy.y)
      if (bullet) {
        bullet.setActive(true)
        bullet.setVisible(true)
        bullet.setDisplaySize(8, 8)
        bullet.body!.setSize(8, 8)

        const angle = baseAngle + (i - (count - 1) / 2) * spread
        bullet.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed)
        this.enemyBulletTrails.set(bullet as Phaser.Physics.Arcade.Sprite, [])
      }
    }
  }

  // パターン2-5: 円形弾幕
  private shootCirclePattern(
    enemy: Phaser.Physics.Arcade.Sprite,
    count: number,
    speed: number
  ) {
    for (let i = 0; i < count; i++) {
      const bullet = this.enemyBullets!.get(enemy.x, enemy.y)
      if (bullet) {
        bullet.setActive(true)
        bullet.setVisible(true)
        bullet.setDisplaySize(8, 8)
        bullet.body!.setSize(8, 8)

        const angle = (Math.PI * 2 * i) / count
        bullet.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed)
        this.enemyBulletTrails.set(bullet as Phaser.Physics.Arcade.Sprite, [])
      }
    }
  }

  // パターン6-8: 螺旋弾幕
  private shootSpiralPattern(
    enemy: Phaser.Physics.Arcade.Sprite,
    arms: number,
    speed: number
  ) {
    let spiralAngle = enemy.getData('spiralAngle') || 0
    spiralAngle += 0.2

    for (let i = 0; i < arms; i++) {
      const bullet = this.enemyBullets!.get(enemy.x, enemy.y)
      if (bullet) {
        bullet.setActive(true)
        bullet.setVisible(true)
        bullet.setDisplaySize(8, 8)
        bullet.body!.setSize(8, 8)

        const angle = spiralAngle + (Math.PI * 2 * i) / arms
        bullet.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed)
        this.enemyBulletTrails.set(bullet as Phaser.Physics.Arcade.Sprite, [])
      }
    }

    enemy.setData('spiralAngle', spiralAngle)
  }

  // パターン9: 波状弾幕
  private shootWavePattern(enemy: Phaser.Physics.Arcade.Sprite, speed: number) {
    const baseAngle = Phaser.Math.Angle.Between(
      enemy.x,
      enemy.y,
      this.player!.x,
      this.player!.y
    )

    for (let i = 0; i < 5; i++) {
      const bullet = this.enemyBullets!.get(enemy.x, enemy.y)
      if (bullet) {
        bullet.setActive(true)
        bullet.setVisible(true)
        bullet.setDisplaySize(8, 8)
        bullet.body!.setSize(8, 8)

        const waveOffset = Math.sin(i * 0.5) * 0.5
        const angle = baseAngle + waveOffset
        bullet.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed)
        this.enemyBulletTrails.set(bullet as Phaser.Physics.Arcade.Sprite, [])

        // 弾に波状の動きを追加
        bullet.setData('wave', true)
        bullet.setData('wavePhase', i * 0.5)
      }
    }
  }

  // パターン10: ランダム弾幕
  private shootRandomPattern(
    enemy: Phaser.Physics.Arcade.Sprite,
    count: number,
    speed: number
  ) {
    for (let i = 0; i < count; i++) {
      const bullet = this.enemyBullets!.get(enemy.x, enemy.y)
      if (bullet) {
        bullet.setActive(true)
        bullet.setVisible(true)
        bullet.setDisplaySize(8, 8)
        bullet.body!.setSize(8, 8)

        const angle = Math.random() * Math.PI * 2
        const randomSpeed = speed * (0.7 + Math.random() * 0.6)
        bullet.setVelocity(
          Math.cos(angle) * randomSpeed,
          Math.sin(angle) * randomSpeed
        )
        this.enemyBulletTrails.set(bullet as Phaser.Physics.Arcade.Sprite, [])
      }
    }
  }

  // パターン11: 収束弾幕
  private shootConvergingPattern(
    enemy: Phaser.Physics.Arcade.Sprite,
    count: number,
    speed: number
  ) {
    for (let i = 0; i < count; i++) {
      const bullet = this.enemyBullets!.get(enemy.x, enemy.y)
      if (bullet) {
        bullet.setActive(true)
        bullet.setVisible(true)
        bullet.setDisplaySize(8, 8)
        bullet.body!.setSize(8, 8)

        const angle = (Math.PI * 2 * i) / count
        bullet.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed)
        bullet.setData('converging', true)
        this.enemyBulletTrails.set(bullet as Phaser.Physics.Arcade.Sprite, [])
      }
    }
  }

  // パターン12: 拡散弾幕
  private shootDivergingPattern(
    enemy: Phaser.Physics.Arcade.Sprite,
    count: number,
    speed: number
  ) {
    for (let i = 0; i < count; i++) {
      const bullet = this.enemyBullets!.get(enemy.x, enemy.y)
      if (bullet) {
        bullet.setActive(true)
        bullet.setVisible(true)
        bullet.setDisplaySize(8, 8)
        bullet.body!.setSize(8, 8)

        const angle = (Math.PI * 2 * i) / count
        bullet.setVelocity(
          Math.cos(angle) * speed * 0.5,
          Math.sin(angle) * speed * 0.5
        )
        bullet.setData('diverging', true)
        this.enemyBulletTrails.set(bullet as Phaser.Physics.Arcade.Sprite, [])
      }
    }
  }

  // パターン13: 十字型
  private shootCrossPattern(
    enemy: Phaser.Physics.Arcade.Sprite,
    speed: number
  ) {
    const angles = [0, Math.PI / 2, Math.PI, (Math.PI * 3) / 2]
    angles.forEach(angle => {
      const bullet = this.enemyBullets!.get(enemy.x, enemy.y)
      if (bullet) {
        bullet.setActive(true)
        bullet.setVisible(true)
        bullet.setDisplaySize(8, 8)
        bullet.body!.setSize(8, 8)
        bullet.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed)
        this.enemyBulletTrails.set(bullet as Phaser.Physics.Arcade.Sprite, [])
      }
    })
  }

  // パターン14: X字型
  private shootXPattern(enemy: Phaser.Physics.Arcade.Sprite, speed: number) {
    const angles = [
      Math.PI / 4,
      (Math.PI * 3) / 4,
      (Math.PI * 5) / 4,
      (Math.PI * 7) / 4,
    ]
    angles.forEach(angle => {
      const bullet = this.enemyBullets!.get(enemy.x, enemy.y)
      if (bullet) {
        bullet.setActive(true)
        bullet.setVisible(true)
        bullet.setDisplaySize(8, 8)
        bullet.body!.setSize(8, 8)
        bullet.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed)
        this.enemyBulletTrails.set(bullet as Phaser.Physics.Arcade.Sprite, [])
      }
    })
  }

  // パターン15: 米字型
  private shootAsteriskPattern(
    enemy: Phaser.Physics.Arcade.Sprite,
    speed: number
  ) {
    for (let i = 0; i < 8; i++) {
      const bullet = this.enemyBullets!.get(enemy.x, enemy.y)
      if (bullet) {
        bullet.setActive(true)
        bullet.setVisible(true)
        bullet.setDisplaySize(8, 8)
        bullet.body!.setSize(8, 8)

        const angle = (Math.PI * 2 * i) / 8
        bullet.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed)
        this.enemyBulletTrails.set(bullet as Phaser.Physics.Arcade.Sprite, [])
      }
    }
  }

  // パターン16: ホーミング弾
  private shootHomingPattern(
    enemy: Phaser.Physics.Arcade.Sprite,
    count: number,
    speed: number
  ) {
    for (let i = 0; i < count; i++) {
      const bullet = this.enemyBullets!.get(enemy.x, enemy.y)
      if (bullet) {
        bullet.setActive(true)
        bullet.setVisible(true)
        bullet.setDisplaySize(8, 8)
        bullet.body!.setSize(8, 8)

        const angle = (Math.PI * 2 * i) / count
        bullet.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed)
        bullet.setData('homing', true)
        this.enemyBulletTrails.set(bullet as Phaser.Physics.Arcade.Sprite, [])
      }
    }
  }

  // パターン17: 加速弾
  private shootAcceleratingPattern(
    enemy: Phaser.Physics.Arcade.Sprite,
    count: number,
    speed: number
  ) {
    const baseAngle = Phaser.Math.Angle.Between(
      enemy.x,
      enemy.y,
      this.player!.x,
      this.player!.y
    )

    for (let i = 0; i < count; i++) {
      const bullet = this.enemyBullets!.get(enemy.x, enemy.y)
      if (bullet) {
        bullet.setActive(true)
        bullet.setVisible(true)
        bullet.setDisplaySize(8, 8)
        bullet.body!.setSize(8, 8)

        const angle = baseAngle + (i - 2) * 0.2
        bullet.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed)
        bullet.setData('accelerating', true)
        this.enemyBulletTrails.set(bullet as Phaser.Physics.Arcade.Sprite, [])
      }
    }
  }

  // パターン18: 減速弾
  private shootDeceleratingPattern(
    enemy: Phaser.Physics.Arcade.Sprite,
    count: number,
    speed: number
  ) {
    const baseAngle = Phaser.Math.Angle.Between(
      enemy.x,
      enemy.y,
      this.player!.x,
      this.player!.y
    )

    for (let i = 0; i < count; i++) {
      const bullet = this.enemyBullets!.get(enemy.x, enemy.y)
      if (bullet) {
        bullet.setActive(true)
        bullet.setVisible(true)
        bullet.setDisplaySize(8, 8)
        bullet.body!.setSize(8, 8)

        const angle = baseAngle + (i - 2) * 0.2
        bullet.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed)
        bullet.setData('decelerating', true)
        this.enemyBulletTrails.set(bullet as Phaser.Physics.Arcade.Sprite, [])
      }
    }
  }

  // パターン19: 二段階弾幕
  private shootTwoStagePattern(
    enemy: Phaser.Physics.Arcade.Sprite,
    speed: number
  ) {
    // 第一段階
    for (let i = 0; i < 4; i++) {
      const bullet = this.enemyBullets!.get(enemy.x, enemy.y)
      if (bullet) {
        bullet.setActive(true)
        bullet.setVisible(true)
        bullet.setDisplaySize(8, 8)
        bullet.body!.setSize(8, 8)

        const angle = (Math.PI * 2 * i) / 4
        bullet.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed)
        bullet.setData('twoStage', true)
        bullet.setData('stageTime', this.time.now)
        this.enemyBulletTrails.set(bullet as Phaser.Physics.Arcade.Sprite, [])
      }
    }
  }

  // パターン20: 時間差弾幕
  private shootDelayedPattern(
    enemy: Phaser.Physics.Arcade.Sprite,
    count: number,
    speed: number
  ) {
    const baseAngle = Phaser.Math.Angle.Between(
      enemy.x,
      enemy.y,
      this.player!.x,
      this.player!.y
    )

    for (let i = 0; i < count; i++) {
      this.time.delayedCall(i * 100, () => {
        if (enemy.active && !this.gameOver) {
          const bullet = this.enemyBullets!.get(enemy.x, enemy.y)
          if (bullet) {
            bullet.setActive(true)
            bullet.setVisible(true)
            bullet.setDisplaySize(8, 8)
            bullet.body!.setSize(8, 8)
            bullet.setVelocity(
              Math.cos(baseAngle) * speed,
              Math.sin(baseAngle) * speed
            )
            this.enemyBulletTrails.set(
              bullet as Phaser.Physics.Arcade.Sprite,
              []
            )
          }
        }
      })
    }
  }

  // パターン21: 密集弾幕
  private shootDensePattern(
    enemy: Phaser.Physics.Arcade.Sprite,
    count: number,
    speed: number
  ) {
    const baseAngle = Phaser.Math.Angle.Between(
      enemy.x,
      enemy.y,
      this.player!.x,
      this.player!.y
    )

    for (let i = 0; i < count; i++) {
      const bullet = this.enemyBullets!.get(enemy.x, enemy.y)
      if (bullet) {
        bullet.setActive(true)
        bullet.setVisible(true)
        bullet.setDisplaySize(8, 8)
        bullet.body!.setSize(8, 8)

        const angle = baseAngle + (i - count / 2) * 0.05
        bullet.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed)
        this.enemyBulletTrails.set(bullet as Phaser.Physics.Arcade.Sprite, [])
      }
    }
  }

  // パターン22: まばら弾幕
  private shootSparsePattern(
    enemy: Phaser.Physics.Arcade.Sprite,
    count: number,
    speed: number
  ) {
    const baseAngle = Phaser.Math.Angle.Between(
      enemy.x,
      enemy.y,
      this.player!.x,
      this.player!.y
    )

    for (let i = 0; i < count; i++) {
      const bullet = this.enemyBullets!.get(enemy.x, enemy.y)
      if (bullet) {
        bullet.setActive(true)
        bullet.setVisible(true)
        bullet.setDisplaySize(8, 8)
        bullet.body!.setSize(8, 8)

        const angle = baseAngle + (i - count / 2) * 0.8
        bullet.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed)
        this.enemyBulletTrails.set(bullet as Phaser.Physics.Arcade.Sprite, [])
      }
    }
  }

  // パターン25: ダブル円形
  private shootDoubleCirclePattern(
    enemy: Phaser.Physics.Arcade.Sprite,
    speed: number
  ) {
    const counts = [8, 8]
    const speeds = [speed, speed * 0.6]

    counts.forEach((count, index) => {
      for (let i = 0; i < count; i++) {
        const bullet = this.enemyBullets!.get(enemy.x, enemy.y)
        if (bullet) {
          bullet.setActive(true)
          bullet.setVisible(true)
          bullet.setDisplaySize(8, 8)
          bullet.body!.setSize(8, 8)

          const angle = (Math.PI * 2 * i) / count
          bullet.setVelocity(
            Math.cos(angle) * speeds[index],
            Math.sin(angle) * speeds[index]
          )
          this.enemyBulletTrails.set(bullet as Phaser.Physics.Arcade.Sprite, [])
        }
      }
    })
  }

  // パターン26: トリプル円形
  private shootTripleCirclePattern(
    enemy: Phaser.Physics.Arcade.Sprite,
    speed: number
  ) {
    const counts = [6, 6, 6]
    const speeds = [speed, speed * 0.7, speed * 0.4]

    counts.forEach((count, index) => {
      for (let i = 0; i < count; i++) {
        const bullet = this.enemyBullets!.get(enemy.x, enemy.y)
        if (bullet) {
          bullet.setActive(true)
          bullet.setVisible(true)
          bullet.setDisplaySize(8, 8)
          bullet.body!.setSize(8, 8)

          const angle = (Math.PI * 2 * i) / count
          bullet.setVelocity(
            Math.cos(angle) * speeds[index],
            Math.sin(angle) * speeds[index]
          )
          this.enemyBulletTrails.set(bullet as Phaser.Physics.Arcade.Sprite, [])
        }
      }
    })
  }

  // パターン27: バースト弾
  private shootBurstPattern(
    enemy: Phaser.Physics.Arcade.Sprite,
    speed: number
  ) {
    for (let burst = 0; burst < 3; burst++) {
      this.time.delayedCall(burst * 150, () => {
        if (enemy.active && !this.gameOver) {
          for (let i = 0; i < 8; i++) {
            const bullet = this.enemyBullets!.get(enemy.x, enemy.y)
            if (bullet) {
              bullet.setActive(true)
              bullet.setVisible(true)
              bullet.setDisplaySize(8, 8)
              bullet.body!.setSize(8, 8)

              const angle = (Math.PI * 2 * i) / 8 + burst * 0.2
              bullet.setVelocity(
                Math.cos(angle) * speed,
                Math.sin(angle) * speed
              )
              this.enemyBulletTrails.set(
                bullet as Phaser.Physics.Arcade.Sprite,
                []
              )
            }
          }
        }
      })
    }
  }

  // パターン28: ストリーム弾
  private shootStreamPattern(
    enemy: Phaser.Physics.Arcade.Sprite,
    speed: number
  ) {
    const baseAngle = Phaser.Math.Angle.Between(
      enemy.x,
      enemy.y,
      this.player!.x,
      this.player!.y
    )

    for (let i = 0; i < 10; i++) {
      this.time.delayedCall(i * 50, () => {
        if (enemy.active && !this.gameOver) {
          const bullet = this.enemyBullets!.get(enemy.x, enemy.y)
          if (bullet) {
            bullet.setActive(true)
            bullet.setVisible(true)
            bullet.setDisplaySize(8, 8)
            bullet.body!.setSize(8, 8)

            const angle = baseAngle + (Math.random() - 0.5) * 0.1
            bullet.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed)
            this.enemyBulletTrails.set(
              bullet as Phaser.Physics.Arcade.Sprite,
              []
            )
          }
        }
      })
    }
  }

  // パターン29: 直線自機狙い
  private shootStraightAimPattern(
    enemy: Phaser.Physics.Arcade.Sprite,
    count: number,
    speed: number
  ) {
    const angle = Phaser.Math.Angle.Between(
      enemy.x,
      enemy.y,
      this.player!.x,
      this.player!.y
    )

    for (let i = 0; i < count; i++) {
      const bullet = this.enemyBullets!.get(enemy.x, enemy.y)
      if (bullet) {
        bullet.setActive(true)
        bullet.setVisible(true)
        bullet.setDisplaySize(8, 8)
        bullet.body!.setSize(8, 8)
        bullet.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed)
        this.enemyBulletTrails.set(bullet as Phaser.Physics.Arcade.Sprite, [])
      }
    }
  }

  // パターン30: 予測弾
  private shootPredictivePattern(
    enemy: Phaser.Physics.Arcade.Sprite,
    count: number,
    speed: number
  ) {
    // プレイヤーの速度を考慮した予測位置を計算
    const predictTime = 0.5
    const predictX =
      this.player!.x + this.player!.body!.velocity.x * predictTime
    const predictY =
      this.player!.y + this.player!.body!.velocity.y * predictTime

    const angle = Phaser.Math.Angle.Between(
      enemy.x,
      enemy.y,
      predictX,
      predictY
    )

    for (let i = 0; i < count; i++) {
      const bullet = this.enemyBullets!.get(enemy.x, enemy.y)
      if (bullet) {
        bullet.setActive(true)
        bullet.setVisible(true)
        bullet.setDisplaySize(8, 8)
        bullet.body!.setSize(8, 8)

        const spreadAngle = angle + (i - 1) * 0.15
        bullet.setVelocity(
          Math.cos(spreadAngle) * speed,
          Math.sin(spreadAngle) * speed
        )
        this.enemyBulletTrails.set(bullet as Phaser.Physics.Arcade.Sprite, [])
      }
    }
  }

  // パターン31: 爆発型
  private shootExplosionPattern(
    enemy: Phaser.Physics.Arcade.Sprite,
    count: number,
    speed: number
  ) {
    for (let i = 0; i < count; i++) {
      const bullet = this.enemyBullets!.get(enemy.x, enemy.y)
      if (bullet) {
        bullet.setActive(true)
        bullet.setVisible(true)
        bullet.setDisplaySize(8, 8)
        bullet.body!.setSize(8, 8)

        const angle = (Math.PI * 2 * i) / count
        const randomSpeed = speed * (0.8 + Math.random() * 0.4)
        bullet.setVelocity(
          Math.cos(angle) * randomSpeed,
          Math.sin(angle) * randomSpeed
        )
        this.enemyBulletTrails.set(bullet as Phaser.Physics.Arcade.Sprite, [])
      }
    }
  }

  // パターン32-33: 回転弾幕
  private shootRotatingPattern(
    enemy: Phaser.Physics.Arcade.Sprite,
    count: number,
    rotationSpeed: number,
    speed: number
  ) {
    let rotationAngle = enemy.getData('rotationAngle') || 0
    rotationAngle += rotationSpeed

    for (let i = 0; i < count; i++) {
      const bullet = this.enemyBullets!.get(enemy.x, enemy.y)
      if (bullet) {
        bullet.setActive(true)
        bullet.setVisible(true)
        bullet.setDisplaySize(8, 8)
        bullet.body!.setSize(8, 8)

        const angle = rotationAngle + (Math.PI * 2 * i) / count
        bullet.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed)
        this.enemyBulletTrails.set(bullet as Phaser.Physics.Arcade.Sprite, [])
      }
    }

    enemy.setData('rotationAngle', rotationAngle)
  }

  // パターン34: 花弁状
  private shootFlowerPattern(
    enemy: Phaser.Physics.Arcade.Sprite,
    petals: number,
    speed: number
  ) {
    for (let i = 0; i < petals * 3; i++) {
      const bullet = this.enemyBullets!.get(enemy.x, enemy.y)
      if (bullet) {
        bullet.setActive(true)
        bullet.setVisible(true)
        bullet.setDisplaySize(8, 8)
        bullet.body!.setSize(8, 8)

        const petalAngle = (Math.PI * 2 * Math.floor(i / 3)) / petals
        const offset = (i % 3) * 0.2
        const angle = petalAngle + offset
        const petalSpeed = speed * (1 - (i % 3) * 0.2)

        bullet.setVelocity(
          Math.cos(angle) * petalSpeed,
          Math.sin(angle) * petalSpeed
        )
        this.enemyBulletTrails.set(bullet as Phaser.Physics.Arcade.Sprite, [])
      }
    }
  }

  // パターン35: ランダム方向ホーミング
  private shootRandomHomingPattern(
    enemy: Phaser.Physics.Arcade.Sprite,
    count: number,
    speed: number
  ) {
    for (let i = 0; i < count; i++) {
      const bullet = this.enemyBullets!.get(enemy.x, enemy.y)
      if (bullet) {
        bullet.setActive(true)
        bullet.setVisible(true)
        bullet.setDisplaySize(8, 8)
        bullet.body!.setSize(8, 8)

        const angle = Math.random() * Math.PI * 2
        bullet.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed)
        bullet.setData('homing', true)
        bullet.setData('homingDelay', 500 + Math.random() * 500)
        bullet.setData('homingStartTime', this.time.now)
        this.enemyBulletTrails.set(bullet as Phaser.Physics.Arcade.Sprite, [])
      }
    }
  }

  private shootBullet(targetX: number, targetY: number) {
    if (this.gameOver) return

    const time = this.time.now
    if (time < this.lastFired + this.fireRate) return

    this.lastFired = time

    const bullet = this.bullets!.get(this.player!.x, this.player!.y - 20)
    if (bullet) {
      bullet.setActive(true)
      bullet.setVisible(true)
      bullet.setDisplaySize(10, 10)
      bullet.body!.setSize(10, 10)

      // 自機から目標座標への角度を計算
      const angle = Phaser.Math.Angle.Between(
        this.player!.x,
        this.player!.y,
        targetX,
        targetY
      )

      // 速度を設定（角度に基づいて）
      const speed = 500
      bullet.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed)

      // 残像エフェクト用の配列を初期化
      this.bulletTrails.set(bullet as Phaser.Physics.Arcade.Sprite, [])
    }
  }

  private hitEnemy(
    bullet: Phaser.Types.Physics.Arcade.GameObjectWithBody,
    enemy: Phaser.Types.Physics.Arcade.GameObjectWithBody
  ) {
    // 残像を削除
    const bulletSprite = bullet as Phaser.Physics.Arcade.Sprite
    const bulletTrail = this.bulletTrails.get(bulletSprite)
    if (bulletTrail) {
      bulletTrail.forEach(point => point.graphics.destroy())
      this.bulletTrails.delete(bulletSprite)
    }

    const enemySprite = enemy as Phaser.Physics.Arcade.Sprite
    const enemyTrail = this.enemyTrails.get(enemySprite)
    if (enemyTrail) {
      enemyTrail.forEach(point => point.graphics.destroy())
      this.enemyTrails.delete(enemySprite)
    }

    // 敵の射撃タイマーを削除
    const shootTimer = enemySprite.getData('shootTimer')
    if (shootTimer) {
      shootTimer.destroy()
    }

    bullet.destroy()
    enemy.destroy()

    // スコア加算
    this.score += 10
    this.scoreText?.setText('スコア: ' + this.score)
  }

  private hitPlayer() {
    if (this.gameOver) return

    this.gameOver = true

    this.player?.setVelocity(0, 0)

    // すべての残像を削除
    this.playerTrail.forEach(point => point.graphics.destroy())
    this.playerTrail = []

    // 敵のスポーンを停止
    this.enemySpawnTimer?.destroy()

    // ゲームオーバー表示
    const gameOverText = this.add.text(400, 300, 'GAME OVER', {
      fontSize: '64px',
      color: '#ff0000',
    })
    gameOverText.setOrigin(0.5)
    gameOverText.setDepth(200)

    const restartText = this.add.text(
      400,
      370,
      'クリックかタップで再スタート',
      {
        fontSize: '24px',
        color: '#ffffff',
      }
    )
    restartText.setOrigin(0.5)
    restartText.setDepth(200)

    // 再スタート処理
    this.input.once('pointerdown', () => {
      this.scene.restart()
    })
  }

  update(_time: number, delta: number) {
    if (this.gameOver) return

    this.gravityField?.update(delta)

    // キーボード移動
    if (this.cursors?.left.isDown) {
      this.player?.setVelocityX(-300)
    } else if (this.cursors?.right.isDown) {
      this.player?.setVelocityX(300)
    } else {
      this.player?.setVelocityX(0)
    }

    if (this.spaceKey?.isDown && this.player) {
      this.shootBullet(this.player.x, this.player.y - 20)
    }

    // 敵の弾に重力を適用
    this.applyGravityToEnemyBullets()

    // 残像エフェクトの更新
    this.updateTrails()

    // プレイヤーの描画
    this.drawPlayer()

    // デバッグ情報を更新
    this.updateDebugInfo()

    // 弾が画面外に出たら削除
    this.bullets?.children.entries.forEach(bullet => {
      const b = bullet as Phaser.Physics.Arcade.Sprite
      if (b.x < -10 || b.x > 810 || b.y < -10 || b.y > 610) {
        const trail = this.bulletTrails.get(b)
        if (trail) {
          trail.forEach(point => point.graphics.destroy())
          this.bulletTrails.delete(b)
        }
        b.destroy()
      }
    })

    // 敵の弾が画面外に出たら削除
    this.enemyBullets?.children.entries.forEach(bullet => {
      const b = bullet as Phaser.Physics.Arcade.Sprite
      if (b.x < -50 || b.x > 850 || b.y < -50 || b.y > 650) {
        const trail = this.enemyBulletTrails.get(b)
        if (trail) {
          trail.forEach(point => point.graphics.destroy())
          this.enemyBulletTrails.delete(b)
        }
        b.destroy()
      }
    })

    // 敵が画面外に出たら削除
    this.enemies?.children.entries.forEach(enemy => {
      const e = enemy as Phaser.Physics.Arcade.Sprite
      if (e.y > 610) {
        const trail = this.enemyTrails.get(e)
        if (trail) {
          trail.forEach(point => point.graphics.destroy())
          this.enemyTrails.delete(e)
        }
        const shootTimer = e.getData('shootTimer')
        if (shootTimer) {
          shootTimer.destroy()
        }
        e.destroy()
      }
    })
  }

  private applyGravityToEnemyBullets() {
    if (!this.enemyBullets || !this.player) return

    this.enemyBullets.children.entries.forEach(bullet => {
      const b = bullet as Phaser.Physics.Arcade.Sprite
      if (!b.active) return

      // 重力場を適用
      this.gravityField?.applyTo(b)

      // ホーミング弾の処理
      if (b.getData('homing')) {
        const homingDelay = b.getData('homingDelay') || 0
        const homingStartTime = b.getData('homingStartTime') || 0
        if (this.time.now - homingStartTime > homingDelay) {
          const angleToPlayer = Phaser.Math.Angle.Between(
            b.x,
            b.y,
            this.player.x,
            this.player.y
          )
          const currentAngle = Math.atan2(
            b.body!.velocity.y,
            b.body!.velocity.x
          )
          const speed = Math.sqrt(
            b.body!.velocity.x ** 2 + b.body!.velocity.y ** 2
          )

          // 徐々に角度を変える
          const turnRate = 0.05
          const newAngle = Phaser.Math.Angle.RotateTo(
            currentAngle,
            angleToPlayer,
            turnRate
          )
          b.setVelocity(Math.cos(newAngle) * speed, Math.sin(newAngle) * speed)
        }
      }

      // 加速弾の処理
      if (b.getData('accelerating')) {
        const accel = 1.02
        b.setVelocity(b.body!.velocity.x * accel, b.body!.velocity.y * accel)
      }

      // 減速弾の処理
      if (b.getData('decelerating')) {
        const decel = 0.98
        b.setVelocity(b.body!.velocity.x * decel, b.body!.velocity.y * decel)
      }

      // 波状弾の処理
      if (b.getData('wave')) {
        const wavePhase = b.getData('wavePhase') || 0
        const newPhase = wavePhase + 0.1
        b.setData('wavePhase', newPhase)

        const currentAngle = Math.atan2(b.body!.velocity.y, b.body!.velocity.x)
        const waveOffset = Math.sin(newPhase) * 0.05
        const newAngle = currentAngle + waveOffset

        const speed = Math.sqrt(
          b.body!.velocity.x ** 2 + b.body!.velocity.y ** 2
        )
        b.setVelocity(Math.cos(newAngle) * speed, Math.sin(newAngle) * speed)
      }

      // 収束弾の処理
      if (b.getData('converging')) {
        const centerX = 400
        const centerY = 300
        const angleToCenter = Phaser.Math.Angle.Between(
          b.x,
          b.y,
          centerX,
          centerY
        )
        const currentAngle = Math.atan2(b.body!.velocity.y, b.body!.velocity.x)
        const speed = Math.sqrt(
          b.body!.velocity.x ** 2 + b.body!.velocity.y ** 2
        )

        const turnRate = 0.02
        const newAngle = Phaser.Math.Angle.RotateTo(
          currentAngle,
          angleToCenter,
          turnRate
        )
        b.setVelocity(Math.cos(newAngle) * speed, Math.sin(newAngle) * speed)
      }

      // 拡散弾の処理
      if (b.getData('diverging')) {
        const centerX = 400
        const centerY = 300
        const angleFromCenter = Phaser.Math.Angle.Between(
          centerX,
          centerY,
          b.x,
          b.y
        )
        const currentAngle = Math.atan2(b.body!.velocity.y, b.body!.velocity.x)
        const speed = Math.sqrt(
          b.body!.velocity.x ** 2 + b.body!.velocity.y ** 2
        )

        const turnRate = 0.02
        const newAngle = Phaser.Math.Angle.RotateTo(
          currentAngle,
          angleFromCenter,
          turnRate
        )
        b.setVelocity(
          Math.cos(newAngle) * speed * 1.01,
          Math.sin(newAngle) * speed * 1.01
        )
      }

      // 二段階弾の処理
      if (b.getData('twoStage')) {
        const stageTime = b.getData('stageTime') || 0
        if (this.time.now - stageTime > 500 && !b.getData('secondStage')) {
          // 第二段階: プレイヤーに向かって方向転換
          const angleToPlayer = Phaser.Math.Angle.Between(
            b.x,
            b.y,
            this.player.x,
            this.player.y
          )
          const speed = 250
          b.setVelocity(
            Math.cos(angleToPlayer) * speed,
            Math.sin(angleToPlayer) * speed
          )
          b.setData('secondStage', true)
        }
      }
    })
  }

  private updateTrails() {
    // プレイヤーの残像を追加
    if (this.player) {
      this.addTrailPoint(
        this.playerTrail,
        this.player.x,
        this.player.y,
        0x00ffff
      )
    }

    // 弾の残像を追加
    this.bullets?.children.entries.forEach(bullet => {
      const b = bullet as Phaser.Physics.Arcade.Sprite
      if (b.active) {
        let trail = this.bulletTrails.get(b)
        if (!trail) {
          trail = []
          this.bulletTrails.set(b, trail)
        }
        this.addTrailPoint(trail, b.x, b.y, 0xffff00)
      }
    })

    // 敵の残像を追加
    this.enemies?.children.entries.forEach(enemy => {
      const e = enemy as Phaser.Physics.Arcade.Sprite
      if (e.active) {
        let trail = this.enemyTrails.get(e)
        if (!trail) {
          trail = []
          this.enemyTrails.set(e, trail)
        }
        this.addTrailPoint(trail, e.x, e.y, 0xff0000)
      }
    })

    // 敵の弾の残像を追加
    this.enemyBullets?.children.entries.forEach(bullet => {
      const b = bullet as Phaser.Physics.Arcade.Sprite
      if (b.active) {
        let trail = this.enemyBulletTrails.get(b)
        if (!trail) {
          trail = []
          this.enemyBulletTrails.set(b, trail)
        }
        this.addTrailPoint(trail, b.x, b.y, 0xff00ff)
      }
    })

    // 残像の透明度を更新して古いものを削除
    this.updateTrailAlpha(this.playerTrail)
    this.bulletTrails.forEach(trail => this.updateTrailAlpha(trail))
    this.enemyTrails.forEach(trail => this.updateTrailAlpha(trail))
    this.enemyBulletTrails.forEach(trail => this.updateTrailAlpha(trail))
  }

  private addTrailPoint(
    trail: TrailPoint[],
    x: number,
    y: number,
    _color: number
  ) {
    const graphics = this.add.graphics()
    graphics.setDepth(10)

    trail.push({
      x,
      y,
      alpha: 1.0,
      graphics,
    })

    // 最大長を超えたら古いものを削除
    if (trail.length > this.maxTrailLength) {
      const old = trail.shift()
      if (old) old.graphics.destroy()
    }
  }

  private updateTrailAlpha(trail: TrailPoint[]) {
    for (let i = trail.length - 1; i >= 0; i--) {
      const point = trail[i]
      point.alpha -= 0.1

      if (point.alpha <= 0) {
        point.graphics.destroy()
        trail.splice(i, 1)
      } else {
        point.graphics.clear()
        point.graphics.fillStyle(0xffffff, point.alpha * 0.5)
        point.graphics.fillCircle(point.x, point.y, 3)
      }
    }
  }

  private drawPlayer() {
    if (!this.player) return

    // プレイヤーの本体を描画（毎フレーム描画し直す）
    const g = this.add.graphics()
    g.fillStyle(0x00ffff, 1)
    g.beginPath()
    g.moveTo(this.player.x, this.player.y - 15)
    g.lineTo(this.player.x - 15, this.player.y + 15)
    g.lineTo(this.player.x + 15, this.player.y + 15)
    g.closePath()
    g.fillPath()
    g.setDepth(20)

    // 次フレームで削除
    this.time.delayedCall(50, () => g.destroy())

    // 自機の弾を描画
    this.bullets?.children.entries.forEach(bullet => {
      const b = bullet as Phaser.Physics.Arcade.Sprite
      if (b.active) {
        const bg = this.add.graphics()
        bg.fillStyle(0xffff00, 1)
        bg.fillCircle(b.x, b.y, 5)
        bg.setDepth(20)
        this.time.delayedCall(50, () => bg.destroy())
      }
    })

    // 敵を描画
    this.enemies?.children.entries.forEach(enemy => {
      const e = enemy as Phaser.Physics.Arcade.Sprite
      if (e.active) {
        const eg = this.add.graphics()
        eg.fillStyle(0xff0000, 1)
        eg.fillRect(e.x - 15, e.y - 15, 30, 30)
        eg.setDepth(20)
        this.time.delayedCall(50, () => eg.destroy())
      }
    })

    // 敵の弾を描画
    this.enemyBullets?.children.entries.forEach(bullet => {
      const b = bullet as Phaser.Physics.Arcade.Sprite
      if (b.active) {
        const bg = this.add.graphics()
        bg.fillStyle(0xff00ff, 1)
        bg.fillCircle(b.x, b.y, 4)
        bg.setDepth(20)
        this.time.delayedCall(50, () => bg.destroy())
      }
    })
  }

  private updateDebugInfo() {
    if (!this.debugText || !this.player) return

    const playerX = Math.floor(this.player.x)
    const playerY = Math.floor(this.player.y)
    const bulletCount = this.bullets?.getLength() || 0
    const enemyCount = this.enemies?.getLength() || 0
    const enemyBulletCount = this.enemyBullets?.getLength() || 0

    this.debugText.setText(
      `Debug: Player(${playerX},${playerY}) | Bullets:${bulletCount} | Enemies:${enemyCount} | EnemyBullets:${enemyBulletCount}`
    )
  }

  private handlePointerDown(pointer: Phaser.Input.Pointer) {
    if (this.gameOver) return

    // 画面外周の判定（画面端から100ピクセル以内）
    const edgeThreshold = 100
    const isEdge =
      pointer.x < edgeThreshold || // 左端
      pointer.x > 800 - edgeThreshold || // 右端
      pointer.y < edgeThreshold || // 上端
      pointer.y > 600 - edgeThreshold // 下端

    if (isEdge) {
      // 外周：射撃
      this.shootBullet(pointer.x, pointer.y)

      // 射撃インジケーターを表示
      this.shootIndicator?.clear()
      this.shootIndicator?.lineStyle(2, 0xff00ff, 0.8)
      this.shootIndicator?.beginPath()
      this.shootIndicator?.moveTo(this.player!.x, this.player!.y)
      this.shootIndicator?.lineTo(pointer.x, pointer.y)
      this.shootIndicator?.strokePath()

      // インジケーターをフェードアウト
      this.time.delayedCall(200, () => this.shootIndicator?.clear())
    } else {
      // 中央部分：移動
      this.moveIndicator?.clear()
      this.moveIndicator?.fillStyle(0x00ff00, 0.3)
      this.moveIndicator?.fillCircle(pointer.x, pointer.y, 20)

      // プレイヤーを直線移動
      const distance = Phaser.Math.Distance.Between(
        this.player!.x,
        this.player!.y,
        pointer.x,
        pointer.y
      )
      const duration = distance * 2 // 移動速度を調整

      this.tweens.add({
        targets: this.player,
        x: pointer.x,
        y: pointer.y,
        duration: duration,
        ease: 'Linear',
      })

      // インジケーターをフェードアウト
      this.time.delayedCall(duration, () => this.moveIndicator?.clear())
    }
  }

  private handlePointerMove(pointer: Phaser.Input.Pointer) {
    if (this.gameOver) return
    if (!pointer.isDown) return

    const targetX = Phaser.Math.Clamp(pointer.x, 15, 785)
    this.player?.setX(targetX)
  }
}
