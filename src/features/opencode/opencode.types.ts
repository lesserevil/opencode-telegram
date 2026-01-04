import type { Session } from "@opencode-ai/sdk";
import type { Context } from "grammy";

export interface UserSession {
    userId: number;
    sessionId: string;
    session: Session;
    createdAt: Date;
    chatId?: number;
    lastMessageId?: number;
}
