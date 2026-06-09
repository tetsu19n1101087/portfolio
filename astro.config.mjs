import { defineConfig, envField } from 'astro/config';
import vercel from '@astrojs/vercel';

// https://astro.build/config
export default defineConfig({
  adapter: vercel({
    isr: {
      expiration: 60 * 60 * 24,
    },
  }),
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
