import * as vscode from 'vscode';

export enum OperationType {
    CREATE = 'create',
    UPDATE = 'update',
    DELETE = 'delete',
    RENAME = 'rename',
    MODIFY_LINES = 'modify_lines'
}

export interface LineModification {
    lineNumber: number;
    newContent: string;
    originalContent?: string;
}

export interface FileOperation {
    id: string;
    type: OperationType;
    path: string;
    content?: string;
    newPath?: string;
    modifications?: LineModification[];
    timestamp: Date;
    status: 'pending' | 'accepted' | 'rejected';
}

export class ResponseParser {
    private operationCounter = 0;

    parse(text: string): FileOperation[] {
        const operations: FileOperation[] = [];

        // Parse <file> tags for create/update operations
        const fileMatches = this.matchAll(text, /<file\s+path="([^"]+)">([\s\S]*?)<\/file>/g);
        for (const match of fileMatches) {
            const path = match[1];
            const content = match[2].trim();
            
            operations.push({
                id: this.generateId(),
                type: OperationType.UPDATE,
                path: path,
                content: content,
                timestamp: new Date(),
                status: 'pending'
            });
        }

        // Parse <delete> tags
        const deleteMatches = this.matchAll(text, /<delete\s+path="([^"]+)"\s*\/>/g);
        for (const match of deleteMatches) {
            operations.push({
                id: this.generateId(),
                type: OperationType.DELETE,
                path: match[1],
                timestamp: new Date(),
                status: 'pending'
            });
        }

        // Parse <rename> tags
        const renameMatches = this.matchAll(text, /<rename\s+from="([^"]+)"\s+to="([^"]+)"\s*\/>/g);
        for (const match of renameMatches) {
            operations.push({
                id: this.generateId(),
                type: OperationType.RENAME,
                path: match[1],
                newPath: match[2],
                timestamp: new Date(),
                status: 'pending'
            });
        }

        // Parse <shell> tags for terminal commands
        const shellMatches = this.matchAll(text, /<shell>([\s\S]*?)<\/shell>/g);
        for (const match of shellMatches) {
            // Shell commands could be handled separately or stored as operations
            console.log('Shell command found:', match[1]);
        }

        // Parse line-specific modifications
        // Format: <modify path="file.dart" line="42">new content</modify>
        const modifyLineMatches = this.matchAll(text, /<modify\s+path="([^"]+)"\s+line="(\d+)">([\s\S]*?)<\/modify>/g);
        
        // Group modifications by file
        const modificationsByFile = new Map<string, LineModification[]>();
        
        for (const match of modifyLineMatches) {
            const path = match[1];
            const lineNumber = parseInt(match[2], 10);
            const newContent = match[3].trim();

            if (!modificationsByFile.has(path)) {
                modificationsByFile.set(path, []);
            }
            
            modificationsByFile.get(path)!.push({
                lineNumber,
                newContent
            });
        }

        // Create operations for each file with line modifications
        for (const [path, modifications] of modificationsByFile.entries()) {
            operations.push({
                id: this.generateId(),
                type: OperationType.MODIFY_LINES,
                path: path,
                modifications: modifications,
                timestamp: new Date(),
                status: 'pending'
            });
        }

        // Parse code blocks with file path comments
        // Format: ```language:path/to/file.ext ... ```
        const codeBlockMatches = this.matchAll(text, /```(\w+):([^\n]+)\n([\s\S]*?)```/g);
        for (const match of codeBlockMatches) {
            const language = match[1];
            const path = match[2].trim();
            const content = match[3].trim();

            // Check if we already have an operation for this file
            const existingOp = operations.find(op => op.path === path && op.type === OperationType.UPDATE);
            
            if (!existingOp) {
                operations.push({
                    id: this.generateId(),
                    type: OperationType.UPDATE,
                    path: path,
                    content: content,
                    timestamp: new Date(),
                    status: 'pending'
                });
            }
        }

        return operations;
    }

    private generateId(): string {
        return `op_${Date.now()}_${++this.operationCounter}`;
    }

    private matchAll(text: string, regex: RegExp): RegExpExecArray[] {
        const matches: RegExpExecArray[] = [];
        let match: RegExpExecArray | null;
        
        // Create a new regex instance to avoid state issues with global flag
        const newRegex = new RegExp(regex.source, regex.flags);
        
        while ((match = newRegex.exec(text)) !== null) {
            matches.push(match);
        }
        
        return matches;
    }
}
