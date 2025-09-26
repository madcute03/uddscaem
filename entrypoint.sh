#!/bin/bash
set -e


# Debug output
echo "[Entrypoint] PORT is set to: $PORT"
if [ -z "$PORT" ]; then
	echo "[Entrypoint] Error: PORT environment variable is not set."
	exit 1
fi

# Set Apache to listen on the port provided by Railway
export APACHE_RUN_USER=www-data
export APACHE_RUN_GROUP=www-data
export APACHE_LOG_DIR=/var/log/apache2
export APACHE_PID_FILE=/var/run/apache2/apache2.pid
export APACHE_RUN_DIR=/var/run/apache2
export APACHE_LOCK_DIR=/var/lock/apache2

# Update Apache ports.conf to use $PORT (replace all Listen lines)
echo "[Entrypoint] Updating /etc/apache2/ports.conf to Listen on $PORT"
sed -i "s/^Listen .*/Listen ${PORT}/g" /etc/apache2/ports.conf
cat /etc/apache2/ports.conf

# Update 000-default.conf to use the correct DocumentRoot and port
echo "[Entrypoint] Updating /etc/apache2/sites-available/000-default.conf to use port $PORT and DocumentRoot /var/www/html/public"
sed -i "s|<VirtualHost .*:.*>|<VirtualHost *:${PORT}>|g" /etc/apache2/sites-available/000-default.conf
sed -i "s|DocumentRoot /var/www/html$|DocumentRoot /var/www/html/public|g" /etc/apache2/sites-available/000-default.conf
if ! grep -q "/var/www/html/public" /etc/apache2/sites-available/000-default.conf; then
	sed -i "/<Directory \/var\/www\/>/a \\t<Directory /var/www/html/public/>\n\t\tAllowOverride All\n\t\tRequire all granted\n\t</Directory>" /etc/apache2/sites-available/000-default.conf
fi
cat /etc/apache2/sites-available/000-default.conf

# Run Laravel migrations (ignore errors if no DB configured)
php artisan migrate --force || true

# Start Apache in the foreground
echo "[Entrypoint] Starting Apache..."
exec apache2-foreground

# Run Laravel migrations (ignore errors if no DB configured)
php artisan migrate --force || true

# Start Apache in the foreground
exec apache2-foreground
