#!/usr/bin/env sh
set -eu

if [ "$#" -ne 2 ]; then
    echo "Usage: ./scripts/grant-coins.sh USERNAME POSITIVE_AMOUNT" >&2
    exit 2
fi

project_dir=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
cd "$project_dir"
docker compose exec -T web php /var/www/app/bin/grant-coins.php "$1" "$2"
