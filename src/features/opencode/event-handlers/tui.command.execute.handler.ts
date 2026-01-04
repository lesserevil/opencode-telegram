import type { Event } from "@opencode-ai/sdk";
import type { Context } from "grammy";
import type { UserSession } from "../opencode.types.js";
import { escapeHtml } from "./utils.js";

type TuiCommandExecuteEvent = Extract<Event, { type: "tui.command.execute" }>;

export default async function tuiCommandExecuteHandler(
    event: TuiCommandExecuteEvent,
    ctx: Context,
    userSession: UserSession
): Promise<string | null> {
    console.log(event.type);
    return null;
}
