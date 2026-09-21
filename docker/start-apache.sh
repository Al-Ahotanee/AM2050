#!/bin/sh
set -eu

# Render supplies PORT dynamically. Apache is otherwise configured to listen on 80.
PORT_TO_USE="${PORT:-10000}"
sed -ri "s/^Listen [0-9]+$/Listen ${PORT_TO_USE}/" /etc/apache2/ports.conf
sed -ri "s/<VirtualHost \*:80>/<VirtualHost *:${PORT_TO_USE}>/" /etc/apache2/sites-available/000-default.conf
export TZ="${APP_TIMEZONE:-Africa/Lagos}"

# Run migrations automatically on container startup when database is configured
if [ -n "${DB_HOST:-}" ] && [ -n "${DB_NAME:-}" ]; then
  echo "[AM2050] Running database migrations..."
  php /var/www/am2050-api/scripts/migrate.php || echo "[AM2050] Migration step encountered an issue or database is not yet reachable. Continuing startup..."
fi

exec apache2-foreground
