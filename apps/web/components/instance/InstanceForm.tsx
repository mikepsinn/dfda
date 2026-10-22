"use client"

import { useActionState, useState } from "react"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { InstanceFormState } from "@/lib/actions/instances"
import { slugFromName, type InstanceBranding } from "@/lib/instance/config"
import {
  CORNER_RADII,
  FONTS,
  bestTextContrast,
  contrastRatio,
  isDark,
  themeVariables,
  type CornerRadius,
  type InstanceFont,
} from "@/lib/instance/theme"

type Values = {
  name: string
  slug: string
  tagline: string
  logoUrl: string
  primaryColor: string
  backgroundColor: string
  font: InstanceFont
  cornerRadius: CornerRadius
  products: string
  customDomain: string
  supportEmail: string
}

function toValues(instance?: InstanceBranding | null): Values {
  return {
    name: instance?.name ?? "",
    slug: instance?.slug ?? "",
    tagline: instance?.tagline ?? "",
    logoUrl: instance?.logoUrl ?? "",
    primaryColor: instance?.primaryColor ?? "#6d4df6",
    backgroundColor: instance?.backgroundColor ?? "#ffffff",
    font: instance?.font ?? "inter",
    cornerRadius: instance?.cornerRadius ?? "medium",
    products: instance?.products.join("\n") ?? "",
    customDomain: instance?.customDomain ?? "",
    supportEmail: instance?.supportEmail ?? "",
  }
}

function FieldError({ message }: { message?: string }) {
  return message ? <p className="text-sm text-destructive">{message}</p> : null
}

const selectClass =
  "h-10 w-full rounded-md border border-input bg-background px-3 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"

/** A typed hex color, or the fallback while the owner types one. */
const hexOr = (value: string, fallback: string) => (/^#[0-9a-fA-F]{6}$/.test(value) ? value.toLowerCase() : fallback)

/**
 * The form for a company instance, with a live preview of the branding.
 * `action` creates an instance, or changes the one it is bound to.
 */
export function InstanceForm({
  action,
  instance,
  submitLabel,
  siteHost,
}: {
  action: (state: InstanceFormState, formData: FormData) => Promise<InstanceFormState>
  instance?: InstanceBranding | null
  submitLabel: string
  siteHost: string
}) {
  const [state, formAction, pending] = useActionState(action, {})
  const [values, setValues] = useState(() => toValues(instance))
  // Until the owner edits the address, it follows the company name.
  const [slugEdited, setSlugEdited] = useState(Boolean(instance))
  const set = (field: keyof Values) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const value = event.target.value
    setValues((current) => ({
      ...current,
      [field]: value,
      ...(field === "name" && !slugEdited ? { slug: slugFromName(value) } : {}),
    }))
  }
  const errors = state.fieldErrors ?? {}
  const products = values.products.split(/[\n,]/).map((item) => item.trim()).filter(Boolean).slice(0, 8)
  const color = hexOr(values.primaryColor, "#6d4df6")
  const background = hexOr(values.backgroundColor, "#ffffff")
  // The preview sets the same CSS variables as the site (lib/instance/theme.ts) on its own box.
  const theme = themeVariables({ primaryColor: color, backgroundColor: background, font: values.font, cornerRadius: values.cornerRadius })
  const previewStyle = { ...theme.brand, ...theme.surface.variables, fontFamily: theme.fontFamily } as React.CSSProperties
  const backgroundHint =
    bestTextContrast(background) < 7 ? "Choose a lighter or a darker background, so that text is easy to read on it." : undefined
  const brandContrast = contrastRatio(color, background)

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <form action={formAction} className="space-y-5">
        {state.error && (
          <p role="alert" className="rounded-lg border border-destructive/50 bg-destructive/5 p-3 text-sm">
            {state.error}
          </p>
        )}
        <div className="space-y-2">
          <Label htmlFor="name">Company name</Label>
          <Input id="name" name="name" value={values.name} onChange={set("name")} placeholder="Acme Proteomics" required />
          <FieldError message={errors.name} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="slug">Address</Label>
          <div className="flex items-center gap-2">
            <span className="shrink-0 text-sm text-muted-foreground">{siteHost}/i/</span>
            <Input
              id="slug"
              name="slug"
              value={values.slug}
              onChange={(event) => {
                setSlugEdited(true)
                set("slug")(event)
              }}
              placeholder="acme-proteomics"
              required
            />
          </div>
          <FieldError message={errors.slug} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="tagline">Tagline</Label>
          <Input
            id="tagline"
            name="tagline"
            value={values.tagline}
            onChange={set("tagline")}
            placeholder="Track how your peptides and lab results change over time."
          />
          <FieldError message={errors.tagline} />
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="primaryColor">Brand color</Label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                aria-label="Pick the brand color"
                value={color}
                onChange={set("primaryColor")}
                className="h-10 w-12 shrink-0 cursor-pointer rounded border bg-background p-1"
              />
              <Input id="primaryColor" name="primaryColor" value={values.primaryColor} onChange={set("primaryColor")} required />
            </div>
            <FieldError message={errors.primaryColor} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="backgroundColor">Background color</Label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                aria-label="Pick the background color"
                value={background}
                onChange={set("backgroundColor")}
                className="h-10 w-12 shrink-0 cursor-pointer rounded border bg-background p-1"
              />
              <Input
                id="backgroundColor"
                name="backgroundColor"
                value={values.backgroundColor}
                onChange={set("backgroundColor")}
                required
              />
            </div>
            <FieldError message={errors.backgroundColor ?? backgroundHint} />
          </div>
          {brandContrast < 4.5 && (
            <p className="text-sm text-muted-foreground sm:col-span-2">
              The brand color is hard to read as text on this background (contrast {brandContrast.toFixed(1)} to 1; text
              needs 4.5 to 1). So the site shows links and headings in a {isDark(background) ? "lighter" : "darker"} shade of
              it, and buttons in the brand color itself.
            </p>
          )}
          <div className="space-y-2">
            <Label htmlFor="font">Font</Label>
            <select id="font" name="font" value={values.font} onChange={set("font")} className={selectClass}>
              {Object.entries(FONTS).map(([value, font]) => (
                <option key={value} value={value}>
                  {font.label}
                </option>
              ))}
            </select>
            <FieldError message={errors.font} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cornerRadius">Corners</Label>
            <select id="cornerRadius" name="cornerRadius" value={values.cornerRadius} onChange={set("cornerRadius")} className={selectClass}>
              {Object.entries(CORNER_RADII).map(([value, radius]) => (
                <option key={value} value={value}>
                  {radius.label}
                </option>
              ))}
            </select>
            <FieldError message={errors.cornerRadius} />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="logoUrl">Logo address (optional)</Label>
          <Input id="logoUrl" name="logoUrl" value={values.logoUrl} onChange={set("logoUrl")} placeholder="https://…/logo.png" />
          <FieldError message={errors.logoUrl} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="products">Products to track (one per line)</Label>
          <Textarea
            id="products"
            name="products"
            value={values.products}
            onChange={set("products")}
            rows={3}
            placeholder={"Proteomics blood panel\nBPC-157"}
          />
          <FieldError message={errors.products} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="customDomain">Your own domain (optional)</Label>
          <Input
            id="customDomain"
            name="customDomain"
            value={values.customDomain}
            onChange={set("customDomain")}
            placeholder="track.acme.com"
          />
          <FieldError message={errors.customDomain} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="supportEmail">Support email (optional)</Label>
          <Input
            id="supportEmail"
            name="supportEmail"
            type="email"
            value={values.supportEmail}
            onChange={set("supportEmail")}
            placeholder="help@acme.com"
          />
          <p className="text-xs text-muted-foreground">
            Shown on your sign-in page. Replies to the emails that your site sends go here.
          </p>
          <FieldError message={errors.supportEmail} />
        </div>
        <Button type="submit" size="lg" disabled={pending} className="gap-2">
          {pending && <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />}
          {submitLabel}
        </Button>
      </form>

      <section aria-label="Preview" className="space-y-2 lg:sticky lg:top-24 lg:self-start">
        <p className="text-sm font-medium text-muted-foreground">Preview</p>
        <div className="overflow-hidden rounded-lg border bg-background text-foreground shadow-sm" style={previewStyle}>
          <div className="flex items-center gap-2 border-b bg-background px-4 py-3">
            {values.logoUrl.startsWith("https://") && (
              // eslint-disable-next-line @next/next/no-img-element -- the logo is on the company's own host
              <img src={values.logoUrl} alt="" className="h-7 w-7 object-contain" />
            )}
            <span className="font-bold">{values.name || "Company name"}</span>
          </div>
          <div className="space-y-4 bg-muted/40 p-6">
            <p className="text-3xl font-bold tracking-tight text-primary">
              {values.name || "Company name"}
            </p>
            <p className="text-muted-foreground">
              {values.tagline || "Track your treatments and how you feel, and see what worked for people like you."}
            </p>
            {products.length > 0 && (
              <ul className="flex flex-wrap gap-2">
                {products.map((product) => (
                  <li key={product} className="rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
                    {product}
                  </li>
                ))}
              </ul>
            )}
            <span className="inline-block rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
              Start tracking
            </span>
          </div>
        </div>
      </section>
    </div>
  )
}
