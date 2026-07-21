#!/bin/sh
set -eu

while true; do
    current_minute=$(date -u +%M)
    if [ "$current_minute" = "00" ]; then
        php /var/www/app/cron/leaderboard.php
    fi
    sleep 60
done
