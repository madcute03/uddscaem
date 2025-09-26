# Base PHP with Apache
FROM php:8.2-apache

# Install system dependencies
RUN apt-get update && apt-get install -y \
    git unzip curl libpng-dev libonig-dev libxml2-dev zip nodejs npm && \
    rm -rf /var/lib/apt/lists/*

# Enable Apache mod_rewrite
RUN a2enmod rewrite

# Install PHP extensions
RUN docker-php-ext-install pdo_mysql mbstring exif pcntl bcmath gd

# Set working directory
WORKDIR /var/www/html

# Copy Composer
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# Copy project files
COPY . .

# Install PHP dependencies
RUN composer install --no-dev --optimize-autoloader

# Install Node dependencies and build assets
RUN npm install && npm run build

RUN sed -i 's|DocumentRoot /var/www/html|DocumentRoot /var/www/html/public|' /etc/apache2/sites-available/000-default.conf \
    && sed -i '/<Directory \/var\/www\/>/a \\t<Directory /var/www/html/public/>\n\t\tAllowOverride All\n\t\tRequire all granted\n\t</Directory>' /etc/apache2/sites-available/000-default.conf

# Make entrypoint script executable
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Use entrypoint script to start Apache and run migrations
ENTRYPOINT ["/entrypoint.sh"]

# Fix Laravel permissions
RUN chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache
RUN chmod -R 755 /var/www/html/storage /var/www/html/bootstrap/cache

# Expose Railway's dynamic port (will be replaced by $PORT at runtime)
EXPOSE 8080

# Start Apache, dynamically set to Railway's $PORT
CMD ["bash", "-c", "sed -i 's/80/${PORT}/g' /etc/apache2/ports.conf && apache2ctl -D FOREGROUND"]