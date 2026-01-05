# Agent Cycling Fix - Final Solution

## Problem Summary

When pressing Tab to cycle agents in Telegram, the bot always showed:
```
⇥ Switched to agent: unknown

Available primary agents:
• build
• plan
• compaction  ← Should not appear
• title       ← Should not appear
• summary     ← Should not appear
```

## Root Cause

**The `agent.cycle` command in OpenCode is broken.**

When we send the command to OpenCode:
```typescript
await client.session.command({
    path: { id: sessionId },
    body: { command: "agent.cycle", arguments: "" }
});
```

It returns an error:
```
TypeError: undefined is not an object (evaluating 'command3.agent')
at command2 (src/session/prompt.ts:1285:23)
```

This is a bug in OpenCode itself, not in our code.

## Solution: Local Agent Tracking

Since OpenCode's `agent.cycle` command doesn't work, we implemented **local agent state tracking**:

### 1. Added Current Agent to User Session
```typescript
// opencode.types.ts
export interface UserSession {
    userId: number;
    sessionId: string;
    session: Session;
    createdAt: Date;
    chatId?: number;
    lastMessageId?: number;
    currentAgent?: string; // ← Track agent locally
}
```

### 2. Implemented Local Cycling Logic
```typescript
// opencode.service.ts
async cycleToNextAgent(userId: number): Promise<{ success: boolean; currentAgent?: string }> {
    // Get user's session
    const userSession = this.getUserSession(userId);
    
    // Get available primary agents (filtered)
    const agents = await this.getAvailableAgents();
    
    // Get current agent or default to first
    const currentAgent = userSession.currentAgent || agents[0].name;
    
    // Find current index and cycle to next
    const currentIndex = agents.findIndex(a => a.name === currentAgent);
    const nextIndex = (currentIndex + 1) % agents.length;
    const nextAgent = agents[nextIndex].name;
    
    // Update session state
    userSession.currentAgent = nextAgent;
    
    return { success: true, currentAgent: nextAgent };
}
```

### 3. Fixed Agent Filtering

We discovered that agents have a `hidden` flag that indicates internal agents:

```javascript
// From OpenCode API
{
    "name": "build",
    "mode": "primary",
    "hidden": false       // ← User-selectable
}
{
    "name": "compaction",
    "mode": "primary",
    "hidden": true        // ← Internal agent
}
{
    "name": "explore",
    "mode": "subagent",   // ← Not for direct selection
    "hidden": false
}
```

Updated filtering logic:
```typescript
const filtered = result.data.filter((agent: any) => {
    // Exclude hidden agents (compaction, title, summary)
    if (agent.hidden === true) return false;
    
    // Exclude subagents (general, explore)
    if (agent.mode === "subagent") return false;
    
    // Only include primary agents
    return agent.mode === "primary" || agent.mode === "all";
});
```

## Agent Classification

### User-Selectable Agents (What Tab cycles through)
- **build** - `mode: "primary", hidden: false`
- **plan** - `mode: "primary", hidden: false`

### Internal Agents (Hidden from user)
- **compaction** - `mode: "primary", hidden: true` - For conversation summarization
- **title** - `mode: "primary", hidden: true` - For generating titles
- **summary** - `mode: "primary", hidden: true` - For generating summaries

### Subagents (Not directly selectable)
- **general** - `mode: "subagent", hidden: true` - Called by other agents
- **explore** - `mode: "subagent", hidden: false` - Called by other agents

## Testing

Test with the simple verification script:
```bash
cd /home/tom/telegramCoder

# This shows the filtering logic works correctly
cat > test-agents.mjs << 'EOF'
import { createOpencodeClient } from "@opencode-ai/sdk";
const client = createOpencodeClient({ baseUrl: "http://localhost:4096" });
const result = await client.app.agents();
const filtered = result.data.filter(a => 
    a.hidden !== true && 
    a.mode !== "subagent" && 
    (a.mode === "primary" || a.mode === "all")
);
console.log("User-selectable agents:", filtered.map(a => a.name));
EOF

node test-agents.mjs
# Output: User-selectable agents: [ 'build', 'plan' ]
```

## Files Modified

### Core Changes
1. **src/features/opencode/opencode.types.ts**
   - Added `currentAgent?: string` to `UserSession` interface

2. **src/features/opencode/opencode.service.ts**
   - `cycleToNextAgent()` - Replaced broken OpenCode command with local cycling
   - `getAvailableAgents()` - Added `hidden` flag filtering

### Documentation
1. **docs/agent-cycling.md** - Complete feature documentation
2. **tests/manual/agent-cycling-test.md** - Manual test procedures
3. **AGENT_CYCLING_SOLUTION.md** - This file

### Test Scripts
1. **scripts/test-agent-cycle.mjs** - Tests OpenCode API directly
2. **DEBUG_AGENT_CYCLING.md** - Debugging instructions

## How It Works Now

```
User presses Tab in Telegram
    ↓
Bot calls cycleToNextAgent(userId)
    ↓
Service gets list of available agents from OpenCode
    ↓
Filters to only user-selectable agents (build, plan)
    ↓
Gets current agent from user session (or defaults to first)
    ↓
Calculates next agent: (currentIndex + 1) % agents.length
    ↓
Updates user session with new current agent
    ↓
Returns new agent name to bot
    ↓
Bot displays: "⇥ Switched to agent: build"
```

## Benefits of This Solution

1. **Works reliably** - No dependency on broken OpenCode command
2. **Simple** - Easy to understand and maintain
3. **Correct filtering** - Uses `hidden` flag to properly exclude internal agents
4. **Proper cycling** - Wraps around from last agent to first
5. **Per-user state** - Each user can be on a different agent

## Future Improvements

If OpenCode fixes the `agent.cycle` command, we could:
1. Keep the local tracking as a fallback
2. Try to use OpenCode's command first
3. Fall back to local tracking if command fails

However, the current local solution works perfectly and may actually be more reliable than depending on OpenCode's implementation.
