#!/usr/bin/env python3
"""
sync_files.py – Intelligent AI-to-File Sync Tool (v2.0)
Single-file CLI for surgical code updates from structured markdown.

Usage:
    python sync_files.py input.md [--dry-run] [--yes] [--backup] [--interactive]
    cat ai_response.md | python sync_files.py --stdin --yes
"""

import sys
import os
import re
import argparse
import difflib
from pathlib import Path
from datetime import datetime
from typing import Optional, Dict, List, Tuple, Any

# ─── Constants ────────────────────────────────────────────────────────────────
VERSION = "2.0.0"
CONTEXT_SIMILARITY_THRESHOLD = 0.75
BACKUP_SUFFIX = ".bak"
TRASH_DIR = ".sync_trash"

# ANSI colors for terminal output
class C:
    GREEN = "\033[92m"
    YELLOW = "\033[93m"
    RED = "\033[91m"
    CYAN = "\033[96m"
    BOLD = "\033[1m"
    RESET = "\033[0m"


# ─── Argument Parsing ─────────────────────────────────────────────────────────
def parse_args():
    parser = argparse.ArgumentParser(
        description=f"sync_files v{VERSION} – Surgical AI code sync tool",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python sync_files.py changes.md --backup --interactive
  python sync_files.py --stdin --yes --dry-run
  python sync_files.py patch.md --log sync.log
        """
    )
    parser.add_argument('input', nargs='?', help='Input markdown file')
    parser.add_argument('--stdin', action='store_true', help='Read from stdin')
    parser.add_argument('--dry-run', action='store_true', help='Preview without writing')
    parser.add_argument('--yes', '-y', action='store_true', help='Auto-accept all changes')
    parser.add_argument('--backup', action='store_true', help='Create .bak before modifying')
    parser.add_argument('--no-backup', action='store_true', help='Disable backups even if default')
    parser.add_argument('--interactive', '-i', action='store_true', help='Prompt per file')
    parser.add_argument('--force', action='store_true', help='Force overwrite on create conflicts')
    parser.add_argument('--log', type=str, help='Log operations to JSON file')
    parser.add_argument('--context-lines', type=int, default=3,
                        help='Context lines for fuzzy matching (default: 3)')
    return parser.parse_args()


# ─── Input Reading ────────────────────────────────────────────────────────────
def read_input(args) -> str:
    if args.stdin or not args.input:
        print(f"{C.CYAN}📥 Paste AI response (Ctrl+D or 'END' on new line):{C.RESET}")
        lines = []
        while True:
            try:
                line = sys.stdin.readline()
                if not line or line.strip().upper() == 'END':
                    break
                lines.append(line)
            except KeyboardInterrupt:
                print(f"\n{C.RED}❌ Interrupted.{C.RESET}", file=sys.stderr)
                sys.exit(1)
        return ''.join(lines)
    else:
        path = Path(args.input)
        if not path.exists():
            print(f"{C.RED}❌ File not found: {args.input}{C.RESET}", file=sys.stderr)
            sys.exit(1)
        return path.read_text(encoding='utf-8')


# ─── Metadata Parser ─────────────────────────────────────────────────────────
def parse_metadata(header_block: str) -> Dict[str, Any]:
    """Extract <!-- key:value --> directives from text between ## File: and ```."""
    meta = {}
    # Match <!-- key:value --> or <!-- key:"multi-line value" -->
    pattern = re.compile(
        r'<!--\s*(op|context:after|context:before|action|target|force)\s*:\s*'
        r'(?:"((?:[^"\\]|\\.)*)"|([\w\-]+))\s*-->',
        re.IGNORECASE | re.DOTALL
    )
    for m in pattern.finditer(header_block):
        key = m.group(1).lower()
        value = m.group(2) if m.group(2) is not None else m.group(3)
        if key == 'force':
            meta[key] = value.lower() == 'true'
        else:
            meta[key] = value.replace('\\"', '"').replace('\\n', '\n')
    return meta


# ─── Block Parser ─────────────────────────────────────────────────────────────
def parse_blocks(text: str) -> List[Dict[str, Any]]:
    """Parse markdown into structured file operation blocks."""
    # Split on ## File: headers, capturing everything until next header or EOF
    file_pattern = re.compile(
        r'##\s*File:\s*`([^`]+)`\s*\n(.*?)(?=^##\s*File:|\Z)',
        re.DOTALL | re.MULTILINE | re.IGNORECASE
    )
    blocks = []
    for match in file_pattern.finditer(text):
        filepath = match.group(1).strip()
        body = match.group(2)

        # Extract metadata from pre-code-fence section
        code_fence_match = re.search(r'```(?:\w+)?\s*\n(.*?)```', body, re.DOTALL)
        if code_fence_match:
            header_section = body[:code_fence_match.start()]
            code = code_fence_match.group(1).rstrip('\n')
        else:
            # No code fence – treat entire body as code (for delete ops)
            header_section = body
            code = ""

        meta = parse_metadata(header_section)
        op = meta.get('op', '').lower()

        # Default operation inference
        if not op:
            op = 'delete' if not code.strip() else 'update'

        blocks.append({
            'filepath': filepath,
            'code': code,
            'op': op,
            'meta': meta,
        })
    return blocks


# ─── Context Matching Engine ─────────────────────────────────────────────────
def find_anchor(content: str, anchor: str, threshold: float = CONTEXT_SIMILARITY_THRESHOLD) -> Optional[int]:
    """Find anchor string in content with fuzzy fallback. Returns start index or None."""
    # Exact match first
    idx = content.find(anchor)
    if idx != -1:
        return idx

    # Fuzzy line-by-line matching
    anchor_lines = anchor.strip().splitlines()
    content_lines = content.splitlines()

    best_ratio = 0.0
    best_idx = -1

    for i in range(len(content_lines) - len(anchor_lines) + 1):
        window = '\n'.join(content_lines[i:i + len(anchor_lines)])
        ratio = difflib.SequenceMatcher(None, anchor.strip(), window).ratio()
        if ratio > best_ratio:
            best_ratio = ratio
            best_idx = i

    if best_ratio >= threshold:
        # Return character offset of matched line
        char_offset = sum(len(l) + 1 for l in content_lines[:best_idx])
        return char_offset

    return None


# ─── Operation Executors ─────────────────────────────────────────────────────
def execute_create(path: Path, code: str, meta: Dict, dry_run: bool, force: bool) -> Tuple[str, str]:
    if path.exists() and not (force or meta.get('force')):
        return 'SKIP', f"File exists (use --force or <!-- force:true -->)"
    if dry_run:
        return 'DRY', f"Would CREATE ({len(code)} chars)"
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(code + '\n', encoding='utf-8')
    return 'CREATE', f"Created ({len(code)} chars)"


def execute_update(path: Path, code: str, meta: Dict, dry_run: bool) -> Tuple[str, str]:
    if not path.exists():
        return 'ERROR', f"File not found for UPDATE"

    original = path.read_text(encoding='utf-8')
    ctx_after = meta.get('context:after')
    ctx_before = meta.get('context:before')

    if ctx_after or ctx_before:
        # Context-aware splice
        anchor = ctx_after or ctx_before
        pos = find_anchor(original, anchor)
        if pos is None:
            return 'ERROR', f"Context anchor not found: {anchor[:60]}..."

        if ctx_after:
            # Insert after anchor
            end_of_anchor = original.find('\n', pos)
            if end_of_anchor == -1:
                end_of_anchor = len(original)
            new_content = original[:end_of_anchor + 1] + code + '\n' + original[end_of_anchor + 1:]
        else:
            # Insert before anchor
            new_content = original[:pos] + code + '\n' + original[pos:]
    else:
        # Full replacement (legacy behavior)
        new_content = code + '\n'

    if new_content == original:
        return 'NOOP', "Content unchanged"
    if dry_run:
        diff = list(difflib.unified_diff(
            original.splitlines(), new_content.splitlines(),
            lineterm='', n=2
        ))
        preview = '\n'.join(diff[:20])
        return 'DRY', f"Would UPDATE\n{preview}"

    path.write_text(new_content, encoding='utf-8')
    return 'UPDATE', f"Updated ({len(new_content) - len(original):+d} chars)"


def execute_line(path: Path, code: str, meta: Dict, dry_run: bool) -> Tuple[str, str]:
    if not path.exists():
        return 'ERROR', "File not found for LINE operation"

    action = meta.get('action', '').lower()
    target = meta.get('target', '')
    if not action or not target:
        return 'ERROR', "LINE op requires <!-- action:... --> and <!-- target:... -->"

    original = path.read_text(encoding='utf-8')
    pos = find_anchor(original, target)
    if pos is None:
        return 'ERROR', f"Target not found: {target[:60]}..."

    lines = original.splitlines(keepends=True)
    # Find which line contains the position
    char_count = 0
    target_line_idx = -1
    for i, line in enumerate(lines):
        if char_count + len(line) > pos:
            target_line_idx = i
            break
        char_count += len(line)

    if target_line_idx == -1:
        return 'ERROR', "Could not resolve target line index"

    if action == 'insert-after':
        lines.insert(target_line_idx + 1, code + '\n')
    elif action == 'insert-before':
        lines.insert(target_line_idx, code + '\n')
    elif action == 'replace':
        lines[target_line_idx] = code + '\n'
    elif action == 'delete':
        del lines[target_line_idx]
    else:
        return 'ERROR', f"Unknown LINE action: {action}"

    new_content = ''.join(lines)
    if new_content == original:
        return 'NOOP', "Content unchanged"
    if dry_run:
        return 'DRY', f"Would LINE-{action.upper()} at line {target_line_idx + 1}"

    path.write_text(new_content, encoding='utf-8')
    return 'LINE', f"{action} at line {target_line_idx + 1}"


def execute_delete(path: Path, meta: Dict, dry_run: bool, backup: bool) -> Tuple[str, str]:
    if not path.exists():
        return 'NOOP', "File already absent"
    if dry_run:
        return 'DRY', f"Would DELETE {path.name}"

    if backup:
        trash = path.parent / TRASH_DIR
        trash.mkdir(exist_ok=True)
        ts = datetime.now().strftime('%Y%m%d_%H%M%S')
        dest = trash / f"{path.stem}_{ts}{path.suffix}"
        dest.write_text(path.read_text(encoding='utf-8'), encoding='utf-8')

    path.unlink()
    return 'DELETE', f"Deleted{' (→ ' + TRASH_DIR + ')' if backup else ''}"


# ─── Interactive Prompt ──────────────────────────────────────────────────────
def prompt_user(filepath: str, op: str, detail: str) -> bool:
    print(f"\n{C.BOLD}{'─' * 60}{C.RESET}")
    print(f"{C.CYAN}📄 {filepath}{C.RESET}")
    print(f"   Op: {C.BOLD}{op.upper()}{C.RESET} | {detail}")
    while True:
        choice = input(f"   Apply? [Y/n/e(exit)]: ").strip().lower()
        if choice in ('', 'y', 'yes'):
            return True
        if choice in ('n', 'no'):
            return False
        if choice in ('e', 'exit'):
            print(f"{C.YELLOW}⏹ User exited.{C.RESET}")
            sys.exit(0)
        print("   Please enter y, n, or e.")


# ─── Main Orchestrator ────────────────────────────────────────────────────────
def main():
    args = parse_args()
    text = read_input(args)

    if not text.strip():
        print(f"{C.RED}⚠️  No input provided.{C.RESET}", file=sys.stderr)
        sys.exit(1)

    blocks = parse_blocks(text)
    if not blocks:
        print(f"{C.RED}⚠️  No valid '## File:' blocks found.{C.RESET}", file=sys.stderr)
        sys.exit(1)

    root = Path.cwd()
    do_backup = args.backup and not args.no_backup
    stats = {'CREATE': 0, 'UPDATE': 0, 'DELETE': 0, 'LINE': 0,
             'SKIP': 0, 'NOOP': 0, 'ERROR': 0, 'DRY': 0}
    log_entries = []

    print(f"\n{C.BOLD}🔧 sync_files v{VERSION}{C.RESET}")
    print(f"📂 Found {len(blocks)} operation(s) | Mode: {'DRY RUN' if args.dry_run else 'LIVE'}")
    print(f"{'─' * 60}")

    for block in blocks:
        fp = block['filepath']
        path = root / fp
        op = block['op']
        code = block['code']
        meta = block['meta']

        # Dispatch
        if op == 'create':
            status, detail = execute_create(path, code, meta, args.dry_run, args.force)
        elif op == 'update':
            status, detail = execute_update(path, code, meta, args.dry_run)
        elif op == 'line':
            status, detail = execute_line(path, code, meta, args.dry_run)
        elif op == 'delete':
            status, detail = execute_delete(path, meta, args.dry_run, do_backup)
        else:
            status, detail = 'ERROR', f"Unknown operation: {op}"

        # Backup before write (non-dry-run, non-create)
        if do_backup and not args.dry_run and status in ('UPDATE', 'LINE') and path.exists():
            bak = path.with_suffix(path.suffix + BACKUP_SUFFIX)
            if not bak.exists():  # Only one backup per session
                bak.write_text(path.read_text(encoding='utf-8'), encoding='utf-8')

        # Interactive gate
        if args.interactive and not args.dry_run and status not in ('NOOP', 'ERROR', 'SKIP'):
            if not prompt_user(fp, op, detail):
                status = 'SKIP'
                detail = 'User declined'

        # Colorized output
        color_map = {
            'CREATE': C.GREEN, 'UPDATE': C.GREEN, 'DELETE': C.YELLOW,
            'LINE': C.CYAN, 'DRY': C.CYAN, 'NOOP': C.YELLOW,
            'SKIP': C.YELLOW, 'ERROR': C.RED
        }
        color = color_map.get(status, C.RESET)
        icon = {'CREATE': '✨', 'UPDATE': '🔄', 'DELETE': '🗑️', 'LINE': '✏️',
                'DRY': '👁️', 'NOOP': '⏭️', 'SKIP': '⏭️', 'ERROR': '❌'}.get(status, '?')
        print(f"{color}{icon} [{status:6s}] {fp}{C.RESET}")
        if detail and (status == 'ERROR' or args.dry_run):
            for dl in detail.split('\n')[:10]:
                print(f"         {dl}")

        stats[status] = stats.get(status, 0) + 1
        log_entries.append({
            'timestamp': datetime.now().isoformat(),
            'file': fp, 'op': op, 'status': status, 'detail': detail
        })

    # Summary
    print(f"\n{'─' * 60}")
    summary_parts = [f"{k}: {v}" for k, v in stats.items() if v > 0]
    print(f"{C.BOLD}📊 Summary:{C.RESET} {' | '.join(summary_parts)}")

    # Log file
    if args.log:
        import json
        with open(args.log, 'a', encoding='utf-8') as lf:
            for entry in log_entries:
                lf.write(json.dumps(entry) + '\n')
        print(f"📝 Log appended to: {args.log}")

    # Exit code
    if stats.get('ERROR', 0) > 0:
        sys.exit(1)
    sys.exit(0)


if __name__ == "__main__":
    main()