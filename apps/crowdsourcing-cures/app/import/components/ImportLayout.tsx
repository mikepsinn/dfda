'use client';

import * as React from "react";
import { cn } from "@/lib/utils";

interface ImportLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export default function ImportLayout({ children, className }: ImportLayoutProps) {
  return (
    <div 
      className={cn(
        "my-10 px-10 min-h-screen bg-background/50 space-y-10",
        className
      )}
    >
      {children}
    </div>
  );
} 