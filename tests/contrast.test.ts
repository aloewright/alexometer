import { describe, expect, it } from "vitest"

import { contrastRatio, evaluateContrast, evaluateContrastFromStrings } from "../src/utils/contrast"

const black = { r: 0, g: 0, b: 0, a: 1 }
const white = { r: 255, g: 255, b: 255, a: 1 }
const mid = { r: 119, g: 119, b: 119, a: 1 }

describe("contrastRatio", () => {
  it("white-on-black is 21", () => {
    expect(contrastRatio(white, black)).toBeCloseTo(21, 0)
  })

  it("same color is 1", () => {
    expect(contrastRatio(white, white)).toBeCloseTo(1, 2)
  })

  it("symmetric", () => {
    expect(contrastRatio(white, black)).toBeCloseTo(contrastRatio(black, white), 5)
  })
})

describe("evaluateContrast", () => {
  it("white-on-black passes everything", () => {
    const r = evaluateContrast(white, black)
    expect(r.AAlarge).toBe(true)
    expect(r.AAnormal).toBe(true)
    expect(r.AAAlarge).toBe(true)
    expect(r.AAAnormal).toBe(true)
  })

  it("mid-grey on white fails AA normal", () => {
    const r = evaluateContrast(mid, white)
    expect(r.AAnormal).toBe(false)
  })

  it("AAA normal threshold is 7", () => {
    const dark = { r: 90, g: 90, b: 90, a: 1 }
    const r = evaluateContrast(dark, white)
    expect(r.AAAnormal).toBe(r.ratio >= 7)
  })
})

describe("evaluateContrastFromStrings", () => {
  it("accepts hex strings", () => {
    const r = evaluateContrastFromStrings("#ffffff", "#000000")
    expect(r?.AAnormal).toBe(true)
  })

  it("returns null on invalid input", () => {
    expect(evaluateContrastFromStrings("garbage", "#000")).toBeNull()
  })
})
