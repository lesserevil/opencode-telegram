import type { Event } from "@opencode-ai/sdk";
import type { Context } from "grammy";
import type { UserSession } from "../opencode.types.js";
import { escapeHtml } from "./utils.js";

type MessageUpdatedEvent = Extract<Event, { type: "message.updated" }>;

export default async function messageUpdatedHandler(
    event: MessageUpdatedEvent,
    ctx: Context,
    userSession: UserSession
): Promise<string | null> {
    const message = event.properties.info;
    return `📝 <b>Message Updated</b>\n` +
        `Role: ${message.role}\n` +
        `ID: <code>${escapeHtml(message.id)}</code>`;
}
