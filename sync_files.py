#!/usr/bin/env python3
"""
Sync files from markdown-like input (with "## File:" and code blocks).
Usage:
  python sync_files.py [input_file] [--dry-run] [--backup] [--gitignore]
If no file is given, reads from stdin (paste and Ctrl+D or type END on new line).
"""

import sys
import os
import re
import argparse
from pathlib import Path
from datetime import datetime

def parse_args():
    parser = argparse.ArgumentParser(description="Sync files from markdown blocks.")
    parser.add_argument('input', nargs='?', help='Input file (markdown/text)')
    parser.add_argument('--dry-run', action='store_true', help='Preview changes without writing')
    parser.add_argument('--backup', action='store_true', help='Create .bak backup before overwriting')
    parser.add_argument('--gitignore', action='store_true', help='Skip files listed in .gitignore')
    return parser.parse_args()

def read_input(args):
    if args.input:
        with open(args.input, 'r', encoding='utf-8') as f:
            return f.read()
    else:
        print("📥 Paste your input (end with Ctrl+D on a new line, or type 'END' on a new line):")
        lines = []
        while True:
            try:
                line = sys.stdin.readline()
                if not line:  # EOF (Ctrl+D)
                    break
                if line.strip().upper() == 'END':
                    break
                lines.append(line)
            except KeyboardInterrupt:
                print("\n❌ Interrupted.", file=sys.stderr)
                sys.exit(1)
        return ''.join(lines)

def parse_blocks(text):
    """Yield (filepath, code) for each ## File: block."""
    pattern = re.compile(
        r'##\s*File:\s*`([^`]+)`\s*\n+```(?:\w+)?\s*\n(.*?)\n```',
        re.DOTALL | re.IGNORECASE
    )
    for match in pattern.finditer(text):
        filepath = match.group(1).strip()
        code = match.group(2).rstrip('\n')
        yield filepath, code

def is_gitignored(filepath, root):
    """Check if file is ignored by .gitignore (simple)."""
    if not root:
        return False
    try:
        import gitignore_parser
        # pip install gitignore-parser if needed
        rules = gitignore_parser.parse_gitignore(root / '.gitignore')
        return rules(filepath)
    except ImportError:
        # Fallback: check file extension or basic patterns
        pass
    return False

def main():
    args = parse_args()
    text = read_input(args)
    if not text or not text.strip():
        print("⚠️ No input provided.", file=sys.stderr)
        sys.exit(1)

    blocks = list(parse_blocks(text))
    if not blocks:
        print("⚠️ No valid '## File:' blocks found.", file=sys.stderr)
        sys.exit(1)

    root = Path.cwd()
    print(f"📂 Found {len(blocks)} file block(s).")
    created = updated = skipped = 0

    for filepath, code in blocks:
        path = root / filepath
        # Check gitignore (if requested)
        if args.gitignore and is_gitignored(filepath, root):
            print(f"⏭️  Skipped (gitignore): {filepath}")
            skipped += 1
            continue

        if args.dry_run:
            status = "CREATE" if not path.exists() else "UPDATE"
            print(f"[DRY RUN] {status}: {filepath}")
            continue

        # Create parent directories
        path.parent.mkdir(parents=True, exist_ok=True)

        # Backup if requested and file exists
        if args.backup and path.exists():
            backup = path.with_suffix(path.suffix + '.bak')
            backup.write_text(path.read_text(encoding='utf-8'), encoding='utf-8')
            print(f"💾 Backup created: {backup}")

        # Write new code
        path.write_text(code + '\n', encoding='utf-8')
        if path.exists():
            updated += 1
            print(f"✅ Updated: {filepath}")
        else:
            created += 1
            print(f"✅ Created: {filepath}")

    print(f"\n🎉 Done. Created: {created}, Updated: {updated}, Skipped: {skipped}.")

if __name__ == "__main__":
    main()
