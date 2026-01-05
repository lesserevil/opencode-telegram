#!/usr/bin/env node

/**
 * Test the new local agent cycling implementation
 */

import { OpenCodeService } from "../dist/features/opencode/opencode.service.js";

async function testLocalAgentCycling() {
    console.log("🔍 Testing local agent cycling implementation...\n");

    const service = new OpenCodeService();
    const testUserId = 999999; // Test user ID

    try {
        // 1. Create a session
        console.log("1. Creating session...");
        const session = await service.createSession(testUserId, "Test Agent Cycling");
        console.log(`   ✓ Session created: ${session.sessionId}\n`);

        // 2. Get available agents
        console.log("2. Getting available agents...");
        const agents = await service.getAvailableAgents();
        console.log(`   ✓ Found ${agents.length} agents:`);
        agents.forEach(a => console.log(`     - ${a.name}${a.description ? `: ${a.description}` : ''}`));
        console.log();

        // 3. Test cycling through agents
        console.log("3. Testing agent cycling...");
        console.log(`   Initial agent: ${session.currentAgent || '(none set)'}\n`);

        for (let i = 0; i < agents.length + 2; i++) {
            const result = await service.cycleToNextAgent(testUserId);
            if (result.success) {
                console.log(`   Cycle ${i + 1}: ✓ ${result.currentAgent}`);
            } else {
                console.log(`   Cycle ${i + 1}: ✗ Failed`);
            }
        }

        console.log("\n4. Verifying cycle wraps around...");
        const updatedSession = service.getUserSession(testUserId);
        console.log(`   Final agent: ${updatedSession?.currentAgent}`);
        console.log(`   ${agents.length > 0 && updatedSession?.currentAgent === agents[1].name ? '✓' : '✗'} Correctly wrapped around`);

        console.log("\n✅ Test complete!");
        process.exit(0);

    } catch (error) {
        console.error("❌ Test failed:", error);
        process.exit(1);
    }
}

testLocalAgentCycling();
