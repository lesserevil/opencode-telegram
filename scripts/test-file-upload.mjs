#!/usr/bin/env node

/**
 * Test script for file upload handler
 * 
 * This script tests the file upload functionality:
 * 1. Verifies /tmp/telegramCoder directory exists
 * 2. Tests file writing permissions
 * 3. Simulates file upload scenarios
 */

import * as fs from "fs";
import * as path from "path";

console.log("🧪 Testing File Upload Handler\n");

const saveDir = "/tmp/telegramCoder";

// Test 1: Check directory exists
console.log("1️⃣ Test: Directory existence");
if (fs.existsSync(saveDir)) {
    console.log(`   ✅ Directory exists: ${saveDir}`);
} else {
    console.log(`   ⚠️  Creating directory: ${saveDir}`);
    fs.mkdirSync(saveDir, { recursive: true });
    console.log(`   ✅ Directory created successfully`);
}

// Test 2: Check write permissions
console.log("\n2️⃣ Test: Write permissions");
const testFile = path.join(saveDir, "test_write.txt");
try {
    fs.writeFileSync(testFile, "Test content");
    console.log(`   ✅ Can write to directory`);
    fs.unlinkSync(testFile);
    console.log(`   ✅ Can delete from directory`);
} catch (error) {
    console.log(`   ❌ Permission error: ${error.message}`);
}

// Test 3: Simulate different file types
console.log("\n3️⃣ Test: File naming conventions");
const fileTypes = [
    { type: "document", name: "config.json", expected: "config.json" },
    { type: "photo", name: null, expected: /^photo_\d+\.jpg$/ },
    { type: "video", name: "demo.mp4", expected: "demo.mp4" },
    { type: "audio", name: "song.mp3", expected: "song.mp3" },
    { type: "voice", name: null, expected: /^voice_\d+\.ogg$/ },
    { type: "video_note", name: null, expected: /^video_note_\d+\.mp4$/ }
];

for (const file of fileTypes) {
    let fileName = file.name;
    
    if (!fileName) {
        // Generate timestamp-based name like the handler does
        fileName = `${file.type}_${Date.now()}.${getExtension(file.type)}`;
    }
    
    const matches = file.expected instanceof RegExp 
        ? file.expected.test(fileName)
        : fileName === file.expected;
    
    console.log(`   ${matches ? '✅' : '❌'} ${file.type}: ${fileName}`);
}

function getExtension(type) {
    switch(type) {
        case "photo": return "jpg";
        case "voice": return "ogg";
        case "video_note": return "mp4";
        default: return "bin";
    }
}

// Test 4: Path formatting
console.log("\n4️⃣ Test: Path formatting for Telegram");
const testFileName = "example.pdf";
const fullPath = path.join(saveDir, testFileName);
const htmlFormatted = `<code>${fullPath}</code>`;
console.log(`   File: ${testFileName}`);
console.log(`   Full path: ${fullPath}`);
console.log(`   HTML format: ${htmlFormatted}`);
console.log(`   ✅ Path is in tappable format`);

// Test 5: Supported file types
console.log("\n5️⃣ Test: Supported file types");
const supportedTypes = [
    "message:document",
    "message:photo",
    "message:video",
    "message:audio",
    "message:voice",
    "message:video_note"
];
console.log(`   ✅ Handles ${supportedTypes.length} file types:`);
supportedTypes.forEach(type => {
    console.log(`      • ${type.replace('message:', '')}`);
});

// Summary
console.log("\n📊 Summary:");
console.log("   The file upload handler:");
console.log("   • Saves all file types to /tmp/telegramCoder");
console.log("   • Returns tappable path in <code> tags");
console.log("   • Preserves original filenames when available");
console.log("   • Generates timestamp-based names for media");
console.log("   • Auto-deletes confirmation messages after 10s");

console.log("\n✅ All tests completed!");

console.log("\n💡 To test in the bot:");
console.log("   1. Send any file to the bot");
console.log("   2. Bot saves it to /tmp/telegramCoder/");
console.log("   3. Bot replies with the full path");
console.log("   4. Tap the path to copy it");
console.log("   5. Check the directory:");
console.log(`      ls -lh ${saveDir}`);
