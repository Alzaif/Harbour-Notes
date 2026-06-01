#!/bin/sh
set -e
node /app/dist/main.js &
API_PID=$!
trap "kill $API_PID 2>/dev/null" EXIT TERM INT
exec nginx -g 'daemon off;'
