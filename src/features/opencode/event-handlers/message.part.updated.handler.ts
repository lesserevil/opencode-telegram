import type { Event } from "@opencode-ai/sdk";
import type { Context } from "grammy";
import type { UserSession } from "../opencode.types.js";
import { escapeHtml } from "./utils.js";
import { MessageUtils } from "../../../utils/message.utils.js";

type MessagePartUpdatedEvent = Extract<Event, { type: "message.part.updated" }>;

// State per session (keyed by sessionId-chatId)
const sessionState = new Map<string, {
    messageId: number | null;
    deleteTimer: NodeJS.Timeout | null;
    lastReasoningTime: number;
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
    
    // Filter events - only handle events for this user's session
    if (part.sessionID !== userSession.sessionId) {
        console.log(`Skipping event for different session: ${part.sessionID} (expected: ${userSession.sessionId})`);
        return null;
    }
    
    const chatId = ctx.chat?.id ?? userSession.chatId;
    if (!chatId) {
        console.log("No chat id available for message.part.updated event");
        return null;
    }

    // Use both sessionId and chatId for unique key
    const sessionKey = `${userSession.sessionId}-${chatId}`;

    // Get or create state for this session
    let state = sessionState.get(sessionKey);
    if (!state) {
        state = {
            messageId: null,
            deleteTimer: null,
            lastReasoningTime: 0
        };
        sessionState.set(sessionKey, state);
    }

    if (part.type === "reasoning") {
        // Debounce: only send if 5 seconds have passed since last reasoning message
        const now = Date.now();
        const timeSinceLastReasoning = now - state.lastReasoningTime;
        
        if (timeSinceLastReasoning < 5000) {
            console.log("Skipping reasoning message (debounced)");
            return null;
        }
        
        state.lastReasoningTime = now;
        
        const msg = await ctx.api.sendMessage(chatId, "💭 Reasoning...");
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

        // Clear existing delete timer
        if (state.deleteTimer) {
            clearTimeout(state.deleteTimer);
            state.deleteTimer = null;
        }

        // If no message exists, send one
        if (!state.messageId) {
            try {
                const sent = await ctx.api.sendMessage(chatId, text, { parse_mode: "HTML" });
                state.messageId = sent.message_id;
                console.log(`Created new message ${sent.message_id} for session ${sessionKey}`);
            } catch (err) {
                console.error("Failed to send message:", err);
                return null;
            }
        } else {
            // Message exists, update it
            try {
                await ctx.api.editMessageText(chatId, state.messageId, text, { parse_mode: "HTML" });
                console.log(`Updated message ${state.messageId} for session ${sessionKey}`);
            } catch (err) {
                // If edit fails (message might be deleted), send new message
                console.error(`Failed to edit message ${state.messageId}, creating new one:`, err);
                try {
                    const sent = await ctx.api.sendMessage(chatId, text, { parse_mode: "HTML" });
                    state.messageId = sent.message_id;
                    console.log(`Created fallback message ${sent.message_id} for session ${sessionKey}`);
                } catch (sendErr) {
                    console.error("Failed to send fallback message:", sendErr);
                    return null;
                }
            }
        }

        // Set timer to delete message after 10 seconds of no updates
        state.deleteTimer = setTimeout(async () => {
            if (state!.messageId) {
                try {
                    await ctx.api.deleteMessage(chatId, state!.messageId);
                    console.log(`Deleted message ${state!.messageId} after timeout for session ${sessionKey}`);
                } catch (err) {
                    console.error("Failed to delete message:", err);
                }
                state!.messageId = null;
            }
            state!.deleteTimer = null;
        }, 10000);

        return null;
    }

    console.log("Handled message.part.updated event:", part);
    return null;
}
