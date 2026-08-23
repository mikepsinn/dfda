import {
  getPublicStudies,
  getPublicVariable,
  getPublicVariableCategories,
  getPublicVariables,
  isDiscoverablePublicVariable,
  toVariableListItem,
} from "@/lib/dfda/public-data"

const fetchMock = jest.fn()

function jsonResponse(body: unknown, status = 200) {
  return {
    json: async () => body,
    ok: status >= 200 && status < 300,
    status,
  } as Response
}

describe("public DFDA data client", () => {
  beforeEach(() => {
    fetchMock.mockReset()
    global.fetch = fetchMock
  })

  it("uses the canonical app host and creates readable variable slugs", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse([
        {
          id: 1398,
          name: "Overall Mood",
          numberOfAggregateCorrelationsAsCause: 2,
          numberOfAggregateCorrelationsAsEffect: 3,
          variableCategoryName: "Emotions",
        },
      ])
    )

    const [variable] = await getPublicVariables({ concise: true, limit: 1 })
    const requestUrl = new URL(String(fetchMock.mock.calls[0][0]))

    expect(requestUrl.origin).toBe("https://app.dfda.earth")
    expect(requestUrl.searchParams.get("concise")).toBe("true")
    expect(toVariableListItem(variable)).toMatchObject({
      name: "Overall Mood",
      slug: "Overall_Mood",
      variable_categories: { name: "Emotions" },
    })
  })

  it("removes private and boring categories before sorting them", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse([
        { id: 1, name: "Private", isPublic: false, numberOfVariables: 100 },
        { id: 2, name: "Boring", boring: true, numberOfVariables: 90 },
        { id: 3, name: "Symptoms", isPublic: true, numberOfVariables: 10 },
        { id: 4, name: "Treatments", isPublic: true, numberOfVariables: 20 },
      ])
    )

    const categories = await getPublicVariableCategories()

    expect(categories.map((category) => category.name)).toEqual([
      "Treatments",
      "Symptoms",
    ])
  })

  it("returns population studies from the API response", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({
        success: true,
        studies: [
          {
            id: "cause-1-effect-2-population-study",
            causeVariable: { id: 1, name: "Sleep" },
            effectVariable: { id: 2, name: "Mood" },
            statistics: { forwardPearsonCorrelationCoefficient: 0.4 },
          },
        ],
      })
    )

    const studies = await getPublicStudies({ causeVariableId: 1, limit: 1 })
    const requestUrl = new URL(String(fetchMock.mock.calls[0][0]))

    expect(studies[0].id).toBe("cause-1-effect-2-population-study")
    expect(requestUrl.searchParams.get("causeVariableId")).toBe("1")
    expect(requestUrl.searchParams.get("aggregated")).toBe("true")
  })

  it("resolves canonical slugs when punctuation cannot be reversed", async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse([]))
      .mockResolvedValueOnce(
        jsonResponse([
          {
            id: 5555931,
            name: "4:0 Saturated Fatty Acids",
            url: "https://app.dfda.earth/variables/4-0_Saturated_Fatty_Acids",
          },
        ])
      )

    const variable = await getPublicVariable("4-0_Saturated_Fatty_Acids")
    const fallbackUrl = new URL(String(fetchMock.mock.calls[1][0]))

    expect(variable?.id).toBe(5555931)
    expect(fallbackUrl.searchParams.get("name")).toBe("%Saturate%")
  })

  it("preserves the legacy discovery thresholds", () => {
    expect(
      isDiscoverablePublicVariable({
        id: 1,
        name: "High signal",
        numberOfAggregateCorrelationsAsCause: 1,
        numberOfMeasurements: 6,
        numberOfUserVariables: 3,
      })
    ).toBe(true)
    expect(
      isDiscoverablePublicVariable({
        id: 2,
        name: "Low signal",
        numberOfAggregateCorrelationsAsCause: 0,
        numberOfMeasurements: 6,
        numberOfUserVariables: 3,
      })
    ).toBe(false)
  })

  it("rejects failed API responses", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({}, 503))

    await expect(getPublicVariables()).rejects.toThrow(
      "DFDA API request failed with status 503"
    )
  })
})
