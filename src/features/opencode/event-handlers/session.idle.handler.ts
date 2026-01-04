import type { Event } from "@opencode-ai/sdk";
import type { Context } from "grammy";
import type { UserSession } from "../opencode.types.js";

type SessionIdleEvent = Extract<Event, { type: "session.idle" }>;

export default async function sessionIdleHandler(
    event: SessionIdleEvent,
    ctx: Context,
    userSession: UserSession
): Promise<string | null> {
    console.log(event.type);
    return null;
}
