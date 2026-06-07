import { createClient } from 'microcms-js-sdk';
import { CMS_API_KEY, CMS_SERVICE_DOMAIN } from 'astro:env/server';

export const client = createClient({
  serviceDomain: CMS_SERVICE_DOMAIN,
  apiKey: CMS_API_KEY,
});
