#!/bin/bash
set -e

# Koyeb / Railway / Render: the platform provides a PORT env var
if [ -n "$PORT" ]; then
    sed -i "s/Listen 80/Listen $PORT/" /etc/apache2/ports.conf
    sed -i "s/:80/:$PORT/g" /etc/apache2/sites-available/000-default.conf
fi

# Symfony cache warmup
php bin/console cache:warmup --env=prod --no-debug 2>/dev/null || true

# Run migrations automatically if flag is set
if [ "$RUN_MIGRATIONS" = "true" ]; then
    php bin/console doctrine:migrations:migrate --no-interaction --allow-no-migration 2>&1 || true
fi

# Ensure runtime user can write Symfony cache/log files
chown -R www-data:www-data /var/www/html/var

exec "$@"
