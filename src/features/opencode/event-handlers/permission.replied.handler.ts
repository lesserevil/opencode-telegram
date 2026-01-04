import type { Event } from "@opencode-ai/sdk";
import type { Context } from "grammy";
import type { UserSession } from "../opencode.types.js";
import { escapeHtml } from "./utils.js";

type PermissionRepliedEvent = Extract<Event, { type: "permission.replied" }>;

export default async function permissionRepliedHandler(
    event: PermissionRepliedEvent,
    ctx: Context,
    userSession: UserSession
): Promise<string | null> {
    const props = event.properties;
    return `💬 <b>Permission replied:</b> ${escapeHtml(props.response)} (permission=${escapeHtml(props.permissionID)})`;
}
