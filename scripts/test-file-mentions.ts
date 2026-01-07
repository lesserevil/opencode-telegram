/**
 * Test script for file mentions (@-mentions) feature
 * 
 * This demonstrates the file mention parser and OpenCode API integration
 */

import { FileMentionParser, FileMentionService } from '../src/features/file-mentions/index.js';

async function testFileMentions() {
    console.log('🧪 Testing File Mentions Feature\n');
    
    // Test 1: Parser
    console.log('=== Test 1: Message Parser ===');
    const parser = new FileMentionParser();
    
    const testMessages = [
        'How is auth handled in @src/api/auth.ts',
        'Compare @utils/logger.ts and @utils/helper.ts',
        '@"path with spaces/file.ts" works too',
        'Email test@example.com should be ignored',
        'Check @packages/functions/src/api/index.ts for details'
    ];
    
    for (const msg of testMessages) {
        const mentions = parser.parse(msg);
        console.log(`\nMessage: "${msg}"`);
        console.log(`Found ${mentions.length} mention(s):`);
        mentions.forEach(m => {
            console.log(`  - "${m.raw}" → query: "${m.query}"`);
        });
    }
    
    // Test 2: OpenCode API integration
    console.log('\n\n=== Test 2: OpenCode API Integration ===');
    const service = new FileMentionService();
    
    try {
        console.log('Testing file search with OpenCode find.files API...\n');
        
        const testQueries = [
            'auth.ts',
            '*.test.ts',
            'package.json'
        ];
        
        for (const query of testQueries) {
            console.log(`Searching for: "${query}"`);
            const results = await service.findFiles(query);
            console.log(`Found ${results.length} match(es):`);
            results.slice(0, 5).forEach((match, i) => {
                console.log(`  ${i + 1}. ${match.path} (score: ${match.score.toFixed(2)})`);
            });
            console.log('');
        }
        
        console.log('✅ OpenCode API integration test passed!');
        
    } catch (error) {
        console.error('❌ OpenCode API test failed:', error);
        console.error('\nMake sure:');
        console.error('1. OpenCode server is running (opencode serve)');
        console.error('2. You have an active project open');
        console.error('3. OPENCODE_SERVER_URL is configured correctly');
    }
    
    // Test 3: End-to-end
    console.log('\n\n=== Test 3: End-to-End ===');
    const examplePrompt = 'Explain the authentication flow in @src/api/auth.ts';
    console.log(`Example prompt: "${examplePrompt}"`);
    
    const mentions = parser.parse(examplePrompt);
    console.log(`\nParsed ${mentions.length} mention(s)`);
    
    if (mentions.length > 0) {
        try {
            const matches = await service.searchMentions(mentions);
            console.log('\nSearch results:');
            
            for (const [mention, files] of matches.entries()) {
                console.log(`\n  ${mention.raw}:`);
                if (files.length === 0) {
                    console.log(`    ❌ No matches found`);
                } else if (files.length === 1) {
                    console.log(`    ✅ Exact match: ${files[0].path}`);
                } else {
                    console.log(`    🔍 Found ${files.length} possible matches:`);
                    files.slice(0, 3).forEach((f, i) => {
                        console.log(`       ${i + 1}. ${f.path}`);
                    });
                }
            }
            
            console.log('\n✅ End-to-end test completed!');
            
        } catch (error) {
            console.error('❌ Search failed:', error);
        }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('✨ All tests completed!');
    console.log('='.repeat(60));
}

testFileMentions().catch(console.error);
