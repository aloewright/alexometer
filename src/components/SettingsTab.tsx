import type { ColorFormat, Settings, TokenFormat } from "../types"
import { ColorFormatToggle } from "./ColorFormatToggle"

interface Props {
  settings: Settings
  onChange: (next: Partial<Settings>) => void
}

const TOKEN_FORMATS: TokenFormat[] = ["tailwind", "css", "json"]
const TARGETS: ("AA" | "AAA")[] = ["AA", "AAA"]

export function SettingsTab({ settings, onChange }: Props) {
  return (
    <div className="p-3 space-y-4">
      <Card title="Default color format" hint="Used in Inspect and Scan tabs.">
        <ColorFormatToggle
          value={settings.colorFormat}
          onChange={(f: ColorFormat) => onChange({ colorFormat: f })}
        />
      </Card>

      <Card title="WCAG contrast target">
        <div className="inline-flex bg-card border border-border rounded overflow-hidden">
          {TARGETS.map((t) => (
            <button
              key={t}
              onClick={() => onChange({ contrastTarget: t })}
              className={`text-[11px] px-3 py-1 transition-colors ${
                settings.contrastTarget === t ? "bg-accent text-fg" : "text-fg/40 hover:text-fg/70"
              }`}>
              {t}
            </button>
          ))}
        </div>
      </Card>

      <Card title="Token export defaults">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-fg/50 w-20">Format</span>
            <div className="inline-flex bg-card border border-border rounded overflow-hidden">
              {TOKEN_FORMATS.map((f) => (
                <button
                  key={f}
                  onClick={() => onChange({ exportDefaults: { ...settings.exportDefaults, tokenFormat: f } })}
                  className={`text-[10px] uppercase tracking-wider px-2 py-1 transition-colors ${
                    settings.exportDefaults.tokenFormat === f ? "bg-accent text-fg" : "text-fg/40 hover:text-fg/70"
                  }`}>
                  {f}
                </button>
              ))}
            </div>
          </div>
          <Toggle
            label="Include fonts"
            checked={settings.exportDefaults.includeFonts}
            onChange={(v) => onChange({ exportDefaults: { ...settings.exportDefaults, includeFonts: v } })}
          />
          <Toggle
            label="Include spacing"
            checked={settings.exportDefaults.includeSpacing}
            onChange={(v) => onChange({ exportDefaults: { ...settings.exportDefaults, includeSpacing: v } })}
          />
        </div>
      </Card>

      <Card title="Keyboard shortcut">
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-fg/50">Toggle side panel</span>
          <kbd className="text-[10px] px-2 py-0.5 rounded bg-bg border border-border text-fg/50 font-mono">
            Alt+Shift+A
          </kbd>
        </div>
        <p className="text-[10px] text-fg/30 mt-1">Customize at chrome://extensions/shortcuts</p>
      </Card>

      <Card title="About">
        <p className="text-[11px] text-fg/40">Alexometer v0.1.0</p>
        <p className="text-[11px] text-fg/40 mt-1">Inspect any website's design.</p>
      </Card>
    </div>
  )
}

function Card({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="p-3 rounded-lg bg-card border border-border">
      <h3 className="text-xs font-medium mb-1">{title}</h3>
      {hint && <p className="text-[10px] text-fg/30 mb-2">{hint}</p>}
      {children}
    </div>
  )
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center justify-between cursor-pointer">
      <span className="text-[11px] text-fg/60">{label}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="accent-chart-1"
      />
    </label>
  )
}
