"use client"

import { useActionState, useState } from "react"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { PageFormState } from "@/lib/actions/instance-pages"
import { slugFromName } from "@/lib/instance/config"
import { MAX_PAGE_LENGTH, type PageInput } from "@/lib/instance/pages"

function FieldError({ id, message }: { id: string; message?: string }) {
  return message ? (
    <p id={id} className="text-sm text-destructive">
      {message}
    </p>
  ) : null
}

/**
 * The form for a content page of a company's site: its title, its address and
 * its text in Markdown. While the address is not edited, it follows the title.
 */
export function PageForm({
  action,
  deleteAction,
  initial,
  submitLabel,
}: {
  action: (state: PageFormState, formData: FormData) => Promise<PageFormState>
  /** Only for a page that exists. */
  deleteAction?: () => Promise<void>
  initial: PageInput
  submitLabel: string
}) {
  const [state, formAction, pending] = useActionState(action, {})
  const [values, setValues] = useState(initial)
  const [slugEdited, setSlugEdited] = useState(Boolean(initial.slug))
  const errors = state.fieldErrors ?? {}

  return (
    <div className="max-w-4xl space-y-6">
      <form action={formAction} className="space-y-6">
        {state.error && (
          <p role="alert" className="rounded-lg border border-destructive/50 bg-destructive/5 p-3 text-sm">
            {state.error}
          </p>
        )}

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              name="title"
              value={values.title}
              onChange={(event) => {
                const title = event.target.value
                setValues((current) => ({ ...current, title, ...(slugEdited ? {} : { slug: slugFromName(title) }) }))
              }}
              placeholder="What we measure"
              aria-describedby={errors.title ? "title-error" : undefined}
              required
            />
            <FieldError id="title-error" message={errors.title} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="slug">Address</Label>
            <div className="flex items-center gap-2">
              <span className="shrink-0 text-sm text-muted-foreground">/pages/</span>
              <Input
                id="slug"
                name="slug"
                value={values.slug}
                onChange={(event) => {
                  setSlugEdited(true)
                  setValues((current) => ({ ...current, slug: event.target.value }))
                }}
                placeholder="what-we-measure"
                aria-describedby={errors.slug ? "slug-error slug-hint" : "slug-hint"}
                required
              />
            </div>
            <p id="slug-hint" className="text-xs text-muted-foreground">
              The address <span className="font-mono">terms</span> or <span className="font-mono">privacy</span> makes
              this page your own terms of service or privacy policy, in place of the network&rsquo;s.
            </p>
            <FieldError id="slug-error" message={errors.slug} />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="body">Text</Label>
          <Textarea
            id="body"
            name="body"
            rows={18}
            maxLength={MAX_PAGE_LENGTH}
            value={values.body}
            onChange={(event) => setValues((current) => ({ ...current, body: event.target.value }))}
            className="font-mono text-sm"
            aria-describedby={errors.body ? "body-error body-hint" : "body-hint"}
            required
          />
          <p id="body-hint" className="text-xs text-muted-foreground">
            Markdown: <span className="font-mono">## Heading</span>, <span className="font-mono">**bold**</span>,{" "}
            <span className="font-mono">- list item</span>, <span className="font-mono">[link](https://…)</span>, and
            tables with <span className="font-mono">| column | column |</span> rows.
          </p>
          <FieldError id="body-error" message={errors.body} />
        </div>

        <label className="flex items-start gap-3 text-sm">
          <input
            type="checkbox"
            name="inMenu"
            checked={values.inMenu}
            onChange={(event) => setValues((current) => ({ ...current, inMenu: event.target.checked }))}
            className="mt-0.5 h-4 w-4 shrink-0 accent-primary"
          />
          <span>
            Show in the top menu. Every page is also linked at the bottom of each page of your site.
          </span>
        </label>

        <Button type="submit" size="lg" disabled={pending} className="gap-2">
          {pending && <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />}
          {submitLabel}
        </Button>
      </form>

      {deleteAction && (
        <form
          action={deleteAction}
          onSubmit={(event) => {
            if (!window.confirm("Delete this page? Its text cannot be recovered.")) event.preventDefault()
          }}
          className="border-t pt-6"
        >
          <Button type="submit" variant="outline" className="text-destructive">
            Delete page
          </Button>
        </form>
      )}
    </div>
  )
}
