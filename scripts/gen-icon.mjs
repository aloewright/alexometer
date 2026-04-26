import { mkdir, writeFile } from "node:fs/promises"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"

import sharp from "sharp"

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, "..")

const SIZE = 1024
const STROKE = 80
const LENS_R = 320
const LENS_CX = 432
const LENS_CY = 432
const HANDLE_LEN = 360

const handleStartX = LENS_CX + Math.cos(Math.PI / 4) * LENS_R
const handleStartY = LENS_CY + Math.sin(Math.PI / 4) * LENS_R
const handleEndX = handleStartX + Math.cos(Math.PI / 4) * HANDLE_LEN
const handleEndY = handleStartY + Math.sin(Math.PI / 4) * HANDLE_LEN

const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${SIZE} ${SIZE}" width="${SIZE}" height="${SIZE}">
  <g fill="none" stroke="#ffffff" stroke-width="${STROKE}" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="${LENS_CX}" cy="${LENS_CY}" r="${LENS_R}" />
    <line x1="${handleStartX}" y1="${handleStartY}" x2="${handleEndX}" y2="${handleEndY}" />
  </g>
</svg>`

const outDir = resolve(root, "assets")
await mkdir(outDir, { recursive: true })

const pngBuffer = await sharp(Buffer.from(svg))
  .resize(SIZE, SIZE)
  .png()
  .toBuffer()

await writeFile(resolve(outDir, "icon.png"), pngBuffer)
await writeFile(resolve(outDir, "icon.svg"), svg)

console.log(`Wrote assets/icon.png (${SIZE}x${SIZE}) and assets/icon.svg`)
