import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { createTwoFilesPatch } from 'diff';
import { FileChange } from './parser';

export interface ApplyResult {
    success: boolean;
    appliedCount: number;
    failedCount: number;
    appliedFiles: string[];
    error?: string;
}

/**
 * Applies file changes to the workspace.
 * @param fileChanges - Array of file changes to apply
 * @param createBackup - Whether to create backup files before overwriting
 * @returns Result of the apply operation
 */
export async function applyChanges(
    fileChanges: FileChange[],
    createBackup: boolean = true
): Promise<ApplyResult> {
    const result: ApplyResult = {
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
            
        } catch (error) {
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
export async function previewChanges(fileChanges: FileChange[]): Promise<boolean> {
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
            const options: vscode.MessageOptions = {
                modal: true,
                detail: `File: ${change.filePath}\nAction: ${change.action === 'create' ? 'CREATE' : 'UPDATE'}`
            };
            
            const confirm = await vscode.window.showInformationMessage(
                `Review changes for ${change.filePath}`,
                options,
                { title: '✓ Apply', isCloseAffordance: false },
                { title: '✗ Reject', isCloseAffordance: true }
            );

            if (confirm?.title !== '✓ Apply') {
                // Clean up temp files
                cleanupTempFiles(tempDir);
                return false;
            }
        }

        // Clean up temp files
        cleanupTempFiles(tempDir);
        return true;

    } catch (error) {
        console.error('Error showing preview:', error);
        vscode.window.showErrorMessage('Failed to show preview');
        cleanupTempFiles(tempDir);
        return false;
    }
}

/**
 * Generates a unified diff between two strings.
 */
function generateDiff(filename: string, oldContent: string, newContent: string): string {
    return createTwoFilesPatch(
        `a/${filename}`,
        `b/${filename}`,
        oldContent,
        newContent,
        '',
        '',
        {
            context: 3
        }
    );
}

/**
 * Cleans up temporary preview files.
 */
function cleanupTempFiles(tempDir: string) {
    try {
        if (fs.existsSync(tempDir)) {
            fs.rmSync(tempDir, { recursive: true, force: true });
        }
    } catch (error) {
        console.error('Failed to cleanup temp files:', error);
    }
}

/**
 * Checks if a file exists in the workspace.
 */
export function fileExists(filePath: string): boolean {
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
export function getFileContent(filePath: string): string | null {
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
    } catch {
        return null;
    }
}
