import * as vscode from 'vscode';
import { marked } from 'marked';

export class MarkdownPreviewPanel {
    public static currentPanel: MarkdownPreviewPanel | undefined;
    private readonly _panel: vscode.WebviewPanel;
    private _content: string = '';

    public static createOrShow(extensionUri: vscode.Uri): MarkdownPreviewPanel {
        const column = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn
            : undefined;

        const panel = vscode.window.createWebviewPanel(
            'treecourseMarkdownPreview',
            'Treecourse Markdown Preview',
            column || vscode.ViewColumn.One,
            {
                enableScripts: true,
                localResourceRoots: [extensionUri],
                retainContextWhenHidden: true
            }
        );

        MarkdownPreviewPanel.currentPanel = new MarkdownPreviewPanel(panel, extensionUri);
        return MarkdownPreviewPanel.currentPanel;
    }

    private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
        this._panel = panel;
        
        this._panel.onDidDispose(() => this.dispose(), null, []);
    }

    public show(): void {
        this._panel.reveal(vscode.ViewColumn.Two);
        this._update();
    }

    public setContent(content: string): void {
        this._content = content;
        this._update();
    }

    public dispose(): void {
        MarkdownPreviewPanel.currentPanel = undefined;
        this._panel.dispose();
    }

    private _update(): void {
        const html = this._getHtmlForContent(this._content);
        this._panel.webview.html = html;
    }

    private _getHtmlForContent(content: string): string {
        const renderedContent = marked.parse(content);
        
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Markdown Preview</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe WPC', 'Segoe UI', system-ui, 'Ubuntu', 'Droid Sans', sans-serif;
            font-size: 14px;
            line-height: 1.6;
            padding: 20px;
            color: #333;
            background-color: #fff;
        }
        
        code {
            font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
            background-color: #f4f4f4;
            padding: 2px 4px;
            border-radius: 3px;
        }
        
        pre {
            background-color: #f4f4f4;
            padding: 12px;
            border-radius: 5px;
            overflow-x: auto;
            border: 1px solid #ddd;
        }
        
        pre code {
            background-color: transparent;
            padding: 0;
        }
        
        blockquote {
            margin: 0;
            padding: 0 1em;
            color: #6a737d;
            border-left: 0.25em solid #dfe2e5;
        }
        
        table {
            border-collapse: collapse;
            width: 100%;
            margin: 16px 0;
        }
        
        table th, table td {
            border: 1px solid #dfe2e5;
            padding: 6px 13px;
        }
        
        table tr:nth-child(2n) {
            background-color: #f6f8fa;
        }
        
        h1, h2, h3, h4, h5, h6 {
            margin-top: 24px;
            margin-bottom: 16px;
            font-weight: 600;
            line-height: 1.25;
        }
        
        h1 { font-size: 2em; padding-bottom: 0.3em; border-bottom: 1px solid #eaecef; }
        h2 { font-size: 1.5em; padding-bottom: 0.3em; border-bottom: 1px solid #eaecef; }
        h3 { font-size: 1.25em; }
        
        ul, ol {
            padding-left: 2em;
        }
        
        a {
            color: #0366d6;
            text-decoration: none;
        }
        
        a:hover {
            text-decoration: underline;
        }
        
        img {
            max-width: 100%;
            box-sizing: border-box;
        }
        
        .vscode-dark body {
            background-color: #1e1e1e;
            color: #d4d4d4;
        }
        
        .vscode-dark code {
            background-color: #2d2d2d;
        }
        
        .vscode-dark pre {
            background-color: #2d2d2d;
            border-color: #404040;
        }
        
        .vscode-dark table tr:nth-child(2n) {
            background-color: #2d2d2d;
        }
        
        .vscode-dark table th, .vscode-dark table td {
            border-color: #404040;
        }
        
        .vscode-dark h1, .vscode-dark h2 {
            border-bottom-color: #404040;
        }
    </style>
</head>
<body>
    ${renderedContent}
</body>
</html>`;
    }
}
