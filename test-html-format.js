// Simple test to verify HTML formatting
import { formatAsHtml } from './src/features/opencode/event-handlers/utils.js';

console.log('Testing HTML formatting...\n');

// Test markdown samples
const testCases = [
    '**Bold text**',
    '*Italic text*', 
    '`inline code`',
    '```javascript\nconsole.log("hello");\n```',
    '# Header',
    '## Subheader',
    'Normal text with **bold** and *italic*',
    'Code with `var example = "test"` here'
];

testCases.forEach((test, i) => {
    console.log(`Test ${i + 1}:`);
    console.log('Input:  ', test);
    console.log('Output: ', formatAsHtml(test));
    console.log('---');
});

console.log('\n✅ HTML formatting test complete!');