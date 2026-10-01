import { ImageResponse } from "next/og"
import { env } from "@/lib/env"
import { BrandMark, fixedBrandMarkColors } from "@/components/BrandMark"

export const runtime = "edge"
export const alt = env.NEXT_PUBLIC_SITE_NAME
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = "image/png"

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "linear-gradient(to bottom right, #ffffff, #f3f4f6)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "48px",
        }}
      >
        <div style={{ display: "flex", width: "120px", height: "120px", marginBottom: "24px" }}>
          <BrandMark colors={fixedBrandMarkColors} size={120} />
        </div>
        <h1
          style={{
            fontSize: "64px",
            fontWeight: "bold",
            color: "#1f2937",
            textAlign: "center",
            marginBottom: "16px",
            lineHeight: 1.2,
          }}
        >
          {env.NEXT_PUBLIC_SITE_NAME}
        </h1>
        <p
          style={{
            fontSize: "32px",
            color: "#4b5563",
            textAlign: "center",
            maxWidth: "800px",
          }}
        >
          {env.NEXT_PUBLIC_SITE_DESCRIPTION}
        </p>
      </div>
    ),
    {
      ...size,
    }
  )
} 