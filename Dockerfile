# AM2050 production image for Render: Vite SPA + PHP 8.3 Apache API under one same-origin domain.
FROM node:22-bookworm-slim AS frontend-build
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN corepack enable && pnpm install --frozen-lockfile
COPY client ./client
COPY server ./server
COPY shared ./shared
COPY package.json tsconfig.json tsconfig.node.json vite.config.ts components.json ./
COPY patches ./patches
ARG VITE_AM2050_API_URL=/api/v1
ENV VITE_AM2050_API_URL=${VITE_AM2050_API_URL}
RUN pnpm build

FROM composer:2 AS php-dependencies
WORKDIR /app/backend
COPY backend/composer.json backend/composer.lock* ./
RUN composer install --no-dev --no-interaction --prefer-dist --optimize-autoloader

FROM php:8.3-apache-bookworm
ENV APACHE_DOCUMENT_ROOT=/var/www/html \
    APP_TIMEZONE=Africa/Lagos
RUN apt-get update && apt-get install -y --no-install-recommends \
    libfreetype6-dev libjpeg62-turbo-dev libpng-dev libzip-dev unzip \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install -j"$(nproc)" pdo_mysql zip gd \
    && a2enmod rewrite headers expires \
    && rm -rf /var/lib/apt/lists/*
COPY docker/apache-vhost.conf /etc/apache2/sites-available/000-default.conf
COPY docker/start-apache.sh /usr/local/bin/am2050-start
RUN chmod +x /usr/local/bin/am2050-start
COPY --from=frontend-build /app/dist/public/ /var/www/html/
COPY backend/ /var/www/am2050-api/
COPY --from=php-dependencies /app/backend/vendor/ /var/www/am2050-api/vendor/
RUN chown -R www-data:www-data /var/www/html /var/www/am2050-api
EXPOSE 10000
CMD ["/usr/local/bin/am2050-start"]
