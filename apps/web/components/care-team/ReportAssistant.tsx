"use client"

import { useRef, useState } from "react"
import { BookOpen, Loader2, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { applyEvent, emptyAnswer, MAX_QUESTION_LENGTH, type Answer, type AnswerEvent } from "@/lib/care-team/assistant"

/** A question of the care team's log, as the page gets it. */
export type AskedQuestion = { id: string; question: string; askerName: string; askedOn: string; answer: Answer | null }

const SUGGESTIONS = [
  "Which changes should I look at first, and why?",
  "What does the literature say about these changes on this drug?",
  "What should we measure at the next visit?",
]

/** An answer, with a numbered link to its source after each part. */
function AnswerView({ answer, id }: { answer: Answer; id: string }) {
  return (
    <div className="space-y-3">
      <p className="whitespace-pre-line leading-relaxed">
        {answer.segments.map((segment, index) => (
          <span key={index}>
            {/* The source numbers go after the words they support, before the space that follows. */}
            {segment.text.trimEnd()}
            {segment.sources.map((n) => (
              <sup key={n} className="ml-0.5">
                <a href={`#${id}-source-${n}`} className="font-medium text-primary no-underline hover:underline" aria-label={`Source ${n}`}>
                  [{n}]
                </a>
              </sup>
            ))}
            {segment.text.slice(segment.text.trimEnd().length)}
          </span>
        ))}
      </p>
      {answer.sources.length > 0 && (
        <ol aria-label="Sources" className="space-y-1.5 border-t pt-3 text-sm">
          {answer.sources.map((source) => (
            <li key={source.n} id={`${id}-source-${source.n}`} className="flex gap-2">
              <span className="w-6 shrink-0 text-muted-foreground">{source.n}.</span>
              {source.kind === "report" ? (
                <span>
                  <span className="font-medium">This report:</span> <span className="text-muted-foreground">&ldquo;{source.quote}&rdquo;</span>
                </span>
              ) : (
                <span className="min-w-0">
                  <a href={source.url} target="_blank" rel="noopener noreferrer" className="font-medium text-primary underline">
                    {source.title}
                  </a>{" "}
                  <span className="break-all text-xs text-muted-foreground">{new URL(source.url).hostname}</span>
                  {source.quote && <span className="block text-muted-foreground">&ldquo;{source.quote}&rdquo;</span>}
                </span>
              )}
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}

/**
 * Questions about a report for the care team (lib/care-team/assistant.ts),
 * like a literature assistant: each answer cites the report and the
 * literature. The person does not see the questions.
 */
export function ReportAssistant({ reportId, initial }: { reportId: string; initial: AskedQuestion[] }) {
  const [asked, setAsked] = useState(initial)
  const [question, setQuestion] = useState("")
  const [pending, setPending] = useState<{ question: string; answer: Answer; status: string | null } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const field = useRef<HTMLTextAreaElement>(null)

  async function ask(text: string) {
    setError(null)
    setPending({ question: text, answer: emptyAnswer(), status: "Reading the report…" })
    let answer = emptyAnswer()
    try {
      const response = await fetch(`/api/care-team/reports/${reportId}/questions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: text }),
      })
      if (!response.ok || !response.body) {
        const body = (await response.json().catch(() => null)) as { error?: { message?: string } } | null
        throw new Error(body?.error?.message ?? "The assistant could not answer now. Try again in a minute.")
      }
      const reader = response.body.pipeThrough(new TextDecoderStream()).getReader()
      let buffer = ""
      for (let chunk = await reader.read(); !chunk.done; chunk = await reader.read()) {
        buffer += chunk.value
        const lines = buffer.split("\n")
        buffer = lines.pop() ?? ""
        for (const line of lines.filter(Boolean)) {
          const event = JSON.parse(line) as AnswerEvent
          if (event.type === "error") throw new Error(event.message)
          if (event.type === "done") {
            setAsked((current) => [...current, { id: event.questionId, question: text, askerName: "You", askedOn: "Just now", answer }])
            setQuestion("")
            setPending(null)
            return
          }
          answer = applyEvent(answer, event)
          const status = event.type === "status" ? event.text : event.type === "text" ? null : undefined
          setPending((current) => current && { ...current, answer, status: status === undefined ? current.status : status })
        }
      }
      throw new Error("The answer stopped before its end. Try again.")
    } catch (caught) {
      setPending(null)
      setError(caught instanceof Error ? caught.message : String(caught))
    }
  }

  return (
    <section aria-labelledby="assistant-heading" className="surface-raised mx-auto max-w-5xl space-y-5 rounded-xl border p-6 print:hidden">
      <div className="space-y-1">
        <h2 id="assistant-heading" className="flex items-center gap-2 text-xl font-semibold">
          <Sparkles aria-hidden="true" className="h-5 w-5 text-primary" /> Ask about this report
        </h2>
        <p className="text-sm text-muted-foreground">
          Answers come from this report and from medical literature on trusted sites, with a source for each part. Check the
          sources before you act. Only the care team sees these questions.
        </p>
      </div>

      {asked.length > 0 && (
        <ul aria-label="Questions" className="space-y-5">
          {asked.map((item) => (
            <li key={item.id} className="space-y-2 rounded-lg border p-4">
              <p className="font-medium">{item.question}</p>
              <p className="text-xs text-muted-foreground">
                {item.askerName} · {item.askedOn}
              </p>
              {item.answer ? <AnswerView answer={item.answer} id={item.id} /> : <p className="text-sm text-muted-foreground">No answer.</p>}
            </li>
          ))}
        </ul>
      )}

      {pending && (
        <div role="status" aria-live="polite" className="space-y-2 rounded-lg border border-primary/40 p-4">
          <p className="font-medium">{pending.question}</p>
          {pending.status && (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" /> {pending.status}
            </p>
          )}
          <AnswerView answer={pending.answer} id="pending" />
        </div>
      )}

      {error && (
        <p role="alert" className="rounded-lg border border-destructive/50 bg-destructive/5 p-3 text-sm">
          {error}
        </p>
      )}

      <form
        className="space-y-3"
        onSubmit={(event) => {
          event.preventDefault()
          if (question.trim() && !pending) void ask(question.trim())
        }}
      >
        <div className="space-y-2">
          <Label htmlFor="assistant-question">Your question</Label>
          <Textarea
            id="assistant-question"
            ref={field}
            rows={3}
            maxLength={MAX_QUESTION_LENGTH}
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            placeholder="For example: Why did this marker go against the program's intent?"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button type="submit" disabled={Boolean(pending) || !question.trim()} className="gap-2">
            {pending ? <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" /> : <BookOpen aria-hidden="true" className="h-4 w-4" />}
            Ask
          </Button>
          {SUGGESTIONS.map((suggestion) => (
            <Button
              key={suggestion}
              type="button"
              variant="outline"
              size="sm"
              className="h-auto whitespace-normal py-1.5 text-left"
              disabled={Boolean(pending)}
              onClick={() => {
                setQuestion(suggestion)
                field.current?.focus()
              }}
            >
              {suggestion}
            </Button>
          ))}
        </div>
      </form>
    </section>
  )
}
