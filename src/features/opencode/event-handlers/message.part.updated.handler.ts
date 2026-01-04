import type { Event } from "@opencode-ai/sdk";
import type { Context } from "grammy";
import type { UserSession } from "../opencode.types.js";
import { escapeHtml } from "./utils.js";

type MessagePartUpdatedEvent = Extract<Event, { type: "message.part.updated" }>;

export default async function messagePartUpdatedHandler(
    event: MessagePartUpdatedEvent,
    ctx: Context,
    userSession: UserSession
): Promise<string | null> {
    const part = event.properties.part;
    return `✏️ <b>Message part updated:</b> type=${escapeHtml(part.type)}, id=<code>${escapeHtml(part.id)}</code>`;
}
