#!/bin/bash
set -e

# Set Apache to listen on the port provided by Railway
export APACHE_RUN_USER=www-data
export APACHE_RUN_GROUP=www-data
export APACHE_LOG_DIR=/var/log/apache2
export APACHE_PID_FILE=/var/run/apache2/apache2.pid
export APACHE_RUN_DIR=/var/run/apache2
export APACHE_LOCK_DIR=/var/lock/apache2

# Update Apache ports.conf to use $PORT
sed -i "s/Listen 80/Listen ${PORT}/g" /etc/apache2/ports.conf

# Run Laravel migrations (ignore errors if no DB configured)
php artisan migrate --force || true

# Start Apache in the foreground
apache2-foreground
