# Change Log

All notable changes to the "treecourse" extension will be documented in this file.

## [1.0.0] - Initial Release

### Features
- **Smart Parsing**: Automatically extracts file paths and code blocks from AI responses (Markdown format)
- **Safe Syncing**: Built-in "Dry Run" mode to preview changes before they hit your disk
- **Agentic Workflow**: Accept/Reject gate ensures you maintain full control over your codebase
- **Atomic Updates**: Ensures files are created or updated correctly without risking corruption
- **Git Integration**: Automatically respects your `.gitignore` and tracks changes within your existing repository
- **Clipboard Detection**: Automatically detects clipboard content for quick pasting
- **Backup System**: Creates timestamped backups before overwriting files
- **Auto-formatting**: Automatically formats files after applying changes
- **Diff Preview**: Shows unified diff before applying changes

### Commands
- `Treecourse: Apply AI Response` - Parse and apply AI-generated code
- `Treecourse: Preview AI Response (Dry Run)` - Preview changes without applying

### Configuration
- `treecourse.autoFormat` - Enable/disable auto-formatting (default: true)
- `treecourse.showDiff` - Show diff preview before applying (default: true)
- `treecourse.backupFiles` - Create backup files before overwriting (default: true)
