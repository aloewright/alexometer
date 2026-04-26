import { describe, expect, it } from "vitest"

import {
  addAsset,
  addPalette,
  addTokenSet,
  getAll,
  getAssets,
  getPalettes,
  getSettings,
  getTokens,
  removeAsset,
  removePalette,
  removeTokenSet,
  setSettings
} from "../src/storage"
import { DEFAULT_SETTINGS } from "../src/types"

describe("storage defaults", () => {
  it("returns default settings when none stored", async () => {
    expect(await getSettings()).toEqual(DEFAULT_SETTINGS)
  })

  it("returns empty arrays for unset collections", async () => {
    const all = await getAll()
    expect(all.palettes).toEqual([])
    expect(all.tokens).toEqual([])
    expect(all.assets).toEqual([])
  })
})

describe("settings", () => {
  it("round-trips", async () => {
    await setSettings({ ...DEFAULT_SETTINGS, colorFormat: "oklch", contrastTarget: "AAA" })
    const s = await getSettings()
    expect(s.colorFormat).toBe("oklch")
    expect(s.contrastTarget).toBe("AAA")
  })
})

describe("palettes", () => {
  it("adds and removes", async () => {
    await addPalette({ id: "1", name: "p1", colors: ["#000"], createdAt: "now" })
    await addPalette({ id: "2", name: "p2", colors: ["#fff"], createdAt: "now" })
    expect((await getPalettes()).length).toBe(2)
    await removePalette("1")
    const list = await getPalettes()
    expect(list.length).toBe(1)
    expect(list[0].id).toBe("2")
  })
})

describe("tokens", () => {
  it("adds and removes", async () => {
    await addTokenSet({ id: "t1", name: "tw", format: "tailwind", payload: "@theme {}", createdAt: "now" })
    expect((await getTokens()).length).toBe(1)
    await removeTokenSet("t1")
    expect((await getTokens()).length).toBe(0)
  })
})

describe("assets", () => {
  it("adds and removes", async () => {
    await addAsset({ id: "a1", type: "image", url: "https://x/y.png", createdAt: "now" })
    expect((await getAssets()).length).toBe(1)
    await removeAsset("a1")
    expect((await getAssets()).length).toBe(0)
  })
})
