/**
 * Test script for the /sessions command
 * 
 * This script demonstrates how to use the getSessions() method
 * and verifies that it returns the expected data structure.
 * 
 * Usage:
 *   ts-node scripts/test-sessions-command.ts
 * 
 * Prerequisites:
 *   - OpenCode server must be running
 *   - OPENCODE_SERVER_URL environment variable must be set (or uses default)
 */

import { OpenCodeService } from '../src/features/opencode/opencode.service.js';

async function testSessionsCommand() {
    console.log('🧪 Testing /sessions command implementation\n');
    
    const serverUrl = process.env.OPENCODE_SERVER_URL || 'http://localhost:4096';
    console.log(`📡 Connecting to OpenCode server: ${serverUrl}`);
    
    const service = new OpenCodeService(serverUrl);
    
    try {
        console.log('📋 Fetching last 5 sessions...\n');
        const sessions = await service.getSessions(5);
        
        if (sessions.length === 0) {
            console.log('✅ No sessions found (this is expected if no sessions exist)');
            return;
        }
        
        console.log(`✅ Found ${sessions.length} session(s):\n`);
        
        sessions.forEach((session, index) => {
            const shortId = session.id.substring(0, 8);
            const title = session.title || 'Untitled';
            const createdDate = new Date(session.created * 1000).toLocaleString();
            const updatedDate = new Date(session.updated * 1000).toLocaleString();
            
            console.log(`${index + 1}. ${title}`);
            console.log(`   ID: ${shortId}...`);
            console.log(`   Created: ${createdDate}`);
            console.log(`   Updated: ${updatedDate}`);
            console.log('');
        });
        
        console.log('✅ Test completed successfully!');
        
    } catch (error) {
        console.error('❌ Test failed:', error);
        process.exit(1);
    }
}

testSessionsCommand();
