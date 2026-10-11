import { brandTheme } from "@/lib/instance/config"

// Sets the theme's primary color to a company instance's brand color, in light
// and dark mode. The color is a validated hex value (lib/instance/config).
export function InstanceTheme({ primaryColor }: { primaryColor: string }) {
  const { primary, primaryForeground } = brandTheme(primaryColor)
  const css = `:root,:root.dark,.dark{--primary:${primary};--primary-foreground:${primaryForeground};--ring:${primary}}`
  return <style dangerouslySetInnerHTML={{ __html: css }} />
}
