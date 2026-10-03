import type { ReactNode } from "react";
import { Activity, FileSignature, FileText, Search, Star, Stethoscope, Wallet, type LucideIcon } from "lucide-react";
import type { ScriptSlide } from "@/lib/present/script";
import { cn } from "@/lib/utils";

// A 1920 × 1080 slide. Light slides use the site's theme; dark ones switch to its dark tokens.
// The eyebrow, title and source line come from the script.
export function SlideFrame({ s, tone = "light", header = true, className, children }: {
  s: ScriptSlide;
  tone?: "light" | "dark";
  header?: boolean;
  className?: string;
  children: ReactNode;
}) {
  const dark = tone === "dark";
  return (
    <div className={cn("relative flex h-full w-full flex-col bg-background px-[120px] pb-[64px] pt-[88px] text-foreground",
      dark && "dark", className)}>
      <div aria-hidden="true" className={cn("pointer-events-none absolute inset-0",
        dark ? "bg-[radial-gradient(ellipse_70%_55%_at_50%_20%,hsl(var(--primary)/0.22),transparent_70%)]"
          : "bg-gradient-to-br from-primary/5 via-background to-muted/60")} />
      {header && s.eyebrow && <Eyebrow dark={dark}>{s.eyebrow}</Eyebrow>}
      {header && s.title && (
        <h2 className="relative mt-4 max-w-[1600px] text-[60px] font-bold leading-[1.1] tracking-tight">{s.title}</h2>
      )}
      <div className={cn("relative min-h-0 flex-1", header && (s.eyebrow || s.title) && "mt-12")}>{children}</div>
      {s.sourceLine && <p className="relative mt-8 text-[19px] leading-snug text-muted-foreground">{s.sourceLine}</p>}
    </div>
  );
}

export function Eyebrow({ dark = false, className, children }: { dark?: boolean; className?: string; children: ReactNode }) {
  return (
    <p className={cn("relative text-[22px] font-semibold uppercase tracking-[0.12em]", dark ? "text-amber-400" : "text-primary", className)}>
      {children}
    </p>
  );
}

// A round icon badge, as used on the site's how-it-works steps.
export function IconBadge({ icon: Icon, tone = "soft", size = 72, className }: {
  icon: LucideIcon;
  tone?: "soft" | "solid" | "highlight";
  size?: number;
  className?: string;
}) {
  return (
    <span aria-hidden="true" style={{ width: size, height: size }}
      className={cn("flex shrink-0 items-center justify-center rounded-full",
        tone === "soft" && "bg-primary/10 text-primary",
        tone === "solid" && "bg-primary text-primary-foreground",
        tone === "highlight" && "bg-amber-400 text-slate-950", className)}>
      <Icon style={{ width: size * 0.46, height: size * 0.46 }} />
    </span>
  );
}

export const journeyIcons: LucideIcon[] = [Search, Stethoscope, FileSignature, Wallet, Activity, FileText, Star];

// The seven steps as a dotted zigzag through icon circles, ending in an orange star.
export function PatientPath({ width = 1680, className }: { width?: number; className?: string }) {
  const node = 96;
  const gap = (width - node) / 6;
  const points = journeyIcons.map((_, i) => ({ x: node / 2 + i * gap, y: i % 2 ? node / 2 : node / 2 + 84 }));
  const d = points.slice(1).reduce((path, p, i) => {
    const from = points[i];
    const mid = (from.x + p.x) / 2;
    return `${path} C ${mid} ${from.y} ${mid} ${p.y} ${p.x} ${p.y}`;
  }, `M ${points[0].x} ${points[0].y}`);
  return (
    <div aria-hidden="true" className={cn("relative", className)} style={{ width, height: node + 84 }}>
      <svg className="absolute inset-0 overflow-visible text-primary/50" width={width} height={node + 84}>
        <path d={d} fill="none" stroke="currentColor" strokeWidth={4} strokeLinecap="round" strokeDasharray="2 14" />
      </svg>
      {journeyIcons.map((icon, i) => (
        <div key={i} className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: points[i].x, top: points[i].y }}>
          <IconBadge icon={icon} size={node} tone={i === journeyIcons.length - 1 ? "highlight" : "solid"} className="shadow-lg" />
        </div>
      ))}
    </div>
  );
}
