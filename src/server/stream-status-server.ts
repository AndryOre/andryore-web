import { createLiveStatus, statusResponse } from '../lib/twitch-status'

const liveStatus = createLiveStatus({
  clientId: process.env.TWITCH_CLIENT_ID,
  clientSecret: process.env.TWITCH_CLIENT_SECRET,
})

const port = Number(process.env.PORT ?? 3000)

Bun.serve({
  port,
  routes: {
    '/api/stream-status': async () => statusResponse(await liveStatus.get()),
  },
  fetch: () => new Response('Not found', { status: 404 }),
})
