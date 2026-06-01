import { serve } from '@hono/node-server';
import { createNotesDependencies } from './bootstrap/create-notes-dependencies.js';
import { createApp } from './infrastructure/http/app.js';

const deps = await createNotesDependencies();
const app = createApp(deps);

serve(
  {
    fetch: app.fetch,
    port: deps.config.PORT,
  },
  (info) => {
    console.log(
      JSON.stringify({
        level: 'info',
        message: 'Harbour Notes API listening',
        port: info.port,
        trustGateway: deps.config.TRUST_GATEWAY_HEADERS,
      }),
    );
  },
);
