# Message Part Handler Fix

## Problem 1: Multiple Messages Per Session
The `message.part.updated` handler was sending multiple messages instead of updating a single message. This happened because the handler stored message IDs per session (`sessionId-chatId` key), meaning each new session would create a new message instead of reusing the existing one.

## Problem 2: Rate Limiting (429 Errors)
After fixing Problem 1, a second issue emerged: the handler was creating multiple messages during a single prompt. This was caused by Telegram's rate limiting:
- Handler tried to update too frequently (every part update)
- Telegram rejected edits with 429 "Too Many Requests"
- The error handler created a "fallback message" instead of skipping
- This created new messages constantly during fast updates

## Root Cause
```typescript
// OLD: Session-dependent storage
const sessionState = new Map<string, { ... }>();
const sessionKey = `${userSession.sessionId}-${chatId}`;
```

When a user had multiple sessions or switched sessions, the handler would create a new message for each session instead of reusing one message per chat.

## Solution 1: Handler-Unique Storage
Changed to **handler-unique storage** keyed only by `chatId`, independent of which session is active:

```typescript
// NEW: Handler-unique storage (chat-level only)
const handlerState = new Map<number, { ... }>();
// Key is just chatId, not sessionId-chatId
```

## Solution 2: Debouncing + Rate Limit Protection
Implemented three layers of protection:

### 1. Update Debouncing (500ms)
- Store pending text instead of sending immediately
- Wait 500ms for more updates to arrive
- Batch rapid updates together
- Only send the final text after 500ms of silence

### 2. Minimum Time Between Updates (1000ms)
- Track `lastTextUpdate` timestamp
- Enforce minimum 1 second between actual API calls
- Skip updates that come too soon

### 3. Smart Error Handling
- Detect 429 rate limit errors specifically
- Skip update on 429 instead of creating fallback message
- Only create fallback message for real errors (deleted message, etc.)
- Keep messageId after deletion to allow graceful retry

```typescript
// Check error type before creating fallback
if (err.error_code === 429) {
    console.log("Rate limited, skipping update");
    return; // Don't create new message
}
// Only create fallback for non-rate-limit errors
```

## Behavior Changes

### Before Fix
- User starts session A → Message 1 created
- User starts session B → Message 2 created (duplicate)
- Updates appear in multiple messages

### After Fix
- User starts session A → Message 1 created
- User starts session B → Message 1 updated (reused)
- All updates appear in single message per chat

## Implementation Details

**File**: `src/features/opencode/event-handlers/message.part.updated.handler.ts`

**Key Changes**:
1. Renamed `sessionState` → `handlerState` for clarity
2. Changed map key from `string` (sessionId-chatId) to `number` (chatId only)
3. Removed `sessionKey` construction - now uses `chatId` directly
4. Updated all log messages to reference "chat" instead of "session"

**Storage Structure**:
```typescript
Map<chatId, {
    messageId: number | null;            // Last sent message to update
    deleteTimer: NodeJS.Timeout | null;  // Timeout to auto-delete
    lastReasoningTime: number;           // Debounce reasoning messages
    lastTextUpdate: number;              // Track last update time (rate limit)
    pendingText: string | null;          // Pending text to send (debouncing)
    updateTimer: NodeJS.Timeout | null;  // Debounce timer for updates
}>
```

## Benefits
1. ✅ **Single message per chat** - No duplicate messages across sessions
2. ✅ **Handler-unique state** - Independent of session lifecycle
3. ✅ **Cleaner UX** - Users see one updating message, not multiple
4. ✅ **Rate limit protection** - Prevents 429 errors and message spam
5. ✅ **Batched updates** - Groups rapid updates together (500ms debounce)
6. ✅ **Lower API calls** - Minimum 1 second between actual updates
7. ✅ **Graceful degradation** - Skips updates when rate limited instead of creating spam

## Testing
Verify the fix by:
1. Start a session with `/opencode`
2. Send a prompt that triggers part updates
3. Observe that only ONE message is created and updated
4. Start a new session with `/opencode new session`
5. Send another prompt
6. Verify the SAME message is updated (not a new one)

## Technical Details

### Update Flow
1. **Part update arrives** → Store in `pendingText`
2. **Start 500ms timer** → Clear previous timer if exists
3. **Timer fires** → Check if 1000ms passed since last update
4. **If too soon** → Skip to avoid rate limit
5. **If ready** → Send/update message
6. **On 429 error** → Skip gracefully, don't create new message
7. **On other errors** → Create fallback message only if needed

### Timing Strategy
- **500ms debounce**: Batches rapid typing/thinking updates
- **1000ms minimum**: Respects Telegram's rate limits (30 msgs/sec per chat)
- **10 second auto-delete**: Cleans up after response completes

## Deployment
- Built: 2026-01-05 (Initial fix)
- Deployed: pm2 restart telegramCoder (restart #26)
- Updated: 2026-01-05 (Rate limit protection)
- Deployed: pm2 restart telegramCoder (restart #27)
- Status: ✅ Online and working
