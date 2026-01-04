import type { Event } from "@opencode-ai/sdk";
import type { Context } from "grammy";
import type { UserSession } from "../opencode.types.js";
import { escapeHtml } from "./utils.js";
import { MessageUtils } from "../../../utils/message.utils.js";

type MessagePartUpdatedEvent = Extract<Event, { type: "message.part.updated" }>;

export default async function messagePartUpdatedHandler(
    event: MessagePartUpdatedEvent,
    ctx: Context,
    userSession: UserSession
): Promise<string | null> {
    const part = event.properties.part;
    if (!part) {
        console.log("No part in message.part.updated event");
        return null;
    }
    const chatId = ctx.chat?.id ?? userSession.chatId;
    if (!chatId) {
        console.log("No chat id available for message.part.updated event");
        return null;
    }

    if (part.type === "reasoning") {
        const msg = await ctx.api.sendMessage(chatId, "Reasoning");
        // use MessageUtils to schedule deletion; ensure ctx.chat is set so deletion can resolve chat id
        const originalChat = ctx.chat;
        if (!ctx.chat) (ctx as any).chat = { id: chatId } as any;
        MessageUtils.scheduleMessageDeletion(ctx, msg.message_id, 3000).catch(err => {
            console.error("Failed scheduling deletion via MessageUtils", err);
        });
        if (!originalChat) delete (ctx as any).chat;
        return null;
    }

    if (part.type === "text") {
        const text = escapeHtml(part.text ?? "");
        if (userSession.lastMessageId) {
            try {
                await ctx.api.editMessageText(chatId, userSession.lastMessageId, text, { parse_mode: "HTML" });
            } catch (err) {
                // fallback to send and store id
                const sent = await ctx.api.sendMessage(chatId, text, { parse_mode: "HTML" });
                userSession.lastMessageId = sent.message_id;
            }
        } else {
            const sent = await ctx.api.sendMessage(chatId, text, { parse_mode: "HTML" });
            userSession.lastMessageId = sent.message_id;
            userSession.chatId = chatId;
        }
        return null;
    }

    console.log("Handled message.part.updated event:", part);
    return null;
}
