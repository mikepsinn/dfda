import { getEmbeddableVariableUrl } from "@/lib/dfda/variable-page-url"

describe("getEmbeddableVariableUrl", () => {
  it("reuses the canonical variable path returned by the API", () => {
    expect(
      getEmbeddableVariableUrl({
        name: "Overall Mood",
        url: "https://app.dfda.earth/variables/Overall_Mood",
      })
    ).toBe("https://studies.dfda.earth/variables/Overall_Mood")
  })

  it("preserves canonical variable paths containing slashes", () => {
    expect(
      getEmbeddableVariableUrl({
        name: "Nervousness / Anxiety",
        url: "https://app.dfda.earth/variables/Nervousness_/_Anxiety",
      })
    ).toBe("https://studies.dfda.earth/variables/Nervousness_/_Anxiety")
  })

  it.each([undefined, "not a URL", "https://example.com/not-a-variable"])(
    "falls back to a name slug when the API URL is %s",
    (url) => {
      expect(getEmbeddableVariableUrl({ name: "Overall Mood", url })).toBe(
        "https://studies.dfda.earth/variables/Overall_Mood"
      )
    }
  )

  it("encodes unsafe characters in fallback slugs", () => {
    expect(getEmbeddableVariableUrl({ name: "Pain # / Sleep?" })).toBe(
      "https://studies.dfda.earth/variables/Pain_%23_/_Sleep_"
    )
  })
})
