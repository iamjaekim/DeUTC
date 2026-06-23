# DeUTC — Status Page Time Converter

**DeUTC** is a lightweight, zero-config Chrome Extension that automatically converts UTC timestamps and relative durations on any status page into your local timezone. No more mental math during an incident.

---

## Features

- **Absolute UTC conversion** — Detects timestamps like `Jun 13, 2026 - 00:50 UTC` and appends your local equivalent directly below.
- **Relative duration conversion** — Detects phrases like `Ongoing for 1 hour` or `2 hours ago` and calculates an approximate absolute local time (prefixed with `~`).
- **Works on any status page** — Activates on any URL that contains the word `status` (e.g. `status.openai.com`, `status.claude.com`, `status.atlassian.com`).
- **SPA-safe** — Uses a non-destructive, attribute-based injection strategy so it never crashes React or Next.js frontends.
- **Zero performance impact** — MutationObserver only watches for new child elements, never attributes. Processed nodes are tracked in a `WeakSet` to prevent duplicate work.

---

## How It Works

The extension injects a content script that:

1. Walks the DOM depth-first to find the most specific element wrapping a timestamp.
2. Writes the converted local time to a `data-deutc-time` attribute on that element.
3. A CSS `::after` rule renders `↳ <local time>` directly below the original text.
4. A `MutationObserver` repeats this for any new content loaded dynamically.

---

## Installation (Developer Mode)

1. Clone this repo: `git clone https://github.com/YOUR-USERNAME/DeUTC.git`
2. Open Chrome and go to `chrome://extensions/`
3. Enable **Developer Mode** (top-right toggle)
4. Click **Load unpacked** and select the `DeUTC` folder
5. Visit any status page — your local time will appear automatically

---

## Project Structure

```
DeUTC/
├── manifest.json      # Chrome Extension manifest (v3)
├── content.js         # Core DOM scanner and converter logic
├── styles.css         # Styles for converted timestamp elements
├── icons/
│   ├── icon-16.png
│   ├── icon-48.png
│   └── icon-128.png
├── README.md
└── LICENSE
```

---

## License

MIT — see [LICENSE](LICENSE)