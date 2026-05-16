# 開発手順

## セットアップ

```bash
npm install
```

Node.js 22 以降推奨 (CI と揃える)。

## コマンド

| コマンド | 用途 |
|---|---|
| `npm run dev` | 開発サーバ起動 ([http://localhost:3000/yatagarrage/](http://localhost:3000/yatagarrage/)) |
| `npm run build` | `tsc` + `vite build` → `dist/` |
| `npm run preview` | 本番ビルドを 4173 ポートで配信 |
| `npm run typecheck` | TypeScript 型チェックのみ |
| `npm run lint` | ESLint |
| `npm run lint:fix` | ESLint 自動修正 |
| `npm run format` | Prettier フォーマット |
| `npm run format:check` | Prettier チェックのみ |
| `npm run test` | Vitest (テストはスケルトンのみ) |

## 完了判定

CLAUDE.md (freeza) のルールに従い、Issue close 前に必ず:

1. `npm run typecheck` 通過
2. `npm run lint` 通過
3. `npm run build` 通過
4. **`npm run preview` + ブラウザでタイトル → ゲーム → ゲームオーバーまで実機確認**
5. ブラウザコンソールにエラーが出ていないこと

特に UI / ゲーム挙動は型と build だけでは検出できないので、実機確認を省略しない。

## デプロイ

`vite.config.ts` の `base: '/yatagarrage/'` でサブパス配信を前提に設定済み。
GitHub Pages もしくは Cloudflare Pages で `dist/` を配信する。

想定 URL: `https://yatagarrage.llll-ll.com/` (`name-name` ランチャーの `worker/src/projects.ts` に登録済み)。

## ブラウザ検証メモ

- Chromium / Playwright で実機検証する場合、`?v=<n>` クエリで強制リロードできる (キャッシュ回避)
- 開始直後 2.5 秒は無敵 + 初回スポーン待ちで何も起きないように見えるが正常
- 固定プレイヤーで死亡まで約 6.15 秒
- `[gameover]` ログを仕込みたい場合は `src/scenes/GameScene.ts` の onGameOver 直前に `console.log` を入れる
