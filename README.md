# NotifAI

A full‑featured terminal Markdown editor with built‑in AI assistance. NotifAI combines a split‑pane live preview, Groq‑powered chat, math evaluation, and a robust export pipeline into one CLI application built with Textual.

## Features

- Live split‑pane Markdown editing with instant preview
- AI assistant modal (Ctrl + E) powered by Groq
- Math evaluation for inline expressions
- Export to Markdown, plain text, HTML, or PDF
- Keyboard‑first workflow: save, export, quit without leaving the terminal

## Requirements

- Python 3.9+
- `textual`
- `rich`
- `markdown`
- `xhtml2pdf`
- `groq` (optional, for the AI assistant)

## Installation

```bash
git clone https://github.com/yourname/notifai.git
cd notifai
python -m venv .venv
source .venv/bin/activate
pip install textual rich markdown xhtml2pdf groq
```

## Usage

Launch the editor:
```bash
python -m notifai open
```

Export a file:
```bash
python -m notifai export note.md --format pdf --output my_note
```

Show version:
```bash
python -m notifai version
```

## Editor Bindings

| Key | Action |
|-----|--------|
| Ctrl + E | Open AI Assistant |
| Ctrl + S | Save current note to `note.md` |
| Ctrl + P | Trigger export dialog |
| Ctrl + Q | Quit |

## AI Configuration

Set your Groq API key in the environment before opening the editor:
```bash
export GROQ_API_KEY="your-api-key"
python -m notifai open
```

## Project Structure

```
notifai/
├── notifai/
│   ├── __init__.py
│   ├── __main__.py
│   ├── app/
│   │   ├── __init__.py
│   │   ├── editor.py
│   │   ├── ai_modal.py
│   │   └── exporter.py
│   └── cli/
│       ├── __init__.py
│       └── main.py
├── README.md
└── notifai.py
```

## Contributing

1. Fork the repo
2. Create a feature branch
3. Run `textual run -e notifai.app.editor`
4. Submit a pull request

## License

MIT
