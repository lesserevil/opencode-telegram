import type { Event } from "@opencode-ai/sdk";
import type { Context } from "grammy";
import type { UserSession } from "../opencode.types.js";
import { escapeHtml } from "./utils.js";

type LspClientDiagnosticsEvent = Extract<Event, { type: "lsp.client.diagnostics" }>;

export default async function lspClientDiagnosticsHandler(
    event: LspClientDiagnosticsEvent,
    ctx: Context,
    userSession: UserSession
): Promise<string | null> {
    return `🔍 <b>LSP diagnostics:</b> server=${escapeHtml(event.properties.serverID)}, path=<code>${escapeHtml(event.properties.path)}</code>`;
}
