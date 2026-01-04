import type { Event } from "@opencode-ai/sdk";
import type { Context } from "grammy";
import type { UserSession } from "../opencode.types.js";
import { escapeHtml } from "./utils.js";

type SessionCreatedEvent = Extract<Event, { type: "session.created" }>;

export default async function sessionCreatedHandler(
    event: SessionCreatedEvent,
    ctx: Context,
    userSession: UserSession
): Promise<string | null> {
    const info = event.properties.info;
    return `📁 <b>Session created:</b> ${escapeHtml(info.title)} (id=<code>${escapeHtml(info.id)}</code>)`;
}
