"use client";

import React, { useRef, useState } from "react";
import { cn } from "@/lib/utils";

export interface MagicCardProps extends React.HTMLAttributes<HTMLDivElement> {
  gradientSize?: number;
  gradientColor?: string;
  gradientOpacity?: number;
}

export function MagicCard({
  children,
  className,
  gradientSize = 260,
  gradientColor = "rgba(245, 158, 11, 0.08)",
  gradientOpacity = 0.8,
  ...props
}: MagicCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const spotlightRef = useRef<HTMLDivElement>(null);
  const borderSpotlightRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (spotlightRef.current) {
      spotlightRef.current.style.background = `radial-gradient(${gradientSize}px circle at ${x}px ${y}px, ${gradientColor}, transparent 80%)`;
    }
    if (borderSpotlightRef.current) {
      borderSpotlightRef.current.style.backgroundImage = `radial-gradient(${gradientSize}px circle at ${x}px ${y}px, rgba(245, 158, 11, 0.35), transparent 80%)`;
    }
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        "relative rounded-3xl overflow-hidden border border-slate-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-950/80 p-8 md:p-10 shadow-xl transition-colors duration-200 w-full text-slate-900 dark:text-white",
        className
      )}
      {...props}
    >
      {/* Background Spotlight Layer */}
      <div
        ref={spotlightRef}
        className="pointer-events-none absolute inset-0 transition-opacity duration-200 will-change-[opacity]"
        style={{
          opacity: isHovered ? gradientOpacity : 0,
        }}
      />
      {/* Borders Spotlight Layer using Masking */}
      <div
        ref={borderSpotlightRef}
        className="pointer-events-none absolute inset-0 border border-transparent rounded-[inherit] transition-opacity duration-200 will-change-[opacity]"
        style={{
          opacity: isHovered ? 1 : 0,
          mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
          WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
          WebkitMaskComposite: "xor",
          maskComposite: "exclude",
          padding: "1.5px",
        }}
      />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
