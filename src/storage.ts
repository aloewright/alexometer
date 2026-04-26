import { Storage } from "@plasmohq/storage"

import {
  DEFAULT_SETTINGS,
  DEFAULT_STORAGE,
  type SavedAsset,
  type SavedPalette,
  type SavedTokenSet,
  type Settings,
  type StorageSchema
} from "./types"

const storage = new Storage({ area: "local" })

export async function getAll(): Promise<StorageSchema> {
  const [palettes, tokens, assets, settings] = await Promise.all([
    storage.get<SavedPalette[]>("palettes"),
    storage.get<SavedTokenSet[]>("tokens"),
    storage.get<SavedAsset[]>("assets"),
    storage.get<Settings>("settings")
  ])
  return {
    palettes: palettes ?? DEFAULT_STORAGE.palettes,
    tokens: tokens ?? DEFAULT_STORAGE.tokens,
    assets: assets ?? DEFAULT_STORAGE.assets,
    settings: settings ?? DEFAULT_STORAGE.settings
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

export { storage }
