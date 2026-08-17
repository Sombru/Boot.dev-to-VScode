# Boot.dev to VS Code

A small plain-JavaScript browser extension that exports the current Boot.dev lesson into local files you can open in VS Code.

## Current behavior

- Runs on `https://www.boot.dev/*`.
- Adds a browser action popup with an export button.
- Reads visible lesson content from the active Boot.dev tab.
- Downloads a lesson README file.
- Downloads one code file when editor/code content can be detected.

This first version intentionally avoids npm, TypeScript, bundlers, a ZIP dependency, and a companion VS Code extension.

## Load in Chrome or Edge

1. Open `chrome://extensions`.
2. Enable `Developer mode`.
3. Click `Load unpacked`.
4. Select this project folder.
5. Open a Boot.dev lesson page.
6. Click the extension icon and choose `Export lesson`.

After editing extension files, return to `chrome://extensions` and reload the extension.

## Load in Firefox

1. Open `about:debugging`.
2. Choose `This Firefox`.
3. Click `Load Temporary Add-on`.
4. Select `manifest.json` from this project folder.
5. Open a Boot.dev lesson page.
6. Click the extension icon and choose `Export lesson`.

Firefox temporary add-ons are removed when the browser closes, so reload the extension when starting a new browser session.

## Debugging

- Popup errors appear inside the popup.
- Content-script logs and errors appear in the Boot.dev page DevTools console.
- If no code file downloads, Boot.dev may be using an editor structure this first extractor does not recognize yet.

The most likely future improvement is tuning `content.js` after testing against real Boot.dev lesson pages.
