#!/bin/sh
set -eu

su -s /bin/sh nginx -c 'cd /app && PORT=3000 /usr/local/bin/stream-status-server' &
exec nginx -g 'daemon off;'
