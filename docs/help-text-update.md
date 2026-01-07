# Help Text Update

## Overview
Updated the help text shown by `/start` and `/help` commands to include all available bot commands. The help message **does not auto-delete** so users can reference it anytime.

## Changes Made

### Auto-Delete Disabled
- Help message remains visible permanently
- Users can reference command list at any time
- No need to repeatedly call `/help` to see commands

### New Commands Added to Help Text:
1. `/sessions` - View recent sessions (last 5)
2. `/projects` - List available projects
3. `/undo` - Revert the last message/change
4. `/redo` - Restore a previously undone change

### Reorganized Structure:

#### 🎯 Session Commands
- `/opencode [title]` - Start new session
- `/rename <title>` - Rename current session
- `/endsession` - End current session
- `/sessions` - View recent sessions
- `/projects` - List available projects

#### ⚡️ Control Commands
- `/esc` - Abort current AI operation
- `/undo` - Revert last message/change
- `/redo` - Restore undone change
- TAB button - Cycle agents
- ESC button - Abort operation

#### 📋 Information Commands
- `/start` - Show help message
- `/help` - Show help message
- `/sessions` - View recent sessions
- `/projects` - List available projects

### Enhanced "How to Use" Section:
Updated workflow to include:
1. Start session
2. Chat directly (no /prompt needed)
3. Use control buttons
4. Rename anytime
5. **Use undo/redo** (NEW)
6. End session

### Updated Tips:
Added new tips:
- "Use /undo if AI makes unwanted changes"
- "Streaming responses limited to last 50 lines"

## Before vs After

### Before:
- Missing `/sessions` and `/projects` commands
- No mention of `/undo` and `/redo`
- Less organized command grouping
- Missing new features in tips

### After:
✅ All commands documented
✅ Clear command categories
✅ Updated workflow includes undo/redo
✅ Tips reflect latest features (50-line limit)
✅ Better organized for readability

## Help Message Structure

```
👋 Welcome to TelegramCoder!

🎯 Session Commands
⚡️ Control Commands  
📋 Information Commands
💬 How to Use (6 steps)
🤖 Agents Available
💡 Tips
🚀 Get started
```

## Benefits
✅ **Complete** - All commands documented
✅ **Organized** - Logical grouping by purpose
✅ **Up-to-date** - Includes latest features
✅ **Clear** - Easy to understand workflow
✅ **Comprehensive** - Tips include new capabilities

## File Modified
- `src/features/opencode/opencode.bot.ts` - Updated `handleStart()` method

## Testing
To verify:
1. Send `/start` or `/help` to the bot
2. Verify all commands are listed
3. Check that new features are mentioned
4. Confirm organization is clear

## Related Documentation
- `docs/undo-redo-commands.md` - Undo/redo implementation
- `docs/message-line-limit.md` - 50-line limit feature
- `docs/sessions-command.md` - Sessions command
- `README.md` - External documentation
