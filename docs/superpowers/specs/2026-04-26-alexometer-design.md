# Alexometer — Design Spec

**Date**: 2026-04-26
**Status**: Approved (brainstormed with user)
**Author**: aloe

## Overview

Alexometer is a Chrome extension that inspects any website's design from a side panel. Hover an element to see its computed styles, palette, fonts, and WCAG contrast; click to freeze the selection and export it as HTML, CSS, or Tailwind utility classes. A full-page scan aggregates every color, font, asset, and spacing value used on the page; users can save palettes, export design tokens (Tailwind v4 `@theme`, CSS variables, or JSON), and bulk-download every image, SVG, and Lottie file as a single zip.

Visual design system mirrors `lean-extensions` (dark `#3b3b3f` background, Inter typography, `#505055` borders, accent palette of soft pastels). Stack mirrors `lean-extensions` except Tailwind is version 4 (CSS-first config via `@theme`).

## Goals

- Full feature parity with the design-inspection tool the user is cloning, including its paid-tier features (bulk export, full-page scans), shipped free.
- Reuse the visual language and interaction patterns of `lean-extensions` so the extensions feel like a coherent suite.
- Side-panel-only — no popup, no separate dashboard tab.
- Public GitHub repo at `aloewright/alexometer`.

## Non-goals

- Pseudo-element / animation inspection (would require `chrome.debugger` and a persistent debugging banner).
- Cross-origin iframe inspection (browser security boundary).
- Account / billing / paywall.

## Architecture

### Stack

- Plasmo 0.90.5 (manifest generation, dev/build)
- React 18 + TypeScript 5.7
- Tailwind 3 with `tailwind.config.js` and `tailwindcss` PostCSS plugin
  *(Tailwind 4 was attempted but `@tailwindcss/postcss` pulls in `jiti`, which
  imports `node:module` — unresolvable by Plasmo's Parcel bundler. Tailwind 3
  produces identical visual output here, so we use it. The lean-extensions
  color tokens carry over verbatim.)*
- `@plasmohq/storage` (chrome.storage.local wrapper)
- `fflate` for client-side zip generation
- Vitest + happy-dom for unit tests

### Surfaces

| Surface             | File                       | Role                                                    |
| ------------------- | -------------------------- | ------------------------------------------------------- |
| Side panel          | `src/sidepanel.tsx`        | Only user-facing UI. Tab router for the four tabs.      |
| Background SW       | `src/background.ts`        | Side-panel lifecycle, message routing, command handler. |
| Inspector content   | `src/contents/inspector.ts`| Hover overlay + click freeze; on demand only.           |
| Scanner content     | `src/contents/scanner.ts`  | Walks DOM once and ships aggregated payload.            |

The toolbar action opens the side panel via `chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true })`. The `Alt+Shift+A` command opens it programmatically.

### Side panel internal layout

Single panel, four tabs:

1. **Inspect** — live mode. Start/stop button toggles inspector. Hover paints overlay; click freezes target. Renders box model, color swatches (text/bg/border), font card, contrast badge, and Export / Tokens / Save buttons.
2. **Scan** — "Scan this page" button. Renders dedup'd colors/fonts/spacing/assets sorted by occurrence. Bulk actions: save-as-palette, export-tokens, download-all-assets-as-zip.
3. **Library** — saved palettes, token sets, and assets. Search + filter. Each item has copy/export/delete actions.
4. **Settings** — default color format, contrast target (AA/AAA), token-export defaults.

### Module layout

```
src/
  sidepanel.tsx                 # entry; tab router
  background.ts                 # SW: panel lifecycle + message routing
  storage.ts                    # typed wrappers around @plasmohq/storage
  types.ts                      # all shared types + DEFAULT_STORAGE
  style.css                     # @theme tokens + base styles

  components/
    TabBar.tsx
    InspectTab.tsx
    ScanTab.tsx
    LibraryTab.tsx
    SettingsTab.tsx
    ColorSwatch.tsx
    ColorFormatToggle.tsx
    FontCard.tsx
    BoxModelView.tsx
    ContrastBadge.tsx
    AssetCard.tsx
    ExportPanel.tsx
    TokensPanel.tsx
    EmptyState.tsx
    Toast.tsx

  contents/
    inspector.ts
    scanner.ts

  utils/
    color.ts                    # parse + convert HEX/RGB/HSL/OKLCH
    contrast.ts                 # WCAG luminance + ratio
    codegen.ts                  # element → HTML / CSS / Tailwind snippet
    tokens.ts                   # palette → Tailwind v4 / CSS vars / JSON
    fonts.ts                    # font detection + dedup
    assets.ts                   # collect <img>, inline SVG, Lottie
    zip.ts                      # bulk export via fflate
    messaging.ts                # typed sendMessage helpers

tests/
  setup.ts                      # mocks @plasmohq/storage
  color.test.ts
  contrast.test.ts
  codegen.test.ts
  tokens.test.ts
  storage.test.ts
```

### Module boundaries

- `utils/*` are pure (no chrome APIs, no React) and unit-tested.
- `contents/*` only run in page context; they use `utils/*` and `chrome.runtime.sendMessage` only.
- `components/*` are presentational; data comes from `storage.ts` or live messages.
- `background.ts` is thin — only message routing and panel lifecycle.

## Data flows

### Live inspect

```
User clicks "Start inspecting" in Inspect tab
→ panel sends {type:"inspector:start"} to background
→ background uses chrome.scripting.executeScript to inject inspector.ts in active tab
→ content script attaches mousemove (debounced) + click handlers
→ on hover: paints overlay div around target; posts {type:"inspector:hover", payload}
→ on click: freezes selection; posts {type:"inspector:pick", payload}
→ panel renders payload via Inspect tab components
```

The hover payload is a debounced `ElementSnapshot` (≤ 60Hz). Pick payload is identical but signals freeze. Stop tears down listeners and removes overlay.

### Full-page scan

```
User clicks "Scan this page" → background injects scanner.ts → scanner.ts:
  walks document.querySelectorAll("*") (skipping invisible elements)
  for each: collect color/bg/border, font props, spacing props, asset refs
  also walks shadow roots when present
  dedup by string value, keep occurrence count
  sort each list by count desc
→ posts {type:"scan:result", payload}
→ panel renders Scan tab
```

### Bulk asset export

```
User clicks "Download all assets" on Scan tab
→ panel iterates ScanResult.assets
→ for each: fetch() in panel context (works for same-origin and CORS-enabled)
   - inline SVGs are serialized to text
   - cross-origin without CORS is skipped with a count in the toast
→ fflate.zipSync builds a flat archive named alexometer-<host>-<timestamp>.zip
→ chrome.downloads.download({ url: blob URL })
```

### Save flows

- Save palette: gather currently-displayed colors → `addPalette({id, name, colors, sourceUrl, createdAt})`.
- Save tokens: render export string from current palette/scan → `addTokenSet({id, name, format, payload, createdAt})`.
- Save asset: data URL captured during fetch → `addAsset({id, type, url, dataUrl, createdAt})`.

## Storage shape

`chrome.storage.local` (~5MB), accessed via `@plasmohq/storage`:

```ts
{
  palettes: SavedPalette[]      // {id, name, colors[], sourceUrl?, createdAt}
  tokens: SavedTokenSet[]       // {id, name, format, payload, createdAt, sourceUrl?}
  assets: SavedAsset[]          // {id, type, url, dataUrl?, inlineSvg?, sourceUrl?, createdAt}
  settings: Settings            // {colorFormat, contrastTarget, exportDefaults}
}
```

Defaults in `DEFAULT_STORAGE` (`src/types.ts`).

## Color, contrast, codegen, tokens

### Color (`utils/color.ts`)

- Parser accepts HEX (`#abc`, `#aabbcc`, `#aabbccdd`), `rgb()`/`rgba()`, `hsl()`/`hsla()`, named colors (via a small lookup of CSS named colors), `transparent`.
- Internal canonical form: `RGBA = {r,g,b,a}` with sRGB 0–255 channels and 0–1 alpha.
- Output formatters for `hex` / `rgb` / `hsl` / `oklch`.
- OKLCH conversion: sRGB → linear sRGB → XYZ (D65) → Oklab → OKLCH using the Björn Ottosson matrices.

### Contrast (`utils/contrast.ts`)

- Relative luminance per WCAG 2.0 (sRGB → linearized channels → `0.2126*R + 0.7152*G + 0.0722*B`).
- Ratio = `(L1 + 0.05) / (L2 + 0.05)` where L1 is the lighter.
- Pass thresholds: AA 4.5 (normal) / 3 (large); AAA 7 (normal) / 4.5 (large).

### Codegen (`utils/codegen.ts`)

- HTML: `outerHTML` from snapshot, with our injected overlay attribute stripped.
- CSS: emit only properties that differ from a baseline of common defaults (display:block, font-size:16px, etc.) to avoid 200-line output for a `<div>`.
- Tailwind: map a curated list of common properties to utility classes:
  - `padding`, `margin` → `p-*`, `m-*` with closest 0.25rem step or arbitrary `[12px]`
  - `color`, `background-color` → `text-[hex]`, `bg-[hex]`
  - `font-size` → `text-[size]`
  - `font-weight` → `font-{thin..black}`
  - `border-radius` → `rounded-*` or arbitrary
  - `display`, `flex-direction`, `justify-content`, `align-items` → standard utilities
  - everything else → arbitrary value `[prop:value]` or skipped

### Tokens (`utils/tokens.ts`)

- `tailwind` format (Tailwind v4 export): emit a `@theme { --color-foo-1: #...; ... }` block (the *user-facing* token export is still Tailwind v4-shaped, since that is what consumers want; only our own build uses v3).
- `css` format: emit `:root { --color-foo-1: #...; }`.
- `json` format: emit `{ colors: {...}, fonts: [...], spacing: [...] }` shaped to interoperate with Style Dictionary.

## Permissions

```jsonc
{
  "permissions": [
    "activeTab",      // read current page on demand
    "scripting",      // inject inspector / scanner content scripts
    "sidePanel",      // chrome.sidePanel API
    "storage",        // saved palettes / tokens / assets
    "downloads",      // single + bulk asset export
    "clipboardWrite", // copy color codes / export strings
    "tabs"            // resolve active tab id
  ],
  "host_permissions": ["<all_urls>"],
  "commands": {
    "toggle-panel": {
      "suggested_key": { "default": "Alt+Shift+A" },
      "description": "Toggle Alexometer side panel"
    }
  }
}
```

No `chrome.debugger` (avoids the persistent debugging banner). No `cookies`, `management`, `browsingData` — not needed.

## Edge cases

- **Cross-origin iframes** — content script can't read computed styles inside them. Show a small warning chip on the inspect tab when target is in a cross-origin frame.
- **Shadow DOM** — scanner traverses `element.shadowRoot` when open; closed shadow roots are skipped.
- **Lottie** — detected by `<lottie-player>` tag, `bodymovin`/`lottie-web` script presence with a JSON URL nearby, or `*.lottie` URLs in `<img>`/`<source>` tags.
- **Inline SVG** — captured as serialized markup, not just a URL.
- **CORS-restricted assets** — bulk zip skips and reports the count.
- **`color-mix()`, `currentColor`, gradients** — gradients are reported as raw strings; `currentColor` is resolved via computed `color`; `color-mix()` falls through unparsed.
- **Very large pages** — scanner caps `querySelectorAll("*")` traversal at 20,000 nodes with a soft warning.

## Testing

Vitest unit tests on pure modules (no browser):

- `tests/color.test.ts` — every parse → format combination, plus OKLCH round-trip stability.
- `tests/contrast.test.ts` — known WCAG cases (white-on-black 21:1, AA/AAA boundary cases for normal and large text).
- `tests/codegen.test.ts` — element snapshots → HTML/CSS/Tailwind, validating filtered defaults and class mappings.
- `tests/tokens.test.ts` — palette → Tailwind v4 / CSS / JSON output assertions.
- `tests/storage.test.ts` — CRUD round-trips on each collection (uses the mocked Storage in `tests/setup.ts`).

Browser-only paths (content scripts, side panel rendering) are not unit-tested in this MVP.

## Build & verification

```bash
pnpm install
pnpm test    # vitest run
pnpm build   # plasmo build → build/chrome-mv3-prod/
```

Manual smoke test: load `build/chrome-mv3-prod` as unpacked extension, open side panel on an arbitrary page, confirm inspect/scan/library/settings all function.

## Repo

Public GitHub repo `aloewright/alexometer`. No mention of the source-extension brand anywhere in code, copy, or commits.
