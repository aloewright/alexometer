import { useState } from "react"

import { addPalette, addTokenSet } from "../storage"
import type { Message, ScanResult, ScannedAsset, Settings, TokenFormat } from "../types"
import { formatColor, parseColor } from "../utils/color"
import { getActiveTab, sendToTab } from "../utils/messaging"
import { buildZip, dataUrlToBytes, textEntry } from "../utils/zip"
import { AssetCard } from "./AssetCard"
import { ColorFormatToggle } from "./ColorFormatToggle"
import { ColorSwatch } from "./ColorSwatch"
import { EmptyState } from "./EmptyState"
import { FontCard } from "./FontCard"
import { TokensPanel } from "./TokensPanel"

interface Props {
  settings: Settings
  onToast: (msg: string) => void
}

export function ScanTab({ settings, onToast }: Props) {
  const [scan, setScan] = useState<ScanResult | null>(null)
  const [colorFormat, setColorFormat] = useState(settings.colorFormat)
  const [busy, setBusy] = useState(false)

  const runScan = async () => {
    const tab = await getActiveTab()
    if (!tab?.id) return onToast("No active tab")
    setBusy(true)
    const resp = await sendToTab<{ ok: boolean; result?: ScanResult; error?: string }>(tab.id, {
      type: "scan:run"
    } satisfies Message)
    setBusy(false)
    if (!resp || !resp.ok || !resp.result) {
      onToast("Scan failed — try reloading the page")
      return
    }
    setScan(resp.result)
    onToast(`Scanned ${resp.result.colors.length} colors · ${resp.result.assets.length} assets`)
  }

  const copy = async (text: string) => {
    await navigator.clipboard.writeText(text)
    onToast("Copied")
  }

  const savePalette = async () => {
    if (!scan) return
    const colors = scan.colors
      .slice(0, 24)
      .map((c) => parseColor(c.value))
      .filter((p): p is NonNullable<typeof p> => p !== null)
      .map((p) => formatColor(p, "hex"))
    if (colors.length === 0) return onToast("No colors found")
    await addPalette({
      id: crypto.randomUUID(),
      name: `${hostname(scan.url)} – ${new Date().toLocaleDateString()}`,
      colors,
      sourceUrl: scan.url,
      createdAt: new Date().toISOString()
    })
    onToast(`Saved ${colors.length} colors`)
  }

  const saveTokens = async (format: TokenFormat, payload: string) => {
    if (!scan) return
    await addTokenSet({
      id: crypto.randomUUID(),
      name: `${hostname(scan.url)} – ${format}`,
      format,
      payload,
      sourceUrl: scan.url,
      createdAt: new Date().toISOString()
    })
    onToast(`Saved ${format} tokens`)
  }

  const downloadAsset = async (asset: ScannedAsset) => {
    if (asset.inlineSvg) {
      const blob = new Blob([asset.inlineSvg], { type: "image/svg+xml" })
      const url = URL.createObjectURL(blob)
      await chrome.downloads.download({ url, filename: `inline-${Date.now()}.svg` })
      setTimeout(() => URL.revokeObjectURL(url), 5000)
      onToast("Downloaded SVG")
      return
    }
    await chrome.downloads.download({ url: asset.url })
  }

  const downloadAll = async () => {
    if (!scan) return
    if (scan.assets.length === 0) return onToast("No assets")
    const tab = await getActiveTab()
    if (!tab?.id) return onToast("No active tab")
    setBusy(true)

    const entries: { name: string; data: Uint8Array }[] = []
    let skipped = 0

    for (const asset of scan.assets) {
      if (asset.inlineSvg) {
        entries.push(textEntry(`svg/inline-${entries.length + 1}.svg`, asset.inlineSvg))
        continue
      }
      const resp = await sendToTab<{ ok: boolean; dataUrl: string | null }>(tab.id, {
        type: "asset:fetch",
        url: asset.url
      } satisfies Message)
      if (!resp?.dataUrl) {
        skipped += 1
        continue
      }
      const name = filenameFor(asset)
      entries.push({ name, data: dataUrlToBytes(resp.dataUrl) })
    }

    if (entries.length === 0) {
      setBusy(false)
      return onToast("All assets blocked by CORS")
    }

    const zip = buildZip(entries)
    const blob = new Blob([zip], { type: "application/zip" })
    const url = URL.createObjectURL(blob)
    const filename = `alexometer-${hostname(scan.url)}-${Date.now()}.zip`
    await chrome.downloads.download({ url, filename })
    setTimeout(() => URL.revokeObjectURL(url), 8000)
    setBusy(false)
    onToast(`Zipped ${entries.length}${skipped ? ` (${skipped} skipped)` : ""}`)
  }

  return (
    <div className="p-3 space-y-3">
      <button
        onClick={runScan}
        disabled={busy}
        className="w-full text-xs py-2 px-3 rounded bg-chart-1 text-bg font-medium hover:bg-chart-1/90 disabled:opacity-50 transition-colors">
        {busy ? "Working…" : scan ? "Rescan this page" : "Scan this page"}
      </button>

      {!scan && <EmptyState title="No scan yet" hint="Scan extracts every color, font, asset, and spacing value." />}

      {scan && (
        <>
          <div className="flex items-center justify-between">
            <div className="text-[11px] font-mono text-fg/50 truncate">{hostname(scan.url)}</div>
            <ColorFormatToggle value={colorFormat} onChange={setColorFormat} />
          </div>

          <Section title={`Colors (${scan.colors.length})`}>
            <div className="space-y-1.5">
              {scan.colors.slice(0, 32).map((c) => (
                <ColorSwatch key={c.value} value={c.value} format={colorFormat} count={c.count} onCopy={copy} />
              ))}
            </div>
            <button
              onClick={savePalette}
              className="mt-2 w-full text-xs py-1.5 px-3 rounded bg-chart-2/20 text-chart-2 hover:bg-chart-2/30 transition-colors">
              Save palette ({Math.min(scan.colors.length, 24)} colors)
            </button>
          </Section>

          <Section title={`Fonts (${scan.fonts.length})`}>
            <div className="space-y-1.5">
              {scan.fonts.slice(0, 12).map((f) => (
                <FontCard
                  key={f.family}
                  family={f.family}
                  size={f.sizes[0]}
                  weight={f.weights[0]}
                  count={f.count}
                  onCopy={copy}
                />
              ))}
            </div>
          </Section>

          <Section title="Tokens">
            <TokensPanel
              scan={scan}
              defaultFormat={settings.exportDefaults.tokenFormat}
              includeSpacing={settings.exportDefaults.includeSpacing}
              includeFonts={settings.exportDefaults.includeFonts}
              onCopy={copy}
              onSave={saveTokens}
            />
          </Section>

          <Section title={`Assets (${scan.assets.length})`}>
            <div className="space-y-1.5">
              {scan.assets.slice(0, 30).map((a, i) => (
                <AssetCard key={`${a.url}-${i}`} asset={a} onDownload={downloadAsset} />
              ))}
            </div>
            {scan.assets.length > 0 && (
              <button
                onClick={downloadAll}
                disabled={busy}
                className="mt-2 w-full text-xs py-1.5 px-3 rounded bg-chart-1/20 text-chart-1 hover:bg-chart-1/30 disabled:opacity-50 transition-colors">
                {busy ? "Zipping…" : `Download all assets (zip)`}
              </button>
            )}
          </Section>

          <Section title={`Spacing (${scan.spacing.length})`}>
            <div className="grid grid-cols-2 gap-1.5">
              {scan.spacing.slice(0, 16).map((s) => (
                <button
                  key={s.value}
                  onClick={() => copy(s.value)}
                  className="px-2 py-1 rounded bg-card border border-border hover:border-accent text-[11px] font-mono text-fg/70 flex items-center justify-between">
                  <span>{s.value}</span>
                  <span className="text-[10px] text-fg/30">×{s.count}</span>
                </button>
              ))}
            </div>
          </Section>
        </>
      )}
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <div className="text-[10px] uppercase tracking-wider text-fg/40 mb-1.5">{title}</div>
      {children}
    </section>
  )
}

function hostname(url: string): string {
  try {
    return new URL(url).hostname
  } catch {
    return "page"
  }
}

function filenameFor(asset: ScannedAsset): string {
  try {
    const u = new URL(asset.url)
    const last = u.pathname.split("/").filter(Boolean).pop()
    if (last) return last
  } catch {
    /* fall through */
  }
  const ext = asset.type === "svg" ? "svg" : asset.type === "lottie" ? "json" : asset.type === "video" ? "mp4" : "bin"
  return `${asset.type}-${Math.random().toString(36).slice(2, 8)}.${ext}`
}
