# =============================================================================
# Sup2Rh Backend — Symfony API
# Multi-stage build: composer deps → PHP + Apache runtime
# =============================================================================

# --- Stage 1: Composer dependencies ---
FROM composer:2 AS vendor

WORKDIR /app
COPY composer.json composer.lock ./
RUN composer install --no-dev --no-scripts --prefer-dist --no-autoloader

COPY . .
RUN composer dump-autoload --optimize --classmap-authoritative --no-dev

# --- Stage 2: Runtime ---
FROM php:8.4-apache-bookworm

# System dependencies for PHP extensions
RUN apt-get update && apt-get install -y --no-install-recommends \
        libpq-dev \
        libicu-dev \
        libzip-dev \
    && docker-php-ext-configure intl \
    && docker-php-ext-install -j$(nproc) pdo_pgsql intl opcache zip \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Apache: enable rewrite + set document root
RUN a2enmod rewrite headers

ENV APACHE_DOCUMENT_ROOT=/var/www/html/public

RUN sed -ri -e 's!/var/www/html!${APACHE_DOCUMENT_ROOT}!g' \
    /etc/apache2/sites-available/*.conf \
    /etc/apache2/apache2.conf \
    /etc/apache2/conf-available/*.conf

# PHP production config
RUN cp "$PHP_INI_DIR/php.ini-production" "$PHP_INI_DIR/php.ini"

COPY docker/php.ini /usr/local/etc/php/conf.d/app.ini

# Copy application from vendor stage
COPY --from=vendor /app /var/www/html
WORKDIR /var/www/html

# Permissions
RUN chown -R www-data:www-data var/ public/

# Build-time env for cache warmup (overridden at runtime)
ENV APP_ENV=prod \
    APP_DEBUG=0

# Entrypoint
COPY docker/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

EXPOSE 80

ENTRYPOINT ["entrypoint.sh"]
CMD ["apache2-foreground"]
