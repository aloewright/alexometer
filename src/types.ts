export type ColorFormat = "hex" | "rgb" | "hsl" | "oklch"

export interface RGBA {
  r: number
  g: number
  b: number
  a: number
}

export interface BoxModel {
  margin: { top: number; right: number; bottom: number; left: number }
  border: { top: number; right: number; bottom: number; left: number }
  padding: { top: number; right: number; bottom: number; left: number }
  width: number
  height: number
}

export interface ElementSnapshot {
  tagName: string
  selector: string
  rect: { x: number; y: number; width: number; height: number }
  box: BoxModel
  computed: Record<string, string>
  colors: { kind: "color" | "background" | "border"; value: string }[]
  font: {
    family: string
    size: string
    weight: string
    lineHeight: string
    letterSpacing: string
    style: string
  }
  text?: string
  outerHTML: string
}

export interface ScanResult {
  url: string
  title: string
  scannedAt: string
  colors: { value: string; count: number }[]
  fonts: { family: string; sizes: string[]; weights: string[]; count: number }[]
  spacing: { value: string; count: number }[]
  assets: ScannedAsset[]
}

export interface ScannedAsset {
  type: "image" | "svg" | "lottie" | "video"
  url: string
  inlineSvg?: string
  alt?: string
  width?: number
  height?: number
}

export interface SavedPalette {
  id: string
  name: string
  colors: string[]
  sourceUrl?: string
  createdAt: string
}

export type TokenFormat = "tailwind" | "css" | "json"

export interface SavedTokenSet {
  id: string
  name: string
  format: TokenFormat
  payload: string
  createdAt: string
  sourceUrl?: string
}

export interface SavedAsset {
  id: string
  type: ScannedAsset["type"]
  url: string
  dataUrl?: string
  inlineSvg?: string
  sourceUrl?: string
  createdAt: string
}

export interface Settings {
  colorFormat: ColorFormat
  contrastTarget: "AA" | "AAA"
  exportDefaults: {
    tokenFormat: TokenFormat
    includeSpacing: boolean
    includeFonts: boolean
  }
}

export interface StorageSchema {
  palettes: SavedPalette[]
  tokens: SavedTokenSet[]
  assets: SavedAsset[]
  settings: Settings
}

export const DEFAULT_SETTINGS: Settings = {
  colorFormat: "hex",
  contrastTarget: "AA",
  exportDefaults: {
    tokenFormat: "tailwind",
    includeSpacing: true,
    includeFonts: true
  }
}

export const DEFAULT_STORAGE: StorageSchema = {
  palettes: [],
  tokens: [],
  assets: [],
  settings: DEFAULT_SETTINGS
}

export type Message =
  | { type: "inspector:start" }
  | { type: "inspector:stop" }
  | { type: "inspector:hover"; payload: ElementSnapshot }
  | { type: "inspector:pick"; payload: ElementSnapshot }
  | { type: "scan:run" }
  | { type: "scan:result"; payload: ScanResult }
  | { type: "asset:fetch"; url: string }
  | { type: "asset:fetched"; url: string; dataUrl: string | null }
