"use client"

import { useEffect, useRef, useState, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import { CheckCircle2, Loader2, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import type { ChatActionResult } from "@/lib/actions/programs"
import type { ChatMessage } from "@/lib/programs/chat"
import { cn } from "@/lib/utils"

type Entry = ChatMessage | { role: "action"; text: string }

const GREETING = "How are you today? Tell me how you feel and what you took, and I record it for you."

/**
 * The check-in chat (lib/programs/chat.ts): the member writes how they are,
 * and the chat records values, side effects and reminder times. What it saved
 * shows as a line with a check mark, and the page shows the new values. The
 * chat itself lives in this page only.
 */
export function CheckInChat({
  action,
  suggestions,
}: {
  action: (messages: ChatMessage[]) => Promise<ChatActionResult>
  /** Things to say with one tap. */
  suggestions: string[]
}) {
  const router = useRouter()
  const [entries, setEntries] = useState<Entry[]>([])
  const [draft, setDraft] = useState("")
  const [error, setError] = useState<string | null>(null)
  // The request only: the page's refresh after a save does not hold up the next message.
  const [pending, setPending] = useState(false)
  const log = useRef<HTMLDivElement>(null)

  useEffect(() => {
    log.current?.scrollTo({ top: log.current.scrollHeight })
  }, [entries, pending])

  const send = async (text: string) => {
    const message = text.trim()
    if (!message || pending) return
    const next: Entry[] = [...entries, { role: "user", text: message }]
    setEntries(next)
    setDraft("")
    setError(null)
    setPending(true)
    let result: ChatActionResult
    try {
      result = await action(next.filter((entry): entry is ChatMessage => entry.role !== "action"))
    } catch {
      result = { error: "The chat could not answer. Try again." }
    } finally {
      setPending(false)
    }
    if (result.error) {
      setError(result.error)
      return
    }
    setEntries([
      ...next,
      ...(result.actions ?? []).map((saved) => ({ role: "action" as const, text: saved })),
      { role: "assistant", text: result.reply ?? "" },
    ])
    // The page's values, report and side effects show what the chat saved.
    if (result.actions?.length) router.refresh()
  }

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    void send(draft)
  }

  return (
    <div className="space-y-4">
      <div ref={log} role="log" aria-label="Chat" className="max-h-96 space-y-3 overflow-y-auto">
        <p className="max-w-[85%] rounded-lg bg-muted px-3 py-2 text-sm">{GREETING}</p>
        {entries.map((entry, index) =>
          entry.role === "action" ? (
            <p key={index} className="flex items-center gap-2 text-sm font-medium text-primary">
              <CheckCircle2 aria-hidden="true" className="h-4 w-4 shrink-0" />
              {entry.text}
            </p>
          ) : (
            <p
              key={index}
              className={cn(
                "max-w-[85%] whitespace-pre-wrap rounded-lg px-3 py-2 text-sm",
                entry.role === "user" ? "ml-auto bg-primary text-primary-foreground" : "bg-muted",
              )}
            >
              <span className="sr-only">{entry.role === "user" ? "You: " : "Chat: "}</span>
              {entry.text}
            </p>
          ),
        )}
        {pending && (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
            Writing…
          </p>
        )}
      </div>
      {error && (
        <p role="alert" className="rounded-lg border border-destructive/50 bg-destructive/5 p-3 text-sm">
          {error}
        </p>
      )}
      {entries.length === 0 && (
        <div className="flex flex-wrap gap-2">
          {suggestions.map((suggestion) => (
            <Button key={suggestion} type="button" variant="outline" size="sm" onClick={() => void send(suggestion)} disabled={pending}>
              {suggestion}
            </Button>
          ))}
        </div>
      )}
      <form onSubmit={submit} className="flex items-end gap-2">
        <Textarea
          aria-label="Message"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault()
              void send(draft)
            }
          }}
          placeholder="For example: nausea is a 3 today, and I took my dose"
          rows={2}
          maxLength={2000}
          className="min-h-0 resize-none"
        />
        <Button type="submit" size="icon" aria-label="Send" disabled={pending || !draft.trim()}>
          <Send aria-hidden="true" className="h-4 w-4" />
        </Button>
      </form>
    </div>
  )
}
