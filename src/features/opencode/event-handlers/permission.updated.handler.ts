import type { Event } from "@opencode-ai/sdk";
import type { Context } from "grammy";
import type { UserSession } from "../opencode.types.js";
import { escapeHtml } from "./utils.js";

type PermissionUpdatedEvent = Extract<Event, { type: "permission.updated" }>;

export default async function permissionUpdatedHandler(
    event: PermissionUpdatedEvent,
    ctx: Context,
    userSession: UserSession
): Promise<string | null> {
    const p = event.properties;
    return `🔐 <b>Permission updated:</b> ${escapeHtml(p.title)} (id=<code>${escapeHtml(p.id)}</code>)`;
}
