# File Upload Handler

## Overview
Implemented automatic file handling for all file types sent to the bot. Files are saved to `/tmp/telegramCoder` and the full path is returned to the user in a tappable format. **The directory is created automatically if it doesn't exist.**

## Features

### Automatic Directory Creation
✅ **No Setup Required** - Directory is created automatically on first file upload
✅ **Recursive Creation** - Uses `{ recursive: true }` to create parent directories
✅ **Logged** - Directory creation is logged to console for visibility
✅ **Idempotent** - Checks existence before creating, safe to run multiple times

### Supported File Types
✅ **Documents** - PDFs, text files, code files, archives, etc.
✅ **Photos** - JPG, PNG, GIF (saves highest resolution)
✅ **Videos** - MP4, MOV, AVI, etc.
✅ **Audio** - MP3, WAV, OGG, etc.
✅ **Voice Messages** - Voice recordings from Telegram
✅ **Video Notes** - Round video messages

### Functionality
1. **Automatic Detection** - Detects any file type sent to the bot
2. **Download from Telegram** - Fetches file from Telegram servers
3. **Save to Directory** - Saves to `/tmp/telegramCoder` with original filename
4. **Tappable Path** - Returns path in `<code>` tags for easy copying
5. **Auto-Delete Confirmation** - Confirmation message auto-deletes after 10s
6. **Logging** - Logs file type and size for debugging

## Implementation

### File Modified
`src/features/opencode/opencode.bot.ts`

### Handler Registration
```typescript
// Handle file uploads (documents, photos, videos, audio, etc.)
bot.on("message:document", AccessControlMiddleware.requireAccess, this.handleFileUpload.bind(this));
bot.on("message:photo", AccessControlMiddleware.requireAccess, this.handleFileUpload.bind(this));
bot.on("message:video", AccessControlMiddleware.requireAccess, this.handleFileUpload.bind(this));
bot.on("message:audio", AccessControlMiddleware.requireAccess, this.handleFileUpload.bind(this));
bot.on("message:voice", AccessControlMiddleware.requireAccess, this.handleFileUpload.bind(this));
bot.on("message:video_note", AccessControlMiddleware.requireAccess, this.handleFileUpload.bind(this));
```

### Handler Logic
```typescript
private async handleFileUpload(ctx: Context): Promise<void> {
    // 1. Extract file info (ID, name, type)
    // 2. Get file from Telegram API
    // 3. Download file content
    // 4. Save to /tmp/telegramCoder
    // 5. Reply with clickable path
}
```

## User Experience

### Before
- No file handling
- Users had to manually transfer files

### After
```
User: [Sends document "config.json"]

Bot: ✅ File saved!

     Path: /tmp/telegramCoder/config.json

     Tap the path to copy it.
     
[Message auto-deletes after 10 seconds]
```

## Technical Details

### File Naming
- **Documents/Videos/Audio**: Uses original filename
- **Photos**: Generated as `photo_[timestamp].jpg`
- **Voice**: Generated as `voice_[timestamp].ogg`
- **Video Notes**: Generated as `video_note_[timestamp].mp4`

### Directory Structure
```
/tmp/telegramCoder/
├── config.json
├── photo_1704668123456.jpg
├── voice_1704668234567.ogg
└── document_name.pdf
```

### Photo Handling
Photos in Telegram come in multiple sizes. The handler automatically selects the **highest resolution** version:
```typescript
const photo = message.photo[message.photo.length - 1];
```

### Error Handling
✅ Missing file ID
✅ Failed download
✅ Write errors
✅ Invalid file types

## Security Considerations

### Access Control
- All file handlers protected by `AccessControlMiddleware.requireAccess`
- Only authorized users can upload files

### Storage Location
- Files saved to `/tmp` which is:
  - Temporary storage (cleared on reboot)
  - Not persistent
  - Suitable for processing, not long-term storage

### File Validation
- No file size restrictions (uses Telegram's limits)
- No file type restrictions (accepts all Telegram file types)
- Directory is created with proper permissions

## Usage Examples

### Upload a Document
1. Send any file to the bot
2. Bot saves it to `/tmp/telegramCoder/filename.ext`
3. Bot replies with the full path
4. Tap path to copy to clipboard

### Use in OpenCode Session
```
User: [Uploads config.json]
Bot: ✅ File saved!
     Path: /tmp/telegramCoder/config.json

User: @config.json
Bot: [Shows file selection UI with the uploaded file]
```

### Upload and Reference
```
User: [Uploads script.sh]
Bot: ✅ File saved!
     Path: /tmp/telegramCoder/script.sh

User: Run the script I just uploaded
Bot: [AI can reference /tmp/telegramCoder/script.sh]
```

## Help Text Update
Updated help message to include:
- "3. Upload: Send any file - it saves to /tmp/telegramCoder"
- "• Send files - they're saved to /tmp/telegramCoder"
- "• Tap the file path to copy it to clipboard"

## Logging
Console logs include:
```
✓ File saved: /tmp/telegramCoder/config.json (document, 1234 bytes)
✓ File saved: /tmp/telegramCoder/photo_1704668123456.jpg (photo, 56789 bytes)
```

## Future Enhancements
Possible improvements:
- Configurable save directory (environment variable)
- File size limits and validation
- File type filtering
- Automatic cleanup of old files
- Integration with OpenCode file system
- Direct file upload to project directory
- File compression for large files

## Related Features
- Works alongside file mentions (@filename)
- Can be used in OpenCode sessions
- Compatible with all bot commands

## Testing
To test:
1. Send a document to the bot
2. Verify file is saved to `/tmp/telegramCoder/`
3. Check that bot replies with the correct path
4. Tap the path to verify it's copyable
5. Try different file types (photo, video, audio)
6. Verify confirmation message auto-deletes

## Files Modified
- `src/features/opencode/opencode.bot.ts` - Added file upload handler
- `docs/file-upload-handler.md` - This documentation
