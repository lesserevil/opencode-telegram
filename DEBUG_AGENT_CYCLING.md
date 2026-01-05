# Debugging Agent Cycling Issue

## Current Status
The Tab key still shows "unknown" agent after the fix. We need to debug the actual OpenCode API response.

## Steps to Debug

### Option 1: Run the Test Script
This will directly test the OpenCode API and show us the exact response structure:

```bash
# Make sure OpenCode server is running
# Then run:
cd /home/tom/telegramCoder
node scripts/test-agent-cycle.mjs
```

This will:
1. Create a test session
2. Send agent.cycle command
3. Print the full response structure
4. Check messages for agent info
5. Clean up

### Option 2: Test with Telegram Bot
1. Start the bot: `npm start`
2. In Telegram, press Tab key
3. Check the console logs - look for:
   ```
   === AGENT.CYCLE RESPONSE DEBUG ===
   commandResult.data: { ... }
   ```
4. Share the full JSON output

### Option 3: Manual API Test
Use curl to test directly:

```bash
# 1. Create a session
SESSION_RESPONSE=$(curl -s -X POST http://localhost:4096/session \
  -H "Content-Type: application/json" \
  -d '{"title": "Test Session"}')

SESSION_ID=$(echo $SESSION_RESPONSE | jq -r '.id')
echo "Session ID: $SESSION_ID"

# 2. Send agent.cycle command
curl -s -X POST "http://localhost:4096/session/$SESSION_ID/command" \
  -H "Content-Type: application/json" \
  -d '{"command": "agent.cycle", "arguments": ""}' | jq '.'

# 3. Get messages
curl -s "http://localhost:4096/session/$SESSION_ID/message" | jq '.'

# 4. Clean up
curl -s -X DELETE "http://localhost:4096/session/$SESSION_ID"
```

## What We're Looking For

The response should contain the agent name in one of these places:

1. **In `parts` array** (most likely):
   ```json
   {
     "data": {
       "parts": [
         {
           "type": "agent",
           "name": "build"  // ← This!
         }
       ]
     }
   }
   ```

2. **In `info.mode`**:
   ```json
   {
     "data": {
       "info": {
         "mode": "build"  // ← Or this!
       }
     }
   }
   ```

3. **In messages** (fallback):
   ```json
   {
     "role": "assistant",
     "mode": "build"  // ← Or this!
   }
   ```

## Possible Issues

If none of the above work, it could be:

1. **agent.cycle doesn't return agent info** - Maybe we need to:
   - Query session status after cycling
   - Query config after cycling
   - Use a different command

2. **Agent info is in a different field** - The response structure might be different than expected

3. **Command doesn't actually cycle** - Maybe agent.cycle doesn't work as expected?

## Alternative Approaches to Try

If agent.cycle doesn't return the agent name, we could:

### A. Query messages after every cycle
```typescript
// After agent.cycle
const messages = await client.session.messages({ path: { id: sessionId } });
const lastAssistant = messages.data.filter(m => m.role === "assistant").pop();
const agent = lastAssistant?.mode;
```

### B. Maintain state locally
```typescript
// Keep track of agents locally and cycle through them
const agents = ["build", "plan", "explore", "general"];
let currentIndex = 0;

function cycleAgent() {
    currentIndex = (currentIndex + 1) % agents.length;
    return agents[currentIndex];
}
```

### C. Use agent.set command instead
Maybe there's an `agent.set` command we should use?

```bash
# Check available commands
curl -s http://localhost:4096/command | jq '.'
```

## Next Steps

1. Run one of the debug methods above
2. Share the output
3. Based on the actual response structure, we'll update the code
