import type { Event } from "@opencode-ai/sdk";
import type { Context } from "grammy";
import type { UserSession } from "../opencode.types.js";

type SessionDeletedEvent = Extract<Event, { type: "session.deleted" }>;

export default async function sessionDeletedHandler(
    event: SessionDeletedEvent,
    ctx: Context,
    userSession: UserSession
): Promise<string | null> {
    const info = event.properties.info;
    return `🗑️ <b>Session deleted:</b> ${info.id}`;
}
