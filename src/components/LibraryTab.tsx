import { useEffect, useState } from "react"

import {
  getAssets,
  getPalettes,
  getTokens,
  removeAsset,
  removePalette,
  removeTokenSet
} from "../storage"
import type { SavedAsset, SavedPalette, SavedTokenSet } from "../types"
import { EmptyState } from "./EmptyState"

interface Props {
  onToast: (msg: string) => void
}

type Section = "palettes" | "tokens" | "assets"

const SECTIONS: { id: Section; label: string }[] = [
  { id: "palettes", label: "Palettes" },
  { id: "tokens", label: "Tokens" },
  { id: "assets", label: "Assets" }
]

export function LibraryTab({ onToast }: Props) {
  const [section, setSection] = useState<Section>("palettes")
  const [palettes, setPalettes] = useState<SavedPalette[]>([])
  const [tokens, setTokens] = useState<SavedTokenSet[]>([])
  const [assets, setAssets] = useState<SavedAsset[]>([])

  const reload = async () => {
    setPalettes(await getPalettes())
    setTokens(await getTokens())
    setAssets(await getAssets())
  }

  useEffect(() => {
    reload()
  }, [])

  const copy = async (text: string) => {
    await navigator.clipboard.writeText(text)
    onToast("Copied")
  }

  return (
    <div className="p-3 space-y-3">
      <div className="flex bg-card border border-border rounded overflow-hidden">
        {SECTIONS.map((s) => (
          <button
            key={s.id}
            onClick={() => setSection(s.id)}
            className={`flex-1 text-[11px] py-1.5 transition-colors ${
              section === s.id ? "bg-accent text-fg" : "text-fg/40 hover:text-fg/70"
            }`}>
            {s.label}
          </button>
        ))}
      </div>

      {section === "palettes" && (
        <>
          {palettes.length === 0 && <EmptyState title="No saved palettes" hint="Save palettes from Inspect or Scan." />}
          <div className="space-y-2">
            {palettes.map((p) => (
              <div key={p.id} className="p-2 rounded bg-card border border-border">
                <div className="flex items-center justify-between mb-2">
                  <div className="min-w-0">
                    <div className="text-xs truncate">{p.name}</div>
                    {p.sourceUrl && <div className="text-[10px] text-fg/30 truncate font-mono">{p.sourceUrl}</div>}
                  </div>
                  <button
                    onClick={async () => {
                      await removePalette(p.id)
                      reload()
                      onToast("Removed")
                    }}
                    className="text-[10px] text-fg/30 hover:text-destructive transition-colors px-2">
                    delete
                  </button>
                </div>
                <div className="flex flex-wrap gap-1">
                  {p.colors.map((c, i) => (
                    <button
                      key={i}
                      onClick={() => copy(c)}
                      title={c}
                      className="w-6 h-6 rounded border border-border/40 hover:scale-110 transition-transform"
                      style={{ background: c }}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {section === "tokens" && (
        <>
          {tokens.length === 0 && <EmptyState title="No saved tokens" hint="Export tokens from the Scan tab." />}
          <div className="space-y-2">
            {tokens.map((t) => (
              <div key={t.id} className="p-2 rounded bg-card border border-border">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="min-w-0">
                    <div className="text-xs truncate">{t.name}</div>
                    <div className="text-[10px] text-fg/30 uppercase tracking-wider">{t.format}</div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => copy(t.payload)}
                      className="text-[10px] text-chart-1 hover:bg-chart-1/10 px-2 py-1 rounded transition-colors">
                      copy
                    </button>
                    <button
                      onClick={async () => {
                        await removeTokenSet(t.id)
                        reload()
                        onToast("Removed")
                      }}
                      className="text-[10px] text-fg/30 hover:text-destructive transition-colors px-2">
                      delete
                    </button>
                  </div>
                </div>
                <pre className="text-[10px] font-mono text-fg/60 max-h-32 overflow-auto bg-bg p-2 rounded whitespace-pre-wrap break-all">
                  {t.payload.slice(0, 1500)}
                  {t.payload.length > 1500 ? "\n…" : ""}
                </pre>
              </div>
            ))}
          </div>
        </>
      )}

      {section === "assets" && (
        <>
          {assets.length === 0 && <EmptyState title="No saved assets" hint="Save assets from the Scan tab." />}
          <div className="space-y-2">
            {assets.map((a) => (
              <div key={a.id} className="p-2 rounded bg-card border border-border flex items-center gap-2">
                <div className="w-10 h-10 rounded bg-bg flex-shrink-0 overflow-hidden flex items-center justify-center">
                  {a.dataUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={a.dataUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-[9px] uppercase tracking-wider text-fg/40">{a.type}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] uppercase tracking-wider text-fg/30">{a.type}</div>
                  <div className="text-[11px] truncate font-mono text-fg/60">{a.url}</div>
                </div>
                <button
                  onClick={async () => {
                    await removeAsset(a.id)
                    reload()
                    onToast("Removed")
                  }}
                  className="text-[10px] text-fg/30 hover:text-destructive transition-colors px-2">
                  delete
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
