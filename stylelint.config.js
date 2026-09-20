/** @type {import('stylelint').Config} */
export default {
  extends: [
    'stylelint-config-standard-scss',
    'stylelint-config-recess-order',
    'stylelint-config-html',
  ],
  ignoreFiles: ['.astro/**', 'dist/**', '.vercel/**', 'node_modules/**'],
  rules: {
    // FLOCSS接頭辞 + BEM。l-/c-/p- のBlockはUpperCamel、u-/js-/is- はlowerCamel
    'selector-class-pattern': [
      '^(?:(?:l|c|p)-[A-Z][a-zA-Z0-9]*|(?:u|js|is)-[a-z][a-zA-Z0-9]*)(?:__[a-z][a-zA-Z0-9]*)?(?:--[a-z][a-zA-Z0-9]*)?$',
      {
        message:
          'l-/c-/p- は UpperCamel、u-/js-/is- は lowerCamel。要素は __lowerCamel、修飾子は --lowerCamel',
      },
    ],
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
