# Agent Cycling Manual Test

## Purpose
Test the Tab keyboard functionality to ensure:
1. Agent cycling works correctly
2. The current agent name is displayed (not "unknown")
3. Internal agents (compaction, title, summary) are not shown in the available agents list

## Prerequisites
- TelegramCoder bot is running
- Connected to OpenCode server
- Active Telegram chat session with the bot

## Test Steps

### 1. Initial Agent Check
1. Start a conversation with the bot (if not already started)
2. Send a message to ensure a session is created
3. Expected: Session should be created successfully

### 2. Test Agent Cycling
1. Press the Tab key in the Telegram chat
2. **Expected Result:**
   - Message: `⇥ Switched to agent: <agent_name>`
   - Where `<agent_name>` is one of: `build`, `plan`, `explore`, `general` (NOT "unknown")
   - Available agents list should show only primary agents
   - Should NOT show: `compaction`, `title`, `summary`

3. Press Tab again
4. **Expected Result:**
   - Should cycle to the next available agent
   - Agent name should be different from the previous one

5. Continue pressing Tab to cycle through all agents
6. **Expected Result:**
   - Should cycle through all primary agents in order
   - After the last agent, should wrap around to the first agent

### 3. Verify Available Agents List
When you press Tab, the response should show:

```
⇥ Switched to agent: build

Available primary agents:
• build: <description>
• plan: <description>
• explore: <description>
• general: <description>
```

**Should NOT include:**
- ❌ compaction
- ❌ title
- ❌ summary

## Bugs Fixed

### Bug #1: Always showing "unknown" agent
**Problem:** After pressing Tab, the message always showed:
```
⇥ Switched to agent: unknown
```

**Root Cause:** The `cycleToNextAgent` method was trying to get the current agent from the last user message's `agent` field, but that field contains the OLD agent (before cycling), not the new one.

**Fix:** Changed to use the command response from `agent.cycle`, which returns an `AssistantMessage` with a `mode` field containing the newly switched agent name.

**Code Change in `opencode.service.ts`:**
```typescript
// OLD CODE (incorrect):
await client.session.command({ ... }); // didn't capture response
// Then tried to get agent from old messages

// NEW CODE (correct):
const commandResult = await client.session.command({ ... });
let currentAgent = "unknown";
if (commandResult.data?.info?.mode) {
    currentAgent = commandResult.data.info.mode;
}
return { success: true, currentAgent };
```

### Bug #2: Internal agents showing in available agents list
**Problem:** The available agents list was showing internal system agents:
```
Available primary agents:
• build
• plan
• compaction  ← Should NOT appear
• title       ← Should NOT appear
• summary     ← Should NOT appear
```

**Root Cause:** The filtering logic was correct, but needed to be more explicit and include debug logging to verify it's working.

**Fix:** Enhanced the filter with:
1. Explicit internal agents list: `['compaction', 'title', 'summary']`
2. Clear filtering logic that checks agent name against the internal list
3. Added debug logging to verify which agents are being filtered

**Code Change in `opencode.service.ts`:**
```typescript
const internalAgents = ['compaction', 'title', 'summary'];

const filtered = result.data
    .filter((agent: any) => {
        // Exclude internal utility agents
        if (internalAgents.includes(agent.name)) {
            console.log(`Filtering out internal agent: ${agent.name}`);
            return false;
        }
        // Only include primary agents or agents available to all contexts
        return agent.mode === "primary" || agent.mode === "all";
    })
    .map((agent: any) => ({ ... }));
```

## Notes
- The debug logging added in `getAvailableAgents()` can be removed after verifying the fix works correctly
- Internal agents (compaction, title, summary) are used by OpenCode internally for system tasks and should not be directly selectable by users
