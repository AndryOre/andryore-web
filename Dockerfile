FROM oven/bun:1.4.2-alpine AS build
WORKDIR /repo

COPY package.json bun.lock bunfig.toml ./
RUN bun install --frozen-lockfile --ignore-scripts

COPY astro.config.mjs tsconfig.json ./
COPY docs/brand/tokens.css docs/brand/tokens.css
COPY public public
COPY src src
RUN bun run build
RUN bun build --compile src/server/stream-status-server.ts --outfile /repo/stream-status-server

FROM nginx:1.29-alpine
RUN rm -f /etc/nginx/conf.d/default.conf
COPY docker/nginx.conf /etc/nginx/nginx.conf
COPY docker/security-headers.conf /etc/nginx/snippets/security-headers.conf
COPY docker/site.conf /etc/nginx/conf.d/site.conf
COPY --from=build /repo/dist /usr/share/nginx/html
COPY --from=build /repo/stream-status-server /usr/local/bin/stream-status-server
COPY docker/entrypoint.sh /usr/local/bin/entrypoint.sh
ENV PORT=3000
EXPOSE 80
ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO /dev/null http://127.0.0.1/ || exit 1
