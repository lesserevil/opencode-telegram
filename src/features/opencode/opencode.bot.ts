import { Bot, Context, InputFile, Keyboard } from "grammy";
import { OpenCodeService } from "./opencode.service.js";
import { ConfigService } from "../../services/config.service.js";
import { OpenCodeServerService } from "../../services/opencode-server.service.js";
import { AccessControlMiddleware } from "../../middleware/access-control.middleware.js";
import { MessageUtils } from "../../utils/message.utils.js";
import { ErrorUtils } from "../../utils/error.utils.js";

export class OpenCodeBot {
    private opencodeService: OpenCodeService;
    private configService: ConfigService;
    private serverService: OpenCodeServerService;

    constructor(
        opencodeService: OpenCodeService,
        configService: ConfigService
    ) {
        this.opencodeService = opencodeService;
        this.configService = configService;
        this.serverService = new OpenCodeServerService();
    }

    private createControlKeyboard(): Keyboard {
        return new Keyboard()
            .text("⏹️ ESC")
            .text("⇥ TAB")
            .resized()
            .persistent();
    }

    registerHandlers(bot: Bot): void {
        bot.command("start", AccessControlMiddleware.requireAccess, this.handleStart.bind(this));
        bot.command("help", AccessControlMiddleware.requireAccess, this.handleStart.bind(this));
        bot.command("opencode", AccessControlMiddleware.requireAccess, this.handleOpenCode.bind(this));
        bot.command("esc", AccessControlMiddleware.requireAccess, this.handleEsc.bind(this));
        bot.command("endsession", AccessControlMiddleware.requireAccess, this.handleEndSession.bind(this));
        bot.command("rename", AccessControlMiddleware.requireAccess, this.handleRename.bind(this));
        
        // Handle keyboard button presses
        bot.hears("⏹️ ESC", AccessControlMiddleware.requireAccess, this.handleEsc.bind(this));
        bot.hears("⇥ TAB", AccessControlMiddleware.requireAccess, this.handleTab.bind(this));
        
        // Handle inline button callbacks
        bot.callbackQuery("esc", AccessControlMiddleware.requireAccess, this.handleEscButton.bind(this));
        bot.callbackQuery("tab", AccessControlMiddleware.requireAccess, this.handleTabButton.bind(this));
        
        // Handle regular messages (non-commands) as prompts
        bot.on("message:text", AccessControlMiddleware.requireAccess, async (ctx, next) => {
            // Skip if it's a command
            if (ctx.message?.text?.startsWith("/")) {
                return next();
            }
            // Skip if it's a keyboard button
            if (ctx.message?.text === "⏹️ ESC" || ctx.message?.text === "⇥ TAB") {
                return next();
            }
            // Treat as prompt
            await this.handleMessageAsPrompt(ctx);
        });
    }

    private async handleStart(ctx: Context): Promise<void> {
        try {
            const helpMessage = [
                '👋 <b>Welcome to TelegramCoder!</b>',
                '',
                '🎯 <b>Session Commands:</b>',
                '/opencode [title] - Start a new OpenCode AI session',
                '   Example: /opencode Fix login bug',
                '/rename &lt;title&gt; - Rename your current session',
                '   Example: /rename Updated task name',
                '/endsession - End and close your current session',
                '',
                '⚡️ <b>Control Commands:</b>',
                '/esc - Abort the current AI operation',
                '⇥ TAB button - Cycle between agents (build ↔ plan)',
                '⏹️ ESC button - Same as /esc command',
                '',
                '💬 <b>How to Use:</b>',
                '1. Start: /opencode My Project',
                '2. Chat: Just send messages directly',
                '3. Control: Use ESC/TAB buttons on session message',
                '4. Rename: /rename New Name (anytime)',
                '5. End: /endsession when done',
                '',
                '🤖 <b>Agents Available:</b>',
                '• <b>build</b> - Implements code and makes changes',
                '• <b>plan</b> - Plans and analyzes without editing',
                '',
                '📋 <b>Help Commands:</b>',
                '/start - Show this help message',
                '/help - Show this help message',
                '',
                '💡 <b>Tips:</b>',
                '• Session messages auto-delete after 10 seconds',
                '• Tab between build/plan agents as needed',
                '• Use descriptive titles for better organization',
                '• All messages go directly to the AI (no /prompt needed)',
                '',
                '🚀 <b>Get started:</b> /opencode'
            ].join('\n');

            const sentMessage = await ctx.reply(helpMessage, { parse_mode: "HTML" });

            const deleteTimeout = this.configService.getMessageDeleteTimeout();
            if (deleteTimeout > 0 && sentMessage) {
                await MessageUtils.scheduleMessageDeletion(
                    ctx,
                    sentMessage.message_id,
                    deleteTimeout
                );
            }
        } catch (error) {
            await ctx.reply(ErrorUtils.createErrorMessage('show help message', error));
        }
    }

    private async handleOpenCode(ctx: Context): Promise<void> {
        try {
            const userId = ctx.from?.id;
            if (!userId) {
                await ctx.reply("❌ Unable to identify user");
                return;
            }

            // Check if user already has an active session
            if (this.opencodeService.hasActiveSession(userId)) {
                const message = await ctx.reply("✅ Session already started", {
                    reply_markup: {
                        inline_keyboard: [
                            [
                                { text: "⏹️ ESC", callback_data: "esc" },
                                { text: "⇥ TAB", callback_data: "tab" }
                            ]
                        ]
                    }
                });
                
                // Schedule auto-deletion
                await MessageUtils.scheduleMessageDeletion(
                    ctx,
                    message.message_id,
                    this.configService.getMessageDeleteTimeout()
                );
                return;
            }

            // Extract title from command text (everything after /opencode)
            const text = ctx.message?.text || "";
            const title = text.replace("/opencode", "").trim() || undefined;

            // Create a new session
            const statusMessage = await ctx.reply("🔄 Starting OpenCode session...");

            try {
                // Try to create session with optional title
                let userSession;
                try {
                    userSession = await this.opencodeService.createSession(userId, title);
                } catch (error) {
                    // Check if it's a connection error
                    if (error instanceof Error && (error.message.includes('Cannot connect to OpenCode server'))) {
                        // Try to start the server automatically
                        await ctx.api.editMessageText(
                            ctx.chat!.id,
                            statusMessage.message_id,
                            "🔄 OpenCode server not running. Starting server...\n\nThis may take up to 30 seconds."
                        );

                        const startResult = await this.serverService.startServer();

                        if (!startResult.success) {
                            await ctx.api.editMessageText(
                                ctx.chat!.id,
                                statusMessage.message_id,
                                `❌ Failed to start OpenCode server.\n\n${startResult.message}\n\nPlease start the server manually using:\n<code>opencode serve</code>`,
                                { parse_mode: "HTML" }
                            );
                            return;
                        }

                        // Update status
                        await ctx.api.editMessageText(
                            ctx.chat!.id,
                            statusMessage.message_id,
                            "✅ OpenCode server started!\n\n🔄 Creating session..."
                        );

                        // Retry session creation with title
                        userSession = await this.opencodeService.createSession(userId, title);
                    } else {
                        throw error;
                    }
                }

                const successMessage = await ctx.api.editMessageText(
                    ctx.chat!.id,
                    statusMessage.message_id,
                    "✅ Session started",
                    {
                        reply_markup: {
                            inline_keyboard: [
                                [
                                    { text: "⏹️ ESC", callback_data: "esc" },
                                    { text: "⇥ TAB", callback_data: "tab" }
                                ]
                            ]
                        }
                    }
                );

                // Schedule auto-deletion of the session started message
                const messageId = (typeof successMessage === "object" && successMessage && "message_id" in successMessage) ? (successMessage as any).message_id : statusMessage.message_id;
                await MessageUtils.scheduleMessageDeletion(
                    ctx,
                    messageId,
                    this.configService.getMessageDeleteTimeout()
                );

                // Store chat context and start event streaming
                this.opencodeService.updateSessionContext(userId, ctx.chat!.id, messageId);

                // Start event streaming in background
                this.opencodeService.startEventStream(userId, ctx).catch(error => {
                    console.error("Event stream error:", error);
                });
            } catch (error) {
                await ctx.api.editMessageText(
                    ctx.chat!.id,
                    statusMessage.message_id,
                    ErrorUtils.createErrorMessage("start OpenCode session", error)
                );
            }
        } catch (error) {
            await ctx.reply(ErrorUtils.createErrorMessage("start OpenCode session", error));
        }
    }

    private async handleMessageAsPrompt(ctx: Context): Promise<void> {
        try {
            const userId = ctx.from?.id;
            if (!userId) {
                await ctx.reply("❌ Unable to identify user");
                return;
            }

            // Check if user has an active session
            if (!this.opencodeService.hasActiveSession(userId)) {
                await ctx.reply("❌ No active OpenCode session. Use /opencode to start a session first.");
                return;
            }

            const promptText = ctx.message?.text?.trim() || "";

            if (!promptText) {
                return;
            }

            await this.sendPromptToOpenCode(ctx, userId, promptText);
        } catch (error) {
            await ctx.reply(ErrorUtils.createErrorMessage("send prompt to OpenCode", error));
        }
    }

    private async sendPromptToOpenCode(ctx: Context, userId: number, promptText: string): Promise<void> {
        try {
            const response = await this.opencodeService.sendPrompt(userId, promptText);

            // Check if response is markdown (contains markdown formatting)
            const isMarkdown = this.isMarkdownContent(response);
            
            if (isMarkdown) {
                // Send as markdown file
                const buffer = Buffer.from(response, 'utf-8');
                await ctx.replyWithDocument(new InputFile(buffer, "response.md"));
                return;
            }

            // Split response if it's too long (Telegram has a 4096 character limit)
            const maxLength = 4000;
            if (response.length <= maxLength) {
                await ctx.reply(this.escapeHtml(response), { parse_mode: "HTML" });
            } else {
                const chunks = this.splitIntoChunks(response, maxLength);
                for (const chunk of chunks) {
                    await ctx.reply(this.escapeHtml(chunk), { parse_mode: "HTML" });
                }
            }

        } catch (error) {
            await ctx.reply(ErrorUtils.createErrorMessage("send prompt to OpenCode", error));
        }
    }

    private isMarkdownContent(text: string): boolean {
        // If first character is a hash, it's markdown
        return text.trimStart().startsWith('#');
    }

    private escapeHtml(text: string): string {
        return text
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;");
    }

    private splitIntoChunks(text: string, maxLength: number): string[] {
        const chunks: string[] = [];
        let currentChunk = "";

        const lines = text.split("\n");
        for (const line of lines) {
            if (currentChunk.length + line.length + 1 > maxLength) {
                if (currentChunk) {
                    chunks.push(currentChunk);
                }
                currentChunk = line;
            } else {
                if (currentChunk) {
                    currentChunk += "\n" + line;
                } else {
                    currentChunk = line;
                }
            }
        }

        if (currentChunk) {
            chunks.push(currentChunk);
        }

        return chunks;
    }

    private async handleEndSession(ctx: Context): Promise<void> {
        try {
            const userId = ctx.from?.id;
            if (!userId) {
                await ctx.reply("❌ Unable to identify user");
                return;
            }

            if (!this.opencodeService.hasActiveSession(userId)) {
                await ctx.reply("ℹ️ You don't have an active OpenCode session. Use /opencode to start one.");
                return;
            }

            const success = await this.opencodeService.deleteSession(userId);

            if (success) {
                const sentMessage = await ctx.reply("✅ OpenCode session ended successfully.");
                const deleteTimeout = this.configService.getMessageDeleteTimeout();
                if (deleteTimeout > 0 && sentMessage) {
                    await MessageUtils.scheduleMessageDeletion(
                        ctx,
                        sentMessage.message_id,
                        deleteTimeout
                    );
                }
            } else {
                await ctx.reply("⚠️ Failed to end session. It may have already been closed.");
            }
        } catch (error) {
            await ctx.reply(ErrorUtils.createErrorMessage("end OpenCode session", error));
        }
    }

    private async handleEsc(ctx: Context): Promise<void> {
        try {
            const userId = ctx.from?.id;
            if (!userId) {
                await ctx.reply("❌ Unable to identify user");
                return;
            }

            if (!this.opencodeService.hasActiveSession(userId)) {
                await ctx.reply("ℹ️ You don't have an active OpenCode session. Use /opencode to start one.");
                return;
            }

            const success = await this.opencodeService.abortSession(userId);

            if (success) {
                await ctx.reply("⏹️ Current operation aborted successfully.");
            } else {
                await ctx.reply("⚠️ Failed to abort operation. Please try again.");
            }
        } catch (error) {
            await ctx.reply(ErrorUtils.createErrorMessage("abort OpenCode operation", error));
        }
    }

    private async handleTab(ctx: Context): Promise<void> {
        try {
            const userId = ctx.from?.id;
            if (!userId) {
                await ctx.reply("❌ Unable to identify user");
                return;
            }

            if (!this.opencodeService.hasActiveSession(userId)) {
                await ctx.reply("ℹ️ You don't have an active OpenCode session. Use /opencode to start one.");
                return;
            }

            try {
                // Cycle to next agent
                const result = await this.opencodeService.cycleToNextAgent(userId);

                if (result.success && result.currentAgent) {
                    // Show simple agent name message
                    const message = await ctx.reply(`⇥ <b>${result.currentAgent}</b>`, { parse_mode: "HTML" });
                    
                    // Schedule auto-deletion
                    await MessageUtils.scheduleMessageDeletion(
                        ctx,
                        message.message_id,
                        this.configService.getMessageDeleteTimeout()
                    );
                } else {
                    const errorMsg = await ctx.reply("⚠️ Failed to cycle agent. Please try again.");
                    await MessageUtils.scheduleMessageDeletion(
                        ctx,
                        errorMsg.message_id,
                        this.configService.getMessageDeleteTimeout()
                    );
                }
            } catch (error) {
                const errorMsg = await ctx.reply(ErrorUtils.createErrorMessage("cycle agent", error));
                await MessageUtils.scheduleMessageDeletion(
                    ctx,
                    errorMsg.message_id,
                    this.configService.getMessageDeleteTimeout()
                );
            }
        } catch (error) {
            await ctx.reply(ErrorUtils.createErrorMessage("handle TAB", error));
        }
    }

    private async handleEscButton(ctx: Context): Promise<void> {
        try {
            // Answer the callback query to remove loading state
            await ctx.answerCallbackQuery();
            
            // Call the same handler as the ESC command/keyboard
            await this.handleEsc(ctx);
        } catch (error) {
            await ctx.answerCallbackQuery("Error handling ESC");
            console.error("Error in handleEscButton:", error);
        }
    }

    private async handleTabButton(ctx: Context): Promise<void> {
        try {
            // Answer the callback query to remove loading state
            await ctx.answerCallbackQuery();
            
            // Call the same handler as the TAB keyboard
            await this.handleTab(ctx);
        } catch (error) {
            await ctx.answerCallbackQuery("Error handling TAB");
            console.error("Error in handleTabButton:", error);
        }
    }

    private async handleRename(ctx: Context): Promise<void> {
        try {
            const userId = ctx.from?.id;
            if (!userId) {
                await ctx.reply("❌ Unable to identify user");
                return;
            }

            // Check if user has an active session
            if (!this.opencodeService.hasActiveSession(userId)) {
                await ctx.reply("❌ No active session. Use /opencode to start one first.");
                return;
            }

            // Extract new title from command text
            const text = ctx.message?.text || "";
            const newTitle = text.replace("/rename", "").trim();

            if (!newTitle) {
                await ctx.reply("❌ Please provide a new title.\n\nUsage: /rename <new title>");
                return;
            }

            // Update the session title
            const result = await this.opencodeService.updateSessionTitle(userId, newTitle);

            if (result.success) {
                const message = await ctx.reply(`✅ Session renamed to: <b>${newTitle}</b>`, { parse_mode: "HTML" });
                
                // Schedule auto-deletion
                await MessageUtils.scheduleMessageDeletion(
                    ctx,
                    message.message_id,
                    this.configService.getMessageDeleteTimeout()
                );
            } else {
                await ctx.reply(`❌ ${result.message || "Failed to rename session"}`);
            }
        } catch (error) {
            await ctx.reply(ErrorUtils.createErrorMessage("rename session", error));
        }
    }
}
