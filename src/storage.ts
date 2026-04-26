import { Storage } from "@plasmohq/storage"

import {
  DEFAULT_SETTINGS,
  DEFAULT_STORAGE,
  type CachedScan,
  type SavedAsset,
  type SavedPalette,
  type SavedTokenSet,
  type ScanResult,
  type Settings,
  type StorageSchema
} from "./types"

const SCAN_CACHE_LIMIT = 50

const storage = new Storage({ area: "local" })

export async function getAll(): Promise<StorageSchema> {
  const [palettes, tokens, assets, settings, scanCache] = await Promise.all([
    storage.get<SavedPalette[]>("palettes"),
    storage.get<SavedTokenSet[]>("tokens"),
    storage.get<SavedAsset[]>("assets"),
    storage.get<Settings>("settings"),
    storage.get<Record<string, CachedScan>>("scanCache")
  ])
  return {
    palettes: palettes ?? DEFAULT_STORAGE.palettes,
    tokens: tokens ?? DEFAULT_STORAGE.tokens,
    assets: assets ?? DEFAULT_STORAGE.assets,
    settings: settings ?? DEFAULT_STORAGE.settings,
    scanCache: scanCache ?? DEFAULT_STORAGE.scanCache
  }
}

export async function getSettings(): Promise<Settings> {
  return (await storage.get<Settings>("settings")) ?? DEFAULT_SETTINGS
}

export async function setSettings(settings: Settings): Promise<void> {
  await storage.set("settings", settings)
}

export async function getPalettes(): Promise<SavedPalette[]> {
  return (await storage.get<SavedPalette[]>("palettes")) ?? []
}

export async function setPalettes(palettes: SavedPalette[]): Promise<void> {
  await storage.set("palettes", palettes)
}

export async function addPalette(palette: SavedPalette): Promise<void> {
  const list = await getPalettes()
  await setPalettes([palette, ...list])
}

export async function removePalette(id: string): Promise<void> {
  const list = await getPalettes()
  await setPalettes(list.filter((p) => p.id !== id))
}

export async function getTokens(): Promise<SavedTokenSet[]> {
  return (await storage.get<SavedTokenSet[]>("tokens")) ?? []
}

export async function setTokens(tokens: SavedTokenSet[]): Promise<void> {
  await storage.set("tokens", tokens)
}

export async function addTokenSet(set: SavedTokenSet): Promise<void> {
  const list = await getTokens()
  await setTokens([set, ...list])
}

export async function removeTokenSet(id: string): Promise<void> {
  const list = await getTokens()
  await setTokens(list.filter((t) => t.id !== id))
}

export async function getAssets(): Promise<SavedAsset[]> {
  return (await storage.get<SavedAsset[]>("assets")) ?? []
}

export async function setAssets(assets: SavedAsset[]): Promise<void> {
  await storage.set("assets", assets)
}

export async function addAsset(asset: SavedAsset): Promise<void> {
  const list = await getAssets()
  await setAssets([asset, ...list])
}

export async function removeAsset(id: string): Promise<void> {
  const list = await getAssets()
  await setAssets(list.filter((a) => a.id !== id))
}

export function scanCacheKey(url: string): string {
  return url.split("#")[0]
}

export async function getCachedScan(url: string): Promise<CachedScan | null> {
  const cache = (await storage.get<Record<string, CachedScan>>("scanCache")) ?? {}
  return cache[scanCacheKey(url)] ?? null
}

export async function setCachedScan(result: ScanResult): Promise<void> {
  const cache = (await storage.get<Record<string, CachedScan>>("scanCache")) ?? {}
  const key = scanCacheKey(result.url)
  cache[key] = { url: key, result, cachedAt: new Date().toISOString() }

  const entries = Object.values(cache)
  if (entries.length > SCAN_CACHE_LIMIT) {
    entries.sort((a, b) => (a.cachedAt < b.cachedAt ? -1 : 1))
    const overflow = entries.length - SCAN_CACHE_LIMIT
    for (let i = 0; i < overflow; i++) {
      delete cache[entries[i].url]
    }
  }

  await storage.set("scanCache", cache)
}

export async function clearScanCache(): Promise<void> {
  await storage.set("scanCache", {})
}

export { storage }
