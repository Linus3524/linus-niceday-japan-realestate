---
name: use-brave-browser
description: >-
  Instructions for launching and automating browser operations using Brave Browser on this machine.
  Activate this skill whenever the user asks to open a browser, view a web page, perform UI testing,
  take screenshots, or when running Playwright/browser automation scripts on this macOS environment.
---

# Use Brave Browser Workflow

## Context
On this macOS machine, Google Chrome is **not installed**. The user's primary and installed browser is **Brave Browser**.
Standard tools or scripts that attempt to locate Google Chrome (or default Chromium) will fail with CDP connection or executable missing errors.

## Brave Browser Executable Path
- Application Bundle: `/Applications/Brave Browser.app`
- Binary Executable: `/Applications/Brave Browser.app/Contents/MacOS/Brave Browser`

## Opening Pages in Browser for the User
To open a URL directly in Brave Browser:
```bash
open -a "Brave Browser" "<url>"
```

## Playwright / Puppeteer Automation & Screenshots
When running headless browser verification or capturing screenshots via Playwright or Puppeteer, always explicitly configure `executablePath` to point to Brave Browser:

```ts
import { chromium } from "playwright";

const browser = await chromium.launch({
  headless: true,
  executablePath: "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
});

const page = await browser.newPage({ viewport: { width: 1200, height: 900 } });
// Use "domcontentloaded" to avoid timeout caused by Vite/HMR WebSocket connections:
await page.goto("<url>", { waitUntil: "domcontentloaded" });
await page.waitForSelector(".target-selector", { timeout: 10000 });
await page.screenshot({ path: "/path/to/screenshot.png" });
await browser.close();
```

## Key Guidelines
1. **Never assume Chrome exists**: Do not call tools or launch scripts expecting `/Applications/Google Chrome.app`.
2. **Handle Vite / HMR connection**: When using `page.goto()`, use `{ waitUntil: "domcontentloaded" }` instead of `"networkidle"` to avoid timeouts.
3. **Visual Verification**: Always use Brave Browser's executable path when capturing verification screenshots.
