# Message Line Limit Implementation

## Overview
Modified the `text-part.handler.ts` to limit message edits to the last 50 lines to prevent Telegram message size issues and improve readability.

## Problem
When AI responses are very long (hundreds of lines), editing messages in Telegram can:
- Exceed Telegram's message character limit (4096 chars)
- Cause performance issues with frequent edits
- Make messages difficult to read on mobile devices
- Trigger API rate limits

## Solution
Implemented a 50-line limit that shows only the last 50 lines of streaming AI responses.

## Implementation

### File Modified
`src/features/opencode/event-handlers/message-part-updated/text-part.handler.ts`

### Code Change
```typescript
// Limit to last 50 lines to prevent Telegram message size issues
const lines = text.split('\n');
const limitedText = lines.length > 50 
    ? lines.slice(-50).join('\n')
    : text;

// Store the latest text (formatted as HTML)
latestText = formatAsHtml(limitedText);
```

## Behavior

### Before
- Shows entire AI response, regardless of length
- Can exceed Telegram's 4096 character limit
- May cause editing errors or rate limit issues

### After
- Shows only the last 50 lines of the response
- Ensures messages stay within reasonable size
- Provides a "live tail" view of the AI's streaming output
- Full response still available in OpenCode terminal/UI

## Benefits
✅ **Prevents Errors** - Avoids exceeding Telegram's message size limit
✅ **Better UX** - Shows the most recent/relevant output
✅ **Performance** - Reduces message edit size and frequency
✅ **Mobile-Friendly** - Keeps messages readable on small screens
✅ **Rate Limit Safe** - Smaller edits reduce API call load

## Technical Details

### Line Counting
- Uses `text.split('\n')` to count lines
- Applies limit before HTML formatting
- Uses `slice(-50)` to get last 50 lines efficiently

### Edge Cases Handled
- If message has ≤50 lines: Shows entire message
- If message has >50 lines: Shows only last 50
- Empty messages: Handled by existing code
- Very long lines: Still limited by Telegram's 4096 char limit

## Testing
To test:
1. Start a session: `/opencode Test`
2. Send a prompt that generates a long response (>50 lines)
3. Observe that only the last 50 lines are shown
4. Message updates smoothly without errors

Example prompt for testing:
```
Create a file with 100 lines of code
```

## Future Enhancements
Possible improvements:
- Make line limit configurable (environment variable)
- Add line count indicator (e.g., "Showing last 50 of 150 lines")
- Provide command to show full output
- Smart truncation (preserve code blocks, etc.)

## Related Files
- `src/features/opencode/event-handlers/message-part-updated/text-part.handler.ts` - Main implementation
- `src/features/opencode/event-handlers/utils.ts` - HTML formatting utilities
