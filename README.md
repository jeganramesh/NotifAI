# Treecourse: Agentic AI Development for VS Code

**Treecourse** is a powerful VS Code extension that bridges the gap between AI-generated code and your local file system. Inspired by tools like **Cline** and **Kilo Code**, it parses AI responses, previews changes with advanced diff views, and allows you to apply them with a single click through an intuitive accept/reject workflow.

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## 🎯 Features

### Core Functionality

* **Smart Parsing:** Automatically extracts file paths and code blocks from AI responses (Markdown format)
* **Safe Syncing:** Built-in "Dry Run" mode to preview changes before they hit your disk
* **Agentic Workflow:** The "Accept/Reject" gate ensures you maintain full control over your codebase
* **Atomic Updates:** Ensures files are created or updated correctly without risking corruption
* **Git Integration:** Automatically respects your `.gitignore` and tracks changes within your existing repository

### Advanced Features (Cline/Kilo-style)

#### 1. **Interactive Accept/Reject Workflow**
   - Inline diff viewer showing proposed changes side-by-side
   - One-click accept or reject for each file individually
   - Batch accept/reject all changes
   - Keyboard shortcuts: `Ctrl+Enter` (Accept), `Esc` (Reject)
   - Partial acceptance support (coming soon)

#### 2. **Markdown Preview Panel**
   - Rendered markdown view with syntax-highlighted code blocks
   - Collapsible sections for large files
   - Copy-to-clipboard buttons for individual code blocks
   - Export to HTML/PDF functionality
   - Theme-aware styling (light/dark mode)

#### 3. **Command Queue System**
   - Batch multiple AI suggestions into a queue
   - Execute commands in sequence or individually
   - Pause/resume queue execution
   - Undo/Redo support for all applied operations
   - Queue persistence across sessions

#### 4. **Integrated Chat Interface**
   - Side panel chat with AI providers (OpenAI, Anthropic, Local)
   - Conversation history with search
   - Context-aware code suggestions
   - Quick actions from chat messages
   - Multi-model support

#### 5. **Multi-File Operations**
   - Create multiple files from a single AI response
   - Update existing files with smart merging
   - Delete files (with confirmation dialog)
   - Rename/move operations support
   - Directory creation automatically

#### 6. **Terminal Integration**
   - Run shell commands suggested by AI
   - Integrated terminal output viewer
   - Command history and favorites
   - Auto-run safe commands toggle
   - Error detection and suggestions

#### 7. **Code Analysis & Safety**
   - Static analysis before applying changes
   - Linting integration (ESLint, Pylint, etc.)
   - Type checking for TypeScript/Dart
   - Conflict detection with existing code
   - Performance impact estimation

#### 8. **Context Awareness**
   - Project structure analysis
   - Import dependency resolution
   - Intelligent file path completion
   - Workspace-wide search and replace
   - Symbol awareness (functions, classes, variables)

## 📋 AI Response Format

The extension recognizes AI responses in the following format:

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
}
```

## File: `src/services/api.ts`

```typescript
export class ApiService {
  private baseUrl: string;
  
  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }
}
```

## Command: `npm install`

## Delete: `old/file.ts`

## Rename: `old/path.dart` → `new/path.dart`
```

### Supported Patterns

1. **File Creation/Update**:
   ```markdown
   ## File: `path/to/file.dart`
   ```dart
   // code content
   ```
   ```

2. **File Deletion**:
   ```markdown
   ## Delete: `old/file.dart`
   ```

3. **File Rename**:
   ```markdown
   ## Rename: `old/path.dart` → `new/path.dart`
   ```

4. **Shell Commands**:
   ```markdown
   ## Command: `flutter pub get`
   ```

## 📥 How to Use

### Basic Workflow

1. **Generate:** Ask any AI (ChatGPT, Claude, Copilot) for code changes
2. **Paste:** Copy the AI response containing the `## File: path/to/file` blocks
3. **Apply:** Run the Treecourse command (`Ctrl+Shift+P` → `Treecourse: Apply AI Response`)
4. **Review:** Treecourse opens a preview window showing you a `diff` of the proposed changes
5. **Sync:** Click **Accept** to write the files, or **Reject** to discard them

### Advanced Usage

#### Using the Chat Panel
1. Open the chat panel: `Ctrl+Alt+C` or click the Treecourse icon in the sidebar
2. Describe what you want to build or change
3. Review the AI's response in the markdown preview
4. Click "Apply Changes" to start the accept/reject workflow

#### Command Queue
1. Generate multiple AI responses
2. Each response is added to the command queue automatically
3. Review the queue: `Ctrl+Alt+Q`
4. Execute all or select specific items

#### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+Shift+P` → `Treecourse: Apply` | Apply AI response from clipboard |
| `Ctrl+Alt+A` | Accept current change in diff view |
| `Ctrl+Alt+R` | Reject current change |
| `Ctrl+Alt+M` | Toggle markdown preview |
| `Ctrl+Alt+C` | Focus chat panel |
| `Ctrl+Alt+Q` | Show command queue |
| `Ctrl+Alt+Z` | Undo last applied change |

## ⚙️ Extension Commands

| Command | Description |
| --- | --- |
| `treecourse.apply` | Opens a text box to paste AI response and begins the sync process |
| `treecourse.dryRun` | Parses the response and logs proposed changes to the console without writing files |
| `treecourse.acceptAll` | Accept all pending changes in the queue |
| `treecourse.rejectAll` | Reject all pending changes |
| `treecourse.markdownPreview` | Open markdown preview for the last AI response |
| `treecourse.chatFocus` | Focus the chat panel |
| `treecourse.showQueue` | Display the command queue |
| `treecourse.undoLast` | Undo the last applied change |

## 🔌 Configuration

Add these to your `settings.json`:

```json
{
  "treecourse.autoFormat": true,
  "treecourse.showDiff": true,
  "treecourse.backupFiles": true,
  "treecourse.autoDetectClipboard": true,
  "treecourse.chat.provider": "openai",
  "treecourse.chat.model": "gpt-4-turbo",
  "treecourse.terminal.autoRun": false,
  "treecourse.git.autoCommit": false,
  "treecourse.notifications.enabled": true,
  "treecourse.markdown.theme": "default"
}
```

### Configuration Options

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `treecourse.autoFormat` | boolean | `true` | Automatically format files after applying changes |
| `treecourse.showDiff` | boolean | `true` | Show diff preview before applying changes |
| `treecourse.backupFiles` | boolean | `true` | Create backup files before overwriting |
| `treecourse.autoDetectClipboard` | boolean | `true` | Automatically detect AI responses in clipboard |
| `treecourse.chat.provider` | string | `"openai"` | AI provider (openai, anthropic, google, local) |
| `treecourse.chat.model` | string | `"gpt-4-turbo"` | Model to use for chat |
| `treecourse.terminal.autoRun` | boolean | `false` | Automatically run suggested terminal commands |
| `treecourse.git.autoCommit` | boolean | `false` | Auto-commit changes to git |
| `treecourse.notifications.enabled` | boolean | `true` | Enable desktop notifications |

## 🏗️ Architecture Flow

Treecourse follows an "Observe-Propose-Execute" loop to ensure stability:

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   Paste AI  │ ──▶ │   Parse &    │ ──▶ │  Preview    │
│  Response   │     │   Extract    │     │  Changes    │
└─────────────┘     └──────────────┘     └─────────────┘
                                                │
                          ┌─────────────────────┼─────────────────────┐
                          ▼                                           ▼
                   ┌──────────────┐                           ┌──────────────┐
                   │   Accept     │                           │   Reject     │
                   │   Changes    │                           │  Changes     │
                   └──────────────┘                           └──────────────┘
                          │                                           │
                          ▼                                           ▼
                   ┌──────────────┐                           ┌──────────────┐
                   │ Write Files  │                           │   Discard    │
                   │  & Format    │                           │   Changes    │
                   └──────────────┘                           └──────────────┘
```

## 🛠️ Requirements

* **VS Code:** 1.80.0 or higher
* **Node.js:** 18.x or higher (for development)
* **Environment:** Works on Windows, macOS, and Linux

## 📦 Installation

### From VSIX
1. Download the `.vsix` file from releases
2. Open VS Code
3. Go to Extensions (`Ctrl+Shift+X`)
4. Click "..." → "Install from VSIX"
5. Select the downloaded file

### From Marketplace (Coming Soon)
1. Open VS Code Extensions panel
2. Search for "Treecourse"
3. Click Install

## 📦 Getting Started for Developers

If you are looking to contribute or fork Treecourse:

1. **Clone the repo:** `git clone https://github.com/treecourse/treecourse-vscode`
2. **Install dependencies:** `npm install`
3. **Run:** Press `F5` in VS Code to launch the **Extension Development Host**
4. **Build:** `npm run compile`
5. **Package:** `npm run package`

### Development Commands

```bash
# Install dependencies
npm install

# Compile TypeScript
npm run compile

# Watch mode (auto-compile on save)
npm run watch

# Run tests
npm test

# Package extension
npm run package

# Lint code
npm run lint
```

## 🧪 Testing

```bash
# Run unit tests
npm test

# Run integration tests
npm run test:integration

# Run with coverage
npm run test:coverage
```

## 🤝 Contributing

We welcome contributions! Here's how you can help:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Contribution Guidelines

- Follow the existing code style
- Add tests for new features
- Update documentation as needed
- Keep commits atomic and well-described

## 🐛 Issues & Support

- **Report bugs:** [GitHub Issues](https://github.com/treecourse/treecourse-vscode/issues)
- **Feature requests:** [Discussions](https://github.com/treecourse/treecourse-vscode/discussions)
- **Documentation:** [Wiki](https://github.com/treecourse/treecourse-vscode/wiki)
- **Email:** support@treecourse.dev

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details

## 🙏 Acknowledgments

Inspired by:
- [Cline](https://cline.bot/) - Agentic coding assistant
- [Kilo Code](https://kilocode.ai/) - AI-powered development
- [Cursor](https://cursor.sh/) - AI-first code editor
- [GitHub Copilot](https://copilot.github.com/) - AI pair programmer

## 📈 Roadmap

- [ ] Partial file acceptance (accept specific hunks)
- [ ] Real-time collaboration features
- [ ] Custom AI model integration
- [ ] Advanced refactoring tools
- [ ] Team sharing and templates
- [ ] Performance profiling integration
- [ ] Multi-workspace support

---

**Version:** 1.0.0  
**Author:** Treecourse Team  
**Marketplace:** [VS Code Marketplace Link]  
**Website:** https://treecourse.dev
