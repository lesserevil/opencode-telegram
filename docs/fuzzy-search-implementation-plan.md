# Fuzzy File Search Implementation Plan (@-mention)

## Overview

Implement fuzzy file search in prompts using the `@` symbol to reference files from the current project/session. This allows users to mention specific files in their prompts, with intelligent fuzzy matching and confirmation UI.

**Example Usage:**
```
User: How is authentication handled in @packages/functions/src/api/index.ts
Bot: [Resolves file and includes content in context for OpenCode AI]
```

---

## 1. Core Requirements

### 1.1 Functional Requirements
- Parse `@` mentions from user prompts
- Fuzzy match file paths against project files
- Present disambiguation UI when multiple matches exist
- Replace `@` mentions with actual file content or references
- Support multiple `@` mentions in a single prompt
- Handle invalid/non-existent file references gracefully

### 1.2 Non-Functional Requirements
- Fast fuzzy matching (< 200ms for 10k+ files)
- Intuitive UX with minimal friction
- Low memory footprint for file index
- Works within Telegram's UI constraints

---

## 2. Technical Architecture

### 2.1 Component Overview

```
┌─────────────────┐
│   User Input    │
│  @file/path.ts  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Message Parser  │ ← Extract @mentions
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  File Indexer   │ ← Get current project files
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Fuzzy Matcher   │ ← Find matching files
└────────┬────────┘
         │
         ▼
    ┌───┴────┐
    │        │
    ▼        ▼
Exact Match  Multiple Matches
    │        │
    │        ▼
    │   ┌──────────────┐
    │   │ Confirmation │
    │   │  UI/Picker   │
    │   └──────┬───────┘
    │          │
    └──────┬───┘
           │
           ▼
    ┌─────────────┐
    │  File       │
    │  Resolver   │
    └──────┬──────┘
           │
           ▼
    ┌─────────────┐
    │  Prompt     │
    │  Augmenter  │
    └──────┬──────┘
           │
           ▼
    ┌─────────────┐
    │  Send to    │
    │  OpenCode   │
    └─────────────┘
```

### 2.2 File Structure

```
src/
├── features/
│   └── file-mentions/
│       ├── file-mentions.service.ts       # Core service
│       ├── file-mentions.parser.ts        # Parse @mentions
│       ├── file-mentions.matcher.ts       # Fuzzy matching
│       ├── file-mentions.indexer.ts       # File indexing
│       ├── file-mentions.resolver.ts      # Resolve to content
│       ├── file-mentions.ui.ts            # Telegram UI helpers
│       └── file-mentions.types.ts         # TypeScript types
└── utils/
    └── fuzzy-search.utils.ts              # Fuzzy search algorithm
```

---

## 3. Implementation Details

### 3.1 Libraries to Use

**Option 1: fuse.js** (Recommended)
- Popular fuzzy search library
- Configurable scoring
- ~12KB minified
- Install: `npm install fuse.js`

**Option 2: fuzzysort**
- Faster than fuse.js
- Smaller bundle size (~3KB)
- Less configurable
- Install: `npm install fuzzysort`

**Recommendation:** Start with **fuse.js** for better configurability, can optimize to fuzzysort later if needed.

### 3.2 Core Components

#### 3.2.1 Message Parser (`file-mentions.parser.ts`)

```typescript
export interface FileMention {
    raw: string;           // Original @mention text
    query: string;         // Path to search for
    startIndex: number;    // Position in message
    endIndex: number;      // End position
}

export class FileMentionParser {
    // Pattern: @path/to/file.ext or @"path with spaces/file.ext"
    private readonly MENTION_PATTERN = /@(?:"([^"]+)"|([^\s]+))/g;
    
    parse(text: string): FileMention[] {
        // Extract all @mentions from text
        // Handle quoted paths: @"path/to/file with spaces.ts"
        // Handle unquoted paths: @path/to/file.ts
    }
    
    replaceMentions(text: string, replacements: Map<string, string>): string {
        // Replace @mentions with resolved file references
    }
}
```

#### 3.2.2 File Indexer (`file-mentions.indexer.ts`)

```typescript
export interface FileIndex {
    path: string;          // Full file path
    relativePath: string;  // Relative to project root
    name: string;          // File name
    directory: string;     // Parent directory
    extension: string;     // File extension
    size: number;          // File size in bytes
    lastModified: number;  // Unix timestamp
}

export class FileMentionIndexer {
    private cache: Map<string, FileIndex[]> = new Map();
    private cacheExpiry: Map<string, number> = new Map();
    private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes
    
    async indexProject(projectId: string, directory: string): Promise<FileIndex[]> {
        // Use OpenCode SDK to get project files
        // Cache results per project with TTL
        // Filter out node_modules, .git, etc.
    }
    
    invalidateCache(projectId: string): void {
        // Clear cache for specific project
    }
}
```

#### 3.2.3 Fuzzy Matcher (`file-mentions.matcher.ts`)

```typescript
export interface MatchResult {
    file: FileIndex;
    score: number;         // Match score (0-1)
    matches: number[];     // Matched character indices
}

export class FileMentionMatcher {
    private fuse: Fuse<FileIndex>;
    
    constructor(files: FileIndex[]) {
        // Initialize fuse.js with configuration
        this.fuse = new Fuse(files, {
            keys: [
                { name: 'relativePath', weight: 0.5 },
                { name: 'name', weight: 0.3 },
                { name: 'directory', weight: 0.2 }
            ],
            threshold: 0.4,        // Match threshold
            distance: 100,         // Character distance
            minMatchCharLength: 2, // Minimum match length
            includeScore: true,
            includeMatches: true
        });
    }
    
    search(query: string, limit: number = 10): MatchResult[] {
        // Perform fuzzy search
        // Return top matches sorted by score
    }
    
    exactMatch(query: string): FileIndex | null {
        // Check for exact path match first
    }
}
```

#### 3.2.4 File Resolver (`file-mentions.resolver.ts`)

```typescript
export interface ResolvedMention {
    mention: FileMention;
    file: FileIndex;
    content?: string;      // Optional file content
}

export class FileMentionResolver {
    async resolveFile(
        projectId: string,
        file: FileIndex,
        includeContent: boolean = false
    ): Promise<ResolvedMention> {
        // Use OpenCode SDK to get file content if needed
        // Format as reference for OpenCode AI
    }
    
    formatForPrompt(resolved: ResolvedMention[]): string {
        // Format resolved files for OpenCode prompt
        // Example: "Context files:\n- path/to/file.ts\n\n[content...]"
    }
}
```

#### 3.2.5 UI Helper (`file-mentions.ui.ts`)

```typescript
export class FileMentionUI {
    // Strategy: Pre-confirmation (before sending prompt)
    async showMatchPicker(
        ctx: Context,
        mention: FileMention,
        matches: MatchResult[]
    ): Promise<FileIndex | null> {
        // Show inline keyboard with top matches
        // User selects correct file
        // Return selected file
    }
    
    // Strategy: Post-confirmation (after sending prompt)
    async confirmMatches(
        ctx: Context,
        mentions: FileMention[],
        matches: Map<FileMention, MatchResult[]>
    ): Promise<Map<FileMention, FileIndex>> {
        // Show summary of all detected files
        // User confirms or adjusts selections
    }
}
```

---

## 4. User Experience Design

### 4.1 UI Strategy: Hybrid Approach (Recommended)

**Pre-Send Inline Suggestions:**
- As user types, show real-time suggestions below message
- Only for single @mention
- Non-blocking, optional interaction
- **Implementation:** Use Telegram inline queries (if supported) or post-message confirmation

**Post-Send Confirmation:**
- After user sends message with @mentions
- Bot analyzes and shows matches
- User confirms selections via inline buttons
- More reliable, works with multiple mentions

### 4.2 UX Flow Examples

#### Scenario 1: Single Exact Match
```
User: How is auth handled in @src/api/auth.ts

Bot: 🔍 Found 1 file:
     ✅ src/api/auth.ts
     
     Processing your request...
     
[Bot fetches file and sends to OpenCode AI]
```

#### Scenario 2: Multiple Matches
```
User: Explain @utils/logger

Bot: 🔍 Found 3 possible matches for "@utils/logger":
     
     1️⃣ src/utils/logger.ts
     2️⃣ src/utils/logger/index.ts  
     3️⃣ tests/utils/logger.test.ts
     
     [Select File] [Cancel]
     
[Inline keyboard with buttons for each file]

User: [Clicks button 1]

Bot: ✅ Selected: src/utils/logger.ts
     Processing your request...
```

#### Scenario 3: Multiple Mentions
```
User: Compare @api/v1/users.ts and @api/v2/users.ts

Bot: 🔍 Found 2 file references:
     
     1️⃣ @api/v1/users.ts → src/api/v1/users.ts ✅
     2️⃣ @api/v2/users.ts → Found 2 matches:
         • src/api/v2/users.ts
         • src/api/v2/users.controller.ts
     
     Please select for 2️⃣:
     [users.ts] [users.controller.ts] [Cancel]
```

#### Scenario 4: No Match
```
User: Check @nonexistent/file.ts

Bot: ❌ Could not find "@nonexistent/file.ts"
     
     Did you mean:
     1️⃣ src/components/file.ts
     2️⃣ src/utils/files.ts
     
     [Select] [Skip] [Cancel]
```

### 4.3 Telegram UI Components

**Inline Keyboard Layout:**
```typescript
// For single file selection
[
  [{ text: "📄 src/api/auth.ts", callback_data: "file:0" }],
  [{ text: "📄 src/api/auth.service.ts", callback_data: "file:1" }],
  [{ text: "📄 src/auth/index.ts", callback_data: "file:2" }],
  [{ text: "❌ Cancel", callback_data: "file:cancel" }]
]

// For multiple selections (numbered)
[
  [{ text: "1️⃣", callback_data: "file:0:0" }, { text: "2️⃣", callback_data: "file:0:1" }],
  [{ text: "✅ Confirm All", callback_data: "file:confirm" }],
  [{ text: "❌ Cancel", callback_data: "file:cancel" }]
]
```

---

## 5. Integration Points

### 5.1 OpenCode Service Integration

```typescript
// In opencode.service.ts

async sendPromptWithFiles(
    userId: number,
    text: string,
    files: ResolvedMention[]
): Promise<string> {
    const userSession = this.getUserSession(userId);
    if (!userSession) {
        throw new Error("No active session");
    }
    
    // Format prompt with file context
    const contextText = this.formatFileContext(files);
    const fullPrompt = `${contextText}\n\n${text}`;
    
    // Send to OpenCode
    const client = createOpencodeClient({ baseUrl: this.baseUrl });
    const result = await client.session.prompt({
        path: { id: userSession.sessionId },
        body: {
            parts: [{ type: "text", text: fullPrompt }],
            agent: userSession.currentAgent,
        },
    });
    
    return this.extractResponse(result);
}

private formatFileContext(files: ResolvedMention[]): string {
    if (files.length === 0) return "";
    
    let context = "📎 Referenced Files:\n\n";
    for (const file of files) {
        context += `File: ${file.file.relativePath}\n`;
        if (file.content) {
            context += "```\n" + file.content + "\n```\n\n";
        }
    }
    return context;
}
```

### 5.2 Bot Handler Modifications

```typescript
// In opencode.bot.ts

private async handleMessageAsPrompt(ctx: Context): Promise<void> {
    const userId = ctx.from?.id;
    if (!userId) {
        await ctx.reply("❌ Unable to identify user");
        return;
    }
    
    if (!this.opencodeService.hasActiveSession(userId)) {
        await ctx.reply("❌ No active session. Use /opencode first.");
        return;
    }
    
    const promptText = ctx.message?.text?.trim() || "";
    if (!promptText) return;
    
    // NEW: Check for file mentions
    const mentions = this.fileMentionService.parseMentions(promptText);
    
    if (mentions.length > 0) {
        await this.handlePromptWithMentions(ctx, userId, promptText, mentions);
    } else {
        await this.sendPromptToOpenCode(ctx, userId, promptText);
    }
}

private async handlePromptWithMentions(
    ctx: Context,
    userId: number,
    text: string,
    mentions: FileMention[]
): Promise<void> {
    // Get current project from session
    const projectId = await this.getSessionProjectId(userId);
    
    // Index project files
    const files = await this.fileMentionService.indexProject(projectId);
    
    // Match mentions to files
    const matchResults = await this.fileMentionService.matchMentions(mentions, files);
    
    // Show confirmation UI
    const resolvedFiles = await this.fileMentionUI.confirmAndResolve(
        ctx,
        matchResults
    );
    
    if (!resolvedFiles) {
        await ctx.reply("❌ File selection cancelled");
        return;
    }
    
    // Send prompt with file context
    await this.opencodeService.sendPromptWithFiles(userId, text, resolvedFiles);
}
```

---

## 6. Configuration

### 6.1 Environment Variables

```bash
# .env additions
FILE_MENTION_ENABLED=true
FILE_MENTION_CACHE_TTL=300000          # 5 minutes in ms
FILE_MENTION_MAX_RESULTS=10            # Max fuzzy matches to show
FILE_MENTION_INCLUDE_CONTENT=true      # Include file content in prompt
FILE_MENTION_MAX_FILE_SIZE=100000      # Max file size to include (bytes)
```

### 6.2 User Settings (Future Enhancement)

```typescript
interface UserFileMentionSettings {
    enabled: boolean;
    autoConfirmExactMatch: boolean;    // Skip UI for exact matches
    maxMatchesToShow: number;          // UI preference
    excludePatterns: string[];         // Custom ignore patterns
}
```

---

## 7. Implementation Phases

### Phase 1: Core Infrastructure (Week 1)
- [ ] Install and configure fuse.js
- [ ] Implement message parser for @mentions
- [ ] Implement file indexer (OpenCode SDK integration)
- [ ] Implement fuzzy matcher with basic scoring
- [ ] Unit tests for parser and matcher

### Phase 2: Resolution & Integration (Week 1-2)
- [ ] Implement file resolver (fetch content via OpenCode SDK)
- [ ] Integrate with opencode.service.ts
- [ ] Modify bot handlers to detect @mentions
- [ ] Format file context for OpenCode prompts
- [ ] Integration tests

### Phase 3: UI Implementation (Week 2)
- [ ] Design Telegram inline keyboard layouts
- [ ] Implement confirmation UI for single file
- [ ] Implement confirmation UI for multiple files
- [ ] Handle edge cases (no matches, too many matches)
- [ ] User testing

### Phase 4: Optimization & Polish (Week 3)
- [ ] Add caching for file indices
- [ ] Optimize fuzzy matching performance
- [ ] Add auto-confirmation for exact matches
- [ ] Improve error messages and UX
- [ ] Documentation

### Phase 5: Advanced Features (Future)
- [ ] Real-time suggestions as user types
- [ ] Support for @folder/ mentions (all files in folder)
- [ ] File content preview in selection UI
- [ ] Recent files quick access
- [ ] Alias support (@config → points to actual config file)

---

## 8. Testing Strategy

### 8.1 Unit Tests
```typescript
// file-mentions.parser.test.ts
describe("FileMentionParser", () => {
    test("parses single @mention", () => {});
    test("parses multiple @mentions", () => {});
    test("handles quoted paths with spaces", () => {});
    test("ignores @ in email addresses", () => {});
});

// file-mentions.matcher.test.ts
describe("FileMentionMatcher", () => {
    test("finds exact match", () => {});
    test("ranks partial matches by score", () => {});
    test("handles typos in path", () => {});
    test("prioritizes file name over directory", () => {});
});
```

### 8.2 Integration Tests
```typescript
// Test with real OpenCode server
test("resolves file from actual project", async () => {});
test("handles non-existent files gracefully", async () => {});
test("processes multiple mentions in single prompt", async () => {});
```

### 8.3 Manual Testing Scenarios
- Single exact match
- Multiple partial matches
- No matches with suggestions
- Multiple mentions in one message
- Large projects (10k+ files)
- Special characters in paths
- Very long file paths

---

## 9. Edge Cases & Error Handling

### 9.1 Edge Cases
1. **No active OpenCode session** → Prompt user to start session first
2. **No project associated with session** → Cannot resolve files, show error
3. **File index is stale** → Auto-refresh with loading indicator
4. **Too many matches (>50)** → Show "too broad, be more specific"
5. **File too large** → Show warning, offer to skip content
6. **Binary files** → Don't include content, only reference
7. **Permission denied on file** → Show error, skip file
8. **Slow file system** → Show progress indicator
9. **Ambiguous quoted syntax** → @"file with @ in name.ts"
10. **Concurrent mention resolution** → Queue or debounce

### 9.2 Error Messages
```typescript
const ERROR_MESSAGES = {
    NO_SESSION: "❌ No active session. Use /opencode to start.",
    NO_PROJECT: "❌ Current session has no project directory.",
    NO_MATCHES: "❌ Could not find: @{mention}",
    TOO_MANY_MATCHES: "🔍 Too many matches. Please be more specific.",
    FILE_TOO_LARGE: "⚠️ File {path} is too large to include (>{maxSize}KB)",
    PERMISSION_DENIED: "🔒 Cannot access {path}: Permission denied",
    TIMEOUT: "⏱️ File search timed out. Please try again.",
};
```

---

## 10. Performance Considerations

### 10.1 Optimization Strategies
1. **Lazy Indexing:** Only index when first @mention detected
2. **Incremental Updates:** Watch file system, update index incrementally
3. **Smart Caching:** Cache per project with LRU eviction
4. **Debouncing:** Debounce user input for real-time suggestions
5. **Pagination:** For large result sets, paginate inline keyboard
6. **Worker Threads:** Offload fuzzy matching to worker (future)

### 10.2 Performance Targets
- File indexing: < 500ms for 10k files
- Fuzzy matching: < 100ms for 10k files
- UI response time: < 200ms from user action
- Memory usage: < 50MB for file index (10k files)

---

## 11. Security Considerations

### 11.1 Path Traversal Prevention
```typescript
function sanitizePath(path: string): string {
    // Remove ../ attempts
    const normalized = path.replace(/\.\.[\/\\]/g, "");
    
    // Ensure path is within project directory
    const resolvedPath = resolve(projectRoot, normalized);
    if (!resolvedPath.startsWith(projectRoot)) {
        throw new Error("Path traversal attempt detected");
    }
    
    return resolvedPath;
}
```

### 11.2 Access Control
- Only allow file access within current project directory
- Respect .gitignore and custom ignore patterns
- Don't expose system files or credentials
- Rate limit file content fetching per user

---

## 12. Future Enhancements

### 12.1 Advanced Mention Types
- **Folder mentions:** `@src/components/` (all files in folder)
- **Glob patterns:** `@**/*.test.ts` (all test files)
- **Line ranges:** `@file.ts:10-20` (specific lines)
- **Symbol mentions:** `@file.ts#functionName` (specific function)

### 12.2 Smart Features
- **Recent files:** Quick access to recently opened files
- **Related files:** Auto-suggest related files (imports, tests)
- **Diff mentions:** `@file.ts@branch` (compare branches)
- **Alias system:** User-defined shortcuts

### 12.3 Enhanced UI
- **Inline autocomplete:** Real-time suggestions as typing
- **File preview:** Show first few lines in selection UI
- **Syntax highlighting:** In preview snippets
- **Breadcrumb navigation:** Navigate file tree in UI

---

## 13. Documentation Plan

### 13.1 User Documentation
- Update README.md with @mention usage
- Add examples to help command
- Create tutorial video/GIF
- FAQ section for common issues

### 13.2 Developer Documentation
- Architecture diagram (like this doc)
- API documentation for services
- Configuration options
- Extension guide for custom matchers

---

## 14. Rollout Strategy

### 14.1 Beta Testing
1. Deploy to small test group (5-10 users)
2. Collect feedback on UX and performance
3. Iterate on UI based on feedback
4. Monitor error rates and performance metrics

### 14.2 Gradual Rollout
1. Release as opt-in feature (env flag)
2. Announce in changelog
3. Monitor adoption and issues
4. Enable by default after 2 weeks
5. Iterate based on usage patterns

### 14.3 Success Metrics
- Adoption rate: % of prompts using @mentions
- Success rate: % of mentions resolved correctly
- User satisfaction: Survey responses
- Performance: P95 response time
- Error rate: Failed resolutions per 1000 prompts

---

## 15. Estimated Effort

| Phase | Task | Estimated Hours |
|-------|------|----------------|
| 1 | Core infrastructure | 16h |
| 2 | Integration | 12h |
| 3 | UI implementation | 16h |
| 4 | Optimization | 8h |
| 5 | Testing | 12h |
| 6 | Documentation | 6h |
| **Total** | | **70h** |

**Timeline:** ~2-3 weeks for full implementation

---

## 16. Dependencies

### 16.1 NPM Packages
```json
{
  "dependencies": {
    "fuse.js": "^7.0.0"
  }
}
```

### 16.2 External APIs
- OpenCode SDK: `client.project.files()` (get file list)
- OpenCode SDK: `client.file.get()` (get file content)
- Telegram Bot API: Inline keyboards, callback queries

---

## 17. Risks & Mitigations

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Slow file indexing | High | Medium | Cache, lazy load, optimize |
| Poor fuzzy matching | High | Low | Tune scoring, test extensively |
| Complex UX | Medium | Medium | Iterate based on user feedback |
| Memory leaks | High | Low | Proper cache eviction, monitoring |
| OpenCode API changes | Medium | Low | Version pinning, integration tests |

---

## Conclusion

This implementation plan provides a comprehensive roadmap for adding fuzzy file search with @mentions to telegramCoder. The hybrid UX approach (post-send confirmation with inline buttons) provides the best balance of reliability and user experience within Telegram's constraints.

**Key Success Factors:**
1. Fast, accurate fuzzy matching
2. Intuitive confirmation UI
3. Graceful error handling
4. Good performance with large projects
5. Clear documentation and examples

**Next Steps:**
1. Review and approve this plan
2. Install dependencies (fuse.js)
3. Begin Phase 1 implementation
4. Set up test environment
5. Create feature branch: `feature/file-mentions`
