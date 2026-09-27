import { useEffect, useState } from "react";

const SEGMENTS = 24;

export function LoadingDialog({ open, duration = 3000 }: { open: boolean; duration?: number }) {
  const [pct, setPct] = useState(0);

  useEffect(() => {
    if (!open) {
      setPct(0);
      return;
    }
    const start = Date.now();
    const id = setInterval(() => {
      setPct(Math.min(100, ((Date.now() - start) / duration) * 100));
    }, 40);
    return () => clearInterval(id);
  }, [open, duration]);

  if (!open) return null;

  const lit = Math.round((pct / 100) * SEGMENTS);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-background/95 backdrop-blur-md">
      {/* crimson stage glow */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 70% 45% at 50% 60%, color-mix(in srgb, var(--primary) 14%, transparent), transparent 70%)",
        }}
      />
      {/* sweeping scanline */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-full overflow-hidden">
        <div
          className="h-16 w-full animate-[signal-scan_2.2s_linear_infinite]"
          style={{
            background:
              "linear-gradient(to bottom, transparent, color-mix(in srgb, var(--primary) 10%, transparent), transparent)",
          }}
        />
      </div>

      <div className="relative flex w-[min(320px,82vw)] flex-col items-center gap-5">
        {/* brand mark */}
        <div className="notranslate text-center font-display text-3xl tracking-wide">
          <span className="text-foreground">CRAZY</span>{" "}
          <span className="text-primary">SCRIPT</span>
        </div>

        {/* big percentage */}
        <div className="font-display text-7xl leading-none text-primary tabular-nums [text-shadow:0_0_28px_color-mix(in_srgb,var(--primary)_55%,transparent)]">
          {Math.round(pct)}
          <span className="text-3xl text-foreground/70">%</span>
        </div>

        {/* segmented signal bar */}
        <div className="flex w-full items-end justify-center gap-[3px]" dir="ltr">
          {Array.from({ length: SEGMENTS }).map((_, i) => (
            <span
              key={i}
              className="w-full rounded-[1px] transition-colors duration-100"
              style={{
                height: 10 + Math.sin((i / (SEGMENTS - 1)) * Math.PI) * 14,
                background:
                  i < lit
                    ? "var(--primary)"
                    : "color-mix(in srgb, var(--muted-foreground) 25%, transparent)",
                boxShadow: i < lit ? "0 0 8px color-mix(in srgb, var(--primary) 60%, transparent)" : undefined,
              }}
            />
          ))}
        </div>

        {/* status line */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
          جاري ضبط الإشارة…
        </div>
      </div>

      <style>{`@keyframes signal-scan { from { transform: translateY(-10vh); } to { transform: translateY(110vh); } }`}</style>
    </div>
  );
}
