import { describe, expect, it } from "vitest"

import type { ElementSnapshot } from "../src/types"
import { generateCss, generateHtml, generateTailwind } from "../src/utils/codegen"

function snapshot(overrides: Partial<ElementSnapshot["computed"]> = {}, html = "<div></div>"): ElementSnapshot {
  return {
    tagName: "DIV",
    selector: "div.example",
    rect: { x: 0, y: 0, width: 100, height: 50 },
    box: {
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
      border: { top: 0, right: 0, bottom: 0, left: 0 },
      padding: { top: 0, right: 0, bottom: 0, left: 0 },
      width: 100,
      height: 50
    },
    computed: {
      "padding-top": "0px",
      "padding-right": "0px",
      "padding-bottom": "0px",
      "padding-left": "0px",
      "margin-top": "0px",
      "margin-right": "0px",
      "margin-bottom": "0px",
      "margin-left": "0px",
      ...overrides
    },
    colors: [],
    font: { family: "", size: "", weight: "", lineHeight: "", letterSpacing: "", style: "" },
    outerHTML: html
  }
}

describe("generateHtml", () => {
  it("strips alexometer attributes", () => {
    const snap = snapshot({}, '<div data-alexometer="1" class="x">hi</div>')
    expect(generateHtml(snap)).toBe('<div class="x">hi</div>')
  })
})

describe("generateCss", () => {
  it("emits non-default properties only", () => {
    const css = generateCss(
      snapshot({
        "padding-top": "12px",
        color: "rgb(255, 0, 0)",
        display: "flex"
      })
    )
    expect(css).toContain("padding-top: 12px;")
    expect(css).toContain("color: rgb(255, 0, 0);")
    expect(css).toContain("display: flex;")
    expect(css).not.toContain("padding-bottom: 0px")
  })
})

describe("generateTailwind", () => {
  it("maps display:flex", () => {
    const cls = generateTailwind(snapshot({ display: "flex", "flex-direction": "column" }))
    expect(cls).toContain("flex")
    expect(cls).toContain("flex-col")
  })

  it("maps padding shorthand when uniform", () => {
    const cls = generateTailwind(
      snapshot({
        "padding-top": "12px",
        "padding-right": "12px",
        "padding-bottom": "12px",
        "padding-left": "12px"
      })
    )
    expect(cls).toContain("p-[12px]")
  })

  it("maps padding axis when symmetric", () => {
    const cls = generateTailwind(
      snapshot({
        "padding-top": "8px",
        "padding-right": "16px",
        "padding-bottom": "8px",
        "padding-left": "16px"
      })
    )
    expect(cls).toContain("py-[8px]")
    expect(cls).toContain("px-[16px]")
  })

  it("maps colors to arbitrary hex", () => {
    const cls = generateTailwind(
      snapshot({
        color: "rgb(255, 0, 0)",
        "background-color": "rgb(0, 0, 255)"
      })
    )
    expect(cls).toContain("text-[#ff0000]")
    expect(cls).toContain("bg-[#0000ff]")
  })

  it("maps font weight to utilities", () => {
    const cls = generateTailwind(snapshot({ "font-weight": "700" }))
    expect(cls).toContain("font-bold")
  })

  it("maps justify-content + align-items", () => {
    const cls = generateTailwind(
      snapshot({ display: "flex", "justify-content": "center", "align-items": "center" })
    )
    expect(cls).toContain("justify-center")
    expect(cls).toContain("items-center")
  })
})
