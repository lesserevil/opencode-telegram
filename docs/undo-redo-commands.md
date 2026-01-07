# Undo/Redo Commands Implementation

## Overview
Added `/undo` and `/redo` commands to revert and restore changes in OpenCode sessions using the SDK's `session.revert()` and `session.unrevert()` methods.

## Commands

### `/undo`
- **Purpose**: Reverts the last message/change in the current session
- **SDK Method**: `client.session.revert()`
- **Response**: "↩️ Undone - Last message reverted"
- **Error Handling**: Checks if method exists in SDK version, provides helpful error messages

### `/redo`
- **Purpose**: Restores a previously undone change
- **SDK Method**: `client.session.unrevert()`
- **Response**: "↪️ Redone - Change restored"
- **Error Handling**: Checks if method exists in SDK version, provides helpful error messages

## Implementation Details

### Service Layer (`opencode.service.ts`)
```typescript
async undoLastMessage(userId: number): Promise<{ success: boolean; message?: string }> {
    // Validates session exists
    // Checks if SDK method is available
    // Calls client.session.revert()
    // Returns success/failure with message
}

async redoLastMessage(userId: number): Promise<{ success: boolean; message?: string }> {
    // Validates session exists
    // Checks if SDK method is available
    // Calls client.session.unrevert()
    // Returns success/failure with message
}
```

### Bot Layer (`opencode.bot.ts`)
- Registered handlers for `/undo` and `/redo` commands
- Auto-delete confirmation messages after configured timeout
- Error handling with user-friendly messages
- Updated help text to include new commands

## SDK Compatibility
The implementation checks if the methods exist before calling them:
```typescript
if (typeof client.session.revert !== 'function') {
    return { success: false, message: "Undo is not available in this SDK version" };
}
```

This ensures backward compatibility with older SDK versions that may not have these methods.

## User Experience
1. User sends a message to the AI
2. If the AI makes an unwanted change, user can type `/undo`
3. The last message is reverted and session state is restored
4. User can type `/redo` to restore the change if needed
5. Confirmation messages auto-delete after 10 seconds (configurable)

## Help Text Update
Added to the `/start` and `/help` commands:
- "/undo - Revert the last message/change"
- "/redo - Restore a previously undone change"
- Tip: "Use /undo if AI makes unwanted changes"

## Testing
To test:
1. Start a session: `/opencode Test`
2. Send a prompt to the AI
3. Type `/undo` to revert
4. Type `/redo` to restore
5. Verify confirmation messages appear and auto-delete

## Files Modified
- `src/features/opencode/opencode.service.ts` - Added undo/redo methods
- `src/features/opencode/opencode.bot.ts` - Added command handlers and help text
- `docs/undo-redo-commands.md` - This documentation
