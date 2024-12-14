'use client';

import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface InfoIconProps {
  title: string;
  value: number;
  target: number;
}

interface InfoTextProps {
  label: string;
  value1: number | string;
  value2?: number | string;
  suffix1?: string;
  suffix2?: string;
}

export function InfoIcon({ title, value, target }: InfoIconProps) {
  const progress = Math.min((value / target) * 100, 100);

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium">{title}</span>
        <span className="text-sm text-muted-foreground">{value.toLocaleString()}</span>
      </div>
      <Progress value={progress} className="h-2" />
      <div className="text-xs text-muted-foreground text-right">
        Target: {target.toLocaleString()}
      </div>
    </div>
  );
}

export function InfoText({ label, value1, value2, suffix1, suffix2 }: InfoTextProps) {
  return (
    <div className="py-2.5 px-5">
      <div className="flex items-center gap-1">
        <span className="text-3xl">{value1}</span>
        {suffix1 && <span className="text-sm pt-1.5 pr-1.5">{suffix1}</span>}
        {value2 && <span className="text-3xl">{value2}</span>}
        {suffix2 && <span className="text-sm pt-1.5">{suffix2}</span>}
      </div>
      <span className="text-sm text-muted-foreground">{label}</span>
    </div>
  );
}

interface InfoBarProps {
  label: string;
  barValue: number;
  value1: number | string;
  value2?: number | string;
  suffix1?: string;
  suffix2?: string;
  color?: string;
}

export function InfoBar({
  label,
  barValue,
  value1,
  value2,
  suffix1,
  suffix2,
  color,
}: InfoBarProps) {
  return (
    <div className="flex w-full items-center gap-4">
      <div className="w-1/5">
        <span className="text-xs text-muted-foreground text-right block">
          {label}
        </span>
      </div>
      <div className="w-3/5">
        <Progress 
          value={barValue} 
          className={cn(
            "h-2",
            color === "green" ? "bg-green-100 [&>div]:bg-green-500" : ""
          )}
        />
      </div>
      <div className="w-1/5 flex items-center">
        <span className="text-base">{value1}</span>
        {suffix1 && <span className="text-xs pt-0.5 pr-1.5">{suffix1}</span>}
        {value2 && <span className="text-base">{value2}</span>}
        {suffix2 && <span className="text-xs pt-0.5">{suffix2}</span>}
      </div>
    </div>
  );
}
