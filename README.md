# telegramCoder - AI-Powered Telegram Terminal Bot

[![npm version](https://badge.fury.io/js/@tommertom%2Ftelegramcoder.svg)](https://www.npmjs.com/package/@tommertom/telegramcoder)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**An AI-powered Telegram bot providing interactive terminal sessions with support for GitHub Copilot, Claude, Cursor, and other CLI-based AI coding assistants.**

Control your development environment through Telegram with full terminal access, file management, and AI coding assistant integration. Self-hosted and secure.

## ✨ Features

- 💻 **Interactive Terminal** - Full terminal sessions via Telegram
- 🤖 **AI Assistant Integration** - Works with GitHub Copilot, Claude, Cursor, and more
- 🧠 **OpenCode Integration** - Direct access to OpenCode AI for coding assistance
- 📱 **Mobile-First** - Code from anywhere using your phone
- 🏠 **Self-Hosted** - Runs on YOUR machine, under YOUR control
- 📁 **File Management** - Upload, download, and manage files remotely
- 🔒 **Private & Secure** - Your code stays on your machine
- ⚡ **Real-time** - Instant terminal feedback and interaction



## Using telegramCoder

Once your bot is running and configured:

1. **Open Telegram** and find your bot
2. **Send /start** to see available commands
3. **Use /opencode** to start an AI coding session
4. **Send prompts** with /prompt to interact with OpenCode AI

### 🧠 OpenCode AI Integration

The bot includes built-in integration with OpenCode AI for intelligent coding assistance.

**Auto-Start Feature:**
- The bot automatically starts the OpenCode server if it's not running
- Simply install OpenCode globally: `npm install -g opencode-ai`
- Then use `/opencode` - the bot handles the rest!

**Commands:**
- `/start` or `/help` - Show help message with available commands
- `/opencode` - Start a new OpenCode AI session (auto-starts server if needed)
- `/prompt <message>` - Send a prompt to your active OpenCode session

**Example Usage:**
```
You: /opencode

Bot: 🔄 OpenCode server not running. Starting server...
     This may take up to 30 seconds.
     
     ✅ OpenCode server started!
     
     🔄 Creating session...
     
     ✅ OpenCode session started!
     Session ID: abc123...
     
     Use /prompt <your message> to send prompts to OpenCode.

You: /prompt Create a function to calculate factorial in JavaScript

Bot: 📝 OpenCode Response:

     Here's a factorial function in JavaScript:
     
     function factorial(n) {
       if (n <= 1) return 1;
       return n * factorial(n - 1);
     }
     
     This uses recursion to calculate the factorial...
```

**Features:**
- 🚀 **Auto-Start** - Server starts automatically when needed
- 💬 **Session Management** - Each user has their own isolated session
- 🔄 **Persistent Conversations** - Continue your coding discussion across multiple prompts
- 📦 **Long Response Handling** - Automatically splits long responses for Telegram
- 🔐 **Secure** - Sessions are user-specific and private

**Setup:**
```bash
npm install -g opencode-ai
```

For more details, see [OpenCode Integration Documentation](docs/opencode-integration.md).


## Quick Installation

Choose the installation method that works best for you:

| Method | Best For | Command |
|--------|----------|---------|
| **npx** | Quick testing, temporary use | `npx @tommertom/telegramcoder@latest` |
| **Global Install** | Regular use, permanent installation | `npm install -g @tommertom/telegramcoder` |
| **Docker** | Isolation, Windows, production | `npx @tommertom/telegramcoder@latest --docker` |

### Method 1: Run with npx (Easiest - No Installation)

Perfect for trying out telegramCoder or if you don't want to install anything permanently:

```bash
npx @tommertom/telegramcoder@latest
```

**First Run:** The bot will create a `.env` file automatically and exit with instructions:

```
⚠️  No .env file found in current directory!

📝 Creating .env template...

✅ Created .env file from template

🔧 Please edit .env and configure:
   - TELEGRAM_BOT_TOKENS (required)
   - ALLOWED_USER_IDS (required)

Then run the command again.
```

**Edit the configuration:**

```bash
# Open the .env file that was created
nano .env
```

**Run again to start the bot:**

```bash
npx @tommertom/telegramcoder@latest
```

### Method 2: Install Globally

Install once and run anytime:

```bash
# Install
npm install -g @tommertom/telegramcoder

# Run (creates .env on first run)
telegramcoder
```

**First Run:** Same as npx - creates `.env` file automatically:
1. Bot creates `.env` file and exits
2. You edit `.env` with your tokens
3. Run `telegramcoder` again to start

## 🚩 CLI Flags

telegramCoder supports command-line flags to modify its behavior:

### `--docker` Flag

**Purpose:** Generates Docker configuration files in your current directory.

**Usage:**
```bash
npx @tommertom/telegramcoder@latest --docker
```

**What it does:**
1. Creates a production-ready `Dockerfile` in your current directory
2. Creates a `docker-compose.yml` configured for the bot
3. Prompts you before overwriting any existing files
4. Exits after file generation (does not start the bot)

**Example output:**
```
🤖 telegramCoder - AI-Powered Telegram Terminal Bot
================================================

🐳 Docker Setup Mode

✅ Created Dockerfile at /your/project/Dockerfile
✅ Created docker-compose.yml at /your/project/docker-compose.yml

✅ Docker setup complete!

📝 Next steps:
   1. Create a .env file with your configuration
   2. Run: docker-compose up -d
   3. View logs: docker-compose logs -f
```

**If files already exist:**
```
⚠️  Dockerfile already exists. Overwrite? (y/N): n
❌ Skipping Dockerfile creation.
⚠️  docker-compose.yml already exists. Overwrite? (y/N): yes
✅ Created docker-compose.yml at /your/project/docker-compose.yml
```

**When to use:**
- Setting up telegramCoder with Docker for the first time
- Updating Docker configurations to latest recommended settings
- Getting production-ready Docker files without manual copying

**Note:** You can respond with `y`, `yes`, `n`, or `no` (case-insensitive) to the overwrite prompts.

### Method 3: Docker (Most Isolated)

Run in a container with all dependencies included. Docker is perfect for:
- **Isolation**: Keeps the bot separate from your system
- **Consistency**: Same environment on any machine
- **Easy Updates**: Pull latest version with one command
- **Windows Users**: Best option for Windows compatibility

#### Option A: Quick Setup with --docker flag (Recommended)

The easiest way to get started with Docker:

**Step 1: Generate Docker files**
```bash
# Creates Dockerfile and docker-compose.yml in current directory
npx @tommertom/telegramcoder@latest --docker
```

**What happens:**
- ✅ Production-tested `Dockerfile` is created
- ✅ Pre-configured `docker-compose.yml` is created  
- ✅ You're prompted before overwriting existing files
- ✅ Clear next steps are displayed

**Step 2: Create your configuration**

Create a `.env` file (see Configuration section below) or use the quick method:

```bash
cat > .env << 'EOF'
TELEGRAM_BOT_TOKENS=your_bot_token_here
ALLOWED_USER_IDS=your_telegram_user_id
ADMIN_USER_ID=your_telegram_user_id
MESSAGE_DELETE_TIMEOUT=10000
EOF
```

**Step 3: Start the bot**
```bash
docker-compose up -d      # Start in background
docker-compose logs -f    # View logs (Ctrl+C to exit)
```

**That's it!** Your bot is now running in Docker.

**Managing your Docker bot:**
```bash
docker-compose stop       # Stop the bot
docker-compose start      # Start the bot
docker-compose restart    # Restart the bot
docker-compose down       # Stop and remove container
docker-compose logs -f    # View live logs
```

#### Option B: Manual Docker Setup

**Create `.env` file:**

```bash
cat > .env << 'EOF'
TELEGRAM_BOT_TOKENS=your_bot_token_here
ALLOWED_USER_IDS=your_telegram_user_id
ADMIN_USER_ID=your_telegram_user_id
MESSAGE_DELETE_TIMEOUT=10000
EOF
```

## Configuration

telegramCoder needs a few settings to work. These are stored in a `.env` file that's **created automatically on first run**.

### Automatic .env Creation

When you run telegramCoder for the first time:

1. **Bot detects no .env file** and creates one from the template
2. **Bot exits** with a message telling you to edit it
3. **You edit .env** with your bot token and user ID
4. **You run the bot again** - it starts normally

### Required Settings

The `.env` file contains these settings:

Edit the `.env` file with your configuration:

```bash
# Your Telegram bot token from @BotFather
# Get one by messaging @BotFather on Telegram and creating a new bot
TELEGRAM_BOT_TOKENS=1234567890:ABCdefGHIjklMNOpqrsTUVwxyz

# Your Telegram user ID (the bot will tell you this when you first message it)
# Only users in this list can use the bot
ALLOWED_USER_IDS=123456789

# Admin user ID - receives notifications about unauthorized access
ADMIN_USER_ID=123456789

# How long confirmation messages stay visible (in milliseconds)
# 10000 = 10 seconds, set to 0 to keep messages
MESSAGE_DELETE_TIMEOUT=10000
```

### Finding Your Telegram User ID

1. Start the bot (even before configuring ALLOWED_USER_IDS)
2. Send any message to your bot
3. The bot will reply with your User ID
4. Add that ID to `ALLOWED_USER_IDS` in `.env`
5. Restart the bot

### Multiple Users

You can allow multiple people to use your bot:

```bash
# Separate multiple user IDs with commas (no spaces)
ALLOWED_USER_IDS=123456789,987654321,555666777
```

### Multiple Bots

Run multiple bot instances with different tokens:

```bash
# Separate tokens with commas (no spaces)
TELEGRAM_BOT_TOKENS=token1,token2,token3
```

## System Requirements

- **Operating System**: Linux or macOS (Windows supported via WSL or Docker)
- **Node.js**: Version 18 or higher
- **Disk Space**: ~200MB for dependencies

**Note:** Docker installation includes all dependencies automatically.

## Troubleshooting

### First Run - .env File

**Issue**: Bot creates .env and exits immediately

**This is normal!** On first run:
1. Bot creates `.env` file automatically
2. Bot shows you what to configure
3. Bot exits so you can edit the file
4. Edit `.env` with your bot token and user ID
5. Run the bot again

### Bot Not Responding

1. Check the bot is running (check console output or Docker logs)
2. Verify your User ID is in `ALLOWED_USER_IDS`
3. Make sure `TELEGRAM_BOT_TOKENS` is correct
4. Restart the bot

### Terminal Not Responding

1. Check the terminal session is active
2. Verify commands are being sent correctly
3. Check for any error messages in bot logs
4. Restart the terminal session

### File Upload/Download Issues

1. Check bot console/logs for errors
2. Verify file permissions
3. Check available disk space
4. Ensure file sizes are within Telegram limits

## Privacy & Security

- **Self-Hosted & You're In Control**: Runs on YOUR machine - not someone else's cloud
- **Private Bot**: Only users you authorize can use it
- **Local Execution**: All commands run on your machine, no third-party services
- **Your Code Stays Yours**: Full control over your development environment
- **Access Control**: Unauthorized users are blocked automatically
- **Secure Sessions**: Each user gets isolated terminal sessions
- **Run Anywhere**: Deploy on any machine you control

**Admin Notifications**: The admin user receives alerts if unauthorized users try to access the bot.

## Technical Details

- **Runtime**: Node.js with TypeScript
- **Bot Framework**: Grammy (Telegram Bot API)
- **Terminal**: node-pty for full PTY support
- **AI Integration**: Compatible with GitHub Copilot CLI, Claude, Cursor
- **Multi-Bot Support**: Run multiple bot instances from one installation

## FAQ

**Q: The bot exits immediately after I run it. What's wrong?**  
A: Nothing! On first run, the bot creates a `.env` file and exits so you can configure it. Edit the `.env` file with your bot token and user ID, then run the bot again.

**Q: Where does the bot run?**  
A: On YOUR machine - anywhere you want! Your laptop, home server, or cloud VPS. You have complete control.

**Q: Do I need to trust a third-party service?**  
A: No! The bot runs on your own machine. Only Telegram is used for messaging.

**Q: Can I use GitHub Copilot with this?**  
A: Yes! The bot provides full terminal access, so you can run `gh copilot` and other CLI tools.

**Q: Are terminal sessions persistent?**  
A: Sessions are maintained while the bot is running. They reset if the bot restarts.

**Q: Can multiple people use the same bot?**  
A: Yes! Add multiple user IDs to `ALLOWED_USER_IDS`. Each user gets isolated sessions.

**Q: Can I run this on a Raspberry Pi?**  
A: Yes, as long as it runs Node.js 18+ and has enough storage.

**Q: What happens if my machine goes offline?**  
A: The bot stops working until you bring it back online. That's the trade-off for self-hosting and complete control.

---

**⚠️ Legal Disclaimer**: This software is provided "as is" without warranty. The author is not responsible for any misuse. Users are solely responsible for ensuring proper security and access controls.

**💻 Code from anywhere with telegramCoder!**
