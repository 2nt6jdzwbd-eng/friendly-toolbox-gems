import { createFileRoute } from "@tanstack/react-router";
import { useRequireSession } from "@/lib/guard";
import { useState } from "react";
import { Play, RotateCcw } from "lucide-react";
import { TopBar } from "@/components/TopBar";
import { GameHeaderStats } from "@/components/GameHeaderStats";
import { WinFeed } from "@/components/WinFeed";
import { Button } from "@/components/ui/button";
import closedApple from "@/assets/logo.png";
import goodApple from "@/assets/game-apple.jpg";
import badApple from "@/assets/game-apple-red.jpg";
import {
  fetchAppleLayout,
  isFirebaseMode,
  randomAppleLayout,
  resetAppleLayout,
} from "@/lib/firebase-signals";

export const Route = createFileRoute("/game/apple")({
  head: () => ({
    meta: [
      { title: "سكربت التفاحه Apple of Fortune Script | كريزي سكربت" },
      {
        name: "description",
        content:
          "سكربت التفاحه (apple of fortune script) من كريزي سكربت: إشارات التفاحة السليمة في كل صف ونسب المضاعفة لحظة بلحظة.",
      },
      { property: "og:title", content: "سكربت التفاحه Apple of Fortune Script | كريزي سكربت" },
      { property: "og:description", content: "احصل على إشارات التفاحة السليمة في كل صف مع سكربت التفاحه." },
      { name: "keywords", content: "سكربت التفاحه, اسكربت التفاحه, apple of fortune script, كريزي سكربت, crazy script" },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/game/apple" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/game/apple" }],
  }),

  component: AppleGame,
});

const CLOSED = closedApple;
const GOOD = goodApple;
const BAD = badApple;

// bottom row -> top row
const ODDS = ["1.23", "1.54", "1.93", "2.41", "4.02", "6.71", "11.18", "27.97", "69.93", "349.43"];

function AppleGame() {
  useRequireSession();
  const [rows, setRows] = useState<boolean[][] | null>(null);
  const [busy, setBusy] = useState(false);

  const start = async () => {
    if (busy) return;
    setBusy(true);
    if (isFirebaseMode()) {
      const layout = await fetchAppleLayout();
      setRows(layout);
    } else {
      setRows(randomAppleLayout());
    }
    setBusy(false);
  };

  const reset = async () => {
    if (busy) return;
    setBusy(true);
    setRows(null);
    if (isFirebaseMode()) {
      // اعاده بدأ: تكتب توزيع جديد للتفاح الفاسد في Firebase (m1..m50)
      await resetAppleLayout();
    }
    setBusy(false);
  };

  return (
    <main dir="ltr" className="relative z-10 min-h-screen bg-transparent pb-16">
      <TopBar />
      <GameHeaderStats />

      <div className="mx-auto max-w-md px-4 pt-4">
        <h1 className="border-b border-border pb-3 text-center text-4xl leading-none">APPLE OF FORTUNE</h1>

        <div className="mt-5 flex flex-col gap-2">
          {ODDS.slice().reverse().map((odd, rowIdxFromTop) => {
            const rowIndex = 9 - rowIdxFromTop;
            const row = rows?.[rowIndex];
            return (
              <div key={odd} className="flex items-center justify-center gap-2">
                <span className="mr-1 w-14 rounded-md border border-primary/35 py-1 text-center text-[11px] font-black text-primary">
                  {odd}
                </span>
                {Array.from({ length: 5 }).map((_, c) => {
                  const src = rows == null ? CLOSED : row?.[c] ? BAD : GOOD;
                  return (
                    <span
                      key={c}
                      style={{ width: 45, height: 45, animationDelay: `${rowIdxFromTop * 90 + c * 45}ms` }}
                      className="animate-scale-in overflow-hidden rounded-sm border border-border bg-card"
                    >
                      <img src={src} alt="cell" loading="lazy" width={45} height={45} className="h-full w-full object-cover" />
                    </span>
                  );
                })}
              </div>

            );
          })}
        </div>

        <div className="mt-6 flex gap-3">
           <Button
            onClick={start}
             className="h-11 flex-1 rounded-sm text-sm font-black active:scale-95"
          >
            <Play className="h-4 w-4" /> بدأ
           </Button>
           <Button
             variant="secondary"
            onClick={reset}
             className="h-11 flex-1 rounded-sm border border-border text-sm font-black active:scale-95"
          >
            <RotateCcw className="h-4 w-4" /> اعاده بدأ
           </Button>
        </div>

        <WinFeed />

        <p className="mt-10 text-center text-xs text-muted-foreground">
          كل الحقوق محفوظة لدى منصة crazy script
        </p>
      </div>
    </main>
  );
}
