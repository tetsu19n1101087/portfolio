# コーディング規約

本プロジェクトの実装ガイドライン。保守性・アクセシビリティ（JIS X 8341-3 レベルA準拠）・表示パフォーマンスを担保するための規約。

---

## 1. 基本方針

| 項目 | ルール |
|---|---|
| 文字コード | UTF-8 |
| 改行コード | LF |
| インデント | 半角スペース2 |
| スタイル | SCSS 二層構成（コンポーネント内 `<style lang="scss">` ＋ グローバルSCSS） |
| Web標準基準 | **Baseline**（Widely available は無条件で使用可、Newly available は積極活用） |
| アクセシビリティ | WCAG / JIS X 8341-3:2016 レベルA準拠 |

`.editorconfig` で文字コード・改行コード・インデントを強制する。

---

## 2. CSS / SCSS 設計

Astro のスコープ機構を活用した**グローバルとコンポーネントの二層構成**。

### 2-1. ディレクトリ構成
```
src/styles/
├── global.scss          # @use で集約。BaseLayout から import する
├── reset.scss           # リセットスタイル
├── variables.scss       # CSSカスタムプロパティ
├── base.scss            # html / body など
├── utilities.scss       # .u-srOnly などのユーティリティ
└── develop/             # 出力を持たない道具（追加データとして自動注入）
    ├── _index.scss      # @forward で集約
    ├── breakpoint.scss  # $breakpoints / min-screen()
    ├── function.scss    # rem()
    └── mixin.scss       # hover()
```

### 2-2. `develop/` （出力を持たない道具）
`astro.config.mjs` の `additionalData` で全SCSSに自動注入されている。各コンポーネント側で `@use` を書く必要はない。

#### ① サイズ指定は `rem()` を使う
px 値をそのまま書かず、`rem()` 計算関数を使う。

```scss
.p-Hero__title {
  font-size: rem(32);
  margin-bottom: rem(16);
}
```

#### ② レスポンシブはモバイルファースト
SPの値をベースに書き、`@include min-screen(pc)` でPC値を上書きする。
メディアクエリは範囲記法（`width >= $min`）で自動出力される。

```scss
.p-Section {
  padding: rem(24) 0;

  @include min-screen(pc) {
    padding: rem(64) 0;
  }
}
```

#### ③ ホバーは必ず `@include hover` を使う
タッチデバイスでタップ後に `:hover` の状態が固着するのを防ぐため、`:hover` を直接書かず `@include hover`（`any-hover: hover`）を使う。

```scss
.c-Button {
  transition: opacity 160ms ease;

  @include hover {
    opacity: 0.7;
  }
}
```

#### ④ 変数の使い分け
- **SCSS変数（`develop/`）**: ビルド時に計算・展開される値（ブレークポイント、計算用定数など）
- **CSSカスタムプロパティ（`variables.scss`）**: 実行時に参照・上書きされる値（テーマカラー、フォントファミリー、ギャップなど）

#### ⑤ クラス命名規則 (FLOCSS + BEM)
- FLOCSS 接頭辞（`l-`, `c-`, `p-`, `u-`, `is-`, `js-`）またはケバブケース＋BEM記法を使用する。
- Stylelint（`selector-class-pattern`）により、Block は UpperCamelCase（例: `.p-Card`）、Element は `__lowerCamel`、Modifier は `--lowerCamel` が強制される。
- セクションや汎用パーツ固有のスタイルは各 `.astro` の `<style lang="scss">` に記述し、スコープを効かせる。

#### ⑥ Stylelint と Astro 固有疑似クラス
- microCMS の動的 HTML や外部コンポーネントに親からスタイルを当てるため Astro の `:global(...)` を使う場合、`stylelint.config.js` の `selector-pseudo-class-no-unknown` で `ignorePseudoClasses: ['global']` のホワイトリスト指定が必要。

---

## 3. HTML & マークアップ品質

### 3-1. 画像（Images）
- **`width` / `height` を必ず明示する**: レイアウトシフト（CLS）を防ぐため、すべての `<img>` に固有寸法（またはアスペクト比）を指定する（markuplint 必須要件）。
- **遅延読み込み**: ファーストビュー以外の画像には `loading="lazy"` を指定する。ファーストビューの重要画像には `loading="eager"` かつ `fetchpriority="high"` を検討する。
- **代替テキスト**: 情報を持つ画像には適切な `alt`、装飾目的の画像には `alt=""` を指定する。

### 3-2. 構造化とセマンティクス
- `<section>` などのランドマークには `aria-labelledby` を指定し、対応する見出し（`h2 id="..."` 等）の ID と完全に一致させる。
- 見出しレベル（`h1`〜`h6`）をデザイン都合で飛ばさない。
- 視覚的に非表示だが支援技術に伝えたい文言には `.u-srOnly`（`.sr-only`）を使用する。

### 3-3. UIパターン
- **モーダル・ダイアログ**: `<div>` ではなくネイティブの `<dialog>` + `showModal()` を使う。フォーカストラップ・Escapeキーでの閉鎖が標準で担保される。
- **アコーディオン**: `<div>` のクラス切り替えではなく、`<details>` + `<summary>` を使う。開閉アニメーションには Web Animations API を活用する。

---

## 4. JavaScript / TypeScript

### 4-1. コロケーション
コンポーネント固有のスクリプトは、その `.astro` ファイル内の `<script>` に記述する。
Astro の `<script>` は `type="module"`（defer相当）として出力されるため、`DOMContentLoaded` の待機イベントは不要。

### 4-2. スクリプトのスコープについて
`<style>` とは異なり、`<script>` は自動でスコープされない。
ページ全体からクラスを取得するのではなく、コンポーネントのルート要素を起点（`querySelector` 等）としてスコープを絞る。

### 4-3. frontmatter の注意点
`.astro` の frontmatter はサーバー側（Node.js環境）で実行される。`document` や `window` などのブラウザAPIは `<script>` 内でのみ使用すること。

---

## 5. 記事下書き（drafts）執筆規約

`drafts/` 配下で記事・実績紹介などの Markdown 下書きを作成・編集する際は、詳細ルール（`docs/draft-rules.md`）に従うこと。

- **太字（Bold）の禁止**: 記事本文、リスト、テーブル等で太字（`**...**`、`__...__`、`<strong>`、`<b>`）を一切使用しない。
- **水平線（`---` / `<hr>`）の禁止**: セクションの区切りに水平線（`---`）を挿入しない（frontmatter 除く）。
- **構造化による表現**: 強調したい場合は太字に頼らず、見出しの適切な設計、箇条書きリスト、カギ括弧（「」）、インラインコードなどの構造化によって表現する。
- **技術スタックの 5 区分・採用技術のみ列挙**: 「言語」「フレームワーク」「OS」「インフラ」「その他」の 5 区分で記述し、選定理由などの解説文は入れず採用技術のみ列挙する。
- **コードブロック内の非コード記述禁止**: コードブロック（```）はプログラムコードやシェルコマンド専用とし、フロー図やアスキーアートなどは入れない。

---

## 6. 依存関係とツールチェーンの注意点

- **Yarn Berry + Astro 7**: `@astrojs/check` 等が要求する `@emnapi/runtime` は peerDependency のため、Yarn Berry（nodeLinker）環境では `devDependencies` に明示追加して解決する。
- **Vercel アダプターの互換性**: Astro 7 には `@astrojs/vercel: ^11.x` を採用する。
- **テレメトリ抑止**: CI やサンドボックス環境で書き込みエラーが出る場合は、コマンド実行時に `ASTRO_TELEMETRY_DISABLED=1` を指定する。

---

## 7. 品質検証コマンド

コード変更後は以下のコマンドで品質を検査する。

```bash
# 型・構文チェック
yarn check

# Lint (ESLint + Stylelint)
yarn lint

# ビルド後HTMLのマークアップ検証
yarn lint:markup

# 全工程の通し検証
yarn verify
```

---

## 8. コミット規約

コミットメッセージは [Conventional Commits](https://www.conventionalcommits.org/ja/v1.0.0/) 形式に従い、**プレフィックスの後ろ（説明部分）は日本語で記述**する。

```text
<type>: <日本語の説明>
```

### 主な type 一覧と記述例

| type | 用途 | 例 |
|---|---|---|
| `feat` | 新機能や新しいコンポーネントの追加 | `feat: カルーセルコンポーネントを追加` |
| `fix` | バグ修正・表示崩れ修正 | `fix: モバイル表示時の余白崩れを修正` |
| `refactor` | リファクタリング（機能変更を伴わないコード整理） | `refactor: クラス命名規則をFLOCSSに統一` |
| `style` | CSS・スタイルの調整（レイアウト微調整など） | `style: ボタンのホバー色を微調整` |
| `docs` | ドキュメントの追加・更新 | `docs: コミット規約に日本語記述ルールを追記` |
| `chore` | 設定ファイル・依存関係の変更 | `chore: commitlint を導入` |

※ Husky の `commit-msg` フック（commitlint）により、規約外のメッセージ（プレフィックスなし等）は自動でコミットが弾かれます。
