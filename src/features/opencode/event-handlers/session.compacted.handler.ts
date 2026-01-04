import type { Event } from "@opencode-ai/sdk";
import type { Context } from "grammy";
import type { UserSession } from "../opencode.types.js";

type SessionCompactedEvent = Extract<Event, { type: "session.compacted" }>;

export default async function sessionCompactedHandler(
    event: SessionCompactedEvent,
    ctx: Context,
    userSession: UserSession
): Promise<string | null> {
    return `🧹 <b>Session compacted:</b> ${event.properties.sessionID}`;
}
