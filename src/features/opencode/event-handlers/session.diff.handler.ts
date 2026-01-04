import type { Event } from "@opencode-ai/sdk";
import type { Context } from "grammy";
import type { UserSession } from "../opencode.types.js";

type SessionDiffEvent = Extract<Event, { type: "session.diff" }>;

export default async function sessionDiffHandler(
    event: SessionDiffEvent,
    ctx: Context,
    userSession: UserSession
): Promise<string | null> {
    const diff = event.properties.diff || [];
    return `🔧 <b>Session diff:</b> ${diff.length} files changed`;
}
