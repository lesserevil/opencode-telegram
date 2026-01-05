import type { Event } from "@opencode-ai/sdk";
import type { Context } from "grammy";
import type { UserSession } from "../opencode.types.js";

type MessagePartUpdatedEvent = Extract<Event, { type: "message.part.updated" }>;

let updateMessageId: number | null = null;
let lastUpdateTime = 0;
let deleteTimeout: NodeJS.Timeout | null = null;

let reasoningMessageId: number | null = null;
let reasoningDeleteTimeout: NodeJS.Timeout | null = null;

let toolMessageId: number | null = null;
let toolDeleteTimeout: NodeJS.Timeout | null = null;

export default async function messagePartUpdatedHandler(
    event: MessagePartUpdatedEvent,
    ctx: Context,
    userSession: UserSession
): Promise<string | null> {
    try {
        const { part } = event.properties;
        
        // Handle reasoning parts separately
        if (part.type === "reasoning") {
            return await handleReasoningPart(ctx);
        }
        
        // Handle tool calls separately
        if (part.type === "tool") {
            return await handleToolPart(ctx, part);
        }
        
        // Only process text parts
        if (part.type !== "text") {
            return null;
        }

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
                deleteMessage(ctx);
            }, 5000);
            return null;
        }

        // Update the last update time
        lastUpdateTime = now;

        if (!updateMessageId) {
            // First message - send new message
            const sentMessage = await ctx.reply(part.text);
            updateMessageId = sentMessage.message_id;
        } else {
            // Subsequent updates - edit existing message
            await ctx.api.editMessageText(
                ctx.chat!.id,
                updateMessageId,
                part.text
            );
        }

        // Set timeout to delete message after 5 seconds of no updates
        deleteTimeout = setTimeout(() => {
            deleteMessage(ctx);
        }, 5000);

    } catch (error) {
        console.log("Error in message.part.updated handler:", error);
    }

    return null;
}

async function deleteMessage(ctx: Context): Promise<void> {
    try {
        if (updateMessageId) {
            await ctx.api.deleteMessage(ctx.chat!.id, updateMessageId);
            updateMessageId = null;
        }
    } catch (error) {
        console.log("Error deleting message:", error);
    }
}

async function handleReasoningPart(ctx: Context): Promise<null> {
    try {
        // Clear existing reasoning delete timeout
        if (reasoningDeleteTimeout) {
            clearTimeout(reasoningDeleteTimeout);
            reasoningDeleteTimeout = null;
        }

        if (!reasoningMessageId) {
            // Send reasoning message
            const sentMessage = await ctx.reply("Reasoning");
            reasoningMessageId = sentMessage.message_id;
        }

        // Set timeout to delete message after 2.5 seconds (half of 5 seconds)
        reasoningDeleteTimeout = setTimeout(async () => {
            try {
                if (reasoningMessageId) {
                    await ctx.api.deleteMessage(ctx.chat!.id, reasoningMessageId);
                    reasoningMessageId = null;
                }
            } catch (error) {
                console.log("Error deleting reasoning message:", error);
            }
        }, 2500);

    } catch (error) {
        console.log("Error in reasoning part handler:", error);
    }

    return null;
}

async function handleToolPart(ctx: Context, part: any): Promise<null> {
    try {
        // Clear existing tool delete timeout
        if (toolDeleteTimeout) {
            clearTimeout(toolDeleteTimeout);
            toolDeleteTimeout = null;
        }

        if (!toolMessageId && part.tool) {
            // Send tool name message
            const sentMessage = await ctx.reply(`🔧 ${part.tool}`);
            toolMessageId = sentMessage.message_id;
        }

        // Set timeout to delete message after 2.5 seconds (half of 5 seconds)
        toolDeleteTimeout = setTimeout(async () => {
            try {
                if (toolMessageId) {
                    await ctx.api.deleteMessage(ctx.chat!.id, toolMessageId);
                    toolMessageId = null;
                }
            } catch (error) {
                console.log("Error deleting tool message:", error);
            }
        }, 2500);

    } catch (error) {
        console.log("Error in tool part handler:", error);
    }

    return null;
}
