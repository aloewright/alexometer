# Alexometer

Inspect any website's design — extract colors, fonts, spacing, SVGs, Lottie, and export to code.

A Chrome extension that opens a side panel for live design inspection. Hover any element on the active page to see computed styles, palette, fonts, and a WCAG contrast read; click to freeze and export the snippet as HTML, CSS, or Tailwind. Run a full-page scan to aggregate every color, font, asset, and spacing value, and bulk-export them as a Tailwind config, CSS variables, JSON tokens, or a zip of all images, SVGs, and Lottie files.

## Features

- **Hover-to-inspect** — computed styles, box model, and palette for any element
- **Color tools** — HEX, RGB, HSL, OKLCH; one-click copy
- **Font detection** — family, size, weight, line-height
- **WCAG contrast** — AA / AAA pass/fail for text vs background
- **Full-page scan** — all colors, fonts, assets, spacing values, deduped and sorted by use
- **Asset library** — download images, SVGs, and Lottie animations (single or zipped bulk)
- **Code export** — selected element as HTML, CSS, or Tailwind utility classes
- **Design tokens** — palette → Tailwind v4 `@theme`, CSS variables, or JSON
- **Library** — saved palettes, tokens, and assets across sessions

## Install (development)

```bash
pnpm install
pnpm dev
```

Then load `build/chrome-mv3-dev` in `chrome://extensions/` (Developer mode → Load unpacked).

## Build

```bash
pnpm build
```

Output in `build/chrome-mv3-prod`.

## Test

```bash
pnpm test
```

## Stack

Plasmo · React 18 · TypeScript · Tailwind 3 · `@plasmohq/storage` · Vitest · `fflate`

> Tailwind 4 was attempted; its PostCSS plugin pulls in `jiti` which Plasmo's
> Parcel bundler cannot resolve (`node:module` is unknown to Parcel). Tailwind
> 3 produces the identical visual output here, so we use it.

## Keyboard shortcuts

- `Alt+Shift+A` — toggle the side panel
