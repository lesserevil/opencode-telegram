import type { Event } from "@opencode-ai/sdk";
import type { Context } from "grammy";
import type { UserSession } from "../opencode.types.js";
import { escapeHtml } from "./utils.js";

type ServerInstanceDisposedEvent = Extract<Event, { type: "server.instance.disposed" }>;

export default async function serverInstanceDisposedHandler(
    event: ServerInstanceDisposedEvent,
    ctx: Context,
    userSession: UserSession
): Promise<string | null> {
    return `🗑️ <b>Server instance disposed:</b> <code>${escapeHtml(event.properties.directory)}</code>`;
}
