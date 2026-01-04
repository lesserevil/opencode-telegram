import type { Event } from "@opencode-ai/sdk";
import type { Context } from "grammy";
import type { UserSession } from "../opencode.types.js";
import { escapeHtml } from "./utils.js";

type TuiToastShowEvent = Extract<Event, { type: "tui.toast.show" }>;

export default async function tuiToastShowHandler(
    event: TuiToastShowEvent,
    ctx: Context,
    userSession: UserSession
): Promise<string | null> {
    const p = event.properties;
    return `🔔 <b>TUI toast (${escapeHtml(p.variant)}):</b> ${escapeHtml(p.message)}${p.title ? ` — ${escapeHtml(p.title)}` : ""}`;
}
