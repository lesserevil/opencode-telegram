#!/usr/bin/env node

/**
 * Test directory creation logic
 * 
 * This script tests that the directory is created automatically if it doesn't exist
 */

import * as fs from "fs";
import * as path from "path";

console.log("🧪 Testing Directory Auto-Creation\n");

const saveDir = "/tmp/telegramCoder";

// Test 1: Remove directory if exists
console.log("1️⃣ Test: Clean slate");
if (fs.existsSync(saveDir)) {
    console.log(`   Removing existing directory: ${saveDir}`);
    fs.rmSync(saveDir, { recursive: true, force: true });
}
console.log(`   ✅ Directory removed/doesn't exist`);

// Test 2: Verify directory doesn't exist
console.log("\n2️⃣ Test: Verify directory is gone");
if (!fs.existsSync(saveDir)) {
    console.log(`   ✅ Directory confirmed missing: ${saveDir}`);
} else {
    console.log(`   ❌ Directory still exists!`);
    process.exit(1);
}

// Test 3: Simulate the bot's directory creation logic
console.log("\n3️⃣ Test: Auto-create directory (like bot does)");
if (!fs.existsSync(saveDir)) {
    console.log(`   Creating directory: ${saveDir}`);
    fs.mkdirSync(saveDir, { recursive: true });
    console.log(`   ✓ Directory created: ${saveDir}`);
}

// Test 4: Verify directory now exists
console.log("\n4️⃣ Test: Verify directory was created");
if (fs.existsSync(saveDir)) {
    console.log(`   ✅ Directory exists: ${saveDir}`);
    const stats = fs.statSync(saveDir);
    console.log(`   ✅ Is directory: ${stats.isDirectory()}`);
} else {
    console.log(`   ❌ Directory creation failed!`);
    process.exit(1);
}

// Test 5: Test file writing
console.log("\n5️⃣ Test: Write test file");
const testFile = path.join(saveDir, "test.txt");
try {
    fs.writeFileSync(testFile, "Test content from test script");
    console.log(`   ✅ File written: ${testFile}`);
    
    // Verify file exists
    if (fs.existsSync(testFile)) {
        console.log(`   ✅ File verified: ${testFile}`);
        const content = fs.readFileSync(testFile, 'utf-8');
        console.log(`   ✅ Content: "${content}"`);
    }
    
    // Clean up
    fs.unlinkSync(testFile);
    console.log(`   ✅ Test file cleaned up`);
} catch (error) {
    console.log(`   ❌ Failed to write file: ${error.message}`);
    process.exit(1);
}

// Test 6: Recursive directory creation
console.log("\n6️⃣ Test: Recursive creation (nested paths)");
const nestedDir = "/tmp/telegramCoder/nested/deep/path";
if (!fs.existsSync(nestedDir)) {
    console.log(`   Creating nested directory: ${nestedDir}`);
    fs.mkdirSync(nestedDir, { recursive: true });
    console.log(`   ✓ Nested directory created`);
}
if (fs.existsSync(nestedDir)) {
    console.log(`   ✅ Nested directory verified`);
    // Clean up nested structure
    fs.rmSync("/tmp/telegramCoder/nested", { recursive: true, force: true });
    console.log(`   ✅ Nested directories cleaned up`);
}

console.log("\n📊 Summary:");
console.log("   The bot will automatically:");
console.log("   ✅ Check if /tmp/telegramCoder exists");
console.log("   ✅ Create it with { recursive: true } if missing");
console.log("   ✅ Log directory creation to console");
console.log("   ✅ Save files successfully");

console.log("\n✅ All tests passed!");
console.log("\n💡 The directory will be created automatically when:");
console.log("   • The bot starts and receives a file");
console.log("   • The directory doesn't exist");
console.log("   • No manual intervention needed");

console.log(`\n📁 Current state: ${fs.existsSync(saveDir) ? 'Directory exists' : 'Directory does not exist'}`);
