# OpenCode Integration

This document describes the OpenCode AI integration feature for the Telegram bot.

## Overview

The OpenCode integration allows users to interact with an OpenCode AI server through Telegram, enabling AI-powered coding assistance via simple commands.

## Auto-Start Feature 🎉

**NEW:** The bot will automatically start the OpenCode server if it's not running!

When you use `/opencode`:
1. The bot checks if the OpenCode server is available
2. If not, it automatically starts the server in the background using `opencode serve`
3. You'll see status updates in Telegram as the server starts
4. Once ready, your session is created automatically

**Prerequisites:** 
- OpenCode installed globally: `npm install -g opencode-ai`
- This gives you the `opencode` command

## Prerequisites

### Automatic Setup (Recommended)

1. **Install OpenCode globally**:
   ```bash
   npm install -g opencode-ai
   ```

2. **That's it!** The bot will automatically run `opencode serve` when needed

### Manual Setup (Optional)

If you prefer to manage the server yourself:

1. **Start the OpenCode server manually**:
   ```bash
   opencode serve --port 4096 --hostname localhost
   ```

2. **Configure a custom server URL** in your `.env` file (optional):
   ```bash
   # Default (if running locally on port 4096)
   OPENCODE_SERVER_URL=http://localhost:4096
   
   # Or specify a custom URL
   OPENCODE_SERVER_URL=http://192.168.1.100:4096
   ```

### Additional Requirements

- The `@opencode-ai/sdk` package (already included in dependencies)

## Commands

### `/opencode`

Starts a new OpenCode session for the user.

**Usage:**
```
/opencode
```

**Response:**
- Creates a new OpenCode session
- Returns the session ID
- Confirms that the session is ready for use

**Notes:**
- Each user can have one active session at a time
- If a session already exists, the command will notify the user

### `/prompt <message>`

Sends a prompt to your active OpenCode session and receives an AI response.

**Usage:**
```
/prompt <your message or question>
```

**Example:**
```
/prompt Create a function to calculate factorial in JavaScript
```

**Response:**
- Sends the prompt to OpenCode
- Returns the AI-generated response
- Long responses are automatically split into multiple messages

**Notes:**
- You must have an active session (created with `/opencode`) before using this command
- The command requires at least one word after `/prompt`

## Architecture

### Files

- `src/features/opencode/opencode.types.ts` - TypeScript type definitions
- `src/features/opencode/opencode.service.ts` - Service layer for OpenCode API interactions
- `src/features/opencode/opencode.bot.ts` - Bot command handlers

### Service Layer (`OpenCodeService`)

The service layer manages:
- User session creation and tracking
- Communication with the OpenCode server
- Session cleanup and deletion

**Methods:**
- `createSession(userId, title?)` - Creates a new OpenCode session
- `getUserSession(userId)` - Retrieves the active session for a user
- `sendPrompt(userId, text)` - Sends a prompt and returns the response
- `deleteSession(userId)` - Deletes a user's session
- `hasActiveSession(userId)` - Checks if a user has an active session

### Bot Layer (`OpenCodeBot`)

The bot layer handles:
- Command registration with Grammy
- User interaction and feedback
- Error handling and message formatting
- Response chunking for long messages

## Configuration

The OpenCode service can be configured with a custom base URL:

```typescript
const opencodeService = new OpenCodeService("http://your-server:4096");
```

By default, it connects to `http://localhost:4096`.

## Error Handling

The implementation includes comprehensive error handling:
- Missing session detection
- API communication errors
- Invalid prompt detection
- Automatic error message formatting
- Connection failure detection with automatic server startup
- Helpful error messages with suggested solutions

## Troubleshooting

### Auto-Start Issues

**Problem:** The bot tries to start the server but fails.

**Possible Solutions:**

1. **Ensure OpenCode is installed globally:**
   ```bash
   npm install -g opencode-ai
   ```
   Verify with:
   ```bash
   opencode --version
   ```

2. **Check if port 4096 is already in use:**
   ```bash
   netstat -tlnp | grep 4096
   ```
   If another process is using port 4096, either stop it or configure a different port in `.env`.

3. **Manual server start:**
   If auto-start keeps failing, start the server manually:
   ```bash
   opencode serve --port 4096 --hostname localhost
   ```

### "fetch failed" or "Cannot connect to OpenCode server"

**Problem:** The bot cannot reach the OpenCode server and auto-start failed.

**Solutions:**

1. **Try using `/opencode` again** - The server may have started but took longer than 30 seconds

2. **Verify the URL is correct:**
   - Check your `.env` file for `OPENCODE_SERVER_URL`
   - Ensure the port number and hostname are correct
   - If using a remote server, ensure it's accessible from your network

3. **Check firewall settings:**
   If using a remote server, ensure the port is open in your firewall.

4. **Check server logs:**
   If you started the server manually, check its output for errors.

### "No active OpenCode session"

**Problem:** You're trying to use `/prompt` without creating a session first.

**Solution:** Run `/opencode` to create a session before using `/prompt`.

### Session Issues

If you're having persistent session issues:
1. Restart the bot (sessions are in-memory and will be cleared)
2. Use `/opencode` to create a fresh session
3. Check the OpenCode server logs for errors

### Server Won't Stay Running

**Problem:** The server starts but then stops.

**Solutions:**
1. Check system resources (RAM, CPU)
2. Look for error messages in the console
3. Try starting the server manually to see detailed error messages:
   ```bash
   opencode serve --port 4096 --hostname localhost
   ```

## Security

- Access control is enforced via `AccessControlMiddleware`
- Sessions are user-specific (tied to Telegram user ID)
- No session data is shared between users

## Future Enhancements

Potential improvements for future versions:
- Session management commands (list, switch, delete)
- Configuration for custom OpenCode server URLs
- Support for file uploads and attachments
- Session persistence across bot restarts
- Multi-turn conversation support with context
