import type { Event } from "@opencode-ai/sdk";
import type { Context } from "grammy";
import type { UserSession } from "../opencode.types.js";
import { escapeHtml } from "./utils.js";

type PtyExitedEvent = Extract<Event, { type: "pty.exited" }>;

export default async function ptyExitedHandler(
    event: PtyExitedEvent,
    ctx: Context,
    userSession: UserSession
): Promise<string | null> {
    return `🛑 <b>Terminal Exited</b>\n` +
        `ID: <code>${escapeHtml(event.properties.id)}</code>\n` +
        `Exit Code: ${event.properties.exitCode}`;
}
