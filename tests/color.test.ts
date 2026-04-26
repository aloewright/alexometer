import { describe, expect, it } from "vitest"

import { formatColor, parseColor, toHex, toHsl, toOklch, toRgb } from "../src/utils/color"

describe("parseColor", () => {
  it("parses 6-digit hex", () => {
    expect(parseColor("#3b3b3f")).toEqual({ r: 0x3b, g: 0x3b, b: 0x3f, a: 1 })
  })

  it("parses 3-digit hex", () => {
    expect(parseColor("#abc")).toEqual({ r: 0xaa, g: 0xbb, b: 0xcc, a: 1 })
  })

  it("parses 8-digit hex with alpha", () => {
    const c = parseColor("#3b3b3f80")!
    expect(c.r).toBe(0x3b)
    expect(c.a).toBeCloseTo(0x80 / 255, 3)
  })

  it("parses rgb()", () => {
    expect(parseColor("rgb(59, 59, 63)")).toEqual({ r: 59, g: 59, b: 63, a: 1 })
  })

  it("parses rgba()", () => {
    const c = parseColor("rgba(59, 59, 63, 0.5)")!
    expect(c.a).toBe(0.5)
  })

  it("parses hsl()", () => {
    const c = parseColor("hsl(240, 4%, 24%)")!
    expect(c.r).toBeGreaterThan(0)
    expect(c.b).toBeGreaterThan(c.r)
  })

  it("parses named colors", () => {
    expect(parseColor("white")).toEqual({ r: 255, g: 255, b: 255, a: 1 })
    expect(parseColor("black")).toEqual({ r: 0, g: 0, b: 0, a: 1 })
  })

  it("parses transparent", () => {
    expect(parseColor("transparent")).toEqual({ r: 0, g: 0, b: 0, a: 0 })
  })

  it("returns null for garbage", () => {
    expect(parseColor("not-a-color")).toBeNull()
    expect(parseColor("")).toBeNull()
  })
})

describe("formatColor", () => {
  const c = { r: 0x3b, g: 0x3b, b: 0x3f, a: 1 }

  it("formats hex", () => {
    expect(toHex(c)).toBe("#3b3b3f")
    expect(formatColor(c, "hex")).toBe("#3b3b3f")
  })

  it("formats rgb", () => {
    expect(toRgb(c)).toBe("rgb(59, 59, 63)")
  })

  it("formats hsl", () => {
    expect(toHsl(c)).toMatch(/^hsl\(/)
  })

  it("formats oklch", () => {
    expect(toOklch(c)).toMatch(/^oklch\(/)
  })

  it("emits alpha for non-1 alpha in all formats", () => {
    const a = { r: 100, g: 100, b: 100, a: 0.5 }
    expect(toHex(a)).toMatch(/^#[0-9a-f]{8}$/)
    expect(toRgb(a)).toContain("rgba")
    expect(toHsl(a)).toContain("hsla")
    expect(toOklch(a)).toContain("/")
  })
})

describe("OKLCH conversion", () => {
  it("white maps to ~100% L", () => {
    const out = toOklch({ r: 255, g: 255, b: 255, a: 1 })
    expect(out).toMatch(/^oklch\(100/)
  })

  it("black maps to 0% L", () => {
    const out = toOklch({ r: 0, g: 0, b: 0, a: 1 })
    expect(out).toMatch(/^oklch\(0/)
  })

  it("pure red has expected hue range", () => {
    const out = toOklch({ r: 255, g: 0, b: 0, a: 1 })
    const hueMatch = out.match(/oklch\([\d.]+%\s+[\d.]+\s+([\d.]+)/)
    expect(hueMatch).not.toBeNull()
    const hue = parseFloat(hueMatch![1])
    expect(hue).toBeGreaterThan(20)
    expect(hue).toBeLessThan(40)
  })
})
