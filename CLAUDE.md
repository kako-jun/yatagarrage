# Yatagarrage — 開発者向け index

PixiJS 8 + Vite + TypeScript で作るブラウザ弾幕シューティング。
八咫烏 (カラス天狗) が花火 (敵) を撃ち落とす。React / Phaser / Tailwind 等の依存は無し。

## ドキュメント

- [docs/architecture.md](./docs/architecture.md) — シーン構成・状態モデル・描画方針・設計判断
- [docs/danmaku-patterns.md](./docs/danmaku-patterns.md) — 35 種類の弾幕パターン一覧と追加方法
- [docs/game-balance.md](./docs/game-balance.md) — 速度・タイミング・無敵期間などのゲームバランス定数
- [docs/development.md](./docs/development.md) — セットアップ・コマンド・デプロイ手順
- [docs/todo.md](./docs/todo.md) — 既知の限界と残作業

## 技術スタック

- **PixiJS 8** — WebGL 描画 (Application + Container 階層)
- **Vite 6** — 開発サーバ + 本番ビルド
- **TypeScript 5** — strict
- **ESLint 9 / Prettier 3** — 品質管理
- **Vitest 2** — テスト基盤 (現状スケルトンのみ)

## ディレクトリ構成

```
src/
├── main.ts                 # PixiJS Application bootstrap + Scene wiring
├── constants/colors.ts     # カラーパレット
├── types/GameState.ts      # GameState 型 + createInitialGameState
├── scenes/                 # Title / Game / GameOver + SceneManager
└── game/                   # GravityField / Input / Trail / patterns
```

詳細は [docs/architecture.md](./docs/architecture.md) を参照。

## ライセンス

MIT License
