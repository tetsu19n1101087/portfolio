import type { Config } from "stylelint";

const config: Config = {
  extends: [
    "stylelint-config-standard",
    "stylelint-config-html/astro",
  ],
  rules: {
    // カスタムBEM: block(ケバブ) _ element(ケバブ)、モディファイアは単一ハイフン
    "selector-class-pattern": "^[a-z][a-z0-9]*(-[a-z0-9]+)*(_[a-z0-9]+(-[a-z0-9]+)*)?$",
  },
};

export default config;
