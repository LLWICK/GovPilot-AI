import React, { CSSProperties } from "react";
import { cn } from "@/lib/utils";

export interface RippleProps {
  mainCircleSize?: number;
  mainCircleOpacity?: number;
  numCircles?: number;
  className?: string;
}

export const Ripple = React.memo(function Ripple({
  mainCircleSize = 210,
  mainCircleOpacity = 0.75,
  numCircles = 8,
  className,
}: RippleProps) {
  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-0 select-none [mask-image:radial-gradient(circle_at_center,white,transparent_85%)]",
        className,
      )}
    >
      {Array.from({ length: numCircles }).map((_, i) => {
        const size = mainCircleSize + i * 75;
        const opacity = mainCircleOpacity - i * 0.05;
        const animationDelay = `${i * 0.06}s`;
        const borderStyle = i === numCircles - 1 ? "dashed" : "solid";

        return (
          <div
            key={i}
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-slate-900/30 dark:border-white/20 bg-slate-900/5 dark:bg-white/5 animate-ripple will-change-[transform]"
            style={
              {
                width: `${size}px`,
                height: `${size}px`,
                opacity: Math.max(opacity, 0.25),
                animationDelay: animationDelay,
                borderStyle: borderStyle,
                borderWidth: "1.5px",
                "--i": i,
              } as CSSProperties
            }
          />
        );
      })}
    </div>
  );
});

Ripple.displayName = "Ripple";
