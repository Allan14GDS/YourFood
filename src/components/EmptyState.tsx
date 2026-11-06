import type { ReactNode } from "react";

type Art = "kitchen" | "tables" | "menu" | "people" | "receipt";

/** Subtle line illustrations drawn with currentColor so they follow the theme. */
function Illustration({ art }: { art: Art }) {
  const common = { fill: "none", stroke: "currentColor", strokeWidth: 2.5, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  return (
    <svg viewBox="0 0 120 96" className="h-24 w-32" aria-hidden>
      <ellipse cx="60" cy="86" rx="44" ry="5" className="fill-muted" />
      {art === "kitchen" && (
        <g {...common}>
          <path d="M30 58h60l-6 22H36z" className="text-muted-foreground" />
          <path d="M26 58h68" className="text-muted-foreground" />
          <path d="M48 46c-4-6 4-8 0-14M60 44c-4-6 4-8 0-14M72 46c-4-6 4-8 0-14" className="text-primary" />
          <path d="M94 62l12-6" className="text-muted-foreground" />
        </g>
      )}
      {art === "tables" && (
        <g {...common} className="text-muted-foreground">
          <rect x="34" y="40" width="52" height="10" rx="3" />
          <path d="M42 50v28M78 50v28" />
          <circle cx="60" cy="30" r="6" className="text-primary" />
        </g>
      )}
      {art === "menu" && (
        <g {...common} className="text-muted-foreground">
          <rect x="38" y="16" width="44" height="62" rx="5" />
          <path d="M48 32h24M48 44h24M48 56h14" />
          <circle cx="84" cy="22" r="7" className="text-primary" />
        </g>
      )}
      {art === "people" && (
        <g {...common} className="text-muted-foreground">
          <circle cx="50" cy="36" r="10" />
          <path d="M32 76c0-12 8-20 18-20s18 8 18 20" />
          <circle cx="78" cy="42" r="7" className="text-primary" />
          <path d="M70 76c0-8 4-14 10-14s10 6 10 14" className="text-primary" />
        </g>
      )}
      {art === "receipt" && (
        <g {...common} className="text-muted-foreground">
          <path d="M42 14h36v64l-6-4-6 4-6-4-6 4-6-4-6 4z" />
          <path d="M50 30h20M50 42h20M50 54h12" />
        </g>
      )}
    </svg>
  );
}

export function EmptyState({ art, title, description, action, compact }: { art: Art; title: string; description?: string; action?: ReactNode; compact?: boolean }) {
  return (
    <div className={`flex flex-col items-center justify-center text-center ${compact ? "py-6" : "rounded-2xl border border-dashed px-6 py-14"}`}>
      {!compact && <Illustration art={art} />}
      <p className={`font-semibold ${compact ? "text-xs text-muted-foreground" : "mt-4 text-lg"}`}>{title}</p>
      {description && <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
