# Treecourse - AI Code Assistant for VS Code

An advanced AI-powered coding assistant that brings Cline/Kilo Code-like functionality directly into Visual Studio Code with interactive workflows, markdown previews, and comprehensive file management.

## Features

### 🚀 Core Functionality

#### **Accept/Reject Workflow**
- Inline diff viewer for reviewing changes before acceptance
- Batch operation approval system
- Visual comparison between original and modified code
- One-click accept/reject for individual or all changes
- Pending changes queue with status tracking

#### **Markdown Preview Panel**
- Real-time rendered markdown display
- Syntax highlighting for code blocks
- Interactive preview with clickable links
- Side-by-side editing and preview modes
- Dark/light theme support

#### **Command Queue System**
- Batch operations with execution order management
- Operation history tracking
- Queue management interface in sidebar
- Status indicators for pending/accepted/rejected changes

#### **AI Response Processing**
- Paste AI responses directly from clipboard (Ctrl+Shift+V)
- Automatic parsing of file operations from AI output
- Support for multiple AI providers (OpenAI, Anthropic, Ollama)
- Context-aware conversation history

### 📁 File Operations

The extension supports multiple file operation types:

#### **Create/Update Files**
```xml
<file path="lib/core/constants/api_constants.dart">
// Complete file content here
class ApiConstants {
  static const String baseUrl = 'http://localhost:8080';
}
</file>
```

#### **Delete Files**
```xml
<delete path="src/old-file.ts" />
```

#### **Rename Files**
```xml
<rename from="src/old-name.ts" to="src/new-name.ts" />
```

#### **Modify Specific Lines**
```xml
<modify path="lib/core/constants.dart" line="42">
  static const String newUrl = 'https://api.example.com';
</modify>
```

#### **Execute Shell Commands**
```xml
<shell>
npm install package-name
</shell>
```

#### **Code Blocks with Paths**
````markdown
```dart:path/to/file.dart
class MyClass {
  // Code here will be parsed
}
```
````

## Installation

### From VSIX Package
1. Download the `.vsix` file
2. Open VS Code
3. Go to Extensions (Ctrl+Shift+X)
4. Click the "..." menu → "Install from VSIX"
5. Select the downloaded file

### From Source
```bash
cd treecourse-extension
npm install
npm run compile
# Press F5 to run in development host
```

## Usage

### Quick Start

1. **Copy AI Response**: Copy any AI-generated code response to your clipboard
2. **Process Clipboard**: Press `Ctrl+Shift+V` (or `Cmd+Shift+V` on Mac)
3. **Review Changes**: The extension will parse and queue all file operations
4. **Accept/Reject**: Review each change and accept or reject individually, or use batch operations

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+Shift+A` | Open AI Chat Panel |
| `Ctrl+Shift+V` | Process AI Response from Clipboard |
| `Ctrl+Shift+M` | Toggle Markdown Preview |
| `Ctrl+Shift+Enter` | Accept All Pending Changes |
| `Ctrl+Shift+Escape` | Reject All Pending Changes |

### Commands

Access via Command Palette (`Ctrl+Shift+P`):

- `Treecourse: Start Chat` - Open the AI chat panel
- `Treecourse: Process AI Response from Clipboard` - Parse and queue clipboard content
- `Treecourse: Accept All Changes` - Apply all pending changes
- `Treecourse: Reject All Changes` - Discard all pending changes
- `Treecourse: Toggle Markdown Preview` - Show/hide markdown preview
- `Treecourse: Show Command Queue` - Display pending changes
- `Treecourse: Undo Last Operation` - Revert last applied change
- `Treecourse: Clear History` - Clear operation history

### Configuration

Add these settings to your `settings.json`:

```json
{
  "treecourse.apiKey": "your-api-key",
  "treecourse.model": "gpt-4",
  "treecourse.maxTokens": 4096,
  "treecourse.enableMarkdownPreview": true,
  "treecourse.showDiffViewer": true,
  "treecourse.autoAccept": false,
  "treecourse.safeMode": true
}
```

#### Settings Explained

- `treecourse.apiKey`: API key for your AI provider
- `treecourse.model`: AI model to use (gpt-4, claude-3, etc.)
- `treecourse.maxTokens`: Maximum tokens for AI responses
- `treecourse.enableMarkdownPreview`: Enable markdown preview panel
- `treecourse.showDiffViewer`: Show diff viewer when applying changes
- `treecourse.autoAccept`: Automatically accept changes without review (use with caution)
- `treecourse.safeMode`: Enable safety checks before executing changes

## Example Workflow

### Scenario: Updating API Constants

1. Ask your AI assistant: "Update my API constants file with new endpoints"

2. AI responds with:
```markdown
## File: `lib/core/constants/api_constants.dart`

```dart
import 'package:flutter/foundation.dart';

@immutable
class ApiConstants {
  const ApiConstants._();
  
  static const String baseUrl = String.fromEnvironment(
    'BASE_URL',
    defaultValue: 'http://192.168.1.7:8080',
  );
  
  static const String loginEndpoint = '/api/auth/login';
  static const String registerEndpoint = '/api/auth/register';
}
```
```

3. Copy the entire response

4. Press `Ctrl+Shift+V` in VS Code

5. Review the parsed changes in the queue panel

6. Click "Accept All" or review individual changes

7. The file is automatically created/updated!

## Architecture

```
┌─────────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│ User Input  │ ──→ │  Parse   │ ──→ │  Queue   │ ──→ │  Execute │
│ (Clipboard) │     │ Response │     │ Manager  │     │  Changes │
└─────────────┘     └──────────┘     └──────────┘     └──────────┘
       ↑                                                      │
       │                                                      ↓
       └────────────── [Review/Accept/Reject] ←───────────────┘
```

### Components

- **Response Parser**: Extracts file operations from AI responses
- **Change Queue**: Manages pending operations with status tracking
- **Diff Viewer**: Shows visual differences before applying
- **File Executor**: Applies changes to workspace files
- **Markdown Preview**: Renders markdown content with syntax highlighting

## Supported Languages

The extension supports syntax highlighting and file creation for:

- TypeScript/JavaScript (.ts, .tsx, .js, .jsx)
- Dart (.dart)
- Python (.py)
- Java (.java)
- C# (.cs)
- C/C++ (.cpp, .c)
- Go (.go)
- Rust (.rs)
- Ruby (.rb)
- PHP (.php)
- Swift (.swift)
- Kotlin (.kt)
- Shell scripts (.sh)
- And many more...

## Troubleshooting

### Changes Not Applying
- Ensure you have a workspace folder open
- Check file permissions
- Verify the file path is correct

### Markdown Preview Not Showing
- Check if `treecourse.enableMarkdownPreview` is enabled
- Try toggling with `Ctrl+Shift+M`

### Clipboard Processing Fails
- Ensure the AI response contains valid file operation tags
- Check for malformed XML tags or code blocks

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Roadmap

- [ ] Voice-to-code integration
- [ ] Advanced debugging assistance
- [ ] Performance profiling suggestions
- [ ] Automated testing generation
- [ ] Database schema management
- [ ] Deployment automation
- [ ] Team collaboration features
- [ ] Offline model support (Ollama integration)
- [ ] Multi-file dependency analysis
- [ ] Git integration for commits

## License

MIT License - see LICENSE file for details.

## Support

For issues or questions:
- GitHub Issues: [Create an issue](https://github.com/yourusername/treecourse/issues)
- Documentation: [View docs](https://github.com/yourusername/treecourse/wiki)

---

**Built with ❤️ for developers who want AI-powered productivity**
