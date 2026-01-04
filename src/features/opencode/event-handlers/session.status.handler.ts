import type { Event } from "@opencode-ai/sdk";
import type { Context } from "grammy";
import type { UserSession } from "../opencode.types.js";

type SessionStatusEvent = Extract<Event, { type: "session.status" }>;

export default async function sessionStatusHandler(
    event: SessionStatusEvent,
    ctx: Context,
    userSession: UserSession
): Promise<string | null> {
    const status = event.properties.status;
    const statusType = status.type;
    const emoji = statusType === "busy" ? "🟢" : statusType === "idle" ? "⏸️" : "🔄";
    return `${emoji} <b>Session Status:</b> ${statusType}`;
}
