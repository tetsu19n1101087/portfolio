# Portfolio プロジェクト AIエージェント指示書

本プロジェクト（tsunehara ポートフォリオサイト）におけるAIコーディングアシスタントへの指示書。作業前に必ず一読すること。

---

## 技術構成

- **フレームワーク**: Astro 7.x（`@astrojs/vercel` / Vercel ISR / SSR）
- **言語**: TypeScript 6.x（`astro/tsconfigs/strict`）
- **スタイル**: Sass (SCSS) 二層構成（コンポーネント内 `<style lang="scss">` ＋ グローバルSCSS）
- **ヘッドレスCMS**: microCMS (`microcms-js-sdk`)
- **UI / カルーセル**: Embla Carousel (`embla-carousel`, `embla-carousel-autoplay`)
- **Lint / Formatter**: ESLint 10 (flat config) / Stylelint 17 (SCSS, recess-order) / markuplint / Prettier
- **Node**: 24.20.0（`.node-version`）
- **パッケージマネージャ**: Yarn 4.x (Berry)

---

## 実装時の必須手順

### 1. Modern Web Standards の参照
**HTML / CSS / クライアントサイドJS / `.astro` コンポーネントを書く前に、必ず最新のWeb標準仕様（`modern-web-guidance`）を念頭に置くこと。**
Web標準やブラウザAPIは進化が速く、モデルの学習データに含まれる古いパターン（例: `<div>` によるモーダル自作や、JavaScript によるスライドトグルなど）を避ける。

特に以下を扱うときは確実に最新標準に準拠する：
- **モーダル・ダイアログ**: `<dialog>` + `showModal()` を使う（フォーカストラップ・Escapeキー・`aria-*` をネイティブで担保）
- **アコーディオン**: `<details>` + `<summary>` を使う（キーボード操作・支援技術通知を担保。開閉アニメーションは Web Animations API）
- **レスポンシブ**: コンテナクエリ、`:has()`、範囲記法メディアクエリ（`width >= ...`）
- **Core Web Vitals**: 画像最適化、`width` / `height` / `loading` / `decoding` の明示、LCP画像の `fetchpriority="high"`
- **スクロールアニメーション**: Web Animations API や CSS スクロール連動

### 2. 実装の単位と順序
**セクション単位・コンポーネント単位で実装し、1つ終わるごとに確認を取る。**
ページ全体を一度に書き換えないこと（手戻りを最小化するため）。

---

## スタイル・CSS設計規約

Astro のスコープ機構を活用した**グローバルとコンポーネントの二層構成**を厳守する。

### 1. ディレクトリ構成
```
src/styles/
├── global.scss          # @use で reset, variables, base, utilities を集約
├── reset.scss           # リセットスタイル
├── variables.scss       # CSSカスタムプロパティ（--color-*, --gap 等）
├── base.scss            # html, body 等のベーススタイル
├── utilities.scss       # .u-srOnly 等のユーティリティ
└── develop/             # 出力を持たない道具（SCSS変数・mixin・function）
    ├── _index.scss      # @forward で集約
    ├── breakpoint.scss  # $breakpoints / min-screen()
    ├── function.scss    # rem()
    └── mixin.scss       # hover()
```

### 2. `develop/` の道具の活用
`astro.config.mjs` の `additionalData` で `@use "/src/styles/develop" as *;` が全SCSSに自動注入されているため、コンポーネント側で `@use` を書く必要はない。
- **px は直接書かず `rem()` を使う**:
  ```scss
  font-size: rem(16);
  padding: rem(24) 0;
  ```
- **レスポンシブはモバイルファーストで書く**:
  SPの値をベースに書き、`@include min-screen(pc)` でPC値を上書きする。
  ```scss
  .p-Card {
    padding: rem(16);

    @include min-screen(pc) {
      padding: rem(32);
    }
  }
  ```
- **ホバーは必ず `@include hover` を使う**:
  タッチデバイスでタップ後に `:hover` が固着するのを防ぐため、`:hover` を直接書かず `@include hover`（`any-hover: hover`）でラップする。
  ```scss
  .c-Link {
    @include hover {
      color: var(--color-accent);
    }
  }
  ```

### 3. クラス命名規則
- FLOCSS 接頭辞（`l-`, `c-`, `p-`, `u-`, `is-`, `js-`）またはケバブケース＋BEM記法を使用。
- セクションや汎用パーツ固有のスタイルは各 `.astro` の `<style lang="scss">` に記述し、スコープを効かせる。

### 4. Stylelint と Astro 固有セレクタ
- microCMS の動的 HTML などに親からスタイルを当てるため Astro の `:global(...)` 疑似クラスを使用する場合、`stylelint.config.js` の `selector-pseudo-class-no-unknown` に `ignorePseudoClasses: ['global']` の指定が必須。

---

## マークアップ & アクセシビリティ規約

- **画像の寸法指定**:
  すべての `<img>` に必ず `width` と `height` を指定する（CLS防止・markuplint要件）。
  ファーストビュー以外の画像には `loading="lazy"`、装飾画像には `alt=""` を指定する。
- **見出しレベルとランドマーク**:
  見出し（`h1`〜`h6`）のレベルを飛ばさない。
  `<section>` などのランドマークには、`aria-labelledby` を指定し、対応する見出しの `id` と完全に一致させる（markuplint 要件）。
- **パンくず・リンク**:
  区切り文字（`>` や `/`）は HTML に直接書かず CSS の `::after` で表現する（スクリーンリーダーの誤読防止）。

---

## JavaScript / TypeScript 規約

- **枠組みを先に作らない**:
  必要になった処理だけをシンプルに書く。
- **コロケーション**:
  コンポーネント固有のスクリプトは、その `.astro` の `<script>` に記述する。
  Astro の `<script>` は `type="module"`（defer相当）として出力されるため、`DOMContentLoaded` を待つ必要はない。
- **frontmatter の実行環境**:
  `.astro` の frontmatter（`---` 内）はビルド時またはサーバー側（SSR）で実行されるため、`window` や `document` へのアクセスは行わない。DOM 操作は `<script>` 内で行う。

---

## 記事下書き（drafts）執筆規約

`drafts/` 配下で記事・実績紹介などの Markdown 下書きを作成・編集する際は、詳細ルール（[draft-rules.md](docs/draft-rules.md)）に従うこと。

- **太字（Bold）の禁止**:
  記事本文、リスト、テーブル等で太字（`**...**`、`__...__`、`<strong>`、`<b>`）を一切使用しない。
- **水平線（`---` / `<hr>`）の禁止**:
  セクションの区切りに水平線（`---`）を挿入しない（frontmatter 除く）。見出し自体の余白とスタイルで区切りを表現する。
- **構造化による表現**:
  強調したい場合は太字に頼らず、見出し（`h2`, `h3`）の適切な設計、箇条書きリスト、カギ括弧（「」）、インラインコード（`` `code` ``）などの構造化によって表現する。
- **技術スタックの 5 区分・採用技術のみ列挙**:
  技術スタックセクションは「言語」「フレームワーク」「OS」「インフラ」「その他」の 5 区分で記述し、選定理由やカテゴリ名等の解説文は入れず、採用技術のみをシンプルに列挙する（該当なしは省略。Tailwind CSS や shadcn/ui などの CSS/UI ライブラリも「フレームワーク」に含める）。

---

## 依存関係とツールチェーンの注意点

- **Yarn Berry + Astro 7**:
  `@astrojs/check` / `@astrojs/language-server` のコンパイラが要求する `@emnapi/runtime` は peerDependency のため、Yarn Berry（nodeLinker）環境では欠落しやすい。必ず `devDependencies` に明示的に追加して解決する。
- **Vercel アダプターの互換性**:
  Astro 7 には `@astrojs/vercel: ^11.x` を採用する（10.x は Astro 6 向けのため peerDependency 不整合となる）。
- **テレメトリ抑止**:
  CI やパーミッション制約のあるサンドボックス環境では、`~/.config` や `~/Library/Preferences` への書き込みエラーを防ぐため、コマンド実行時に `ASTRO_TELEMETRY_DISABLED=1` を指定する。

---

## コマンド体系と検証

コード変更後は必ず以下のコマンドで品質検証を行うこと。

```bash
yarn dev        # 開発サーバー
yarn build      # プロダクションビルド
yarn check      # Astro / TypeScript 型チェック
yarn lint       # ESLint + Stylelint
yarn lint:fix   # 自動整形・プロパティ並び替え
yarn lint:markup # ビルド後HTMLの markuplint 検査
yarn verify     # build + check + lint + lint:markup（一括通し検証）
```

コミット前または作業完了時には **`yarn verify` がエラー 0 で通過すること** を確認する。

---

## コミット規約

- コミットは意味のある論理的な単位に分割する。
- コミットメッセージは [Conventional Commits](https://www.conventionalcommits.org/ja/v1.0.0/) 形式に従い、**プレフィックスの後ろ（説明部分）は日本語で記述**する。
- 形式: `<type>: <日本語の説明>`
  - `feat`: 新機能・コンポーネント追加（例: `feat: カルーセルコンポーネントを追加`）
  - `fix`: バグ修正・表示崩れ修正（例: `fix: モバイル表示時の余白を修正`）
  - `refactor`: リファクタリング（例: `refactor: クラス命名規則をFLOCSSに統一`）
  - `style`: スタイル調整（例: `style: ボタンのホバー色を微調整`）
  - `docs`: ドキュメント更新（例: `docs: コミット規約に日本語記述ルールを追記`）
  - `chore`: 設定ファイル・依存関係更新（例: `chore: commitlint を導入`）
- Husky の `commit-msg` フック（commitlint）により、規約外のメッセージは自動でコミットが弾かれます。
