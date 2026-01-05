#!/usr/bin/env node

/**
 * Test script for agent cycling
 * This script directly tests the OpenCode API to see what agent.cycle returns
 */

import { createOpencodeClient } from "@opencode-ai/sdk";

const OPENCODE_URL = process.env.OPENCODE_SERVER_URL || "http://localhost:4096";

async function testAgentCycle() {
    console.log("🔍 Testing agent.cycle command...");
    console.log(`OpenCode URL: ${OPENCODE_URL}\n`);

    const client = createOpencodeClient({ baseUrl: OPENCODE_URL });

    try {
        // 1. Create a test session
        console.log("1. Creating test session...");
        const sessionResult = await client.session.create({
            body: { title: "Agent Cycle Test Session" }
        });

        if (!sessionResult.data) {
            throw new Error("Failed to create session");
        }

        const sessionId = sessionResult.data.id;
        console.log(`   ✓ Session created: ${sessionId}\n`);

        // 1.5. Send an initial message to establish agent context
        console.log("1.5. Sending initial message...");
        try {
            await client.session.prompt({
                path: { id: sessionId },
                body: {
                    text: "Hello"
                }
            });
            console.log("   ✓ Initial message sent\n");
        } catch (promptError) {
            console.log("   ⚠️  Failed to send initial message:", promptError);
        }

        // 2. Send agent.cycle command
        console.log("2. Sending agent.cycle command...");
        const commandResult = await client.session.command({
            path: { id: sessionId },
            body: {
                command: "agent.cycle",
                arguments: ""
            }
        });

        console.log("   ✓ Command sent\n");

        // 3. Analyze the response
        console.log("3. Analyzing response structure:\n");
        console.log("Full response:");
        console.log(JSON.stringify(commandResult, null, 2));
        console.log("\n");

        // Check different possible locations for agent name
        console.log("Checking for agent name in different locations:");
        
        if (commandResult.data?.parts) {
            console.log("   • parts array:", commandResult.data.parts.length, "parts");
            const agentPart = commandResult.data.parts.find(p => p.type === "agent");
            if (agentPart) {
                console.log("   ✓ Found agent part:", agentPart);
            } else {
                console.log("   ✗ No agent part found");
            }
        }

        if (commandResult.data?.info?.mode) {
            console.log("   ✓ info.mode:", commandResult.data.info.mode);
        } else {
            console.log("   ✗ info.mode not found");
        }

        // 4. Get messages to see the result
        console.log("\n4. Getting session messages...");
        const messagesResult = await client.session.messages({
            path: { id: sessionId }
        });

        if (messagesResult.data && messagesResult.data.length > 0) {
            console.log(`   ✓ Found ${messagesResult.data.length} messages\n`);
            
            const lastMessage = messagesResult.data[messagesResult.data.length - 1];
            console.log("   Last message:");
            console.log(JSON.stringify(lastMessage, null, 2));
        }

        // 5. Clean up
        console.log("\n5. Cleaning up...");
        await client.session.delete({ path: { id: sessionId } });
        console.log("   ✓ Session deleted\n");

        console.log("✅ Test complete!");

    } catch (error) {
        console.error("❌ Test failed:", error);
        process.exit(1);
    }
}

testAgentCycle();
