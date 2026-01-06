import type { Context } from "grammy";
import { escapeMarkdownV2 } from "../utils.js";

let updateMessageId: number | null = null;
let lastUpdateTime = 0;
let deleteTimeout: NodeJS.Timeout | null = null;
let latestText = "";

export async function handleTextPart(ctx: Context, text: string): Promise<void> {
    try {
        const now = Date.now();
        
        // Clear existing delete timeout
        if (deleteTimeout) {
            clearTimeout(deleteTimeout);
            deleteTimeout = null;
        }

        // Store the latest text (escaped for MarkdownV2)
        latestText = escapeMarkdownV2(text);

        if (!updateMessageId) {
            // First message - send new message
            const sentMessage = await ctx.reply(latestText, { parse_mode: "MarkdownV2" });
            updateMessageId = sentMessage.message_id;
            lastUpdateTime = now; // Set time AFTER sending
        } else {
            // Throttle: Check if 2 seconds have passed since last update
            const timeSinceLastUpdate = now - lastUpdateTime;
            if (timeSinceLastUpdate < 2000) {
                // Skip this update (text is stored in latestText for later)
                // Set timeout to delete after 5 seconds of no new updates
                deleteTimeout = setTimeout(() => {
                    deleteTextMessage(ctx);
                }, 5000);
                return;
            }
            
            // Update immediately if enough time has passed
            await ctx.api.editMessageText(
                ctx.chat!.id,
                updateMessageId,
                latestText,
                { parse_mode: "MarkdownV2" }
            );
            lastUpdateTime = now; // Update time AFTER sending
        }

        // Set timeout to delete message after 5 seconds of no updates
        deleteTimeout = setTimeout(() => {
            deleteTextMessage(ctx);
        }, 5000);

    } catch (error) {
        console.log("Error in text part handler:", error);
    }
}

async function deleteTextMessage(ctx: Context): Promise<void> {
    try {
        if (updateMessageId) {
            await ctx.api.deleteMessage(ctx.chat!.id, updateMessageId);
            updateMessageId = null;
        }
    } catch (error) {
        console.log("Error deleting text message:", error);
    }
}