export type TabId = "inspect" | "scan" | "library" | "settings"

interface Props {
  value: TabId
  onChange: (id: TabId) => void
}

const TABS: { id: TabId; label: string }[] = [
  { id: "inspect", label: "Inspect" },
  { id: "scan", label: "Scan" },
  { id: "library", label: "Library" },
  { id: "settings", label: "Settings" }
]

export function TabBar({ value, onChange }: Props) {
  return (
    <nav className="flex border-b border-border">
      {TABS.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className={`flex-1 text-xs py-2 transition-colors ${
            value === t.id
              ? "text-fg border-b-2 border-chart-1 -mb-[1px]"
              : "text-fg/40 hover:text-fg/70"
          }`}>
          {t.label}
        </button>
      ))}
    </nav>
  )
}
