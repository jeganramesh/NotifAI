import * as vscode from 'vscode';
import { ChangeQueue } from './changeQueue';
import { MarkdownPreviewPanel } from './markdownPreview';
import { ResponseParser, FileOperation, OperationType } from './responseParser';
import { DiffViewer } from './diffViewer';

let changeQueue: ChangeQueue;
let markdownPanel: MarkdownPreviewPanel | undefined;
let diffViewer: DiffViewer;
let contextGlobal: vscode.ExtensionContext | undefined;

export function activate(context: vscode.ExtensionContext) {
    console.log('Treecourse extension is now active!');
    
    contextGlobal = context;
    
    // Initialize components
    changeQueue = new ChangeQueue();
    diffViewer = new DiffViewer();
    
    // Register commands
    const startChatCommand = vscode.commands.registerCommand('treecourse.startChat', () => {
        showChatPanel(context);
    });

    const acceptAllCommand = vscode.commands.registerCommand('treecourse.acceptAll', async () => {
        await acceptAllChanges();
    });

    const rejectAllCommand = vscode.commands.registerCommand('treecourse.rejectAll', async () => {
        await rejectAllChanges();
    });

    const acceptChangeCommand = vscode.commands.registerCommand('treecourse.acceptChange', async (item: any) => {
        await acceptSingleChange(item);
    });

    const rejectChangeCommand = vscode.commands.registerCommand('treecourse.rejectChange', async (item: any) => {
        await rejectSingleChange(item);
    });

    const markdownPreviewCommand = vscode.commands.registerCommand('treecourse.markdownPreview', () => {
        toggleMarkdownPreview();
    });

    const showQueueCommand = vscode.commands.registerCommand('treecourse.showQueue', () => {
        showQueuePanel();
    });

    const undoLastCommand = vscode.commands.registerCommand('treecourse.undoLast', async () => {
        await undoLastOperation();
    });

    const clearHistoryCommand = vscode.commands.registerCommand('treecourse.clearHistory', () => {
        clearHistory();
    });

    const processClipboardCommand = vscode.commands.registerCommand('treecourse.processClipboard', async () => {
        await processAIResponseFromClipboard();
    });

    context.subscriptions.push(
        startChatCommand,
        acceptAllCommand,
        rejectAllCommand,
        acceptChangeCommand,
        rejectChangeCommand,
        markdownPreviewCommand,
        showQueueCommand,
        undoLastCommand,
        clearHistoryCommand,
        processClipboardCommand
    );

    // Set up context for when clauses
    updateContextKeys();
    
    // Listen for queue changes
    changeQueue.onDidChange(() => {
        updateContextKeys();
        refreshQueueView();
    });
}

async function processAIResponseFromClipboard() {
    try {
        const clipboardText = await vscode.env.clipboard.readText();
        
        if (!clipboardText.trim()) {
            vscode.window.showWarningMessage('Clipboard is empty');
            return;
        }

        const parser = new ResponseParser();
        const operations = parser.parse(clipboardText);

        if (operations.length === 0) {
            vscode.window.showInformationMessage('No file operations found in clipboard content');
            
            // Check if it's markdown content
            if (clipboardText.includes('#') || clipboardText.includes('```')) {
                toggleMarkdownPreview();
                if (markdownPanel) {
                    markdownPanel.setContent(clipboardText);
                }
            }
            return;
        }

        // Add operations to queue
        for (const operation of operations) {
            changeQueue.add(operation);
        }

        const action = operations.length === 1 ? 'operation' : 'operations';
        const result = await vscode.window.showInformationMessage(
            `Found ${operations.length} file ${action}. Review and accept/reject?`,
            'Review Changes',
            'Accept All',
            'Reject All'
        );

        if (result === 'Review Changes') {
            showQueuePanel();
        } else if (result === 'Accept All') {
            await acceptAllChanges();
        } else if (result === 'Reject All') {
            await rejectAllChanges();
        }

    } catch (error) {
        vscode.window.showErrorMessage(`Error processing clipboard: ${error}`);
    }
}

async function acceptAllChanges() {
    const operations = changeQueue.getAll();
    
    if (operations.length === 0) {
        vscode.window.showInformationMessage('No pending changes to accept');
        return;
    }

    let successCount = 0;
    let errorCount = 0;

    for (const operation of operations) {
        try {
            await executeOperation(operation);
            successCount++;
        } catch (error) {
            errorCount++;
            console.error(`Error executing operation: ${error}`);
        }
    }

    changeQueue.clear();
    updateContextKeys();

    let message = `Accepted ${successCount} operation(s)`;
    if (errorCount > 0) {
        message += ` (${errorCount} failed)`;
    }
    
    vscode.window.showInformationMessage(message);
}

async function rejectAllChanges() {
    const count = changeQueue.getAll().length;
    changeQueue.clear();
    updateContextKeys();
    vscode.window.showInformationMessage(`Rejected ${count} pending change(s)`);
}

async function acceptSingleChange(item: any) {
    const operation = changeQueue.getById(item.id);
    
    if (!operation) {
        return;
    }

    try {
        await executeOperation(operation);
        changeQueue.remove(operation.id);
        updateContextKeys();
        vscode.window.showInformationMessage('Change accepted');
    } catch (error) {
        vscode.window.showErrorMessage(`Error accepting change: ${error}`);
    }
}

async function rejectSingleChange(item: any) {
    changeQueue.remove(item.id);
    updateContextKeys();
    vscode.window.showInformationMessage('Change rejected');
}

async function executeOperation(operation: FileOperation) {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    const filePath = workspaceFolder 
        ? vscode.Uri.joinPath(workspaceFolder.uri, operation.path)
        : vscode.Uri.file(operation.path);

    switch (operation.type) {
        case OperationType.CREATE:
        case OperationType.UPDATE:
            if (operation.content !== undefined) {
                await createOrUpdateFile(filePath, operation.content);
            }
            break;
        
        case OperationType.DELETE:
            await deleteFile(filePath);
            break;
        
        case OperationType.RENAME:
            if (operation.newPath !== undefined) {
                await renameFile(filePath, operation.newPath);
            }
            break;
        
        case OperationType.MODIFY_LINES:
            if (operation.modifications !== undefined) {
                await modifySpecificLines(filePath, operation.modifications);
            }
            break;
    }
}

async function createOrUpdateFile(uri: vscode.Uri, content: string) {
    // Ensure directory exists
    const dir = uri.with({ path: uri.path.substring(0, uri.path.lastIndexOf('/')) });
    try {
        await vscode.workspace.fs.createDirectory(dir);
    } catch (error) {
        // Directory might already exist
    }

    // Check if file exists
    try {
        await vscode.workspace.fs.stat(uri);
        // File exists - update it
        const editor = await vscode.workspace.openTextDocument(uri);
        await vscode.window.showTextDocument(editor);
        
        const edit = new vscode.WorkspaceEdit();
        const fullRange = new vscode.Range(
            new vscode.Position(0, 0),
            new vscode.Position(editor.lineCount, 0)
        );
        edit.replace(uri, fullRange, content);
        
        await vscode.workspace.applyEdit(edit);
        await editor.save();
        
        // Show diff if enabled
        if (vscode.workspace.getConfiguration('treecourse').get('showDiffViewer')) {
            diffViewer.showDiff(uri, content);
        }
    } catch (error) {
        // File doesn't exist - create it
        const newDoc = await vscode.workspace.openTextDocument(uri);
        
        const edit = new vscode.WorkspaceEdit();
        edit.insert(uri, new vscode.Position(0, 0), content);
        
        await vscode.workspace.applyEdit(edit);
        await vscode.window.showTextDocument(newDoc);
        await newDoc.save();
    }
}

async function deleteFile(uri: vscode.Uri) {
    await vscode.workspace.fs.delete(uri, { recursive: false, useTrash: true });
    vscode.window.showInformationMessage(`Deleted: ${uri.fsPath}`);
}

async function renameFile(uri: vscode.Uri, newPath: string) {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    const newUri = workspaceFolder 
        ? vscode.Uri.joinPath(workspaceFolder.uri, newPath)
        : vscode.Uri.file(newPath);
    
    await vscode.workspace.fs.rename(uri, newUri);
    vscode.window.showInformationMessage(`Renamed: ${uri.fsPath} -> ${newUri.fsPath}`);
}

async function modifySpecificLines(uri: vscode.Uri, modifications: Array<{lineNumber: number, newContent: string}>) {
    const editor = await vscode.workspace.openTextDocument(uri);
    await vscode.window.showTextDocument(editor);
    
    const edit = new vscode.WorkspaceEdit();
    
    for (const mod of modifications) {
        const line = editor.lineAt(mod.lineNumber - 1); // Convert to 0-based index
        const range = new vscode.Range(
            new vscode.Position(line.lineNumber, 0),
            new vscode.Position(line.lineNumber, line.text.length)
        );
        edit.replace(uri, range, mod.newContent);
    }
    
    await vscode.workspace.applyEdit(edit);
    await editor.save();
}

function toggleMarkdownPreview() {
    if (markdownPanel) {
        markdownPanel.dispose();
        markdownPanel = undefined;
    } else {
        if (contextGlobal) {
            markdownPanel = MarkdownPreviewPanel.createOrShow(contextGlobal.extensionUri);
        }
    }
}

function showChatPanel(context: vscode.ExtensionContext) {
    vscode.commands.executeCommand('treecourseChatView.focus');
}

function showQueuePanel() {
    vscode.commands.executeCommand('treecourseQueueView.focus');
}

async function undoLastOperation() {
    // TODO: Implement undo functionality
    vscode.window.showInformationMessage('Undo functionality coming soon');
}

function clearHistory() {
    changeQueue.clear();
    updateContextKeys();
    vscode.window.showInformationMessage('History cleared');
}

function updateContextKeys() {
    const hasPendingChanges = changeQueue.getAll().length > 0;
    vscode.commands.executeCommand('setContext', 'treecourse.hasPendingChanges', hasPendingChanges);
}

function refreshQueueView() {
    vscode.commands.executeCommand('treecourseQueueView.refresh');
}

function getLanguageFromPath(path: string): string {
    const ext = path.split('.').pop()?.toLowerCase();
    const languageMap: { [key: string]: string } = {
        'ts': 'typescript',
        'tsx': 'typescriptreact',
        'js': 'javascript',
        'jsx': 'javascriptreact',
        'dart': 'dart',
        'py': 'python',
        'java': 'java',
        'cs': 'csharp',
        'cpp': 'cpp',
        'c': 'c',
        'go': 'go',
        'rs': 'rust',
        'rb': 'ruby',
        'php': 'php',
        'swift': 'swift',
        'kt': 'kotlin',
        'scala': 'scala',
        'sh': 'shellscript',
        'md': 'markdown',
        'json': 'json',
        'yaml': 'yaml',
        'yml': 'yaml',
        'xml': 'xml',
        'html': 'html',
        'css': 'css',
        'scss': 'scss',
        'sql': 'sql'
    };
    
    return languageMap[ext || ''] || 'plaintext';
}

export function deactivate() {
    if (markdownPanel) {
        markdownPanel.dispose();
    }
}
