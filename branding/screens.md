

## Reference Images

**If a reference image is provided:**
- Match layout, spacing, typography, and color exactly
- Swap in placeholder content only (images via `https://placehold.co/WIDTHxHEIGHT` at matching aspect ratio, generic copy)
- Do not improve, add to, or reinterpret the design
- After each screenshot pass, compare against the reference image directly and list specific mismatches (e.g. "heading is 32px but reference shows ~24px", "card gap is 16px but should be 24px")
- Run at least 2 comparison rounds. Stop only when no visible differences remain, or the user says to stop.

**If no reference image is provided:**
- Design from scratch using brand guidelines and the frontend-design skill
- Commit to a clear visual direction before writing any code (see frontend-design skill Phase 1)

---

## Local Dev Server

- Always serve on `localhost`. Never screenshot a `file:///` URL.
- Start the dev server from the project root: `node serve.mjs`
- This serves the project root at `http://localhost:3000`
- `serve.mjs` lives at the project root. Paths in `serve.mjs` are relative to that root, not `/home/claude`.
- Start it in the background before taking any screenshots.
- If the server is already running, do not start a second instance. Check with `lsof -i :3000` first.
- If `serve.mjs` fails, check the error message before attempting a workaround.

---

## Screenshot Workflow

- Puppeteer is installed via npm in `node_modules/`. If missing, run `npm install` from the project root (`Pix3l Website/`).
- Chrome cache is at `C:/Users/trey/.cache/puppeteer/` on the host machine. Do not attempt to modify this path.
- Always screenshot from localhost: `node screenshot.mjs http://localhost:3000`
- Optional label suffix: `node screenshot.mjs http://localhost:3000 my-label` saves as `screenshot-N-my-label.png`
- Screenshots auto-increment to `./temporary screenshots/screenshot-N.png` and are never overwritten.
- `screenshot.mjs` lives at the project root. Use it as-is.
- After screenshotting, read the PNG from `temporary screenshots/` with the view tool to analyze it directly.

**If Puppeteer fails:**
1. Check the console error first
2. Confirm the dev server is running and responding at `http://localhost:3000`
3. Try a clean reinstall: `npm install` from the project root
4. Report the exact error to the user before attempting further workarounds

---