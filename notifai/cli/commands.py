import argparse
import subprocess
import sys

def main():
    parser = argparse.ArgumentParser(description="NotifAI - CLI Markdown Editor with AI features")
    subparsers = parser.add_subparsers(dest="command")

    subparsers.add_parser("open", help="Open the NotifAI editor")

    export_parser = subparsers.add_parser("export", help="Export a markdown file")
    export_parser.add_argument("input", help="Input markdown file")
    export_parser.add_argument("--format", choices=["md", "txt", "html", "pdf"], default="pdf",
                                help="Export format (default: pdf)")
    export_parser.add_argument("--output", help="Output filename without extension")

    subparsers.add_parser("version", help="Show version")

    args = parser.parse_args()

    if args.command == "open":
        from notifai.app import editor
        editor.launch()
    elif args.command == "export":
        from notifai.app.exporter import export_document
        try:
            with open(args.input, "r") as f:
                text = f.read()
            filename = args.output or args.input.replace(".md", "")
            export_document(text, args.format, filename)
            print(f"Exported to {filename}.{args.format}")
        except Exception as e:
            print(f"Export failed: {e}", file=sys.stderr)
            sys.exit(1)
    elif args.command == "version":
        print("NotifAI v0.1.0")
    else:
        parser.print_help()
