import * as vscode from 'vscode';

export class DiffViewer {
    public async showDiff(uri: vscode.Uri, newContent: string): Promise<void> {
        try {
            // Read current content
            const currentDoc = await vscode.workspace.openTextDocument(uri);
            const currentContent = currentDoc.getText();

            // Create temporary document with new content for comparison
            const tempUri = vscode.Uri.parse(`untitled:${uri.fsPath}.new`);
            const tempDoc = await vscode.workspace.openTextDocument(tempUri);
            
            const edit = new vscode.WorkspaceEdit();
            edit.insert(tempUri, new vscode.Position(0, 0), newContent);
            await vscode.workspace.applyEdit(edit);

            // Show diff view
            await vscode.commands.executeCommand('vscode.diff', uri, tempUri, `${uri.fsPath} (Changes)`);
        } catch (error) {
            console.error('Error showing diff:', error);
            vscode.window.showErrorMessage('Could not display diff view');
        }
    }

    public createInlineDiff(original: string, modified: string): string {
        // Simple inline diff representation
        const originalLines = original.split('\n');
        const modifiedLines = modified.split('\n');
        
        let diffOutput = '';
        const maxLines = Math.max(originalLines.length, modifiedLines.length);
        
        for (let i = 0; i < maxLines; i++) {
            const origLine = originalLines[i];
            const modLine = modifiedLines[i];
            
            if (origLine === undefined) {
                diffOutput += `+ ${modLine}\n`;
            } else if (modLine === undefined) {
                diffOutput += `- ${origLine}\n`;
            } else if (origLine !== modLine) {
                diffOutput += `- ${origLine}\n`;
                diffOutput += `+ ${modLine}\n`;
            } else {
                diffOutput += `  ${origLine}\n`;
            }
        }
        
        return diffOutput;
    }
}
