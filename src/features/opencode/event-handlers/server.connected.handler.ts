import type { Event } from "@opencode-ai/sdk";
import type { Context } from "grammy";
import type { UserSession } from "../opencode.types.js";

type ServerConnectedEvent = Extract<Event, { type: "server.connected" }>;

export default async function serverConnectedHandler(
    event: ServerConnectedEvent,
    ctx: Context,
    userSession: UserSession
): Promise<string | null> {
    return `🔌 <b>Server connected</b>`;
}
