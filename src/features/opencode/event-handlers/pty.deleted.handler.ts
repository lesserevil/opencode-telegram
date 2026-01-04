import type { Event } from "@opencode-ai/sdk";
import type { Context } from "grammy";
import type { UserSession } from "../opencode.types.js";

type PtyDeletedEvent = Extract<Event, { type: "pty.deleted" }>;

export default async function ptyDeletedHandler(
    event: PtyDeletedEvent,
    ctx: Context,
    userSession: UserSession
): Promise<string | null> {
    return `🗑️ <b>PTY deleted:</b> ${event.properties.id}`;
}
