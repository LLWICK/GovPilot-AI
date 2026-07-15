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
  gradientColor = "rgba(245, 158, 11, 0.08)", // subtle saffron gold glow
  gradientOpacity = 0.8,
  ...props
}: MagicCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setCoords({ x, y });
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        "relative rounded-3xl overflow-hidden border border-zinc-800 bg-zinc-950/80 backdrop-blur-md p-8 md:p-10 shadow-xl transition-all duration-300 w-full",
        className
      )}
      {...props}
    >
      {/* Background Spotlight Layer */}
      <div
        className="pointer-events-none absolute inset-0 transition-opacity duration-300"
        style={{
          opacity: isHovered ? gradientOpacity : 0,
          background: `radial-gradient(${gradientSize}px circle at ${coords.x}px ${coords.y}px, ${gradientColor}, transparent 80%)`,
        }}
      />
      {/* Borders Spotlight Layer using Masking */}
      <div
        className="pointer-events-none absolute inset-0 border border-transparent rounded-[inherit] transition-opacity duration-300"
        style={{
          opacity: isHovered ? 1 : 0,
          backgroundImage: `radial-gradient(${gradientSize}px circle at ${coords.x}px ${coords.y}px, rgba(245, 158, 11, 0.35), transparent 80%)`,
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
