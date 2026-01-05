import type { Context } from "grammy";

let updateMessageId: number | null = null;
let lastUpdateTime = 0;
let deleteTimeout: NodeJS.Timeout | null = null;

export async function handleTextPart(ctx: Context, text: string): Promise<void> {
    try {
        const now = Date.now();
        
        // Clear existing delete timeout
        if (deleteTimeout) {
            clearTimeout(deleteTimeout);
            deleteTimeout = null;
        }

        // Throttle: Check if 1 second has passed since last update
        const timeSinceLastUpdate = now - lastUpdateTime;
        if (updateMessageId && timeSinceLastUpdate < 1000) {
            // Skip this update, but still set the delete timeout
            deleteTimeout = setTimeout(() => {
                deleteTextMessage(ctx);
            }, 5000);
            return;
        }

        // Update the last update time
        lastUpdateTime = now;

        if (!updateMessageId) {
            // First message - send new message
            const sentMessage = await ctx.reply(text);
            updateMessageId = sentMessage.message_id;
        } else {
            // Subsequent updates - edit existing message
            await ctx.api.editMessageText(
                ctx.chat!.id,
                updateMessageId,
                text
            );
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