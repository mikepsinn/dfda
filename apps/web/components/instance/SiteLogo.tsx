import { BrandMark } from "@/components/BrandMark"

/**
 * The site's logo. On a company instance: its own logo, or nothing when it
 * has none (its name stands alone). Otherwise the network's mark.
 */
export function SiteLogo({ brand, className }: { brand?: { name: string; logoUrl: string | null } | null; className?: string }) {
  if (brand?.logoUrl) {
    // eslint-disable-next-line @next/next/no-img-element -- the logo is on the company's own host
    return <img src={brand.logoUrl} alt="" aria-hidden="true" className={`${className ?? ""} object-contain`} />
  }
  if (brand) return null
  return <BrandMark className={className} />
}
