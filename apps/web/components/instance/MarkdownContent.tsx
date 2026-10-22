import type { ElementType } from "react"
import Markdown, { type Components, type ExtraProps } from "react-markdown"
import remarkGfm from "remark-gfm"

/**
 * The text of a company's content page, written in Markdown with tables
 * (GitHub-flavored). Raw HTML in the text is not rendered, and links with an
 * unsafe protocol (such as javascript:) lose their address, so the text cannot
 * run scripts on the company's site.
 */

/** A Markdown element with the site's classes. React-markdown's `node` prop stays off the HTML element. */
function styled(Tag: ElementType, className: string) {
  return function Styled(props: ExtraProps) {
    return <Tag {...props} node={undefined} className={className} />
  }
}

const heading = "mt-10 text-2xl font-semibold tracking-tight first:mt-0"
const Table = styled("table", "w-full text-left text-sm")

const components: Components = {
  // The page title is the page's only h1.
  h1: styled("h2", heading),
  h2: styled("h2", heading),
  h3: styled("h3", "mt-8 text-xl font-semibold first:mt-0"),
  h4: styled("h4", "mt-6 font-semibold first:mt-0"),
  p: styled("p", "mt-4 leading-7 first:mt-0"),
  a: styled("a", "font-medium text-primary underline underline-offset-4"),
  ul: styled("ul", "mt-4 list-disc space-y-1 pl-6 first:mt-0"),
  ol: styled("ol", "mt-4 list-decimal space-y-1 pl-6 first:mt-0"),
  li: styled("li", "leading-7"),
  blockquote: styled("blockquote", "mt-4 border-l-4 pl-4 text-muted-foreground first:mt-0"),
  hr: styled("hr", "my-8"),
  code: styled("code", "rounded bg-muted px-1 py-0.5 font-mono text-sm"),
  pre: styled("pre", "mt-4 overflow-x-auto rounded-lg bg-muted p-4 text-sm first:mt-0 [&>code]:bg-transparent [&>code]:p-0"),
  // A wide table scrolls in its own box, not the page.
  table: (props) => (
    <div className="mt-4 overflow-x-auto rounded-xl border first:mt-0">
      <Table {...props} />
    </div>
  ),
  thead: styled("thead", "bg-muted/50"),
  tbody: styled("tbody", "divide-y"),
  tr: styled("tr", "align-top"),
  th: styled("th", "border-b px-3 py-2 font-semibold"),
  td: styled("td", "px-3 py-2"),
  // A plain image: images in a page are on hosts that the company chooses, which next/image does not know.
  img: styled("img", "mt-4 h-auto max-w-full rounded-lg"),
}

export function MarkdownContent({ children }: { children: string }) {
  return (
    <div className="break-words">
      <Markdown remarkPlugins={[remarkGfm]} skipHtml components={components}>
        {children}
      </Markdown>
    </div>
  )
}
