import type { Event } from "@opencode-ai/sdk";
import type { Context } from "grammy";
import type { UserSession } from "../opencode.types.js";
import { escapeHtml } from "./utils.js";
import { MessageUtils } from "../../../utils/message.utils.js";

type MessagePartUpdatedEvent = Extract<Event, { type: "message.part.updated" }>;

// Throttle state per session (keyed by chatId)
const throttleState = new Map<string, {
    lastUpdateTime: number;
    pendingText: string | null;
    timerId: NodeJS.Timeout | null;
}>();

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

        // Validate text is not empty or whitespace-only
        if (!text || text.trim().length === 0) {
            console.log("Skipping empty or whitespace-only text update");
            return null;
        }

        const sessionKey = `${chatId}`;

        // Get or create throttle state for this session
        let state = throttleState.get(sessionKey);
        if (!state) {
            state = {
                lastUpdateTime: 0,
                pendingText: null,
                timerId: null
            };
            throttleState.set(sessionKey, state);
        }

        const now = Date.now();
        const timeSinceLastUpdate = now - state.lastUpdateTime;

        // Function to actually send the update
        const sendUpdate = async (textToSend: string) => {
            // Extra safety: validate text is not empty or whitespace-only
            if (!textToSend || textToSend.trim().length === 0) {
                console.log("Skipping sendUpdate with empty or whitespace-only text");
                return;
            }

            if (userSession.lastMessageId) {
                try {
                    await ctx.api.editMessageText(chatId, userSession.lastMessageId, textToSend, { parse_mode: "HTML" });
                } catch (err) {
                    // fallback to send and store id
                    const sent = await ctx.api.sendMessage(chatId, textToSend, { parse_mode: "HTML" });
                    userSession.lastMessageId = sent.message_id;
                }
            } else {
                const sent = await ctx.api.sendMessage(chatId, textToSend, { parse_mode: "HTML" });
                userSession.lastMessageId = sent.message_id;
                userSession.chatId = chatId;
            }
            state!.lastUpdateTime = Date.now();
            state!.pendingText = null;
        };

        // If 5 seconds have passed since last update, send immediately
        if (timeSinceLastUpdate >= 5000) {
            // Clear any pending timer
            if (state.timerId) {
                clearTimeout(state.timerId);
                state.timerId = null;
            }
            await sendUpdate(text);
        } else {
            // Store pending text
            state.pendingText = text;

            // Clear existing timer if any
            if (state.timerId) {
                clearTimeout(state.timerId);
            }

            // Set timer to send after the remaining time until 5 seconds from last update
            const delay = 5000 - timeSinceLastUpdate;
            state.timerId = setTimeout(async () => {
                if (state!.pendingText) {
                    await sendUpdate(state!.pendingText);
                }
                state!.timerId = null;
            }, delay);
        }

        return null;
    }

    console.log("Handled message.part.updated event:", part);
    return null;
}
