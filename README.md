# Portfolio

Tetsuro Tsunehara のポートフォリオサイト。

## ドキュメント

| ファイル | 内容 |
|---|---|
| [AGENTS.md](AGENTS.md) | AIエージェントへの指示書・開発規約 |
| [docs/coding-rules.md](docs/coding-rules.md) | コーディング規約（SCSS二層構成、a11y、HTML、JS） |
| [docs/draft-rules.md](docs/draft-rules.md) | 記事下書き執筆ルール（太字禁止、構造化方針） |

## 技術構成

- **Framework**: Astro 7.x (`@astrojs/vercel`)
- **Language**: TypeScript 6.x
- **Styles**: SCSS 二層構成（コンポーネント内 `<style lang="scss">` ＋ グローバルSCSS）
- **Headless CMS**: microCMS (`microcms-js-sdk`)
- **Node.js**: 24.20.0 (`.node-version`)
- **Package Manager**: Yarn 4.x (Berry)

## セットアップ

```bash
yarn install
yarn dev
```

## コマンド一覧

```bash
yarn dev        # 開発サーバー起動
yarn build      # プロダクションビルド
yarn preview    # ビルド結果プレビュー
yarn check      # Astro / TypeScript 型チェック
yarn lint       # ESLint + Stylelint 検査
yarn lint:fix   # ESLint + Stylelint 自動修正
yarn lint:markup # ビルド後HTMLの markuplint 検査
yarn verify     # build + check + lint + lint:markup（通し検証）
```
