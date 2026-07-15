import { ReactNode } from "react";
import { ArrowRight } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import Link from "next/link";
import { ShineBorder } from "@/components/ui/shine-border";

export const BentoGrid = ({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) => {
  return (
    <div
      className={cn(
        "grid w-full auto-rows-[19rem] grid-cols-1 md:grid-cols-3 gap-6",
        className,
      )}
    >
      {children}
    </div>
  );
};

export const BentoCard = ({
  name,
  className,
  background,
  Icon,
  description,
  href,
  cta,
}: {
  name: string;
  className: string;
  background: ReactNode;
  Icon: any;
  description: string;
  href: string;
  cta: string;
}) => (
  <div
    key={name}
    className={cn(
      "group relative col-span-3 flex flex-col justify-between overflow-hidden rounded-3xl",
      "transform-gpu bg-zinc-900/40 border border-zinc-800/80 backdrop-blur-md",
      className,
    )}
  >
    <ShineBorder
      borderWidth={1}
      duration={8}
      shineColor={["#f59e0b", "#d97706", "#27272a"]}
    />
    <div>{background}</div>
    
    <div className="pointer-events-none z-10 flex transform-gpu flex-col gap-1 p-6 transition-all duration-300 group-hover:-translate-y-10">
      <div className="w-10 h-10 rounded bg-zinc-800 text-amber-500 flex items-center justify-center mb-2 origin-left transform-gpu transition-all duration-300 ease-in-out group-hover:scale-75">
        <Icon className="w-5 h-5" weight="duotone" />
      </div>
      <h3 className="text-lg font-bold text-white">
        {name}
      </h3>
      <p className="max-w-lg text-zinc-400 text-xs leading-relaxed">{description}</p>
    </div>

    <div
      className={cn(
        "pointer-events-none absolute bottom-0 flex w-full translate-y-10 transform-gpu flex-row items-center p-6 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100",
      )}
    >
      <Link
        href={href}
        className={cn(
          buttonVariants({ size: "sm", variant: "default" }),
          "pointer-events-auto h-9 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold rounded px-4 inline-flex items-center gap-1 border border-zinc-700/50"
        )}
      >
        <span>{cta}</span>
        <ArrowRight className="w-3.5 h-3.5" weight="bold" />
      </Link>
    </div>
    
    <div className="pointer-events-none absolute inset-0 transform-gpu transition-all duration-300 group-hover:bg-white/[.02]" />
  </div>
);
