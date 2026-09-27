# Portfolio プロジェクト AIエージェント指示書

本プロジェクト（tsunehara ポートフォリオサイト）におけるAIコーディングアシスタントへの指示書。

---

## 1. プロジェクト・技術概要

- **フレームワーク**: Astro 7.x（`@astrojs/vercel` / Vercel ISR / SSR）
- **言語**: TypeScript 6.x
- **スタイル**: SCSS 二層構成 / FLOCSS + BEM
- **CMS**: microCMS (`microcms-js-sdk`)
- **パッケージマネージャ**: Yarn 4.x (Berry)

---

## 2. 実装・執筆時の重要ルール

実装の詳細な規約（CSS設計、アクセシビリティ、JS、依存関係の注意など）はすべて **`docs/coding-rules.md`** を参照すること。
記事の文章作成・下書きを行う際は、必ず **`docs/draft-rules.md`** を参照すること（太字禁止などのルールあり）。

特に以下の点は重要：

1. **Modern Web Standards の徹底**: `<div>` モーダルやJSアコーディオン等の古いパターンを避け、`<dialog>`, `<details>`, `container queries`, `has()` 等の最新仕様を使う。
2. **FLOCSS + BEM の厳守**: クラス名は必ずFLOCSS（`l-`, `c-`, `p-`, `u-`, `js-`, `is-`）＋BEM記法とする。
3. **段階的な実装**: セクションやコンポーネント単位で進め、一度に全体を書き換えない。
4. **記事執筆ルールの遵守**: 文章作成時は太字・水平線を禁止し、構造化で表現する（詳細は `draft-rules.md`）。


---

## 3. コマンドと品質検証

コミット前には、必ず一括通し検証コマンドを実行し、**エラー 0** で通過することを確認する。

```bash
yarn verify     # build + check + lint + lint:markup を一括実行
```

※ CI やサンドボックス環境でテレメトリエラーが出る場合は `ASTRO_TELEMETRY_DISABLED=1 yarn verify` とする。

---

## 4. コミット規約

コミットは論理的な単位で分割し、メッセージは Conventional Commits 形式に従う。**プレフィックスの後ろ（説明部分）は日本語で記述**する（例: `feat: カルーセルを追加`）。
規約外のメッセージは Husky フックで弾かれる。

詳細は `docs/coding-rules.md` を参照。
