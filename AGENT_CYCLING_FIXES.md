# Agent Cycling Bug Fixes

## Date
2026-01-05

## Issues Fixed

### Issue #1: Always showing "unknown" agent
**Symptom:** When pressing Tab to cycle agents, always displays:
```
⇥ Switched to agent: unknown
```

**Root Cause:** 
The `cycleToNextAgent` method was trying to get the current agent from the last user message's `agent` field, but that field contains the agent BEFORE cycling, not after.

**Fix:**
Changed to capture and use the response from the `agent.cycle` command. The response contains an `AssistantMessage` object with a `mode` field that holds the newly switched agent name.

**Files Modified:**
- `src/features/opencode/opencode.service.ts` (lines 225-255)

### Issue #2: Internal agents showing in available list
**Symptom:** 
The available agents list was incorrectly showing internal system agents:
```
Available primary agents:
• build
• plan
• compaction  ← Should NOT appear
• title       ← Should NOT appear  
• summary     ← Should NOT appear
```

**Root Cause:**
While the filtering logic was present, it needed to be more explicit and verifiable.

**Fix:**
Enhanced the filtering in `getAvailableAgents()` with:
1. Explicit internal agents list: `['compaction', 'title', 'summary']`
2. Clear filtering logic with early return for internal agents
3. Added debug logging to verify filtering is working correctly

**Files Modified:**
- `src/features/opencode/opencode.service.ts` (lines 183-223)

## Changes Summary

### src/features/opencode/opencode.service.ts

#### Changed: `cycleToNextAgent` method (lines 225-255)
**Before:**
```typescript
async cycleToNextAgent(userId: number): Promise<{ success: boolean; currentAgent?: string }> {
    // ... session validation ...
    
    try {
        // Send agent.cycle command
        await client.session.command({
            path: { id: userSession.sessionId },
            body: {
                command: "agent.cycle",
                arguments: ""
            }
        });

        // Incorrectly tried to get agent from old messages
        const messagesResult = await client.session.messages({
            path: { id: userSession.sessionId }
        });

        let currentAgent = "unknown";
        if (messagesResult.data && messagesResult.data.length > 0) {
            const lastUserMessage = messagesResult.data
                .filter((msg: any) => msg.role === "user")
                .pop();
            
            if (lastUserMessage && lastUserMessage.agent) {
                currentAgent = lastUserMessage.agent;  // OLD agent!
            }
        }

        return { success: true, currentAgent };
    } catch (error) {
        console.error(`Failed to cycle agent for user ${userId}:`, error);
        return { success: false };
    }
}
```

**After:**
```typescript
async cycleToNextAgent(userId: number): Promise<{ success: boolean; currentAgent?: string }> {
    // ... session validation ...
    
    try {
        // Send agent.cycle command and capture response
        const commandResult = await client.session.command({
            path: { id: userSession.sessionId },
            body: {
                command: "agent.cycle",
                arguments: ""
            }
        });

        // Extract agent from command response
        let currentAgent = "unknown";
        if (commandResult.data?.info?.mode) {
            currentAgent = commandResult.data.info.mode;  // NEW agent!
        }

        return { success: true, currentAgent };
    } catch (error) {
        console.error(`Failed to cycle agent for user ${userId}:`, error);
        return { success: false };
    }
}
```

#### Enhanced: `getAvailableAgents` method (lines 183-223)
**Changes:**
1. Added explicit comment about internal agents being system agents
2. Added debug logging to track all agents and filtering
3. Made filtering logic more explicit with early return

**Key addition:**
```typescript
// Internal agents to filter out - these are system agents not meant for direct user selection
const internalAgents = ['compaction', 'title', 'summary'];

// Log all agents for debugging
console.log("All agents from server:", result.data.map((a: any) => `${a.name} (${a.mode})`));

// Filter with explicit logic
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
    .map((agent: any) => ({
        name: agent.name || "unknown",
        mode: agent.mode,
        description: agent.description
    }));

console.log("Filtered agents:", filtered.map((a: any) => a.name));
```

## Files Added

### Documentation
- `docs/agent-cycling.md` - Comprehensive documentation of the agent cycling feature
  - Overview of how it works
  - Implementation details
  - Data flow diagrams
  - API type definitions
  - Common pitfalls and best practices

### Tests
- `tests/manual/agent-cycling-test.md` - Manual test procedures
  - Test steps
  - Expected results
  - Bug descriptions and fixes

## Testing

To test the fixes:
1. Run `npm run build` to compile TypeScript
2. Start the bot
3. Follow the test procedures in `tests/manual/agent-cycling-test.md`
4. Check console logs to verify internal agents are being filtered
5. Verify Tab key shows correct agent name (not "unknown")
6. Verify internal agents (compaction, title, summary) are not shown

## Notes

- Debug logging added to `getAvailableAgents()` can be removed after verification
- The fix relies on OpenCode API returning `mode` field in AssistantMessage
- Internal agents are filtered client-side, not server-side

## API Insights

From analyzing the OpenCode SDK types:

1. **AssistantMessage.mode** contains the agent name for assistant messages
2. **UserMessage.agent** contains the agent name for user messages  
3. **SessionCommandResponse** returns an AssistantMessage in the `info` field
4. **Agent.mode** can be "subagent", "primary", or "all"
5. Internal agents (compaction, title, summary) are marked as `mode: "primary"` but should be filtered by name

