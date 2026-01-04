# OpenCode Event Handling Architecture

## Overview

The event handling system uses a **Chain of Responsibility** pattern to process events from the OpenCode server. This architecture allows for flexible, maintainable, and extensible event processing.

## Architecture

### Components

1. **EventHandler Interface** - Defines the contract for all event handlers
2. **Concrete Handlers** - Implement specific event processing logic
3. **EventHandlerRegistry** - Manages and coordinates handlers
4. **OpenCodeService** - Integrates the registry into the event stream

### File Structure

```
src/features/opencode/
├── opencode.service.ts          # Main service with event streaming
├── opencode.event-handlers.ts   # Event handler registry and implementations
├── opencode.types.ts            # Type definitions
└── opencode.bot.ts              # Bot command handlers
```

## Event Handler Interface

```typescript
interface EventHandler {
    name: string;
    shouldHandle(event: Event): boolean;
    handle(event: Event, ctx: Context, userSession: UserSession): Promise<EventHandlerResult>;
}
```

### EventHandlerResult

```typescript
interface EventHandlerResult {
    handled: boolean;           // Whether the event was processed
    message?: string;           // Optional message to send
    stopPropagation?: boolean;  // Stop further handler execution
    action?: "send" | "update" | "ignore" | "custom";
}
```

## Built-in Handlers

### 1. MessageEventHandler
Handles message lifecycle events:
- `message.updated` - When a message is created or modified
- `message.removed` - When a message is deleted

### 2. SessionStatusEventHandler
Handles session state changes:
- `session.status` - Session running/paused status
- `session.idle` - When session becomes idle
- `session.error` - Session errors

### 3. FileEventHandler
Handles file operations:
- `file.edited` - When a file is modified

### 4. DefaultEventHandler
Fallback handler that formats all unhandled events with their raw properties.

## How to Add New Event Handlers

### Step 1: Create a New Handler Class

```typescript
export class MyCustomEventHandler implements EventHandler {
    name = "MyCustomEventHandler";

    shouldHandle(event: Event): boolean {
        // Return true if this handler should process the event
        return event.type === "my.custom.event";
    }

    async handle(event: Event, ctx: Context, userSession: UserSession): Promise<EventHandlerResult> {
        // Your custom logic here
        const text = `Custom event handled: ${event.type}`;

        return {
            handled: true,
            message: text,
            action: "send"
        };
    }
}
```

### Step 2: Register the Handler

In [opencode.event-handlers.ts](./opencode.event-handlers.ts), add your handler to the registry:

```typescript
export function createEventHandlerRegistry(): EventHandlerRegistry {
    const registry = new EventHandlerRegistry();

    // Add your custom handler
    registry.register(new MyCustomEventHandler());
    
    // Keep existing handlers
    registry.register(new MessageEventHandler());
    registry.register(new SessionStatusEventHandler());
    registry.register(new FileEventHandler());
    registry.register(new DefaultEventHandler());

    return registry;
}
```

## Advanced Use Cases

### Updating Messages Instead of Sending New Ones

```typescript
export class MessageUpdateHandler implements EventHandler {
    name = "MessageUpdateHandler";
    private lastMessageId: number | null = null;

    shouldHandle(event: Event): boolean {
        return event.type === "message.part.updated";
    }

    async handle(event: Event, ctx: Context, userSession: UserSession): Promise<EventHandlerResult> {
        const text = "Updated content...";

        if (this.lastMessageId && userSession.chatId) {
            // Update existing message
            await ctx.api.editMessageText(
                userSession.chatId,
                this.lastMessageId,
                text,
                { parse_mode: "HTML" }
            );
        } else {
            // Send new message
            const msg = await ctx.api.sendMessage(
                userSession.chatId!,
                text,
                { parse_mode: "HTML" }
            );
            this.lastMessageId = msg.message_id;
        }

        return {
            handled: true,
            action: "update",
            stopPropagation: true  // Don't let other handlers process this
        };
    }
}
```

### Filtering Events (Ignoring Certain Types)

```typescript
export class FilteringHandler implements EventHandler {
    name = "FilteringHandler";
    
    // Events to ignore
    private ignoredTypes = new Set([
        "lsp.updated",
        "lsp.client.diagnostics",
    ]);

    shouldHandle(event: Event): boolean {
        return this.ignoredTypes.has(event.type);
    }

    async handle(event: Event, ctx: Context, userSession: UserSession): Promise<EventHandlerResult> {
        // Silently ignore these events
        return {
            handled: true,
            action: "ignore",
            stopPropagation: true  // Don't pass to other handlers
        };
    }
}
```

### Batching Events

```typescript
export class BatchingHandler implements EventHandler {
    name = "BatchingHandler";
    private buffer: Event[] = [];
    private timer: NodeJS.Timeout | null = null;

    shouldHandle(event: Event): boolean {
        return event.type === "file.edited";
    }

    async handle(event: Event, ctx: Context, userSession: UserSession): Promise<EventHandlerResult> {
        this.buffer.push(event);

        // Clear existing timer
        if (this.timer) {
            clearTimeout(this.timer);
        }

        // Set new timer to flush buffer
        this.timer = setTimeout(async () => {
            await this.flush(ctx, userSession);
        }, 1000);  // Wait 1 second before sending

        return {
            handled: true,
            action: "custom",
            stopPropagation: true
        };
    }

    private async flush(ctx: Context, userSession: UserSession): Promise<void> {
        if (this.buffer.length === 0 || !userSession.chatId) return;

        const files = this.buffer
            .filter(e => e.type === "file.edited")
            .map(e => e.properties.file)
            .join("\n");

        const text = `📄 <b>Files Edited (${this.buffer.length}):</b>\n<code>${files}</code>`;

        await ctx.api.sendMessage(userSession.chatId, text, { parse_mode: "HTML" });
        this.buffer = [];
        this.timer = null;
    }
}
```

## Event Flow

```
Event Stream → EventHandlerRegistry → Handler Chain → Telegram Message
                                     ↓
                        [Handler 1] → shouldHandle? → handle → Result
                        [Handler 2] → shouldHandle? → handle → Result
                        [Handler 3] → shouldHandle? → handle → Result
                        [Default]   → always handles → Result
```

## Handler Priority

Handlers are executed in the order they are registered. **More specific handlers should be registered first**, with the `DefaultEventHandler` as the last fallback.

```typescript
registry.register(new FilteringHandler());         // First: Block unwanted events
registry.register(new MessageUpdateHandler());     // Second: Handle updates
registry.register(new MessageEventHandler());      // Third: Handle new messages
registry.register(new DefaultEventHandler());      // Last: Catch everything else
```

## Testing Event Handlers

```typescript
// Example test
import { MessageEventHandler } from "./opencode.event-handlers.js";

const handler = new MessageEventHandler();
const mockEvent: Event = {
    type: "message.updated",
    properties: {
        info: {
            id: "msg-123",
            role: "assistant"
        }
    }
};

const result = await handler.handle(mockEvent, mockCtx, mockSession);
assert(result.handled === true);
assert(result.message?.includes("Message Updated"));
```

## Benefits of This Architecture

1. **Separation of Concerns** - Each handler focuses on specific event types
2. **Easy to Extend** - Add new handlers without modifying existing code
3. **Testable** - Handlers can be tested independently
4. **Flexible** - Handlers can send, update, batch, or ignore events
5. **Maintainable** - Clear structure and well-defined interfaces
6. **Type-Safe** - Full TypeScript support with proper Event types

## Available Event Types

From the OpenCode SDK, common event types include:

- `message.updated` - Message lifecycle
- `message.removed` - Message deletion
- `message.part.updated` - Message part updates
- `session.status` - Session state changes
- `session.idle` - Session idle state
- `session.error` - Session errors
- `file.edited` - File modifications
- `command.executed` - Command execution
- `todo.updated` - Todo list changes
- `lsp.updated` - LSP updates
- `lsp.client.diagnostics` - Diagnostics
- And many more...

See the OpenCode SDK types for the complete list.
