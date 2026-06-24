import { defineConfig, envField, fontProviders } from 'astro/config';
import vercel from '@astrojs/vercel';

// https://astro.build/config
export default defineConfig({
  adapter: vercel({
    isr: {
      expiration: 60 * 60 * 24,
    },
  }),
  fonts: [
    {
      provider: fontProviders.google(),
      name: 'Inter',
      cssVariable: '--font-inter',
      weights: [400, 600, 700],
      styles: ['normal'],
    },
    {
      provider: fontProviders.google(),
      name: 'Noto Sans JP',
      cssVariable: '--font-noto-sans-jp',
      weights: [400, 600, 700],
      styles: ['normal'],
      subsets: ['latin', 'japanese'],
    },
  ],
  env: {
    schema: {
      CMS_SERVICE_DOMAIN: envField.string({
        context: 'server',
        access: 'secret',
      }),
      CMS_API_KEY: envField.string({ context: 'server', access: 'secret' }),
    },
  },
});
