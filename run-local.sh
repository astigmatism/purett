#!/usr/bin/env sh
set -eu

project_dir=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
cd "$project_dir"

if ! command -v docker >/dev/null 2>&1; then
    echo "Docker is required. Install Docker Desktop (host) or Docker Engine (VM), then rerun ./run-local.sh." >&2
    exit 1
fi

if docker compose version >/dev/null 2>&1; then
    compose_cmd="docker compose"
elif command -v docker-compose >/dev/null 2>&1; then
    compose_cmd="docker-compose"
else
    echo "Docker Compose is required. Install the Docker Compose plugin, then rerun ./run-local.sh." >&2
    exit 1
fi

if ! docker info >/dev/null 2>&1; then
    echo "The Docker daemon is not available. Start Docker and rerun ./run-local.sh." >&2
    exit 1
fi

if [ ! -f .env ]; then
    umask 077
    db_password=$(openssl rand -hex 24)
    root_password=$(openssl rand -hex 24)
    {
        echo "PURETT_DB_PASSWORD=$db_password"
        echo "PURETT_DB_ROOT_PASSWORD=$root_password"
        echo "PURETT_HTTP_PORT=8080"
        echo "PURETT_BIND_ADDRESS=${PURETT_BIND_ADDRESS:-127.0.0.1}"
        echo "PURETT_FREE_ECONOMY=0"
        echo "PURETT_TEST_MODE=0"
        echo "PURETT_MODERN_GRAPHICS_ENABLED=1"
    } > .env
fi

# Keep only .env private. Source copied into the image must remain readable by
# the unprivileged Apache worker even when this is the first launch.
umask 022

mkdir -p var/gamehistory/tutorials var/log var/sessions
chmod 0777 var/gamehistory var/gamehistory/tutorials var/log var/sessions
for tutorial in database/tutorials/1.jsonl database/tutorials/2.jsonl database/tutorials/4.jsonl database/tutorials/5.jsonl; do
    if [ ! -f "$tutorial" ]; then
        echo "Missing sanitized tutorial fixture: $tutorial" >&2
        exit 1
    fi
    cp "$tutorial" var/gamehistory/tutorials/
done

$compose_cmd up --build -d

attempt=0
while [ "$attempt" -lt 60 ]; do
    if ./scripts/health-check.sh >/dev/null 2>&1; then
        echo "Pure Triple Triad is ready at http://127.0.0.1:${PURETT_HTTP_PORT:-8080}/"
        echo "Demo login: demo / TripleTriad!"
        exit 0
    fi
    attempt=$((attempt + 1))
    sleep 2
done

echo "The stack started but did not become healthy. Run '$compose_cmd ps' and '$compose_cmd logs web db redis' for details." >&2
exit 1
