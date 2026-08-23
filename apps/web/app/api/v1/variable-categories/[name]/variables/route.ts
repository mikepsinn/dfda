import { NextResponse } from "next/server"

import { decodeRouteParam } from "@/lib/decode-route-param"
import {
  getPublicVariableCategories,
  getPublicVariables,
  isDiscoverablePublicVariable,
  toVariableCategoryListItem,
  toVariableListItem,
} from "@/lib/dfda/public-data"
import { nameToSlug, slugToName } from "@/lib/slugs"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(
  request: Request,
  { params }: { params: { name: string } }
) {
  const categoryKey = decodeRouteParam(params.name)
  if (categoryKey === null) {
    return NextResponse.json(
      { error: "Invalid category name encoding" },
      { status: 400 }
    )
  }

  try {
    const categoryName = slugToName(categoryKey)
    const categoryId = /^\d+$/.test(categoryKey)
      ? Number.parseInt(categoryKey, 10)
      : null
    const categories = await getPublicVariableCategories()
    const category = categories.find((candidate) =>
      categoryId === null
        ? candidate.name === categoryName ||
          nameToSlug(candidate.name) === categoryKey
        : candidate.id === categoryId
    )

    if (!category) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 })
    }

    const variables = (
      await getPublicVariables({
        categoryName: category.name,
        concise: true,
        limit: 200,
      })
    ).filter(isDiscoverablePublicVariable)

    return NextResponse.json({
      category: toVariableCategoryListItem(category),
      variables: variables.map(toVariableListItem),
    })
  } catch (error) {
    console.error("Error fetching category variables from the DFDA API:", error)
    return NextResponse.json(
      { error: "Failed to fetch variables" },
      { status: 502 }
    )
  }
}
