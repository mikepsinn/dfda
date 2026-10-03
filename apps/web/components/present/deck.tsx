"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight, Maximize2, NotebookText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type DeckSlide = {
  key: string;
  label: string;
  purpose?: string;
  notes?: string;
  content: ReactNode;
};

// Slides are drawn on a fixed 1920 × 1080 canvas and scaled to the window, so they look the same
// on any screen, in a PDF and in a video capture.
export const SLIDE_WIDTH = 1920;
export const SLIDE_HEIGHT = 1080;

const NEXT = new Set(["ArrowRight", "ArrowDown", "PageDown", " ", "Enter"]);
const PREVIOUS = new Set(["ArrowLeft", "ArrowUp", "PageUp", "Backspace"]);

export function Deck({ title, slides }: { title: string; slides: DeckSlide[] }) {
  const [index, setIndex] = useState(0);
  const [notesOpen, setNotesOpen] = useState(false);
  const [scale, setScale] = useState(0);
  const stage = useRef<HTMLDivElement>(null);

  const go = useCallback((target: number) => {
    const next = Math.min(Math.max(target, 0), slides.length - 1);
    setIndex(next);
    window.history.replaceState(null, "", `#${slides[next].key}`);
  }, [slides]);

  // The address names the slide (#7, #B2), so a link or a reload opens it.
  useEffect(() => {
    const fromHash = () => {
      const found = slides.findIndex(slide => slide.key === decodeURIComponent(window.location.hash.slice(1)));
      if (found >= 0) setIndex(found);
    };
    fromHash();
    window.addEventListener("hashchange", fromHash);
    return () => window.removeEventListener("hashchange", fromHash);
  }, [slides]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.altKey || event.ctrlKey || event.metaKey) return;
      const target = event.target instanceof Element ? event.target : null;
      if (target?.closest("input, textarea, select, [contenteditable='true']")) return;
      if ((event.key === " " || event.key === "Enter") && target?.closest("a, button")) return;
      if (NEXT.has(event.key)) go(index + 1);
      else if (PREVIOUS.has(event.key)) go(index - 1);
      else if (event.key === "Home") go(0);
      else if (event.key === "End") go(slides.length - 1);
      else if (event.key === "n") setNotesOpen(open => !open);
      else if (event.key === "f") void document.documentElement.requestFullscreen?.();
      else return;
      event.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, index, slides.length]);

  useEffect(() => {
    const element = stage.current;
    if (!element) return;
    const fit = () => setScale(Math.min(element.clientWidth / SLIDE_WIDTH, element.clientHeight / SLIDE_HEIGHT));
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(element);
    return () => observer.disconnect();
  }, [notesOpen]);

  const current = slides[index];
  return (
    <div className="deck flex h-dvh flex-col bg-slate-950 text-slate-100">
      <h1 className="sr-only">{title}</h1>
      <div ref={stage} className="deck-stage relative min-h-0 flex-1 overflow-hidden">
        <div className="deck-canvas absolute left-1/2 top-1/2"
          style={{ width: SLIDE_WIDTH, height: SLIDE_HEIGHT, transform: `translate(-50%, -50%) scale(${scale})` }}>
          {slides.map((slide, i) => (
            <section key={slide.key} hidden={i !== index} aria-roledescription="slide"
              aria-label={`${slide.label} (${i + 1} of ${slides.length})`}
              className="deck-slide absolute inset-0 overflow-hidden bg-background text-foreground">
              {slide.content}
            </section>
          ))}
        </div>
      </div>
      {notesOpen && (
        <aside aria-label="Speaker notes" className="deck-chrome max-h-[38dvh] overflow-y-auto border-t border-slate-800 bg-slate-900 px-6 py-4 text-sm leading-relaxed">
          {current.purpose && <p className="font-medium text-slate-300">Purpose: {current.purpose}</p>}
          <p className={cn("max-w-4xl text-slate-200", current.purpose && "mt-2")}>{current.notes ?? "No speaker notes."}</p>
        </aside>
      )}
      <nav aria-label="Slides" className="deck-chrome flex items-center justify-between gap-3 border-t border-slate-800 px-4 py-2 text-sm">
        <p className="min-w-0 truncate text-slate-400">{title}</p>
        <div className="flex shrink-0 items-center gap-1">
          <Button variant="ghost" size="icon" aria-label="Previous slide" disabled={index === 0}
            className="text-slate-200 hover:bg-slate-800 hover:text-white" onClick={() => go(index - 1)}>
            <ChevronLeft aria-hidden="true" className="h-5 w-5" />
          </Button>
          <span className="min-w-16 text-center tabular-nums text-slate-300">{current.key} · {index + 1}/{slides.length}</span>
          <Button variant="ghost" size="icon" aria-label="Next slide" disabled={index === slides.length - 1}
            className="text-slate-200 hover:bg-slate-800 hover:text-white" onClick={() => go(index + 1)}>
            <ChevronRight aria-hidden="true" className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" aria-label={notesOpen ? "Hide speaker notes" : "Show speaker notes"}
            aria-pressed={notesOpen} className="text-slate-200 hover:bg-slate-800 hover:text-white"
            onClick={() => setNotesOpen(open => !open)}>
            <NotebookText aria-hidden="true" className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" aria-label="Full screen"
            className="text-slate-200 hover:bg-slate-800 hover:text-white"
            onClick={() => void document.documentElement.requestFullscreen?.()}>
            <Maximize2 aria-hidden="true" className="h-5 w-5" />
          </Button>
        </div>
      </nav>
      <p aria-live="polite" className="sr-only">Slide {index + 1} of {slides.length}: {current.label}</p>
    </div>
  );
}
