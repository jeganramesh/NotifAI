"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const parser_1 = require("./parser");
const fileHandler_1 = require("./fileHandler");
let outputChannel;
let webviewPanel;
function activate(context) {
    outputChannel = vscode.window.createOutputChannel('Treecourse');
    context.subscriptions.push(outputChannel);
    outputChannel.appendLine('Treecourse extension activated');
    // Register Treecourse view provider for sidebar
    const treecourseViewProvider = new TreecourseViewProvider(context.extensionUri);
    context.subscriptions.push(vscode.window.registerWebviewViewProvider('treecourse.webview', treecourseViewProvider));
    // Register Apply command
    const applyCommand = vscode.commands.registerCommand('treecourse.apply', async () => {
        await handleApplyCommand();
    });
    // Register Dry Run command
    const dryRunCommand = vscode.commands.registerCommand('treecourse.dryRun', async () => {
        await handleDryRunCommand();
    });
    context.subscriptions.push(applyCommand, dryRunCommand);
}
async function handleApplyCommand() {
    try {
        // Get AI response from clipboard or input
        const aiResponse = await getAIResponseFromUser();
        if (!aiResponse || aiResponse.trim() === '') {
            vscode.window.showWarningMessage('No AI response provided');
            return;
        }
        outputChannel.appendLine('Parsing AI response...');
        const fileChanges = (0, parser_1.parseAIResponse)(aiResponse);
        if (fileChanges.length === 0) {
            vscode.window.showWarningMessage('No file changes detected in the AI response');
            return;
        }
        outputChannel.appendLine(`Found ${fileChanges.length} file(s) to process`);
        // Show preview with diff
        const config = vscode.workspace.getConfiguration('treecourse');
        const showDiff = config.get('showDiff', true);
        const backupFiles = config.get('backupFiles', true);
        if (showDiff) {
            const userConfirmed = await (0, fileHandler_1.previewChanges)(fileChanges);
            if (!userConfirmed) {
                vscode.window.showInformationMessage('Changes rejected by user');
                return;
            }
        }
        // Apply changes
        outputChannel.appendLine('Applying changes...');
        const result = await (0, fileHandler_1.applyChanges)(fileChanges, backupFiles);
        if (result.success) {
            vscode.window.showInformationMessage(`Successfully applied ${result.appliedCount} file(s). ${result.failedCount > 0 ? `${result.failedCount} failed.` : ''}`);
            // Auto-format if enabled
            const autoFormat = config.get('autoFormat', true);
            if (autoFormat && result.appliedFiles.length > 0) {
                await formatFiles(result.appliedFiles);
            }
        }
        else {
            vscode.window.showErrorMessage(`Failed to apply changes: ${result.error}`);
        }
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        vscode.window.showErrorMessage(`Treecourse error: ${errorMessage}`);
        outputChannel.appendLine(`Error: ${errorMessage}`);
    }
}
async function handleDryRunCommand() {
    try {
        const aiResponse = await getAIResponseFromUser();
        if (!aiResponse || aiResponse.trim() === '') {
            vscode.window.showWarningMessage('No AI response provided');
            return;
        }
        outputChannel.appendLine('=== DRY RUN MODE ===');
        const fileChanges = (0, parser_1.parseAIResponse)(aiResponse);
        if (fileChanges.length === 0) {
            vscode.window.showWarningMessage('No file changes detected');
            return;
        }
        let summary = `📋 DRY RUN - Would process ${fileChanges.length} file(s):\n\n`;
        fileChanges.forEach((change, index) => {
            const action = change.action === 'create' ? 'CREATE' : 'UPDATE';
            summary += `${index + 1}. [${action}] ${change.filePath}\n`;
            summary += `   Lines: ${change.content.split('\n').length}\n`;
        });
        outputChannel.appendLine(summary);
        outputChannel.show(true);
        vscode.window.showInformationMessage(`Dry run complete. Found ${fileChanges.length} file(s). Check output panel.`);
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        vscode.window.showErrorMessage(`Treecourse error: ${errorMessage}`);
        outputChannel.appendLine(`Error: ${errorMessage}`);
    }
}
async function getAIResponseFromUser() {
    // Try to get from clipboard first
    try {
        const clipboardContent = await vscode.env.clipboard.readText();
        if (clipboardContent && clipboardContent.trim().length > 0) {
            const useClipboard = await vscode.window.showQuickPick(['Yes', 'No'], {
                placeHolder: 'Use content from clipboard?',
                ignoreFocusOut: true
            });
            if (useClipboard === 'Yes') {
                return clipboardContent;
            }
        }
    }
    catch {
        // Clipboard access might fail, continue to input box
    }
    // Fallback to input box
    const aiResponse = await vscode.window.showInputBox({
        prompt: 'Paste the AI response containing code blocks',
        placeHolder: '## File: `path/to/file.dart`\n```dart\ncode here\n```',
        ignoreFocusOut: true,
        value: '',
    });
    return aiResponse;
}
async function formatFiles(filePaths) {
    for (const filePath of filePaths) {
        try {
            const uri = vscode.Uri.file(filePath);
            await vscode.commands.executeCommand('editor.action.formatDocument', uri);
        }
        catch (error) {
            outputChannel.appendLine(`Warning: Could not format ${filePath}`);
        }
    }
}
class TreecourseViewProvider {
    constructor(extensionUri) {
        this.extensionUri = extensionUri;
    }
    resolveWebviewView(webviewView, context, _token) {
        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this.extensionUri]
        };
        webviewView.webview.html = this.getHtmlForWebview(webviewView.webview);
        // Handle messages from the webview
        webviewView.webview.onDidReceiveMessage(data => {
            switch (data.type) {
                case 'apply':
                    handleApplyCommand();
                    break;
                case 'dryRun':
                    handleDryRunCommand();
                    break;
            }
        });
    }
    getHtmlForWebview(webview) {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Treecourse</title>
    <style>
        body {
            padding: 10px;
            font-family: var(--vscode-font-family);
            color: var(--vscode-foreground);
            background-color: var(--vscode-sideBar-background);
        }
        h2 {
            margin-top: 0;
        }
        .button-container {
            display: flex;
            gap: 10px;
            margin-top: 15px;
        }
        button {
            flex: 1;
            padding: 8px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 13px;
        }
        .apply-btn {
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
        }
        .apply-btn:hover {
            background-color: var(--vscode-button-hoverBackground);
        }
        .dryrun-btn {
            background-color: var(--vscode-button-secondaryBackground);
            color: var(--vscode-button-secondaryForeground);
        }
        .dryrun-btn:hover {
            background-color: var(--vscode-button-secondaryHoverBackground);
        }
        .info {
            margin-top: 20px;
            font-size: 12px;
            opacity: 0.8;
        }
    </style>
</head>
<body>
    <h2>Treecourse</h2>
    <p>AI Code Apply Extension</p>
    <div class="button-container">
        <button class="apply-btn" id="applyBtn">Apply</button>
        <button class="dryrun-btn" id="dryRunBtn">Preview</button>
    </div>
    <div class="info">
        <p>Use the commands to apply AI-generated code to your workspace.</p>
    </div>
    <script>
        const vscode = acquireVsCodeApi();
        
        document.getElementById('applyBtn').addEventListener('click', () => {
            vscode.postMessage({ type: 'apply' });
        });
        
        document.getElementById('dryRunBtn').addEventListener('click', () => {
            vscode.postMessage({ type: 'dryRun' });
        });
    </script>
</body>
</html>`;
    }
}
TreecourseViewProvider.viewType = 'treecourse.webview';
function deactivate() {
    outputChannel.appendLine('Treecourse extension deactivated');
}
//# sourceMappingURL=extension.js.map