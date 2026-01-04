import type { Event } from "@opencode-ai/sdk";
import type { Context } from "grammy";
import type { UserSession } from "../opencode.types.js";
import { escapeHtml } from "./utils.js";

type SessionErrorEvent = Extract<Event, { type: "session.error" }>;

export default async function sessionErrorHandler(
    event: SessionErrorEvent,
    ctx: Context,
    userSession: UserSession
): Promise<string | null> {
    console.log(event.type);
    return null;
}
