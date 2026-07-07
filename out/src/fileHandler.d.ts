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
export declare function applyChanges(fileChanges: FileChange[], createBackup?: boolean): Promise<ApplyResult>;
/**
 * Shows a diff preview for all file changes and asks for user confirmation.
 * @param fileChanges - Array of file changes to preview
 * @returns true if user confirmed, false if rejected
 */
export declare function previewChanges(fileChanges: FileChange[]): Promise<boolean>;
/**
 * Checks if a file exists in the workspace.
 */
export declare function fileExists(filePath: string): boolean;
/**
 * Gets the current content of a file.
 */
export declare function getFileContent(filePath: string): string | null;
//# sourceMappingURL=fileHandler.d.ts.map