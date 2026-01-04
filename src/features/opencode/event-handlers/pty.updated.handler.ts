import type { Event } from "@opencode-ai/sdk";
import type { Context } from "grammy";
import type { UserSession } from "../opencode.types.js";
import { escapeHtml } from "./utils.js";

type PtyUpdatedEvent = Extract<Event, { type: "pty.updated" }>;

export default async function ptyUpdatedHandler(
    event: PtyUpdatedEvent,
    ctx: Context,
    userSession: UserSession
): Promise<string | null> {
    const info = event.properties.info;
    return `🖥️ <b>PTY updated:</b> ${escapeHtml(info.title)} (status=${escapeHtml(info.status)})`;
}
