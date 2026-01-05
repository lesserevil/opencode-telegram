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
        bot.command("prompt", AccessControlMiddleware.requireAccess, this.handlePrompt.bind(this));
        bot.command("esc", AccessControlMiddleware.requireAccess, this.handleEsc.bind(this));
        bot.command("endsession", AccessControlMiddleware.requireAccess, this.handleEndSession.bind(this));
        
        // Handle keyboard button presses
        bot.hears("⏹️ ESC", AccessControlMiddleware.requireAccess, this.handleEsc.bind(this));
        bot.hears("⇥ TAB", AccessControlMiddleware.requireAccess, this.handleTab.bind(this));
        
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
                '👋 Welcome to TelegramCoder!',
                '',
                'Available commands:',
                '/esc - Abort the current AI operation (like pressing ESC)',
                '/start - Show this help message',
                '/help - Show this help message',
                '/opencode - Start an OpenCode AI session',
                '/prompt <message> - Send a prompt to OpenCode',
                '/endsession - End your current OpenCode session',
                '',
                '🤖 OpenCode AI:',
                '• Start a coding session with /opencode',
                '• Send prompts with /prompt <your message>',
                '• Get AI-powered coding assistance',
                '• Receive real-time updates as the AI works',
                '• Use /esc to abort current operation',
                '',
                '🚀 Get started by typing /opencode!'
            ].join('\n');

            const sentMessage = await ctx.reply(helpMessage);

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
                await ctx.reply("ℹ️ You already have an active OpenCode session. Use /prompt to send messages.");
                return;
            }

            // Create a new session
            const statusMessage = await ctx.reply("🔄 Starting OpenCode session...");

            try {
                // Try to create session
                let userSession;
                try {
                    userSession = await this.opencodeService.createSession(userId);
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

                        // Retry session creation
                        userSession = await this.opencodeService.createSession(userId);
                    } else {
                        throw error;
                    }
                }

                const successMessage = await ctx.api.editMessageText(
                    ctx.chat!.id,
                    statusMessage.message_id,
                    `✅ Session created!\n\nSession ID: <code>${userSession.sessionId}</code>\n\n` +
                    `Use /prompt &lt;your message&gt; to send prompts to OpenCode.\n\n` +
                    `💡 Use the ESC button below to abort operations.`,
                    { parse_mode: "HTML" }
                );

                // Send keyboard in a separate message
                await ctx.reply("🎛️ Control Panel:", {
                    reply_markup: this.createControlKeyboard()
                });

                // Store chat context and start event streaming
                const messageId = (typeof successMessage === "object" && successMessage && "message_id" in successMessage) ? (successMessage as any).message_id : statusMessage.message_id;
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

    private async handlePrompt(ctx: Context): Promise<void> {
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

            // Get the prompt text (everything after /prompt)
            const text = ctx.message?.text || "";
            const promptText = text.replace("/prompt", "").trim();

            if (!promptText) {
                await ctx.reply("❌ Please provide a prompt. Usage: /prompt <your message>");
                return;
            }

            await this.sendPromptToOpenCode(ctx, userId, promptText);
        } catch (error) {
            await ctx.reply(ErrorUtils.createErrorMessage("send prompt to OpenCode", error));
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
        // Send a status message
        const statusMessage = await ctx.reply("🔄 Sending prompt to OpenCode...");
        let messageDeleted = false;
        
        // Schedule deletion of status message
        const deleteTimeout = this.configService.getMessageDeleteTimeout();
        if (deleteTimeout > 0) {
            await MessageUtils.scheduleMessageDeletion(
                ctx,
                statusMessage.message_id,
                deleteTimeout
            );
        }

        try {
            const response = await this.opencodeService.sendPrompt(userId, promptText);

            // Check if response is markdown (contains markdown formatting)
            const isMarkdown = this.isMarkdownContent(response);
            
            if (isMarkdown) {
                // Delete status message
                try {
                    await ctx.api.deleteMessage(ctx.chat!.id, statusMessage.message_id);
                    messageDeleted = true;
                } catch (e) {
                    // Message might already be deleted
                }
                
                // Send as markdown file
                const buffer = Buffer.from(response, 'utf-8');
                await ctx.replyWithDocument(new InputFile(buffer, "response.md"));
                return;
            }

            // Split response if it's too long (Telegram has a 4096 character limit)
            const maxLength = 4000;
            if (response.length <= maxLength) {
                try {
                    await ctx.api.editMessageText(
                        ctx.chat!.id,
                        statusMessage.message_id,
                        this.escapeHtml(response),
                        { parse_mode: "HTML" }
                    );
                } catch (e) {
                    // Message might have been deleted, send as new message
                    await ctx.reply(this.escapeHtml(response), { parse_mode: "HTML" });
                    messageDeleted = true;
                }

                // Schedule deletion after showing the response
                if (deleteTimeout > 0 && !messageDeleted) {
                    await MessageUtils.scheduleMessageDeletion(
                        ctx,
                        statusMessage.message_id,
                        deleteTimeout
                    );
                }
            } else {
                // Delete status message immediately and send response in chunks
                try {
                    await ctx.api.deleteMessage(ctx.chat!.id, statusMessage.message_id);
                    messageDeleted = true;
                } catch (e) {
                    // Message might already be deleted
                }

                const chunks = this.splitIntoChunks(response, maxLength);
                for (const chunk of chunks) {
                    await ctx.reply(this.escapeHtml(chunk), { parse_mode: "HTML" });
                }
            }

        } catch (error) {
            // Try to edit the status message with the error, but only if it wasn't deleted
            if (!messageDeleted) {
                try {
                    await ctx.api.editMessageText(
                        ctx.chat!.id,
                        statusMessage.message_id,
                        ErrorUtils.createErrorMessage("send prompt to OpenCode", error)
                    );
                } catch (e) {
                    // Message was deleted, send error as new message
                    await ctx.reply(ErrorUtils.createErrorMessage("send prompt to OpenCode", error));
                }
            } else {
                // Message already deleted, send error as new message
                await ctx.reply(ErrorUtils.createErrorMessage("send prompt to OpenCode", error));
            }
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
                await ctx.reply("✅ OpenCode session ended successfully.");
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

            // Show temporary status message
            const statusMessage = await ctx.reply("🔄 Cycling to next agent...");

            try {
                // Cycle to next agent
                const result = await this.opencodeService.cycleToNextAgent(userId);

                if (result.success && result.currentAgent) {
                    // Get list of available agents for context
                    const agents = await this.opencodeService.getAvailableAgents();
                    const agentList = agents.map(a => `• ${a.name}${a.description ? `: ${a.description}` : ''}`).join('\n');

                    await ctx.api.editMessageText(
                        ctx.chat!.id,
                        statusMessage.message_id,
                        `⇥ Switched to agent: <b>${result.currentAgent}</b>\n\n` +
                        `Available primary agents:\n${agentList || 'No agents available'}`,
                        { parse_mode: "HTML" }
                    );
                } else {
                    await ctx.api.editMessageText(
                        ctx.chat!.id,
                        statusMessage.message_id,
                        "⚠️ Failed to cycle agent. Please try again."
                    );
                }
            } catch (error) {
                await ctx.api.editMessageText(
                    ctx.chat!.id,
                    statusMessage.message_id,
                    ErrorUtils.createErrorMessage("cycle agent", error)
                );
            }
        } catch (error) {
            await ctx.reply(ErrorUtils.createErrorMessage("handle TAB", error));
        }
    }
}
