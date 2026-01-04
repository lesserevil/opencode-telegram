import type { Event } from "@opencode-ai/sdk";
import type { Context } from "grammy";
import type { UserSession } from "../opencode.types.js";
import { escapeHtml } from "./utils.js";

type CommandExecutedEvent = Extract<Event, { type: "command.executed" }>;

export default async function commandExecutedHandler(
    event: CommandExecutedEvent,
    ctx: Context,
    userSession: UserSession
): Promise<string | null> {
    const props = event.properties;
    return `⚙️ <b>Command executed:</b> ${escapeHtml(props.name)} (session=${escapeHtml(props.sessionID)})`;
}
