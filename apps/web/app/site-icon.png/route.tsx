import { NextResponse } from "next/server"
import { ImageResponse } from "next/og"
import { resolveInstance } from "@/lib/instance/resolve"
import { CORNER_RADII, isDark } from "@/lib/instance/theme"

// The browser icon of a company's site without a logo: its first letter on
// its brand color. A tab needs an icon; without one, browsers show the host's
// /favicon.ico. The network's own icons are public/icon.svg and public/apple-icon.png.
export async function GET(request: Request) {
  const instance = await resolveInstance()
  if (!instance) return NextResponse.redirect(new URL("/apple-icon.png", request.url))
  const radius = CORNER_RADII[instance.cornerRadius].value === "0rem" ? "0px" : "36px"
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: instance.primaryColor,
          color: isDark(instance.primaryColor) ? "#ffffff" : "#171717",
          borderRadius: radius,
          fontSize: "120px",
          fontWeight: "bold",
        }}
      >
        {instance.name.trim().charAt(0).toUpperCase()}
      </div>
    ),
    { width: 180, height: 180, headers: { "Cache-Control": "public, max-age=3600" } },
  )
}
