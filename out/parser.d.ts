export interface FileChange {
    filePath: string;
    content: string;
    language?: string;
    action: 'create' | 'update';
    description?: string;
}
/**
 * Parses AI response text to extract file paths and code blocks.
 *
 * Expected format:
 * ## File: `path/to/file.dart`
 * ```dart
 * code here
 * ```
 */
export declare function parseAIResponse(response: string): FileChange[];
/**
 * Extracts just the file paths from an AI response without the content.
 * Useful for quick previews.
 */
export declare function extractFilePaths(response: string): string[];
/**
 * Validates that a file path is safe and doesn't contain malicious patterns.
 */
export declare function isValidFilePath(filePath: string): boolean;
//# sourceMappingURL=parser.d.ts.map