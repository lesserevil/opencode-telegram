import type { Event } from "@opencode-ai/sdk";
import type { Context } from "grammy";
import type { UserSession } from "../opencode.types.js";
import { escapeHtml } from "./utils.js";

type TuiPromptAppendEvent = Extract<Event, { type: "tui.prompt.append" }>;

export default async function tuiPromptAppendHandler(
    event: TuiPromptAppendEvent,
    ctx: Context,
    userSession: UserSession
): Promise<string | null> {
    console.log(event.type);
    return null;
}
