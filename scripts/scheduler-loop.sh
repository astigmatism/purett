#!/bin/sh
set -eu

while true; do
    php /var/www/app/cron/regen.php
    current_minute=$(date -u +%M)
    if [ "$current_minute" = "00" ]; then
        php /var/www/app/cron/leaderboard.php
    fi
    sleep 60
done
