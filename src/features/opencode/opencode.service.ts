import { createOpencodeClient } from "@opencode-ai/sdk";
import type { Event } from "@opencode-ai/sdk";
import type { Context } from "grammy";
import type { UserSession } from "./opencode.types.js";
import { processEvent } from "./opencode.event-handlers.js";

export class OpenCodeService {
    private userSessions: Map<number, UserSession> = new Map();
    private baseUrl: string;
    private eventAbortControllers: Map<number, AbortController> = new Map();

    constructor(baseUrl?: string) {
        this.baseUrl = baseUrl || process.env.OPENCODE_SERVER_URL || "http://localhost:4096";
    }

    async createSession(userId: number, title?: string): Promise<UserSession> {
        const client = createOpencodeClient({ baseUrl: this.baseUrl });

        try {
            const result = await client.session.create({
                body: { title: title || `Telegram Session ${new Date().toISOString()}` },
            });

            if (!result.data) {
                throw new Error("Failed to create session");
            }

            const userSession: UserSession = {
                userId,
                sessionId: result.data.id,
                session: result.data,
                createdAt: new Date(),
            };

            this.userSessions.set(userId, userSession);
            return userSession;
        } catch (error) {
            // Provide more helpful error message for connection failures
            if (error instanceof Error && (error.message.includes('fetch failed') || error.message.includes('ECONNREFUSED'))) {
                throw new Error(`Cannot connect to OpenCode server at ${this.baseUrl}. Please ensure:\n1. OpenCode server is running\n2. OPENCODE_SERVER_URL is configured correctly in .env file`);
            }
            throw error;
        }
    }

    getUserSession(userId: number): UserSession | undefined {
        return this.userSessions.get(userId);
    }

    updateSessionContext(userId: number, chatId: number, messageId: number): void {
        const session = this.userSessions.get(userId);
        if (session) {
            session.chatId = chatId;
            session.lastMessageId = messageId;
        }
    }

    async startEventStream(userId: number, ctx: Context): Promise<void> {
        const userSession = this.getUserSession(userId);
        if (!userSession || !userSession.chatId) {
            return;
        }

        // Stop any existing event stream for this user
        this.stopEventStream(userId);

        const abortController = new AbortController();
        this.eventAbortControllers.set(userId, abortController);

        const client = createOpencodeClient({ baseUrl: this.baseUrl });

        try {
            const events = await client.event.subscribe();

            for await (const event of events.stream) {
                if (abortController.signal.aborted) {
                    break;
                }

                // Process event through handler
                await processEvent(event, ctx, userSession);
            }
        } catch (error) {
            console.error("Event stream error:", error);
        } finally {
            this.eventAbortControllers.delete(userId);
        }
    }

    stopEventStream(userId: number): void {
        const controller = this.eventAbortControllers.get(userId);
        if (controller) {
            controller.abort();
            this.eventAbortControllers.delete(userId);
        }
    }

    async sendPrompt(userId: number, text: string): Promise<string> {
        const userSession = this.getUserSession(userId);

        if (!userSession) {
            throw new Error("No active session. Please use /opencode to start a session first.");
        }

        const client = createOpencodeClient({ baseUrl: this.baseUrl });

        try {
            const result = await client.session.prompt({
                path: { id: userSession.sessionId },
                body: {
                    parts: [{ type: "text", text }],
                },
            });

            if (!result.data) {
                throw new Error("Failed to send prompt");
            }

            // Extract text from response parts
            const textParts = result.data.parts
                ?.filter((part) => part.type === "text")
                .map((part) => part.text)
                .join("\n");

            return textParts || "No response received";
        } catch (error) {
            // Provide more helpful error message for connection failures
            if (error instanceof Error && (error.message.includes('fetch failed') || error.message.includes('ECONNREFUSED'))) {
                throw new Error(`Cannot connect to OpenCode server at ${this.baseUrl}. Please ensure the OpenCode server is running.`);
            }
            throw error;
        }
    }

    async deleteSession(userId: number): Promise<boolean> {
        const userSession = this.getUserSession(userId);

        if (!userSession) {
            return false;
        }

        // Stop event stream first
        this.stopEventStream(userId);

        const client = createOpencodeClient({ baseUrl: this.baseUrl });

        try {
            await client.session.delete({
                path: { id: userSession.sessionId },
            });
            this.userSessions.delete(userId);
            return true;
        } catch (error) {
            console.error(`Failed to delete session for user ${userId}:`, error);
            return false;
        }
    }

    hasActiveSession(userId: number): boolean {
        return this.userSessions.has(userId);
    }
}
