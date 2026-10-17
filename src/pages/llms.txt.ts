import type { APIRoute } from 'astro'

import about from '../content/about.json'
import colophon from '../content/colophon.json'
import home from '../content/home.json'
import logUi from '../content/log-ui.json'
import uses from '../content/uses.json'
import { buildLlmsTxt } from '../seo/llms'

export const GET: APIRoute = () =>
  new Response(
    buildLlmsTxt(home.en.meta.description, [
      { path: '/', en: home.en.meta, es: home.es.meta },
      {
        path: '/about/',
        en: {
          title: about.en.pageTitle,
          description: about.en.pageDescription,
        },
        es: {
          title: about.es.pageTitle,
          description: about.es.pageDescription,
        },
      },
      { path: '/log/', en: logUi.en, es: logUi.es },
      { path: '/uses/', en: uses.en.meta, es: uses.es.meta },
      { path: '/colophon/', en: colophon.en.meta, es: colophon.es.meta },
    ]),
    { headers: { 'Content-Type': 'text/plain; charset=utf-8' } },
  )
