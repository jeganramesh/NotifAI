"""
Advanced IDE-style Editor with File Tree, Terminal, and AI Integration
"""
import os
import subprocess
import asyncio
from pathlib import Path
from typing import Optional

from textual.app import App, ComposeResult
from textual.containers import Horizontal, Vertical, ScrollableContainer
from textual.widgets import (
    Header, Footer, TextArea, Static, Input, Button, 
    Select, DirectoryTree, Label, LoadingIndicator
)
from textual.screen import ModalScreen
from textual.binding import Binding
from textual.reactive import reactive
from rich.markdown import Markdown
from rich.panel import Panel

# Attempt to import Groq
try:
    from groq import Groq
    GROQ_AVAILABLE = True
except ImportError:
    GROQ_AVAILABLE = False


class TerminalOutput(Static):
    """Widget to display terminal output"""
    
    DEFAULT_CSS = """
    TerminalOutput {
        height: 1fr;
        background: $background;
        border: solid $primary;
        padding: 1;
        overflow-y: auto;
    }
    """
    
    def append_output(self, text: str):
        current = self.renderable or ""
        self.update(f"{current}\n{text}")
    
    def clear_output(self):
        self.update("")


class FileTree(DirectoryTree):
    """Enhanced file tree with VSCode-like styling"""
    
    DEFAULT_CSS = """
    FileTree {
        width: 30;
        height: 1fr;
        border-right: solid $primary;
        background: $surface;
    }
    """


class AIModal(ModalScreen[str]):
    """Modal screen for interacting with the Groq AI."""
    DEFAULT_CSS = """
    AIModal {
        align: center middle;
    }
    #ai-dialog {
        width: 80%;
        height: 80%;
        border: thick $background 80%;
        background: $surface;
        padding: 1 2;
    }
    #ai-response {
        height: 1fr;
        border: solid $primary;
        padding: 1;
        overflow-y: auto;
    }
    #ai-title {
        text-align: center;
        text-style: bold;
        padding: 1;
    }
    """

    def compose(self) -> ComposeResult:
        yield Vertical(
            Static("NotifAI Assistant (Groq)", id="ai-title"),
            Input(placeholder="Enter prompt (e.g., 'Generate Python code for...')", id="ai-input"),
            Button("Send to AI", variant="primary", id="ai-send"),
            Static("Awaiting AI response...", id="ai-response"),
            Button("Close", id="ai-close"),
            id="ai-dialog"
        )

    def on_button_pressed(self, event: Button.Pressed) -> None:
        if event.button.id == "ai-send":
            prompt = self.query_one("#ai-input", Input).value
            if prompt:
                self.query_one("#ai-response", Static).update("Processing...")
                asyncio.create_task(self.query_groq(prompt))
        elif event.button.id == "ai-close":
            self.dismiss()

    async def query_groq(self, prompt: str):
        if not GROQ_AVAILABLE or not os.environ.get("GROQ_API_KEY"):
            self.update_response("Error: Groq SDK missing or GROQ_API_KEY not set.")
            return

        client = Groq(api_key=os.environ.get("GROQ_API_KEY"))
        try:
            chat_completion = client.chat.completions.create(
                messages=[
                    {"role": "system", "content": "You are a helpful coding assistant that outputs clean code and explanations."},
                    {"role": "user", "content": prompt}
                ],
                model="llama3-70b-8192",
            )
            response_text = chat_completion.choices[0].message.content
            self.update_response(response_text)
        except Exception as e:
            self.update_response(f"API Error: {str(e)}")

    def update_response(self, text: str):
        self.query_one("#ai-response", Static).update(Markdown(text))


class CommandPalette(ModalScreen[Optional[str]]):
    """Command palette for quick actions"""
    
    DEFAULT_CSS = """
    CommandPalette {
        align: center top;
    }
    #command-input {
        width: 60;
        margin: 2 0;
    }
    #command-results {
        width: 60;
        height: auto;
        border: solid $primary;
        background: $surface;
    }
    """
    
    def compose(self) -> ComposeResult:
        yield Input(placeholder="Type command...", id="command-input")
        yield Static("", id="command-results")
    
    def on_input_changed(self, event: Input.Changed) -> None:
        # Filter commands based on input
        pass


class AdvancedIDEApp(App):
    """Advanced IDE-style application with file tree, editor, preview, and terminal"""
    
    CSS = """
    Screen {
        layout: grid;
        grid-size: 4;
        grid-columns: 30 2fr 2fr 1fr;
        grid-rows: 1fr 10;
    }
    
    #file-tree {
        row-span: 2;
    }
    
    #editor-container {
        column-span: 2;
        height: 100%;
    }
    
    #preview-container {
        height: 100%;
        border-left: solid $primary;
        padding: 1;
        overflow-y: auto;
    }
    
    #terminal-container {
        row-span: 2;
        height: 100%;
        border-left: solid $secondary;
    }
    
    #menu-bar {
        dock: top;
        height: 3;
        background: $primary;
    }
    
    #status-bar {
        dock: bottom;
        height: 3;
        background: $surface;
        border-top: solid $primary;
    }
    
    .menu-item {
        padding: 0 2;
    }
    
    #current-file {
        padding: 0 2;
        text-style: italic;
    }
    """
    
    BINDINGS = [
        Binding("ctrl+e", "open_ai", "AI Assistant"),
        Binding("ctrl+s", "save", "Save"),
        Binding("ctrl+o", "open_file", "Open File"),
        Binding("ctrl+n", "new_file", "New File"),
        Binding("ctrl+p", "export", "Export"),
        Binding("ctrl+t", "toggle_terminal", "Toggle Terminal"),
        Binding("ctrl+q", "quit", "Quit"),
        Binding("f1", "show_help", "Help"),
    ]
    
    current_file: reactive[Optional[Path]] = reactive(None)
    terminal_visible: reactive[bool] = reactive(True)
    
    def __init__(self, root_path: str = "."):
        super().__init__()
        self.root_path = Path(root_path).resolve()
        self.terminal_process = None
        
    def compose(self) -> ComposeResult:
        # Menu Bar
        yield Static("[B]File[/B]  [B]Edit[/B]  [B]View[/B]  [B]AI[/B]  [B]Help[/B]", id="menu-bar")
        
        # File Tree
        yield FileTree(self.root_path, id="file-tree")
        
        # Editor Container
        yield Vertical(
            TextArea(id="editor", language="markdown"),
            id="editor-container"
        )
        
        # Preview Container
        yield Static("# Preview\nStart editing to see preview...", id="preview-container")
        
        # Terminal Container
        yield Vertical(
            Label("Terminal Output", id="terminal-label"),
            TerminalOutput(id="terminal-output"),
            Input(placeholder="Enter command...", id="terminal-input"),
            id="terminal-container"
        )
        
        # Status Bar
        yield Static("Ready | No file open", id="status-bar")
        
        yield Footer()
    
    def on_mount(self) -> None:
        self.title = "NotifAI Advanced IDE"
        self.sub_title = f"Root: {self.root_path}"
        
    def on_directory_tree_file_selected(self, event: DirectoryTree.FileSelected) -> None:
        """Handle file selection from tree"""
        file_path = event.path
        self.open_file_path(file_path)
    
    def open_file_path(self, file_path: Path):
        """Open a file in the editor"""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            self.query_one("#editor", TextArea).text = content
            self.current_file = file_path
            
            # Update status bar
            self.query_one("#status-bar", Static).update(f"Editing: {file_path.name} | {file_path}")
            
            # Update preview
            self.update_preview(content)
            
            self.notify(f"Opened: {file_path.name}", title="Success")
        except Exception as e:
            self.notify(f"Error opening file: {e}", title="Error", severity="error")
    
    def update_preview(self, text: str):
        """Update the markdown preview"""
        self.query_one("#preview-container", Static).update(Markdown(text))
    
    def on_text_area_changed(self, event: TextArea.Changed) -> None:
        """Update preview when editor changes"""
        md_text = event.text_area.text
        self.update_preview(md_text)
    
    def on_input_submitted(self, event: Input.Submitted) -> None:
        """Handle terminal command execution"""
        if event.input.id == "terminal-input":
            command = event.input.value.strip()
            if command:
                self.execute_command(command)
                event.input.value = ""
    
    def execute_command(self, command: str):
        """Execute a shell command and display output"""
        terminal_output = self.query_one("#terminal-output", TerminalOutput)
        terminal_output.append_output(f"$ {command}")
        
        try:
            result = subprocess.run(
                command,
                shell=True,
                capture_output=True,
                text=True,
                timeout=30,
                cwd=self.root_path
            )
            
            if result.stdout:
                terminal_output.append_output(result.stdout)
            if result.stderr:
                terminal_output.append_output(f"ERROR: {result.stderr}")
            if result.returncode == 0:
                terminal_output.append_output(f"[Command completed successfully]")
            else:
                terminal_output.append_output(f"[Command exited with code {result.returncode}]")
                
        except subprocess.TimeoutExpired:
            terminal_output.append_output("ERROR: Command timed out (30s limit)")
        except Exception as e:
            terminal_output.append_output(f"ERROR: {str(e)}")
    
    def action_open_ai(self) -> None:
        self.push_screen(AIModal())
    
    def action_save(self) -> None:
        text = self.query_one("#editor", TextArea).text
        
        if self.current_file:
            save_path = self.current_file
        else:
            save_path = self.root_path / "untitled.md"
        
        try:
            with open(save_path, "w", encoding='utf-8') as f:
                f.write(text)
            self.current_file = save_path
            self.query_one("#status-bar", Static).update(f"Saved: {save_path.name} | {save_path}")
            self.notify(f"Saved to {save_path.name}", title="Success")
        except Exception as e:
            self.notify(f"Save failed: {e}", title="Error", severity="error")
    
    def action_open_file(self) -> None:
        """Open file dialog - for now just notify"""
        self.notify("Use the file tree on the left to open files", title="Open File")
    
    def action_new_file(self) -> None:
        """Create a new file"""
        self.query_one("#editor", TextArea).text = ""
        self.current_file = None
        self.query_one("#status-bar", Static).update("New file | Not saved")
        self.update_preview("# New File\nStart typing...")
        self.notify("New file created", title="Success")
    
    def action_export(self) -> None:
        """Export current document"""
        text = self.query_one("#editor", TextArea).text
        if not text:
            self.notify("No content to export", title="Error", severity="error")
            return
        
        # Auto-export to HTML and PDF
        from notifai.app.exporter import export_document
        
        if self.current_file:
            base_name = self.current_file.stem
        else:
            base_name = "export"
        
        try:
            export_document(text, "html", f"{base_name}_export")
            export_document(text, "pdf", f"{base_name}_export")
            self.notify(f"Exported to {base_name}_export.html and .pdf", title="Success")
        except Exception as e:
            self.notify(f"Export failed: {e}", title="Error", severity="error")
    
    def action_toggle_terminal(self) -> None:
        """Toggle terminal visibility"""
        terminal = self.query_one("#terminal-container")
        terminal.display = not terminal.display
        self.terminal_visible = terminal.display
        self.notify(f"Terminal {'shown' if self.terminal_visible else 'hidden'}", title="Terminal")
    
    def action_show_help(self) -> None:
        """Show help information"""
        help_text = """
# NotifAI Advanced IDE - Help

## Keyboard Shortcuts
- **Ctrl+E**: Open AI Assistant
- **Ctrl+S**: Save current file
- **Ctrl+O**: Open file (use file tree instead)
- **Ctrl+N**: Create new file
- **Ctrl+P**: Export to HTML/PDF
- **Ctrl+T**: Toggle terminal
- **Ctrl+Q**: Quit application
- **F1**: Show this help

## Features
- **File Tree**: Navigate and open files from the left panel
- **Editor**: Write markdown/code with syntax highlighting
- **Preview**: Real-time markdown preview
- **Terminal**: Execute shell commands directly
- **AI Assistant**: Get help from Groq AI

## Using the Terminal
Type commands in the terminal input at the bottom right and press Enter.
        """
        self.notify("Check the AI modal for detailed help", title="Help")


def launch(root_path: str = "."):
    """Launch the advanced IDE"""
    app = AdvancedIDEApp(root_path)
    app.run()


if __name__ == "__main__":
    import sys
    root = sys.argv[1] if len(sys.argv) > 1 else "."
    launch(root)
