# 残作業 / 既知の限界

## デプロイ

- [ ] `yatagarrage.llll-ll.com` の Cloudflare Pages or GitHub Pages 配備
- [ ] `name-name` worker を `wrangler deploy` してランチャーに反映

## ゲーム機能

- [ ] 旧 Phaser 版にあった Debug シーン (35 パターン個別発射 UI + 重力源 ON/OFF + 強度スライダー) を PixiJS で再実装
- [ ] BGM / 効果音 (`repos/private/notes/.agasteer/notes/dev/yatagarrage.md` に Udio プロンプト掲載)
- [ ] ステージシステム (現状は 1 ステージ永続スポーン)
- [ ] スコア永続化 (Nostalgic Counter or 専用ランキング)
- [ ] スマホ向けレスポンシブ (現状 800×600 固定)

## 演出 / 世界観

- [ ] タイトル画面の墨絵風夜空 + 灰の羽根のハイバネ感
- [ ] ゲーム中の「夢の中」のような浮遊感 (BGM + 視覚)
- [ ] 名作弾幕シューを意識した派手な被弾エフェクト
- [ ] 最終面ボーカル曲

## 弾幕パターン拡張案

- パターン #34 (花弁状) は現状単純な放射、本物の花弁形状にしたい
- 「神回避」「サウザンクロウズ」モード (notes より) は別シーンとして実装余地あり

## コード品質

- [ ] Vitest によるユニットテスト整備 (現状スケルトンのみ)
- [ ] `firePattern` の switch 巨大化 → パターンごとにファイル分割する余地
- [ ] ゲームバランス定数を `src/constants/balance.ts` 等に集約

## 参考

- 元構想: `repos/private/notes/.agasteer/notes/dev/yatagarrage.md`
- セッションログ: `repos/private/freeza/docs/operations/notes/20260516-session445-yatagarrage-pixijs-port.md`
