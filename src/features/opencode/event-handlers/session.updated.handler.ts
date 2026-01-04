import type { Event } from "@opencode-ai/sdk";
import type { Context } from "grammy";
import type { UserSession } from "../opencode.types.js";
import { escapeHtml } from "./utils.js";

type SessionUpdatedEvent = Extract<Event, { type: "session.updated" }>;

export default async function sessionUpdatedHandler(
    event: SessionUpdatedEvent,
    ctx: Context,
    userSession: UserSession
): Promise<string | null> {
    const info = event.properties.info;
    return `✏️ <b>Session updated:</b> ${escapeHtml(info.title || info.id)}`;
}
