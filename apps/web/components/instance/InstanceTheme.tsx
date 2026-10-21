import { themeCss, type InstanceTheme as Theme } from "@/lib/instance/theme"

// Sets the theme of a company instance: its brand color, page colors, font and
// corner radius (lib/instance/theme.ts). The values are validated hex colors and
// names from fixed lists (lib/instance/config.ts and the instances table).
export function InstanceTheme({ theme }: { theme: Theme }) {
  return <style dangerouslySetInnerHTML={{ __html: themeCss(theme) }} />
}
