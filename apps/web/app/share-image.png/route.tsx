import { ImageResponse } from "next/og"
import { BrandMark, fixedBrandMarkColors } from "@/components/BrandMark"
import { env } from "@/lib/env"
import { resolveInstance } from "@/lib/instance/resolve"
import { isDark } from "@/lib/instance/theme"

// The image that link previews show (Open Graph and Twitter cards, set in
// app/layout.tsx). On a company's site it shows the company: its name, tagline
// and colors. Not its logo: the server would fetch the address that the owner
// typed, which could point at a service inside our own network.

const size = { width: 1200, height: 630 }
// Branding can change, so previews may keep an image for an hour, not for a year.
const headers = { "Cache-Control": "public, max-age=3600" }

export async function GET() {
  const instance = await resolveInstance()
  if (instance) {
    const text = isDark(instance.backgroundColor) ? "#ffffff" : "#171717"
    return new ImageResponse(
      (
        <div
          style={{
            background: instance.backgroundColor,
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            padding: "80px",
            borderTop: `24px solid ${instance.primaryColor}`,
          }}
        >
          <div style={{ display: "flex", fontSize: "72px", fontWeight: "bold", color: text, lineHeight: 1.1 }}>{instance.name}</div>
          {instance.tagline && (
            <div style={{ display: "flex", fontSize: "36px", color: text, opacity: 0.75, marginTop: "24px", maxWidth: "1000px" }}>
              {instance.tagline}
            </div>
          )}
        </div>
      ),
      { ...size, headers },
    )
  }

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
        <h1 style={{ fontSize: "64px", fontWeight: "bold", color: "#1f2937", textAlign: "center", marginBottom: "16px", lineHeight: 1.2 }}>
          {env.NEXT_PUBLIC_SITE_NAME}
        </h1>
        <p style={{ fontSize: "32px", color: "#4b5563", textAlign: "center", maxWidth: "800px" }}>{env.NEXT_PUBLIC_SITE_DESCRIPTION}</p>
      </div>
    ),
    { ...size, headers },
  )
}
