# Architecture

## 全体像

PixiJS 8 の `Application` を 1 つ作り、`app.stage` 直下に `SceneManager.world` を置く。
シーン (Title / Game / GameOver / Debug) は全て `Container` で、`SceneManager` が `visible` を切り替えるだけ。
`app.ticker` は毎フレーム動き、`sceneManager.current` が `'game'` のとき `GameScene.update(ticker)`、`'debug'` のとき `DebugScene.update(ticker)` を呼ぶ。

```
Application
└── stage
    └── SceneManager.world
        ├── TitleScene      (visible 切替)
        ├── GameScene       (visible 切替)
        ├── GameOverScene   (visible 切替)
        └── DebugScene      (visible 切替、タイトル右下「Debug Mode」ボタンから遷移)
```

## 弾挙動の共通ロジック

`src/game/bulletBehaviors.ts` に `applyBulletBehaviors(bullet, ctx)` を集約。GameScene / DebugScene 両方から呼ばれる。`BulletFlags` (`homing / accelerating / decelerating / wave / converging / diverging / twoStage`) の挙動はここで一元管理されており、シーンごとの差は `BulletBehaviorContext` の `homingTarget / convergePoint / twoStageBehavior` で吸収する (GameScene = `aim`, DebugScene = `reverse`)。

シーン遷移は `SceneManager.show(key)` 一本で完結。各シーンが自分の Pointer / Keyboard ハンドラを持つ。

## GameState 契約

`src/types/GameState.ts` の `GameState` は**プレーンなオブジェクト**。PixiJS の表示オブジェクト、DOM ノード、タイマー、関数、クラスインスタンスを入れない。

- `GameScene.initWithState(state)` でゲーム開始時の状態を渡せる (デバッグ・テスト・将来のロード機能のため)
- `update()` は `state` を読み書きするだけ。描画は `entityGraphics.clear() → fill()` で毎フレーム描き直す
- 全エンティティ (player / playerBullet / enemy / enemyBullet) は `id` を持ち、`TrailLayer` での残像管理に使う

## 描画方針

- スプライト / テクスチャは使わない。全て `PIXI.Graphics` のプリミティブ (triangle, rect, circle) で描く
- 残像 (`Trail`) は単一 `Graphics` に全 ID の点をまとめて描画
- 重力源 (`GravityField`) はそれぞれ独立した `Graphics` (周回しながら描画位置を更新)
- UI 帯 (左の縦帯 + 下の横帯) は 1 度だけ `Graphics` で描いて配置

オブジェクトプールは持たず、配列 `filter()` で寿命管理。35 種類の弾幕でも数百〜千個程度なので軽量。

## 衝突判定

AABB の代わりに**円距離**を使う。

```ts
const overlapsCircle = (a, b) =>
  (a.x - b.x) ** 2 + (a.y - b.y) ** 2 <= (a.radius + b.radius) ** 2
```

判定対象は 3 種類:
1. `player × enemy`
2. `player × enemyBullet`
3. `playerBullet × enemy`

開始 `state.invincibleUntilMs` までは player の衝突をスキップ (`checkCollisions` 内で early return)。

## 弾幕パターン

`src/game/patterns/` ディレクトリ構成:

- `types.ts` — `PatternContext`, `SpawnBulletInput`, `Pattern` 型
- `helpers.ts` — `angleTo`, `baseAngle`, `fan`, `ring`, `spiral`, `rotating`
- `definitions.ts` — `PATTERNS: readonly Pattern[]` (35 件の `{ id, label, fire }`)
- `index.ts` — `firePattern(id, ctx)` dispatcher + `PATTERN_COUNT` + `PATTERN_DESCRIPTIONS`

各 `Pattern.fire(ctx)` は `ctx.spawn({ x, y, vx, vy, ... })` を呼ぶ純関数的な実装。
レジストリを Array で持つことで、テストから直接 `PATTERNS.find(p => p.id === N).fire(ctx)` を呼べる。

挙動フラグ (`BulletFlags`):

| flag | 効果 |
|---|---|
| `homing` | 一定時間後にプレイヤーへ徐々に旋回 |
| `accelerating` | 速度を毎フレーム加算 |
| `decelerating` | 速度を毎フレーム減衰 |
| `wave` | 進行角度をサイン波で揺らす |
| `converging` | 画面中央へ徐々に旋回 |
| `diverging` | 画面中央から離れる方向へ徐々に旋回 |
| `twoStage` | 一定時間後にプレイヤー方向へ方向転換 |

これらは `applyBulletBehaviors()` が毎フレーム適用する。

## 時間差弾幕

パターン #20 (時間差) / #27 (バースト) / #28 (ストリーム) は `setTimeout` を使わず、`state.elapsedMs` 基準の予約キュー (`scheduled`) に積む。`processScheduled()` が毎フレーム到来分を実行する。シーン遷移してもタイマー暴発しない。

## 入力

`src/game/Input.ts` がキーボード (矢印 + Space) と Pointer (外周タップ=射撃 / 中央タップ=移動) を一本化。`GameScene` が `input.onAction(...)` で受け取る。

Pointer のタッチ対象は `GameScene` 自身 (`eventMode='static'` + 全画面 `hitArea`)。シーンを切り替えると Container の `visible=false` で自然に非アクティブ。

## 重力場

`src/game/GravityField.ts`。中心から放射状に 3 つのソースが周回 (alpha / beta / gamma)。各ソースは `(strength / distSq) * dt` の加速度を弾の `vx/vy` に加算する。

## なぜ Phaser をやめたか

旧版は React + Phaser 3 の `MainScene.ts` モノリス (1660 行) で、Phaser の Group / Pool / Arcade Physics に密結合。PixiJS 化により:

- 状態をプレーンオブジェクトに切り出し、テスト・初期化注入が容易に
- 描画方針を「毎フレーム再描画」に統一して、Sprite / pool のライフサイクル管理から解放
- バンドルサイズ削減 (Phaser 1.2MB → PixiJS 288KB gzip 90KB)
