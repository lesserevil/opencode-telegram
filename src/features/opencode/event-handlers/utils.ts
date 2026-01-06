export function escapeHtml(text: string): string {
    return String(text)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

export function escapeMarkdownV2(text: string): string {
    // Escape special characters for Telegram's MarkdownV2
    // BUT preserve common markdown formatting patterns
    
    // First, protect markdown patterns by temporarily replacing them
    const protectedPatterns: Array<[RegExp, string, string]> = [
        [/```[\s\S]*?```/g, '___CODE_BLOCK___', ''], // Code blocks
        [/`[^`]+`/g, '___INLINE_CODE___', ''], // Inline code
        [/\*\*[^*]+\*\*/g, '___BOLD___', ''], // Bold
        [/\*[^*]+\*/g, '___ITALIC___', ''], // Italic
        [/\[[^\]]+\]\([^)]+\)/g, '___LINK___', ''], // Links
    ];
    
    const protectedTexts: string[] = [];
    let protectedText = text;
    
    // Extract and protect markdown patterns
    protectedPatterns.forEach(([pattern, placeholder]) => {
        const matches = protectedText.match(pattern) || [];
        matches.forEach((match) => {
            protectedTexts.push(match);
            protectedText = protectedText.replace(match, `${placeholder}${protectedTexts.length - 1}___`);
        });
    });
    
    // Now escape special characters in the remaining text
    protectedText = protectedText
        .replace(/\\/g, '\\\\')  // Backslash must be escaped first
        .replace(/_/g, '\\_')
        .replace(/\*/g, '\\*')
        .replace(/\[/g, '\\[')
        .replace(/\]/g, '\\]')
        .replace(/\(/g, '\\(')
        .replace(/\)/g, '\\)')
        .replace(/~/g, '\\~')
        .replace(/`/g, '\\`')
        .replace(/>/g, '\\>')
        .replace(/#/g, '\\#')
        .replace(/\+/g, '\\+')
        .replace(/-/g, '\\-')
        .replace(/=/g, '\\=')
        .replace(/\|/g, '\\|')
        .replace(/\{/g, '\\{')
        .replace(/\}/g, '\\}')
        .replace(/\./g, '\\.')
        .replace(/!/g, '\\!');
    
    // Restore protected markdown patterns
    protectedPatterns.forEach(([, placeholder]) => {
        for (let i = protectedTexts.length - 1; i >= 0; i--) {
            const placeholderWithIndex = `${placeholder}${i}___`;
            if (protectedText.includes(placeholderWithIndex)) {
                protectedText = protectedText.replace(placeholderWithIndex, protectedTexts[i]);
            }
        }
    });
    
    return protectedText;
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
