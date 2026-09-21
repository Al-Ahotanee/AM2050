#!/bin/sh
set -eu

# Render supplies PORT dynamically. Apache is otherwise configured to listen on 80.
PORT_TO_USE="${PORT:-10000}"
sed -ri "s/^Listen [0-9]+$/Listen ${PORT_TO_USE}/" /etc/apache2/ports.conf
sed -ri "s/<VirtualHost \*:80>/<VirtualHost *:${PORT_TO_USE}>/" /etc/apache2/sites-available/000-default.conf
export TZ="${APP_TIMEZONE:-Africa/Lagos}"
exec apache2-foreground
