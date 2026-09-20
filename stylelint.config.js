/** @type {import('stylelint').Config} */
export default {
  extends: [
    'stylelint-config-standard-scss',
    'stylelint-config-recess-order',
    'stylelint-config-html',
  ],
  ignoreFiles: ['.astro/**', 'dist/**', '.vercel/**', 'node_modules/**'],
  rules: {
    // portfolio の命名規則とユーティリティを許容
    'selector-class-pattern': null,
    // @use "..." as *; を許可する
    'scss/at-use-no-unnamespaced': null,
    // Astro の :global() を許可
    'selector-pseudo-class-no-unknown': [
      true,
      {
        ignorePseudoClasses: ['global'],
      },
    ],
  },
};
