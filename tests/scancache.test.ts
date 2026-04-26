import { describe, expect, it } from "vitest"

import { clearScanCache, getCachedScan, scanCacheKey, setCachedScan } from "../src/storage"
import type { ScanResult } from "../src/types"

const result = (url: string): ScanResult => ({
  url,
  title: "t",
  scannedAt: new Date().toISOString(),
  colors: [],
  fonts: [],
  spacing: [],
  assets: []
})

describe("scan cache", () => {
  it("strips fragment from cache key", () => {
    expect(scanCacheKey("https://x.com/a#hash")).toBe("https://x.com/a")
    expect(scanCacheKey("https://x.com/a?q=1")).toBe("https://x.com/a?q=1")
  })

  it("round-trips a scan by URL", async () => {
    await setCachedScan(result("https://x.com/a"))
    const got = await getCachedScan("https://x.com/a")
    expect(got?.result.url).toBe("https://x.com/a")
  })

  it("ignores fragment differences", async () => {
    await setCachedScan(result("https://x.com/a"))
    const got = await getCachedScan("https://x.com/a#section")
    expect(got).not.toBeNull()
  })

  it("returns null for missing URL", async () => {
    expect(await getCachedScan("https://nope.com")).toBeNull()
  })

  it("clears all entries", async () => {
    await setCachedScan(result("https://x.com/a"))
    await setCachedScan(result("https://y.com/b"))
    await clearScanCache()
    expect(await getCachedScan("https://x.com/a")).toBeNull()
    expect(await getCachedScan("https://y.com/b")).toBeNull()
  })
})
