import { BrandMark } from "@/components/BrandMark"

/**
 * The site's logo. On a company instance: its own logo, or without one its
 * first letter on the brand color. Otherwise the network's mark.
 */
export function SiteLogo({ brand, className }: { brand?: { name: string; logoUrl: string | null } | null; className?: string }) {
  if (brand?.logoUrl) {
    // eslint-disable-next-line @next/next/no-img-element -- the logo is on the company's own host
    return <img src={brand.logoUrl} alt="" aria-hidden="true" className={`${className ?? ""} object-contain`} />
  }
  if (brand) {
    return (
      <span
        aria-hidden="true"
        className={`${className ?? ""} items-center justify-center rounded-md bg-primary font-bold text-primary-foreground`}
      >
        {brand.name.trim().charAt(0).toUpperCase()}
      </span>
    )
  }
  return <BrandMark className={className} />
}
