import * as vscode from 'vscode';
import { FileOperation } from './responseParser';

export class ChangeQueue {
    private operations: Map<string, FileOperation> = new Map();
    private _onDidChange = new vscode.EventEmitter<void>();
    public readonly onDidChange = this._onDidChange.event;

    add(operation: FileOperation): void {
        this.operations.set(operation.id, operation);
        this._onDidChange.fire();
    }

    remove(id: string): void {
        this.operations.delete(id);
        this._onDidChange.fire();
    }

    getById(id: string): FileOperation | undefined {
        return this.operations.get(id);
    }

    getAll(): FileOperation[] {
        return Array.from(this.operations.values());
    }

    getPending(): FileOperation[] {
        return Array.from(this.operations.values()).filter(op => op.status === 'pending');
    }

    clear(): void {
        this.operations.clear();
        this._onDidChange.fire();
    }

    updateStatus(id: string, status: 'pending' | 'accepted' | 'rejected'): void {
        const operation = this.operations.get(id);
        if (operation) {
            operation.status = status;
            this._onDidChange.fire();
        }
    }
}
