import type { Event } from "@opencode-ai/sdk";
import type { Context } from "grammy";
import type { UserSession } from "../opencode.types.js";

type TodoUpdatedEvent = Extract<Event, { type: "todo.updated" }>;

export default async function todoUpdatedHandler(
    event: TodoUpdatedEvent,
    ctx: Context,
    userSession: UserSession
): Promise<string | null> {
    const todos = event.properties.todos || [];
    return `📝 <b>Todos updated:</b> ${todos.length} items`;
}
