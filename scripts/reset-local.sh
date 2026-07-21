#!/usr/bin/env sh
set -eu

project_dir=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
cd "$project_dir"

if docker compose version >/dev/null 2>&1; then
    compose_cmd="docker compose"
else
    compose_cmd="docker-compose"
fi

$compose_cmd down --volumes
./run-local.sh
