import { useEffect, useState } from "react"

import "./style.css"

import { InspectTab } from "./components/InspectTab"
import { LibraryTab } from "./components/LibraryTab"
import { ScanTab } from "./components/ScanTab"
import { SettingsTab } from "./components/SettingsTab"
import { TabBar, type TabId } from "./components/TabBar"
import { Toast } from "./components/Toast"
import { getSettings, setSettings as saveSettings } from "./storage"
import { DEFAULT_SETTINGS, type Settings } from "./types"

function SidePanel() {
  const [tab, setTab] = useState<TabId>("inspect")
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS)
  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => {
    getSettings().then(setSettings)
  }, [])

  const updateSettings = async (next: Partial<Settings>) => {
    const merged = { ...settings, ...next }
    setSettings(merged)
    await saveSettings(merged)
  }

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 1800)
  }

  return (
    <div className="h-full bg-bg text-fg font-sans flex flex-col relative overflow-hidden">
      <header className="px-3 py-2 border-b border-border flex items-center gap-2">
        <span className="text-sm font-semibold tracking-tight">Alexometer</span>
        <span className="text-[10px] text-fg/30">v0.1.0</span>
      </header>
      <TabBar value={tab} onChange={setTab} />
      <main className="flex-1 overflow-y-auto">
        {tab === "inspect" && <InspectTab settings={settings} onToast={showToast} />}
        {tab === "scan" && <ScanTab settings={settings} onToast={showToast} />}
        {tab === "library" && <LibraryTab onToast={showToast} />}
        {tab === "settings" && <SettingsTab settings={settings} onChange={updateSettings} />}
      </main>
      <Toast message={toast} />
    </div>
  )
}

export default SidePanel
