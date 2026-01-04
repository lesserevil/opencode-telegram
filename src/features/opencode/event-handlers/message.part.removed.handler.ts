import type { Event } from "@opencode-ai/sdk";
import type { Context } from "grammy";
import type { UserSession } from "../opencode.types.js";

type MessagePartRemovedEvent = Extract<Event, { type: "message.part.removed" }>;

export default async function messagePartRemovedHandler(
    event: MessagePartRemovedEvent,
    ctx: Context,
    userSession: UserSession
): Promise<string | null> {
    return `🗑️ <b>Message part removed:</b> ${event.properties.partID}`;
}
