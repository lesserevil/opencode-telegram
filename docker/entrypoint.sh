#!/bin/bash
# Startup script for TelegramCoder container
# Ensures both OpenCode server and Telegram bot are running

set -e

echo "🚀 Starting TelegramCoder services..."

# Ensure log directory exists
mkdir -p /app/logs /app/events

# Wait for OpenCode to be ready (if needed)
echo "⏳ Waiting for OpenCode server to initialize..."
sleep 5

# Start supervisor to manage both services
echo "✅ Starting services with Supervisor..."
exec /usr/bin/supervisord -c /etc/supervisor/supervisord.conf
