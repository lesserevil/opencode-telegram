import type { Event } from "@opencode-ai/sdk";
import type { Context } from "grammy";
import type { UserSession } from "../opencode.types.js";
import { escapeHtml } from "./utils.js";

type FileEditedEvent = Extract<Event, { type: "file.edited" }>;

export default async function fileEditedHandler(
    event: FileEditedEvent,
    ctx: Context,
    userSession: UserSession
): Promise<string | null> {
    return `📄 <b>File Edited:</b>\n<code>${escapeHtml(event.properties.file)}</code>`;
}
