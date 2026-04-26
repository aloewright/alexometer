import { describe, expect, it } from "vitest"

import { generateTokens, type TokenInputs } from "../src/utils/tokens"

const inputs: TokenInputs = {
  colors: ["#3b3b3f", "rgb(241, 241, 241)", "#3b3b3f"],
  fonts: [{ family: "Inter, system-ui", sizes: ["14px"], weights: ["400"] }],
  spacing: ["12px", "8px"],
  includeSpacing: true,
  includeFonts: true
}

describe("generateTokens", () => {
  it("dedupes colors by hex", () => {
    const out = generateTokens(inputs, "tailwind")
    const matches = out.match(/--color-\d+:/g) ?? []
    expect(matches.length).toBe(2)
  })

  it("emits a Tailwind v4 @theme block", () => {
    const out = generateTokens(inputs, "tailwind")
    expect(out).toMatch(/^@theme \{/)
    expect(out).toContain("--color-1: #3b3b3f")
    expect(out).toContain("--font-")
    expect(out).toContain("--spacing-1: 12px")
    expect(out.trimEnd()).toMatch(/\}$/)
  })

  it("emits CSS :root block", () => {
    const out = generateTokens(inputs, "css")
    expect(out).toMatch(/^:root \{/)
    expect(out).toContain("--color-1:")
  })

  it("emits valid JSON", () => {
    const out = generateTokens(inputs, "json")
    const parsed = JSON.parse(out)
    expect(parsed.colors["color-1"].value).toBe("#3b3b3f")
    expect(Array.isArray(parsed.fonts)).toBe(true)
    expect(Array.isArray(parsed.spacing)).toBe(true)
  })

  it("respects includeSpacing/includeFonts flags", () => {
    const minimal = generateTokens({ ...inputs, includeFonts: false, includeSpacing: false }, "tailwind")
    expect(minimal).not.toContain("--font-")
    expect(minimal).not.toContain("--spacing-")
  })
})
