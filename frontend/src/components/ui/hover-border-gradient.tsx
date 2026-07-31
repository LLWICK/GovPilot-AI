"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";

interface HoverBorderGradientProps extends React.HTMLAttributes<HTMLElement> {
  as?: React.ElementType;
  containerClassName?: string;
  duration?: number;
  clockwise?: boolean;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
}

export function HoverBorderGradient({
  children,
  className,
  containerClassName,
  as: Component = "button",
  duration = 6,
  clockwise = true,
  type,
  disabled,
  ...props
}: HoverBorderGradientProps) {
  const [hovered, setHovered] = useState(false);

  return (
    <Component
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      type={type}
      disabled={disabled}
      className={cn(
        "relative flex h-11 items-center justify-center rounded-xl transition-all duration-300 overflow-hidden p-[1px] bg-zinc-800 border border-transparent",
        containerClassName
      )}
      {...props}
    >
      {/* Background Rotating Conic Gradient */}
      <div
        className={cn(
          "absolute inset-0 w-[150%] h-[150%] left-[-25%] top-[-25%] pointer-events-none rounded-[inherit] transition-opacity duration-500",
          hovered ? "opacity-100" : "opacity-0"
        )}
        style={{
          background: `conic-gradient(from 0deg, transparent 40%, #f59e0b 50%, #d97706 60%, transparent 70%)`,
          animation: `spin ${duration}s linear infinite ${clockwise ? "" : "reverse"}`,
        }}
      />

      {/* Internal Content Container */}
      <div
        className={cn(
          "relative z-10 w-full h-full rounded-[10px] bg-zinc-950 flex items-center justify-center px-4 transition-colors duration-300 text-white text-xs font-bold",
          className
        )}
      >
        {children}
      </div>
    </Component>
  );
}
