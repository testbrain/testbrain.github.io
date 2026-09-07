# 🛠️ Dev Tools

A small collection of everyday developer utilities — server scripts, JSON tools, a diff checker, and a handful of encoders/generators — bundled into one static site.

No build step. No backend. No sign-up. Everything runs in the browser and works straight off GitHub Pages (or any static host).

---

## ✨ Features

### 🧰 Server Scripts (`scripts.html`)
One-command `wget`-and-run scripts for common server maintenance tasks (system info, security audit, network diagnostics, disk health, PHP/MySQL/Nginx/Apache checks, backups, and more). Includes search-as-you-type filtering and one-click copy of the full command.

### 🧾 JSON Formatter (`json-formatter.html` → `json-viewer.html`)
Paste raw JSON, validate it, and open it in a dedicated full-screen viewer with:
- Collapsible, syntax-highlighted tree (color-coded keys/strings/numbers/booleans)
- Expand All / Collapse All
- Live search with match counter and Previous/Next navigation (jumps + auto-scrolls to each match)
- Copy formatted JSON / download as `.json`

### 🆚 Diff Checker (`diff-checker.html`)
Compare two blocks of text with a proper line-based diff (LCS algorithm) — added/removed/unchanged line counts, color-coded output, swap and clear shortcuts.

### 🔐 Encoders & Generators (`encoders.html`)
One tabbed page covering the small utilities you reach for constantly — all update **live** as you type/toggle/drag, no "Generate" button required:
- **Base64** — encode/decode (mode toggle, Unicode-safe)
- **URL** — encode/decode
- **Hash** — SHA-1 / SHA-256 / SHA-384 / SHA-512 (native Web Crypto)
- **Timestamp** — Unix ⇄ human-readable date (Local / UTC / ISO)
- **UUID** — generate 1–50 v4 UUIDs, copy individually or all at once
- **Password** — length slider + character-type toggles, with an entropy-based strength meter
- **QR Code** — generate a scannable QR code and download it as PNG (uses a locally bundled copy of `qrcode.js` — no external CDN dependency)
