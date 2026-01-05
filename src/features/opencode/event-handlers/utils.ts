export function escapeHtml(text: string): string {
    return String(text)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

export async function sendAndAutoDelete(
    ctx: any,
    message: string,
    deleteAfterMs: number = 2500
): Promise<void> {
    try {
        const sentMessage = await ctx.reply(message);
        setTimeout(async () => {
            try {
                await ctx.api.deleteMessage(ctx.chat!.id, sentMessage.message_id);
            } catch (error) {
                console.log("Error deleting auto-delete message:", error);
            }
        }, deleteAfterMs);
    } catch (error) {
        console.log("Error sending auto-delete message:", error);
    }
}
