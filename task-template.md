# Task Template for Clair (Claude Code Sub-Agent)

This template is used by Bob to assemble task prompts for Clair.
Auto-populated sections pull from workspace files to ensure consistent context.

---

## Task
{{TASK_DESCRIPTION}}

## Codebase
- **App:** `index.html` — single-file HTML/React/Babel warehouse receiving log
- **Dashboard:** `dashboard.html` — status dashboard (reads status.json)
- **Repo:** github.com/neimaD7/aurora-log
- **Data Repo:** github.com/neimaD7/aurora-log-data (PRIVATE)
- **Working Copy:** C:\Users\billy\.openclaw\workspace\aurora-log\index.html

## Design Language (from BILLY.md)
- iOS-clean dark aesthetic (background: #0a0a0a, cards: #1c1c1e)
- Border radius: 16px cards, 10px buttons, 8px inputs
- Colors: amber (#c9a84c) for accents, green (#34c759) for success, red (#ff453a) for danger
- Frosted glass modals: rgba(28,28,30,0.95), backdrop-filter blur
- Font: -apple-system/SF Pro stack
- All styles inline (no external CSS)
- Responsive: mobile-first, iOS Safari safe

## Recent Changes
{{RECENT_CHANGELOG}}

## Constraints
- Single-file architecture — everything in index.html
- No external dependencies beyond React/Babel CDN
- Must pass check.py validation (top-level components, failsafe system)
- Test on mobile Safari (Damien uses this at work)
- Preserve GitHub sync functionality (GitHubSync module)
- Preserve soft-delete pattern (_deleted + modifiedAt)

## Output
- Write changes directly to the file
- List every change you made
- Note anything you're unsure about
