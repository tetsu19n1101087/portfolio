import type { Config } from "stylelint";

const config: Config = {
  extends: [
    "stylelint-config-standard",
    "stylelint-config-html/astro",
  ],
};

export default config;
