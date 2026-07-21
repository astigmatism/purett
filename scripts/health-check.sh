#!/usr/bin/env sh
set -eu

project_dir=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
cd "$project_dir"

if [ -f .env ]; then
    # Shell-safe because run-local.sh writes only fixed keys and hexadecimal/integer values.
    set -a
    . ./.env
    set +a
fi

base_url="http://127.0.0.1:${PURETT_HTTP_PORT:-8080}"
response=$(curl -fsS "$base_url/health") || {
    echo "Health request failed: $base_url/health" >&2
    exit 1
}

echo "$response" | grep -q '"status":"ok"' || {
    echo "Health endpoint returned an unhealthy response: $response" >&2
    exit 1
}

echo "$response"
