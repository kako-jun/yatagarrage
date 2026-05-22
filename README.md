# Yatagarrage: Hanabi Sparkout

夜空を駆ける八咫烏が花火を撃ち落とすブラウザ弾幕シューティング。

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## プレイ

ブラウザで直接プレイできます (インストール不要)。
[ゲームをプレイする](#) <!-- TODO: yatagarrage.llll-ll.com デプロイ後に差し替え -->

## 操作方法

| デバイス | 移動 | 射撃 |
|---|---|---|
| PC | 矢印キー | Space |
| スマホ・タブレット | 画面中央をタップ | 画面外周をタップ |

## 特徴

- 35 種類の弾幕パターン (円形・螺旋・波状・ホーミング・重力場応用 ほか)
- 弾道を曲げる 3 つの周回重力源
- 全エンティティに残像エフェクト
- PC・スマホ両対応

## システム要件

モダンなウェブブラウザ (Chrome / Firefox / Safari / Edge) + JavaScript 有効。

## 開発者向け

技術ドキュメントは [CLAUDE.md](./CLAUDE.md) と [docs/](./docs/) を参照してください。

## 表示サイズ

論理解像度は 800×600。canvas は CSS で拡大せず、`src/main.ts` の `renderer.resize()` と `stage.scale` で viewport に収まる実 canvas サイズへ合わせる。

## ライセンス

MIT License — Copyright (c) 2025 kako-jun

PixiJS 8 (WebGL レンダラ) を使用しています。
