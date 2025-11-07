import Phaser from 'phaser'

export class MainScene extends Phaser.Scene {
  private player?: Phaser.Physics.Arcade.Sprite
  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys
  private spaceKey?: Phaser.Input.Keyboard.Key
  private bullets?: Phaser.Physics.Arcade.Group
  private enemies?: Phaser.Physics.Arcade.Group
  private score = 0
  private scoreText?: Phaser.GameObjects.Text
  private gameOver = false
  private lastFired = 0
  private fireRate = 200 // 200msごとに発射可能
  private enemySpawnTimer?: Phaser.Time.TimerEvent
  private instructionText?: Phaser.GameObjects.Text

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
      '操作: ← → 移動 / スペース: 発射 / タップでも操作可',
      {
        fontSize: '16px',
        color: '#aaaaaa',
      }
    )
    this.instructionText.setOrigin(0.5, 0)
    this.instructionText.setDepth(100)

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

    // 三角形を描画
    const graphics = this.add.graphics()
    graphics.fillStyle(0x00ffff, 1)
    graphics.beginPath()
    graphics.moveTo(400, 535) // 上の頂点
    graphics.lineTo(385, 565) // 左下
    graphics.lineTo(415, 565) // 右下
    graphics.closePath()
    graphics.fillPath()

    // プレイヤーの物理設定
    this.player.setCollideWorldBounds(true)
    this.player.body!.setSize(30, 30)

    // プレイヤーを再描画するために、グラフィックスをプレイヤーに追従させる
    this.player.setData('graphics', graphics)
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

  private spawnEnemy() {
    if (this.gameOver) return

    const x = Phaser.Math.Between(50, 750)
    const enemy = this.enemies!.create(x, -20, '')

    // 敵（赤い四角）を描画
    const graphics = this.add.graphics()
    graphics.fillStyle(0xff0000, 1)
    graphics.fillRect(x - 15, -35, 30, 30)

    enemy.setDisplaySize(30, 30)
    enemy.body.setSize(30, 30)
    enemy.setVelocityY(Phaser.Math.Between(100, 200))
    enemy.setData('graphics', graphics)
  }

  private shootBullet() {
    if (this.gameOver) return

    const time = this.time.now
    if (time < this.lastFired + this.fireRate) return

    this.lastFired = time

    const bullet = this.bullets!.get(this.player!.x, this.player!.y - 20)
    if (bullet) {
      // 弾（黄色い小さい円）を描画
      const graphics = this.add.graphics()
      graphics.fillStyle(0xffff00, 1)
      graphics.fillCircle(this.player!.x, this.player!.y - 20, 5)

      bullet.setActive(true)
      bullet.setVisible(true)
      bullet.setDisplaySize(10, 10)
      bullet.body!.setSize(10, 10)
      bullet.setVelocityY(-400)
      bullet.setData('graphics', graphics)
    }
  }

  private hitEnemy(
    bullet: Phaser.Types.Physics.Arcade.GameObjectWithBody,
    enemy: Phaser.Types.Physics.Arcade.GameObjectWithBody
  ) {
    // 弾と敵を削除
    const bulletGraphics = (bullet as Phaser.Physics.Arcade.Sprite).getData(
      'graphics'
    )
    if (bulletGraphics) bulletGraphics.destroy()

    const enemyGraphics = (enemy as Phaser.Physics.Arcade.Sprite).getData(
      'graphics'
    )
    if (enemyGraphics) enemyGraphics.destroy()

    bullet.destroy()
    enemy.destroy()

    // スコア加算
    this.score += 10
    this.scoreText?.setText('スコア: ' + this.score)
  }

  private hitPlayer() {
    if (this.gameOver) return

    this.gameOver = true

    // プレイヤーを赤くする
    const playerGraphics = this.player?.getData('graphics')
    if (playerGraphics) {
      playerGraphics.clear()
      playerGraphics.fillStyle(0xff0000, 1)
      playerGraphics.beginPath()
      playerGraphics.moveTo(this.player!.x, this.player!.y - 15)
      playerGraphics.lineTo(this.player!.x - 15, this.player!.y + 15)
      playerGraphics.lineTo(this.player!.x + 15, this.player!.y + 15)
      playerGraphics.closePath()
      playerGraphics.fillPath()
    }

    this.player?.setVelocity(0, 0)
    this.player?.setTint(0xff0000)

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

    // プレイヤーの移動
    if (this.cursors?.left.isDown) {
      this.player?.setVelocityX(-300)
    } else if (this.cursors?.right.isDown) {
      this.player?.setVelocityX(300)
    } else {
      this.player?.setVelocityX(0)
    }

    // プレイヤーのグラフィックスを更新
    const playerGraphics = this.player?.getData('graphics')
    if (playerGraphics && this.player) {
      playerGraphics.clear()
      playerGraphics.fillStyle(0x00ffff, 1)
      playerGraphics.beginPath()
      playerGraphics.moveTo(this.player.x, this.player.y - 15)
      playerGraphics.lineTo(this.player.x - 15, this.player.y + 15)
      playerGraphics.lineTo(this.player.x + 15, this.player.y + 15)
      playerGraphics.closePath()
      playerGraphics.fillPath()
    }

    // 弾の発射
    if (this.spaceKey?.isDown) {
      this.shootBullet()
    }

    // 弾が画面外に出たら削除
    this.bullets?.children.entries.forEach(bullet => {
      const b = bullet as Phaser.Physics.Arcade.Sprite
      if (b.y < -10) {
        const graphics = b.getData('graphics')
        if (graphics) graphics.destroy()
        b.destroy()
      } else {
        // 弾のグラフィックスを更新
        const graphics = b.getData('graphics')
        if (graphics) {
          graphics.clear()
          graphics.fillStyle(0xffff00, 1)
          graphics.fillCircle(b.x, b.y, 5)
        }
      }
    })

    // 敵が画面外に出たら削除
    this.enemies?.children.entries.forEach(enemy => {
      const e = enemy as Phaser.Physics.Arcade.Sprite
      if (e.y > 610) {
        const graphics = e.getData('graphics')
        if (graphics) graphics.destroy()
        e.destroy()
      } else {
        // 敵のグラフィックスを更新
        const graphics = e.getData('graphics')
        if (graphics) {
          graphics.clear()
          graphics.fillStyle(0xff0000, 1)
          graphics.fillRect(e.x - 15, e.y - 15, 30, 30)
        }
      }
    })
  }

  private handlePointerDown(_pointer: Phaser.Input.Pointer) {
    if (this.gameOver) return

    // タップで弾を発射
    this.shootBullet()
  }

  private handlePointerMove(pointer: Phaser.Input.Pointer) {
    if (this.gameOver) return
    if (!pointer.isDown) return

    // プレイヤーをポインターのX座標に移動
    const targetX = Phaser.Math.Clamp(pointer.x, 15, 785)
    this.player?.setX(targetX)
  }
}
