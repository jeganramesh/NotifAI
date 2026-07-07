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
exports.applyChanges = applyChanges;
exports.previewChanges = previewChanges;
exports.fileExists = fileExists;
exports.getFileContent = getFileContent;
const vscode = __importStar(require("vscode"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const diff_1 = require("diff");
/**
 * Applies file changes to the workspace.
 * @param fileChanges - Array of file changes to apply
 * @param createBackup - Whether to create backup files before overwriting
 * @returns Result of the apply operation
 */
async function applyChanges(fileChanges, createBackup = true) {
    const result = {
        success: true,
        appliedCount: 0,
        failedCount: 0,
        appliedFiles: [],
    };
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    if (!workspaceFolder) {
        result.success = false;
        result.error = 'No workspace folder open';
        return result;
    }
    for (const change of fileChanges) {
        try {
            const fullPath = path.resolve(workspaceFolder, change.filePath);
            // Ensure directory exists
            const dir = path.dirname(fullPath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            // Create backup if file exists and backup is enabled
            if (createBackup && fs.existsSync(fullPath)) {
                const backupPath = `${fullPath}.backup.${Date.now()}`;
                fs.copyFileSync(fullPath, backupPath);
            }
            // Write the file
            fs.writeFileSync(fullPath, change.content, 'utf-8');
            result.appliedCount++;
            result.appliedFiles.push(fullPath);
        }
        catch (error) {
            result.failedCount++;
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            console.error(`Failed to apply ${change.filePath}: ${errorMessage}`);
        }
    }
    if (result.failedCount > 0) {
        result.success = false;
        result.error = `${result.failedCount} file(s) failed to apply`;
    }
    return result;
}
/**
 * Shows a diff preview for all file changes and asks for user confirmation.
 * @param fileChanges - Array of file changes to preview
 * @returns true if user confirmed, false if rejected
 */
async function previewChanges(fileChanges) {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    if (!workspaceFolder) {
        vscode.window.showErrorMessage('No workspace folder open');
        return false;
    }
    // Create a temporary directory for previews
    const tempDir = path.join(workspaceFolder, '.treecourse-preview');
    if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
    }
    try {
        // For each file, show a diff
        for (const change of fileChanges) {
            const fullPath = path.resolve(workspaceFolder, change.filePath);
            const tempPath = path.join(tempDir, change.filePath);
            // Ensure temp directory exists
            const tempDirPath = path.dirname(tempPath);
            if (!fs.existsSync(tempDirPath)) {
                fs.mkdirSync(tempDirPath, { recursive: true });
            }
            // Get existing content or empty string
            let originalContent = '';
            if (fs.existsSync(fullPath)) {
                originalContent = fs.readFileSync(fullPath, 'utf-8');
            }
            // Write new content to temp file
            fs.writeFileSync(tempPath, change.content, 'utf-8');
            // Show diff
            const diff = generateDiff(change.filePath, originalContent, change.content);
            // Create a virtual document for the diff
            const doc = await vscode.workspace.openTextDocument({
                content: diff,
                language: 'diff'
            });
            await vscode.window.showTextDocument(doc, {
                viewColumn: vscode.ViewColumn.One,
                preview: true
            });
            // Ask for confirmation
            const options = {
                modal: true,
                detail: `File: ${change.filePath}\nAction: ${change.action === 'create' ? 'CREATE' : 'UPDATE'}`
            };
            const confirm = await vscode.window.showInformationMessage(`Review changes for ${change.filePath}`, options, { title: '✓ Apply', isCloseAffordance: false }, { title: '✗ Reject', isCloseAffordance: true });
            if (confirm?.title !== '✓ Apply') {
                // Clean up temp files
                cleanupTempFiles(tempDir);
                return false;
            }
        }
        // Clean up temp files
        cleanupTempFiles(tempDir);
        return true;
    }
    catch (error) {
        console.error('Error showing preview:', error);
        vscode.window.showErrorMessage('Failed to show preview');
        cleanupTempFiles(tempDir);
        return false;
    }
}
/**
 * Generates a unified diff between two strings.
 */
function generateDiff(filename, oldContent, newContent) {
    return (0, diff_1.createTwoFilesPatch)(`a/${filename}`, `b/${filename}`, oldContent, newContent, '', '', {
        context: 3
    });
}
/**
 * Cleans up temporary preview files.
 */
function cleanupTempFiles(tempDir) {
    try {
        if (fs.existsSync(tempDir)) {
            fs.rmSync(tempDir, { recursive: true, force: true });
        }
    }
    catch (error) {
        console.error('Failed to cleanup temp files:', error);
    }
}
/**
 * Checks if a file exists in the workspace.
 */
function fileExists(filePath) {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    if (!workspaceFolder) {
        return false;
    }
    const fullPath = path.resolve(workspaceFolder, filePath);
    return fs.existsSync(fullPath);
}
/**
 * Gets the current content of a file.
 */
function getFileContent(filePath) {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    if (!workspaceFolder) {
        return null;
    }
    const fullPath = path.resolve(workspaceFolder, filePath);
    if (!fs.existsSync(fullPath)) {
        return null;
    }
    try {
        return fs.readFileSync(fullPath, 'utf-8');
    }
    catch {
        return null;
    }
}
//# sourceMappingURL=fileHandler.js.map