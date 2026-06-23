# DeUTC — Status Page Time Converter

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Manifest Version: 3](https://img.shields.io/badge/Manifest-v3-blue.svg)](manifest.json)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](https://github.com/iamjaekim/DeUTC/pulls)

**DeUTC** is a lightweight, zero-config Chrome Extension that automatically converts UTC timestamps and relative durations on any status page into your local timezone. No more mental math during active incidents or post-mortems.

---

## Why DeUTC?

Most developer and SaaS status pages (like AWS, GitHub, OpenAI, and Atlassian Statuspage) display incident events in UTC (Coordinated Universal Time). During active outage debugging, translating those timestamps to your local timezone leads to unnecessary mental fatigue and delays. 

**DeUTC** automatically detects these timestamps and displays your local equivalent inline, keeping you focused on resolving the incident.

---

## Features

- **Absolute UTC conversion** — Detects timestamps like `Jun 13, 2026 - 00:50 UTC` and appends your local equivalent directly below.
- **Relative duration conversion** — Detects relative phrases like `Ongoing for 1 hour` or `2 hours ago` and calculates the approximate absolute local time (prefixed with `~`).
- **Works on any status page** — Automatically triggers on any domain/subdomain containing `status` (e.g., `status.openai.com`, `status.claude.com`, `status.atlassian.com`, `status.github.com`).
- **SPA-safe & Non-destructive** — Uses a target attribute-based injection strategy instead of modifying raw innerHTML directly, preventing React, Vue, or Next.js state crashes.
- **Zero performance impact** — Uses `MutationObserver` targeted only to new child insertions (not attributes) and tracks processed nodes in a `WeakSet` to prevent duplicate scans.

---

## How It Works

The extension injects a lightweight content script that:

1. Walks the DOM depth-first to find elements wrapping a timestamp.
2. Formats and writes the local timezone conversion to a `data-deutc-time` attribute on that element.
3. Uses a CSS `::after` rule to cleanly render `↳ <local time>` directly below the original text without disrupting page layout.
4. Leverages a `MutationObserver` to process newly loaded content dynamically.

---

## Installation (Developer Mode)

1. Clone this repository:
   ```bash
   git clone https://github.com/iamjaekim/DeUTC.git
   ```
2. Open Google Chrome and navigate to `chrome://extensions/`
3. Enable **Developer Mode** using the toggle in the top-right corner.
4. Click **Load unpacked** in the top-left corner and select the cloned `DeUTC` directory.
5. Visit any status page — your local timezone conversion will display automatically!

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

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.