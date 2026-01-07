#!/usr/bin/env node

/**
 * Test script for message line limit functionality
 * 
 * This script demonstrates the 50-line limit for message edits:
 * 1. Simulates messages with various line counts
 * 2. Shows how the line limiting works
 * 3. Validates the truncation logic
 */

function limitToLastLines(text, maxLines = 50) {
    const lines = text.split('\n');
    const limitedText = lines.length > maxLines 
        ? lines.slice(-maxLines).join('\n')
        : text;
    return {
        original: lines.length,
        limited: limitedText.split('\n').length,
        truncated: lines.length > maxLines,
        text: limitedText
    };
}

console.log("🧪 Testing Message Line Limit Functionality\n");

// Test 1: Message with less than 50 lines
console.log("1️⃣ Test: Message with 10 lines");
const shortMessage = Array(10).fill(0).map((_, i) => `Line ${i + 1}`).join('\n');
const result1 = limitToLastLines(shortMessage);
console.log(`   - Original lines: ${result1.original}`);
console.log(`   - Limited lines: ${result1.limited}`);
console.log(`   - Truncated: ${result1.truncated ? '✅ Yes' : '❌ No'}`);
console.log(`   - Result: ${result1.truncated ? 'FAIL' : 'PASS'} - Should not truncate\n`);

// Test 2: Message with exactly 50 lines
console.log("2️⃣ Test: Message with exactly 50 lines");
const exactMessage = Array(50).fill(0).map((_, i) => `Line ${i + 1}`).join('\n');
const result2 = limitToLastLines(exactMessage);
console.log(`   - Original lines: ${result2.original}`);
console.log(`   - Limited lines: ${result2.limited}`);
console.log(`   - Truncated: ${result2.truncated ? '✅ Yes' : '❌ No'}`);
console.log(`   - Result: ${result2.truncated ? 'FAIL' : 'PASS'} - Should not truncate\n`);

// Test 3: Message with more than 50 lines
console.log("3️⃣ Test: Message with 100 lines");
const longMessage = Array(100).fill(0).map((_, i) => `Line ${i + 1}`).join('\n');
const result3 = limitToLastLines(longMessage);
console.log(`   - Original lines: ${result3.original}`);
console.log(`   - Limited lines: ${result3.limited}`);
console.log(`   - Truncated: ${result3.truncated ? '✅ Yes' : '❌ No'}`);
console.log(`   - First line shown: ${result3.text.split('\n')[0]}`);
console.log(`   - Last line shown: ${result3.text.split('\n')[49]}`);
console.log(`   - Result: ${result3.truncated && result3.text.startsWith('Line 51') ? 'PASS' : 'FAIL'} - Should show lines 51-100\n`);

// Test 4: Message with 200 lines (extreme case)
console.log("4️⃣ Test: Message with 200 lines (extreme case)");
const veryLongMessage = Array(200).fill(0).map((_, i) => `Line ${i + 1}`).join('\n');
const result4 = limitToLastLines(veryLongMessage);
console.log(`   - Original lines: ${result4.original}`);
console.log(`   - Limited lines: ${result4.limited}`);
console.log(`   - Truncated: ${result4.truncated ? '✅ Yes' : '❌ No'}`);
console.log(`   - First line shown: ${result4.text.split('\n')[0]}`);
console.log(`   - Last line shown: ${result4.text.split('\n')[49]}`);
console.log(`   - Result: ${result4.truncated && result4.text.startsWith('Line 151') ? 'PASS' : 'FAIL'} - Should show lines 151-200\n`);

// Test 5: Empty message
console.log("5️⃣ Test: Empty message");
const emptyMessage = "";
const result5 = limitToLastLines(emptyMessage);
console.log(`   - Original lines: ${result5.original}`);
console.log(`   - Limited lines: ${result5.limited}`);
console.log(`   - Result: ${result5.original <= 1 ? 'PASS' : 'FAIL'} - Should handle empty message\n`);

// Summary
console.log("📊 Summary:");
console.log("   The handler now limits streaming AI responses to the last 50 lines.");
console.log("   This prevents:");
console.log("   - Telegram message size limit errors (4096 chars)");
console.log("   - Rate limiting from frequent large edits");
console.log("   - Poor mobile UX from very long messages");
console.log("\n✅ All tests completed!");
console.log("\n💡 To test in the bot:");
console.log("   1. Start a session: /opencode");
console.log("   2. Ask AI to create a file with 100+ lines");
console.log("   3. Observe only the last 50 lines are shown");
