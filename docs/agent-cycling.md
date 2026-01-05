# Agent Cycling Feature

## Overview
The agent cycling feature allows users to switch between different AI agents (build, plan, explore, general) using the Tab keyboard key in Telegram. Each agent has different capabilities and behaviors optimized for specific tasks.

## How It Works

### User Flow
1. User presses the **Tab** key in Telegram chat
2. The bot cycles to the next available agent
3. A message is displayed showing:
   - The current active agent
   - A list of all available primary agents

### Available Agents

#### Primary Agents (User-Selectable)
These agents can be selected directly by the user via Tab key:

- **build** - Optimized for implementing features and writing code
- **plan** - Optimized for planning and architecture decisions
- **explore** - Optimized for exploring and understanding codebases
- **general** - General-purpose agent for various tasks

#### Internal Agents (System-Only)
These agents are used internally by OpenCode and are NOT available for direct user selection:

- **compaction** - Used for compacting/summarizing conversation history
- **title** - Used for generating conversation titles
- **summary** - Used for generating summaries

## Implementation Details

### Architecture

The agent cycling functionality is implemented across two main methods:

#### `cycleToNextAgent(userId: number)`
Located in: `src/features/opencode/opencode.service.ts`

**Purpose:** Cycles to the next agent in the sequence and returns the current agent name.

**How it works:**
1. Gets the user's session
2. Sends `agent.cycle` command to OpenCode server
3. Extracts the new agent name from the command response
4. Returns the agent name

**Key Implementation Detail:**
```typescript
// Send agent.cycle command and capture the response
const commandResult = await client.session.command({
    path: { id: userSession.sessionId },
    body: {
        command: "agent.cycle",
        arguments: ""
    }
});

// The response contains an AssistantMessage with the new agent in the mode field
let currentAgent = "unknown";
if (commandResult.data?.info?.mode) {
    currentAgent = commandResult.data.info.mode;
}

return { success: true, currentAgent };
```

**Important:** The new agent name is in the `mode` field of the `AssistantMessage` returned in the command response, NOT in any user message.

#### `getAvailableAgents()`
Located in: `src/features/opencode/opencode.service.ts`

**Purpose:** Retrieves the list of available agents from OpenCode server and filters out internal agents.

**How it works:**
1. Calls OpenCode API: `client.app.agents()`
2. Filters the results to exclude internal agents
3. Only returns agents with mode `"primary"` or `"all"`
4. Maps to a simplified format for display

**Key Implementation Detail:**
```typescript
// Internal agents to filter out
const internalAgents = ['compaction', 'title', 'summary'];

// Filter for primary agents only, exclude internal agents
const filtered = result.data
    .filter((agent: any) => {
        // Exclude internal utility agents
        if (internalAgents.includes(agent.name)) {
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
```

### Tab Key Handler
Located in: `src/features/opencode/opencode.bot.ts`

The Tab key is handled in the keyboard event handler:

```typescript
// Cycle to next agent
const result = await this.opencodeService.cycleToNextAgent(userId);

if (result.success && result.currentAgent) {
    // Get list of available agents
    const agents = await this.opencodeService.getAvailableAgents();
    const agentList = agents
        .map(a => `• ${a.name}${a.description ? `: ${a.description}` : ''}`)
        .join('\n');

    // Display the result
    await ctx.api.editMessageText(
        ctx.chat!.id,
        statusMessage.message_id,
        `⇥ Switched to agent: <b>${result.currentAgent}</b>\n\n` +
        `Available primary agents:\n${agentList}`,
        { parse_mode: "HTML" }
    );
}
```

## Data Flow

```
User presses Tab
    ↓
Telegram Bot receives Tab event
    ↓
opencodeService.cycleToNextAgent(userId)
    ↓
Send "agent.cycle" command to OpenCode
    ↓
OpenCode switches agent and returns AssistantMessage
    ↓
Extract agent name from response.data.info.mode
    ↓
opencodeService.getAvailableAgents()
    ↓
Fetch all agents from OpenCode API
    ↓
Filter out internal agents (compaction, title, summary)
    ↓
Return filtered list to bot
    ↓
Bot displays current agent + available agents list
```

## OpenCode API Types

### Agent Type
```typescript
export type Agent = {
    name: string;
    description?: string;
    mode: "subagent" | "primary" | "all";
    builtIn: boolean;
    // ... other fields
}
```

### UserMessage Type
```typescript
export type UserMessage = {
    id: string;
    sessionID: string;
    role: "user";
    agent: string;  // Contains the agent name for this message
    model: {
        providerID: string;
        modelID: string;
    };
    // ... other fields
}
```

### AssistantMessage Type
```typescript
export type AssistantMessage = {
    id: string;
    sessionID: string;
    role: "assistant";
    mode: string;  // Contains the agent name (e.g., "build", "plan")
    modelID: string;
    providerID: string;
    // ... other fields
}
```

### Command Response Type
```typescript
export type SessionCommandResponses = {
    200: {
        info: AssistantMessage;  // Contains the mode field with agent name
        parts: Array<Part>;
    };
}
```

## Common Pitfalls

### ❌ Wrong: Getting agent from user messages
```typescript
// This gets the OLD agent before cycling
const lastUserMessage = messagesResult.data
    .filter((msg: any) => msg.role === "user")
    .pop();
currentAgent = lastUserMessage.agent;  // This is the OLD agent!
```

### ✅ Correct: Getting agent from command response
```typescript
// This gets the NEW agent after cycling
const commandResult = await client.session.command({
    body: { command: "agent.cycle", arguments: "" }
});
currentAgent = commandResult.data.info.mode;  // This is the NEW agent!
```

### ❌ Wrong: Forgetting to filter internal agents
```typescript
// This would show compaction, title, summary to users
return result.data.map(agent => ({ name: agent.name }));
```

### ✅ Correct: Filtering internal agents
```typescript
const internalAgents = ['compaction', 'title', 'summary'];
return result.data
    .filter(agent => !internalAgents.includes(agent.name))
    .map(agent => ({ name: agent.name }));
```

## Testing

See: `tests/manual/agent-cycling-test.md` for manual testing procedures.

## Future Enhancements

Possible improvements:
1. Allow users to switch to a specific agent by name (not just cycle)
2. Show the current agent in the status display
3. Add keyboard shortcuts for switching to specific agents
4. Persist agent preference per user
5. Show agent-specific capabilities in the help text
