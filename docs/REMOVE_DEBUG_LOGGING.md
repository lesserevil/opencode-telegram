# Removing Debug Logging After Testing

After verifying the agent cycling fixes work correctly, you can remove the debug logging from `src/features/opencode/opencode.service.ts`.

## Location
File: `src/features/opencode/opencode.service.ts`
Method: `getAvailableAgents()` (around lines 196-217)

## Lines to Remove

Remove these console.log statements:

```typescript
// Line ~197: Remove this
console.log("All agents from server:", result.data.map((a: any) => `${a.name} (${a.mode})`));

// Line ~204: Remove this  
console.log(`Filtering out internal agent: ${agent.name}`);

// Line ~217: Remove this
console.log("Filtered agents:", filtered.map((a: any) => a.name));
```

## Clean Version

Replace the `getAvailableAgents()` method with this clean version:

```typescript
async getAvailableAgents(): Promise<Array<{ name: string; mode?: string; description?: string }>> {
    const client = createOpencodeClient({ baseUrl: this.baseUrl });

    try {
        const result = await client.app.agents();
        
        if (!result.data) {
            return [];
        }

        // Internal agents to filter out - these are system agents not meant for direct user selection
        const internalAgents = ['compaction', 'title', 'summary'];

        // Filter for primary agents only, exclude internal agents and subagents
        return result.data
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
    } catch (error) {
        console.error("Failed to get available agents:", error);
        return [];
    }
}
```

## When to Remove

Only remove the debug logging after:
1. ✅ Testing Tab key cycling works correctly
2. ✅ Verifying agent names are displayed (not "unknown")
3. ✅ Confirming internal agents are filtered out
4. ✅ Checking console logs show expected filtering behavior

## Keep Error Logging

Keep the error logging on line ~221:
```typescript
console.error("Failed to get available agents:", error);
```

This is important for debugging production issues.
