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
function activate(context) {
    outputChannel = vscode.window.createOutputChannel('Treecourse');
    context.subscriptions.push(outputChannel);
    outputChannel.appendLine('Treecourse extension activated');
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
function deactivate() {
    outputChannel.appendLine('Treecourse extension deactivated');
}
//# sourceMappingURL=extension.js.map