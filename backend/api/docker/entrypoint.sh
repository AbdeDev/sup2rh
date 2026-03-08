#!/bin/bash
set -e

# Koyeb / Railway / Render : ajuste le port si fourni par la plateforme
if [ -n "$PORT" ]; then
    sed -i "s/Listen 80/Listen $PORT/" /etc/apache2/ports.conf
    sed -i "s/:80/:$PORT/g" /etc/apache2/sites-available/000-default.conf
fi

# Symfony cache warmup
php bin/console cache:warmup --env=prod --no-debug 2>/dev/null || true

# ── Initialisation base de données ──────────────────────────────────────────
if [ "$RUN_MIGRATIONS" = "true" ]; then
    echo "[entrypoint] Running Doctrine migrations..."

    # Assure que la table de métadonnées migrations existe
    php bin/console doctrine:migrations:sync-metadata-storage --no-interaction 2>/dev/null || true

    # Lance les migrations. En cas d'échec, force la synchronisation du schéma
    if php bin/console doctrine:migrations:migrate --no-interaction --allow-no-migration 2>&1; then
        echo "[entrypoint] Migrations OK"
    else
        echo "[entrypoint] Migrations failed, falling back to schema:update..."
        php bin/console doctrine:schema:update --force --complete --no-interaction 2>&1 || true
        # Marque toutes les migrations comme exécutées pour éviter de rejouer les échecs
        php bin/console doctrine:migrations:version --add --all --no-interaction 2>/dev/null || true
        echo "[entrypoint] Schema synced via schema:update"
    fi
fi
# ────────────────────────────────────────────────────────────────────────────

# Permissions sur les répertoires Symfony
chown -R www-data:www-data /var/www/html/var

exec "$@"
