#!/bin/sh
set -eu

su -s /bin/sh nginx -c '/usr/local/bin/stream-status-server' &
exec nginx -g 'daemon off;'
