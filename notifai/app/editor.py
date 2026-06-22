import os
from pathlib import Path

from textual.app import App, ComposeResult
from textual.containers import Horizontal, Vertical
from textual.widgets import Header, Footer, TextArea, Static, Input, Button, Select
from textual.screen import ModalScreen
from textual.binding import Binding
from rich.markdown import Markdown

import asyncio

# Attempt to import Groq
try:
    from groq import Groq
    GROQ_AVAILABLE = True
except ImportError:
    GROQ_AVAILABLE = False


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
    """

    def compose(self) -> ComposeResult:
        yield Vertical(
            Static("NotifAI Assistant (Groq)", id="ai-title"),
            Input(placeholder="Enter prompt (e.g., 'Generate a Mermaid diagram for auth flow')", id="ai-input"),
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
                    {"role": "system", "content": "You are a helpful assistant that outputs clean Markdown and Mermaid diagrams."},
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


class NotifAIApp(App):
    CSS = """
    Screen {
        layout: grid;
        grid-size: 2;
        grid-columns: 1fr 1fr;
    }
    #editor-container {
        height: 100%;
    }
    #preview-container {
        height: 100%;
        border-left: solid $primary;
        padding: 1;
        overflow-y: auto;
    }
    """

    BINDINGS = [
        Binding("ctrl+e", "open_ai", "AI Assistant"),
        Binding("ctrl+s", "save", "Save"),
        Binding("ctrl+p", "export", "Export"),
        Binding("ctrl+q", "quit", "Quit"),
    ]

    def compose(self) -> ComposeResult:
        yield Header()
        yield TextArea(id="editor", language="markdown")
        yield Static(id="preview")
        yield Footer()

    def on_mount(self) -> None:
        self.query_one("#preview", Static).update(Markdown("# NotifAI\nStart typing on the left..."))

    def on_text_area_changed(self, event: TextArea.Changed) -> None:
        md_text = event.text_area.text
        self.query_one("#preview", Static).update(Markdown(md_text))

    def action_open_ai(self) -> None:
        self.push_screen(AIModal())

    def action_save(self) -> None:
        text = self.query_one("#editor", TextArea).text
        with open("note.md", "w") as f:
            f.write(text)
        self.notify("Saved to note.md", title="Success")

    def action_export(self) -> None:
        self.notify("Export feature triggered (See documentation for implementation)", title="Export")


def launch():
    app = NotifAIApp()
    app.run()
