import { createClient } from 'microcms-js-sdk';
import { CMS_SERVICE_DOMAIN, CMS_API_KEY } from '@/config';

export const client = createClient({
  serviceDomain: CMS_SERVICE_DOMAIN,
  apiKey: CMS_API_KEY,
})