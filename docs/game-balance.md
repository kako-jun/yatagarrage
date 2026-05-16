# ゲームバランス定数

実装場所: `src/scenes/GameScene.ts` 冒頭の定数 + `src/types/GameState.ts` の初期状態。

## プレイヤー

| 定数 | 値 | 説明 |
|---|---|---|
| `PLAYER_SPEED` | 300 px/s | キーボード移動速度 (ノルマライズ済み斜め含む) |
| `PLAYER_FIRE_RATE_MS` | 200 ms | 弾の連射間隔 |
| `PLAYER_BULLET_SPEED` | 500 px/s | プレイヤー弾の速度 |
| `player.radius` | 12 px | 円判定半径 |

## 敵

| 定数 | 値 | 説明 |
|---|---|---|
| `ENEMY_SPAWN_INTERVAL_MS` | 1000 ms | 敵スポーン間隔 |
| `ENEMY_FALL_SPEED_MIN/MAX` | 100-200 px/s | 落下速度のランダム範囲 |
| `ENEMY_FIRE_INTERVAL_MIN/MAX` | 800-1500 ms | 射撃間隔のランダム範囲 |
| `ENEMY_RADIUS` | 15 px | 円判定半径 |
| 初回射撃遅延 | 1500 ms | スポーン後、初発までの猶予 |

## 弾

| 定数 | 値 | 説明 |
|---|---|---|
| `BULLET_DEFAULT_LIFESPAN_MS` | 6000 ms | 弾が消えるまでの最大時間 |
| `BULLET_DEFAULT_RADIUS` | 4 | デフォルト描画サイズ (`size`) |
| 衝突半径 | `size + 2` | プレイヤーとの判定で使う |
| 弾基本速度 | 200 px/s | パターン側で乗数調整可 |

## 開始直後の安全マージン

```
elapsedMs |  事象
----------|---------------------------------
   0      |  ゲーム開始、プレイヤー (430, 510) 静止
0-2500    |  無敵期間 (player が点滅描画、衝突無視)
   2500   |  初回敵スポーン (上端 y=-20)
   4000   |  初発敵弾 (スポーン後 1500ms 遅延)
  ~6000   |  最初の敵が画面下端到達
```

→ 固定プレイヤーで死亡まで **約 6.15 秒**。プレイヤーが動けばさらに長く生存可能。

実装ポイント:
- `state.invincibleUntilMs = 2500` (`createInitialGameState`)
- `state.enemySpawnAt = 1500` 初期値 → `elapsedMs - enemySpawnAt >= 1000` で発火 → 2500ms で初回
- `enemy.nextShootAt = elapsedMs + 1500` (`spawnEnemy`)
- 無敵中はプレイヤー三角形を `alpha = 0.5 + 0.5 * sin(elapsedMs * 0.02)` で点滅

## 重力場

| ソース | radius (px) | speed (rad/s) | strength | color |
|---|---|---|---|---|
| alpha | 170 | +0.4 | 1,600,000 | 0x66d9ff |
| beta | 240 | -0.28 | 1,200,000 | 0xff8ad9 |
| gamma | 120 | +0.65 | 900,000 | 0x86ffad |

弾に対する加速度 = `(strength / distSq) * dt`。距離が近いほど強く曲がる。距離 < 8px は除外 (発散防止)。

## 描画レイアウト

| 領域 | 値 |
|---|---|
| 画面サイズ | 800 × 600 |
| `PLAY_AREA_LEFT` | 60 (左 UI 帯の右端) |
| `PLAY_AREA_RIGHT` | 800 |
| `PLAY_AREA_TOP` | 0 |
| `PLAY_AREA_BOTTOM` | 560 (下 UI 帯の上端) |
| 左 UI 帯 | 0-60 px (青 alpha 0.8、縦書き "STAGE 1") |
| 下 UI 帯 | y 560-600 (青 alpha 0.8、デバッグテキスト) |

## 残像

- `TrailLayer.maxLength = 10` (各エンティティの履歴上限)
- `TrailLayer.decay = 0.1` (毎フレーム alpha 減衰)
- 描画 alpha = `point.alpha * 0.5`
