import { defineConfig, envField } from 'astro/config';

// https://astro.build/config
export default defineConfig({
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
