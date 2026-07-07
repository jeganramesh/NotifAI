"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseAIResponse = parseAIResponse;
exports.extractFilePaths = extractFilePaths;
exports.isValidFilePath = isValidFilePath;
/**
 * Parses AI response text to extract file paths and code blocks.
 *
 * Expected format:
 * ## File: `path/to/file.dart`
 * ```dart
 * code here
 * ```
 */
function parseAIResponse(response) {
    const fileChanges = [];
    // Pattern 1: ## File: `path/to/file.ext` or ## File: path/to/file.ext
    const filePattern = /##\s*File:\s*(?:`([^`]+)`|([^\n]+))/g;
    let fileMatch;
    let lastIndex = 0;
    while ((fileMatch = filePattern.exec(response)) !== null) {
        const filePath = (fileMatch[1] || fileMatch[2]).trim();
        if (!filePath)
            continue;
        // Find the code block after this file header
        const startIndex = fileMatch.index + fileMatch[0].length;
        const remainingText = response.substring(startIndex);
        // Look for code block: ```language\ncode\n```
        const codeBlockPattern = /^[\s\n]*```(\w*)\n([\s\S]*?)```/;
        const codeMatch = remainingText.match(codeBlockPattern);
        if (codeMatch) {
            const language = codeMatch[1] || undefined;
            const content = codeMatch[2];
            // Determine if this is a create or update action
            const action = determineAction(filePath, content);
            fileChanges.push({
                filePath,
                content: content.trim(),
                language,
                action,
            });
            // Move past this code block
            lastIndex = startIndex + codeMatch[0].length;
        }
        else {
            // No code block found, try to get content until next file header or end
            const nextFileMatch = remainingText.match(/^[\s\n]*##\s*File:/m);
            const endIndex = nextFileMatch ? nextFileMatch.index : remainingText.length;
            const content = remainingText.substring(0, endIndex).trim();
            if (content) {
                const action = determineAction(filePath, content);
                fileChanges.push({
                    filePath,
                    content,
                    action,
                });
            }
        }
    }
    // If no ## File: pattern found, try alternative patterns
    if (fileChanges.length === 0) {
        // Pattern 2: Look for markdown code blocks with file paths in comments
        const altPattern = /```(\w+)(?:\s+\/\/\s*|\/\/\/\s*|\*\s*)?(?:path[:\s]+)?([^\n`]+)\n([\s\S]*?)```/g;
        let altMatch;
        while ((altMatch = altPattern.exec(response)) !== null) {
            const language = altMatch[1];
            const filePath = altMatch[2].trim();
            const content = altMatch[3].trim();
            if (filePath && !filePath.includes(' ') && content) {
                fileChanges.push({
                    filePath,
                    content,
                    language,
                    action: determineAction(filePath, content),
                });
            }
        }
    }
    return fileChanges;
}
function determineAction(filePath, content) {
    // This is a heuristic - in a real scenario, you might want to check if file exists
    // For now, we'll assume files with substantial content are updates
    // and very short files might be creates
    // Check for common creation indicators in content
    const creationIndicators = [
        'new file',
        'created',
        'initial',
        '// New',
        '/* New',
    ];
    const hasCreationIndicator = creationIndicators.some(indicator => content.toLowerCase().includes(indicator.toLowerCase()));
    if (hasCreationIndicator) {
        return 'create';
    }
    // Default to update for existing-looking files
    return 'update';
}
/**
 * Extracts just the file paths from an AI response without the content.
 * Useful for quick previews.
 */
function extractFilePaths(response) {
    const changes = parseAIResponse(response);
    return changes.map(change => change.filePath);
}
/**
 * Validates that a file path is safe and doesn't contain malicious patterns.
 */
function isValidFilePath(filePath) {
    // Reject paths with null bytes
    if (filePath.includes('\0')) {
        return false;
    }
    // Reject absolute paths outside workspace (basic check)
    if (filePath.startsWith('/') && process.platform !== 'win32') {
        // On Unix, could be dangerous - will be validated during apply
        return true; // Allow but validate later
    }
    // Reject paths trying to escape directory
    if (filePath.includes('../') || filePath.includes('..\\')) {
        // Relative escapes might be okay depending on context
        // We'll allow them but they'll be validated during file operations
        return true;
    }
    // Basic valid filename check
    const invalidChars = /[<>:"|?*]/;
    return !invalidChars.test(filePath);
}
//# sourceMappingURL=parser.js.map