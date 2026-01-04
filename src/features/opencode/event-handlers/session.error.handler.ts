import type { Event } from "@opencode-ai/sdk";
import type { Context } from "grammy";
import type { UserSession } from "../opencode.types.js";
import { escapeHtml } from "./utils.js";

type SessionErrorEvent = Extract<Event, { type: "session.error" }>;

export default async function sessionErrorHandler(
    event: SessionErrorEvent,
    ctx: Context,
    userSession: UserSession
): Promise<string | null> {
    const error = event.properties.error;
    const errorMsg = error ? JSON.stringify(error, null, 2) : "Unknown error";
    return `❌ <b>Session Error:</b>\n<pre>${escapeHtml(errorMsg)}</pre>`;
}
