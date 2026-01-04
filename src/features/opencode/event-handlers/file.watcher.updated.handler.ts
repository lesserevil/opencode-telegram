import type { Event } from "@opencode-ai/sdk";
import type { Context } from "grammy";
import type { UserSession } from "../opencode.types.js";

type FileWatcherUpdatedEvent = Extract<Event, { type: "file.watcher.updated" }>;

export default async function fileWatcherUpdatedHandler(
    event: FileWatcherUpdatedEvent,
    ctx: Context,
    userSession: UserSession
): Promise<string | null> {
    const p = event.properties;
    return `📂 <b>File watcher:</b> ${p.event} ${p.file}`;
}
