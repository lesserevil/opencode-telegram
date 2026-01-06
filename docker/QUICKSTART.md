# Quick Start Guide

## Setup in 3 Steps

### 1. Configure
```bash
cd docker
cp .env.template .env
nano .env  # Edit with your bot token and user IDs
```

### 2. Build & Start
```bash
./manage.sh build
./manage.sh start
```

### 3. Verify
```bash
./manage.sh status
./manage.sh health
```

## Common Commands

```bash
# View logs
./manage.sh logs

# Restart services
./manage.sh restart

# Stop services
./manage.sh stop

# Get shell access
./manage.sh shell
```

## That's it! 🎉

Your bot is now running with OpenCode server at http://localhost:4000

Send a message to your bot on Telegram to test it!
