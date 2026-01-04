# OpenCode Auto-Start Implementation Summary

## Overview

Implemented automatic OpenCode server spawning when the server is not available, eliminating the need for manual server setup.

## Changes Made

### 1. New Service: OpenCodeServerService
**File:** `src/services/opencode-server.service.ts`

A new service that manages the OpenCode server lifecycle:

- **`isServerRunning()`** - Checks if the server is accessible via HTTP
- **`isOpenCodeInstalled()`** - Verifies `opencode` command is available
- **`startServer()`** - Spawns the OpenCode server process using `opencode serve`
- **`stopServer()`** - Stops the server process if needed

**Key Features:**
- Uses `spawn()` with detached mode so the server runs independently
- Extracts port and hostname from configured URL
- Waits up to 30 seconds for server to start
- Returns detailed success/failure messages

**Command Used:**
```bash
opencode serve --port <port> --hostname <hostname>
```

### 2. Updated OpenCodeBot Handler
**File:** `src/features/opencode/opencode.bot.ts`

Enhanced the `/opencode` command handler to:

1. **Try to create a session** first
2. **Detect connection failures** (when server is not running)
3. **Automatically start the server** if connection fails
4. **Show progress updates** to the user:
   - "OpenCode server not running. Starting server..."
   - "OpenCode server started!"
   - "Creating session..."
5. **Retry session creation** after server starts
6. **Provide clear error messages** if auto-start fails

**User Experience:**
- Seamless: User just types `/opencode` and everything happens automatically
- Transparent: User sees status updates during the process
- Helpful: Clear error messages if something goes wrong

### 3. Updated Documentation

#### README.md
- Added "Auto-Start Feature" section
- Updated example usage to show auto-start flow
- Added 🚀 Auto-Start to features list
- Updated example to show the full auto-start process

#### docs/opencode-integration.md
- Rewrote Prerequisites section to emphasize auto-start
- Added "Auto-Start Feature" section at the top
- Updated troubleshooting with auto-start specific issues
- Clarified that manual setup is now optional

## User Flow

### Before (Manual Setup Required):
1. User installs OpenCode: `npm install -g opencode-ai`
2. User starts server: `opencode serve`
3. User goes to Telegram and types `/opencode`
4. Session created

### After (Auto-Start):
1. User installs OpenCode: `npm install -g opencode-ai`
2. User types `/opencode` in Telegram
3. Bot detects no server → starts it automatically
4. User sees: "Starting server... (30s)"
5. User sees: "Server started! Creating session..."
6. Session created ✅

## Technical Details

### Process Management
- Server spawned as detached process (`detached: true`)
- Process unref'd so parent can exit independently
- Uses `stdio: 'ignore'` to prevent output buffering issues

### Error Handling
- Detects connection failures via error message inspection
- Provides context-specific error messages
- Graceful fallback with manual start instructions

### Startup Verification
- Polls server every 1 second for up to 30 seconds
- Uses HTTP HEAD request to check availability
- Returns success only when server responds

## Benefits

1. **Simple Setup** - Just `npm install -g opencode-ai` and you're ready
2. **Better UX** - Seamless experience, no manual server management
3. **Clear Feedback** - Users see exactly what's happening
4. **Resilient** - Handles failures gracefully with helpful messages
5. **Optional Manual Control** - Users can still manage server manually if desired

## Testing Recommendations

1. **Test auto-start from scratch:**
   - Ensure no OpenCode server running
   - Type `/opencode`
   - Verify server starts and session created

2. **Test with server already running:**
   - Start server manually: `opencode serve`
   - Type `/opencode`
   - Verify no duplicate server starts

3. **Test failure scenarios:**
   - Uninstall opencode-ai temporarily
   - Block port 4096
   - Verify error messages are helpful

4. **Test retry logic:**
   - Start and immediately stop server
   - Type `/opencode` twice quickly
   - Verify proper handling

## Future Enhancements

Possible improvements:
- Server health monitoring and auto-restart
- Configurable startup timeout
- Server logs access via bot command
- Multiple server instances support
- Custom OpenCode configuration options
