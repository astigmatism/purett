#!/usr/bin/env sh
set -eu

project_dir=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
cd "$project_dir"

if [ -f .env ]; then
    set -a
    . ./.env
    set +a
fi

if ! command -v docker >/dev/null 2>&1; then
    echo "Docker is required. Run tests on the host or inside the provisioned VM." >&2
    exit 1
fi
if docker compose version >/dev/null 2>&1; then
    compose() { docker compose "$@"; }
elif command -v docker-compose >/dev/null 2>&1; then
    compose() { docker-compose "$@"; }
else
    echo "Docker Compose is required." >&2
    exit 1
fi
base_url="http://127.0.0.1:${PURETT_HTTP_PORT:-8080}"
export PURETT_BASE_URL="$base_url"

run_health() {
    ./scripts/health-check.sh >/dev/null
    echo "ok - standalone health endpoint"
}

run_static() {
    if ! command -v node >/dev/null 2>&1; then
        echo "Node.js 18 or newer is required for repository contract tests." >&2
        exit 1
    fi
    node tests/static/repository-contract.js
    compose run --rm -T \
        -v "$project_dir/library:/var/www/app/library:ro" \
        -v "$project_dir/tests:/var/www/app/tests:ro" \
        web sh /var/www/app/tests/php/lint.sh
}

run_unit() {
    compose run --rm --no-deps -T \
        -v "$project_dir/library:/var/www/app/library:ro" \
        -v "$project_dir/tests:/var/www/app/tests:ro" \
        web php /var/www/app/tests/php/unit.php
}

run_integration() {
    compose run --rm -T \
        -v "$project_dir/library:/var/www/app/library:ro" \
        -v "$project_dir/tests:/var/www/app/tests:ro" \
        web php /var/www/app/tests/php/integration.php
}

run_http() {
    if ! command -v node >/dev/null 2>&1; then
        echo "Node.js 18 or newer is required for HTTP contract tests." >&2
        exit 1
    fi
    node tests/http/http-contract.js
}

run_browser() {
    if ! command -v npm >/dev/null 2>&1; then
        echo "npm is required for the Playwright smoke test." >&2
        exit 1
    fi
    compose exec -T web php /var/www/app/bin/reset-demo.php >/dev/null
    compose exec -T web php /var/www/app/bin/grant-coins.php demo 50 >/dev/null
    if [ ! -x tests/browser/node_modules/.bin/playwright ]; then
        npm --prefix tests/browser install --no-audit --no-fund
    fi
    tests/browser/node_modules/.bin/playwright install chromium
    npm --prefix tests/browser test
}

suite=${1:-all}
case "$suite" in
    all)
        run_health
        run_static
        run_unit
        run_integration
        run_http
        ;;
    static)
        run_static
        ;;
    unit)
        run_unit
        ;;
    php)
        run_unit
        run_health
        run_integration
        ;;
    integration)
        run_health
        run_integration
        ;;
    http)
        run_health
        run_http
        ;;
    browser|smoke)
        run_health
        run_browser
        ;;
    *)
        echo "Usage: ./scripts/test.sh [all|static|unit|php|integration|http|browser]" >&2
        exit 2
        ;;
esac
