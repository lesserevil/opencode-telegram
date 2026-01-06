# TelegramCoder - Telegram Bot with OpenCode Server
# Runs both the bot and OpenCode server in the same container

FROM node:22-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    ca-certificates \
    git \
    supervisor \
    && rm -rf /var/lib/apt/lists/*

# Install OpenCode CLI globally
RUN npm install -g @opencode-ai/cli

# Create app directory and necessary folders
RUN mkdir -p /app /app/logs /app/events /workspace && \
    chown -R node:node /app /workspace

WORKDIR /app

# Copy package files
COPY --chown=node:node package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application files
COPY --chown=node:node . .

# Copy and make entrypoint script executable
COPY --chown=node:node docker/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

# Build the application
RUN npm run build:prod

# Create supervisor configuration
RUN echo '[supervisord]' > /etc/supervisor/conf.d/services.conf && \
    echo 'nodaemon=true' >> /etc/supervisor/conf.d/services.conf && \
    echo 'user=root' >> /etc/supervisor/conf.d/services.conf && \
    echo '' >> /etc/supervisor/conf.d/services.conf && \
    echo '[program:opencode]' >> /etc/supervisor/conf.d/services.conf && \
    echo 'command=opencode serve --workspace /workspace' >> /etc/supervisor/conf.d/services.conf && \
    echo 'user=node' >> /etc/supervisor/conf.d/services.conf && \
    echo 'autostart=true' >> /etc/supervisor/conf.d/services.conf && \
    echo 'autorestart=true' >> /etc/supervisor/conf.d/services.conf && \
    echo 'stdout_logfile=/app/logs/opencode.log' >> /etc/supervisor/conf.d/services.conf && \
    echo 'stderr_logfile=/app/logs/opencode.error.log' >> /etc/supervisor/conf.d/services.conf && \
    echo '' >> /etc/supervisor/conf.d/services.conf && \
    echo '[program:telegrambot]' >> /etc/supervisor/conf.d/services.conf && \
    echo 'command=node /app/dist/app.js' >> /etc/supervisor/conf.d/services.conf && \
    echo 'user=node' >> /etc/supervisor/conf.d/services.conf && \
    echo 'directory=/app' >> /etc/supervisor/conf.d/services.conf && \
    echo 'autostart=true' >> /etc/supervisor/conf.d/services.conf && \
    echo 'autorestart=true' >> /etc/supervisor/conf.d/services.conf && \
    echo 'stdout_logfile=/app/logs/bot.log' >> /etc/supervisor/conf.d/services.conf && \
    echo 'stderr_logfile=/app/logs/bot.error.log' >> /etc/supervisor/conf.d/services.conf

# Environment variables
ENV NODE_ENV=production

# Expose OpenCode server port (default 4000)
EXPOSE 4000

# Health check - verify both services are running
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:4000/health || exit 1

# Start supervisor to manage both processes
ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
