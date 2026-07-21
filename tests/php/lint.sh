#!/usr/bin/env sh
set -eu

temporary_list=$(mktemp)
trap 'rm -f "$temporary_list"' EXIT HUP INT TERM

find \
    /var/www/app/application \
    /var/www/app/library/PureTripleTriad \
    /var/www/app/library/Gamehouse \
    /var/www/app/library/Standalone \
    /var/www/app/bin \
    /var/www/app/cron \
    -type f \( -name '*.php' -o -name '*.phtml' \) -print > "$temporary_list"

count=0
while IFS= read -r file; do
    php -l "$file" >/dev/null
    count=$((count + 1))
done < "$temporary_list"

echo "ok - PHP 5.6 syntax ($count files)"

