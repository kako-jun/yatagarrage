import Phaser from 'phaser'

// 残像エフェクト用の型定義
interface TrailPoint {
  x: number
  y: number
  alpha: number
  graphics: Phaser.GameObjects.Graphics
}

export class MainScene extends Phaser.Scene {
  private player?: Phaser.Physics.Arcade.Sprite
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

  // 残像エフェクト用
  private playerTrail: TrailPoint[] = []
  private bulletTrails: Map<Phaser.Physics.Arcade.Sprite, TrailPoint[]> = new Map()
  private enemyTrails: Map<Phaser.Physics.Arcade.Sprite, TrailPoint[]> = new Map()
  private enemyBulletTrails: Map<Phaser.Physics.Arcade.Sprite, TrailPoint[]> = new Map()
  private maxTrailLength = 10

  // タップ移動用
  private moveIndicator?: Phaser.GameObjects.Graphics
  private shootIndicator?: Phaser.GameObjects.Graphics

  // 重力システム用
  private gravityCenter = { x: 0, y: 0 }
  private gravityCenterAngle = 0
  private gravityStrength = 100

  constructor() {
    super({ key: 'MainScene' })
  }

  preload() {
    // アセットがないので、スキップ
  }

  create() {
    // 背景色は設定ファイルで指定済み（黒）

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
      '操作: 画面上半分タップで射撃 / 画面下半分タップで移動',
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

    // タッチ/クリック入力
    this.input.on('pointerdown', this.handlePointerDown, this)

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

    // 敵が定期的に弾を発射するタイマーを設定
    const shootTimer = this.time.addEvent({
      delay: Phaser.Math.Between(800, 1500),
      callback: () => {
        if (enemy.active && !this.gameOver) {
          this.enemyShoot(enemy)
        }
      },
      loop: true
    })

    // 敵が破壊されたときにタイマーを削除
    enemy.setData('shootTimer', shootTimer)
  }

  private enemyShoot(enemy: Phaser.Physics.Arcade.Sprite) {
    if (!this.enemyBullets || !this.player) return

    // 敵から複数の弾を発射（弾幕）
    const bulletCount = 5
    for (let i = 0; i < bulletCount; i++) {
      const bullet = this.enemyBullets.get(enemy.x, enemy.y)
      if (bullet) {
        bullet.setActive(true)
        bullet.setVisible(true)
        bullet.setDisplaySize(8, 8)
        bullet.body!.setSize(8, 8)

        // 扇状に弾を発射
        const baseAngle = Phaser.Math.Angle.Between(
          enemy.x,
          enemy.y,
          this.player.x,
          this.player.y
        )
        const spread = 0.3
        const angle = baseAngle + (i - 2) * spread

        const speed = 200
        bullet.setVelocity(
          Math.cos(angle) * speed,
          Math.sin(angle) * speed
        )

        // 残像エフェクト用の配列を初期化
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
      bullet.setVelocity(
        Math.cos(angle) * speed,
        Math.sin(angle) * speed
      )

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

  update() {
    if (this.gameOver) return

    // 重力中心を画面外周に沿って移動
    this.updateGravityCenter()

    // 敵の弾に重力を適用
    this.applyGravityToEnemyBullets()

    // 残像エフェクトの更新
    this.updateTrails()

    // プレイヤーの描画
    this.drawPlayer()

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

  private updateGravityCenter() {
    // 重力中心を画面外周に沿って移動（時計回り）
    this.gravityCenterAngle += 0.02

    // 画面外周の位置を計算（画面の外側、少し離れた位置）
    const radius = 700 // 画面中心からの距離
    const centerX = 400
    const centerY = 300

    this.gravityCenter.x = centerX + Math.cos(this.gravityCenterAngle) * radius
    this.gravityCenter.y = centerY + Math.sin(this.gravityCenterAngle) * radius
  }

  private applyGravityToEnemyBullets() {
    if (!this.enemyBullets) return

    this.enemyBullets.children.entries.forEach(bullet => {
      const b = bullet as Phaser.Physics.Arcade.Sprite
      if (b.active && b.body) {
        // 重力中心への方向を計算
        const dx = this.gravityCenter.x - b.x
        const dy = this.gravityCenter.y - b.y
        const distance = Math.sqrt(dx * dx + dy * dy)

        if (distance > 0) {
          // 重力加速度を計算（距離の二乗に反比例）
          const force = this.gravityStrength / (distance * 0.1)
          const ax = (dx / distance) * force
          const ay = (dy / distance) * force

          // 速度に加算
          b.setVelocity(
            b.body.velocity.x + ax,
            b.body.velocity.y + ay
          )
        }
      }
    })
  }

  private updateTrails() {
    // プレイヤーの残像を追加
    if (this.player) {
      this.addTrailPoint(this.playerTrail, this.player.x, this.player.y, 0x00ffff)
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

  private addTrailPoint(trail: TrailPoint[], x: number, y: number, _color: number) {
    const graphics = this.add.graphics()
    graphics.setDepth(10)

    trail.push({
      x,
      y,
      alpha: 1.0,
      graphics
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

  private handlePointerDown(pointer: Phaser.Input.Pointer) {
    if (this.gameOver) return

    // 画面を上下に分割：上半分で射撃、下半分で移動
    if (pointer.y < 300) {
      // 上半分：射撃
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
      // 下半分：移動
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
        ease: 'Linear'
      })

      // インジケーターをフェードアウト
      this.time.delayedCall(duration, () => this.moveIndicator?.clear())
    }
  }
}
