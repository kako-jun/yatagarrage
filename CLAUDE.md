# yatagarrage - 開発者向けドキュメント

## プロジェクト概要

PixiJS 8 + Vite + TypeScript で作るブラウザ弾幕シューティング。八咫烏 (カラス天狗) が花火 (敵) を撃ち落とす。
スマホ・PC 両対応、35 種類の弾幕パターンに重力場・残像エフェクトを組み合わせる。

## 技術スタック

- **PixiJS 8**: WebGL 描画 (Application + Container ベースのシーン管理)
- **Vite 6**: 開発・ビルド
- **TypeScript 5**: 型安全
- **ESLint 9 / Prettier 3**: 品質管理
- **Vitest 2**: テスト基盤 (現状はスケルトンのみ)

React / Phaser / Tailwind 等の依存は一切無し。

## ディレクトリ構成

```
src/
├── main.ts                     # PixiJS Application bootstrap + Scene wiring
├── vite-env.d.ts
├── constants/
│   └── colors.ts               # カラーパレット (敵/弾/UI など)
├── types/
│   └── GameState.ts            # GameState 型 + createInitialGameState
├── scenes/
│   ├── SceneManager.ts         # Container ベースの表示切替
│   ├── TitleScene.ts           # タイトル画面 (クリック/Enter で開始)
│   ├── GameScene.ts            # メインループ (敵/弾/重力/衝突/UI)
│   └── GameOverScene.ts        # スコア表示 + クリック/Enter で再スタート
└── game/
    ├── GravityField.ts         # 3 つの周回重力源 + 弾道補正
    ├── Input.ts                # キーボード + ポインター入力 (外周=射撃/中央=移動)
    ├── Trail.ts                # 単一 Graphics で全エンティティの残像を描画
    └── patterns.ts             # 35 種類の敵弾幕パターン (純関数群)
```

## アーキテクチャ

- `GameScene` が状態 (`GameState`) を保持し、`update(ticker)` で 1 フレーム分の更新を実行
- 描画は毎フレーム `entityGraphics.clear() → fill()` で全て描き直す (オブジェクトプール無し)
- 残像は `TrailLayer` が単一 `Graphics` にまとめて描画 (id ごとの ring buffer)
- 衝突判定は円距離ベース (AABB ではなく半径比較) で 3 種類: player×enemy, player×enemyBullet, playerBullet×enemy
- 弾幕パターンは `firePattern(patternId, ctx)` の switch で 35 個に分岐。各ケースが `ctx.spawn()` を呼ぶ
- 弾は `BulletFlags` で挙動切替: `homing / accelerating / decelerating / wave / converging / diverging / twoStage`

## ゲームバランス定数 (`src/scenes/GameScene.ts`)

- `PLAYER_FIRE_RATE_MS = 200`
- `PLAYER_SPEED = 300`
- `PLAYER_BULLET_SPEED = 500`
- `ENEMY_SPAWN_INTERVAL_MS = 1000`
- `ENEMY_FALL_SPEED_MIN/MAX = 100 / 200`
- `ENEMY_FIRE_INTERVAL_MIN/MAX = 800 / 1500`
- `BULLET_DEFAULT_LIFESPAN_MS = 6000`
- 開始 2.5 秒は無敵 (`invincibleUntilMs`) + 最初のスポーン 2.5 秒後 + 最初の射撃 1.5 秒後

## 弾幕パターン (35 種)

`src/game/patterns.ts` で `PATTERN_DESCRIPTIONS` に日本語ラベル一覧。代表例:

- 扇状 (5 / 7-集中 / 7-分散), 円形 (8 / 16 / 24 / 32 方向)
- 螺旋 (シングル / ダブル / トリプル)
- 波状, ランダム, 収束, 拡散
- 幾何 (十字 / X / 米字), 花弁状, 星 (現状は円形流用)
- ホーミング, 加速, 減速, 二段階, 時間差, 密集, まばら
- 多重円形 (ダブル / トリプル), バースト, ストリーム
- 直線狙い, 予測, 爆発, 回転 (CW/CCW), ランダムホーミング

新しいパターンを追加する場合: `firePattern` の switch に case を増やし、`PATTERN_DESCRIPTIONS` にラベルを追加し、`PATTERN_COUNT` を更新する。

## 開発コマンド

```bash
npm install
npm run dev        # http://localhost:3000/yatagarrage/
npm run build      # tsc + vite build → dist/
npm run preview    # 本番ビルドを 4173 でホスト
npm run lint
npm run typecheck
npm run test       # vitest (テストはまだ無し)
```

## 既知の限界 / TODO

- 旧 Phaser 版にあった Debug シーン (パターン個別発射 + 重力強度スライダー) は未移植
- BGM / 効果音は未実装 (`yatagarrage.md` の BGM プロンプトを参照)
- タイトル画面の墨絵背景 / 灰の羽根演出は未実装 (ハイバネ感)
- ステージシステム (現状 1 ステージ固定で永続スポーン)
- スコアの永続化 (Nostalgic Counter 連携など)

## デプロイ

`vite.config.ts` の `base: '/yatagarrage/'` でサブパス配信を前提に設定済み。
GitHub Pages もしくは Cloudflare Pages で `dist/` を配信する。

## ライセンス

MIT License
