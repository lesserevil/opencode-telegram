#!/bin/bash
# Helper script for managing TelegramCoder Docker container

set -e

cd "$(dirname "$0")"

case "$1" in
  build)
    echo "🔨 Building Docker image..."
    docker-compose build
    ;;
  
  start)
    echo "🚀 Starting services..."
    docker-compose up -d
    echo "✅ Services started!"
    echo "📊 Check status: ./manage.sh status"
    echo "📋 View logs: ./manage.sh logs"
    ;;
  
  stop)
    echo "🛑 Stopping services..."
    docker-compose down
    echo "✅ Services stopped!"
    ;;
  
  restart)
    echo "🔄 Restarting services..."
    docker-compose restart
    echo "✅ Services restarted!"
    ;;
  
  logs)
    echo "📋 Viewing logs (Ctrl+C to exit)..."
    docker-compose logs -f
    ;;
  
  logs-bot)
    echo "📋 Viewing bot logs (Ctrl+C to exit)..."
    docker-compose logs -f telegramcoder | grep bot
    ;;
  
  logs-opencode)
    echo "📋 Viewing OpenCode logs (Ctrl+C to exit)..."
    docker-compose logs -f telegramcoder | grep opencode
    ;;
  
  status)
    echo "📊 Service status:"
    docker-compose ps
    echo ""
    echo "📊 Supervisor status:"
    docker-compose exec telegramcoder supervisorctl status 2>/dev/null || echo "Container not running"
    ;;
  
  shell)
    echo "🐚 Opening shell in container..."
    docker-compose exec telegramcoder bash
    ;;
  
  health)
    echo "🏥 Checking health..."
    echo "OpenCode server:"
    curl -f http://localhost:4000/health && echo " ✅" || echo " ❌"
    echo ""
    echo "Container status:"
    docker-compose ps
    ;;
  
  rebuild)
    echo "🔨 Rebuilding and restarting..."
    docker-compose down
    docker-compose build --no-cache
    docker-compose up -d
    echo "✅ Rebuild complete!"
    ;;
  
  clean)
    echo "🧹 Cleaning up..."
    docker-compose down -v
    echo "✅ Cleanup complete!"
    ;;
  
  *)
    echo "TelegramCoder Docker Manager"
    echo ""
    echo "Usage: ./manage.sh [command]"
    echo ""
    echo "Commands:"
    echo "  build          - Build Docker image"
    echo "  start          - Start services"
    echo "  stop           - Stop services"
    echo "  restart        - Restart services"
    echo "  logs           - View all logs"
    echo "  logs-bot       - View bot logs only"
    echo "  logs-opencode  - View OpenCode logs only"
    echo "  status         - Show service status"
    echo "  shell          - Open shell in container"
    echo "  health         - Check service health"
    echo "  rebuild        - Rebuild image and restart"
    echo "  clean          - Stop and remove volumes"
    echo ""
    echo "Examples:"
    echo "  ./manage.sh build"
    echo "  ./manage.sh start"
    echo "  ./manage.sh logs"
    ;;
esac
