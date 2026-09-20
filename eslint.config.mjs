import { defineConfig, globalIgnores } from 'eslint/config';
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import astro from 'eslint-plugin-astro';

export default defineConfig([
  globalIgnores(['dist/', '.astro/', '.vercel/', '.next/']),
  js.configs.recommended,
  tseslint.configs.recommended,
  astro.configs['flat/recommended'],
  {
    rules: {
      // 型の妥当性は tsc / astro check の責務とする。
      // 素の no-undef は TS のグローバル型（ImageMetadata 等）を誤検知するため無効化する
      'no-undef': 'off',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
]);
