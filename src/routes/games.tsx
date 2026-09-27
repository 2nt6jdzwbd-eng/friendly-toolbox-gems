import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight, Play } from "lucide-react";
import { TopBar } from "@/components/TopBar";
import { LoadingDialog } from "@/components/LoadingDialog";
import { Brand } from "@/components/Brand";
import { Button } from "@/components/ui/button";
import { ChoiceDialog, CodeDialog } from "@/components/ActivationDialogs";
import {
  clearAwaitingCode,
  
  readPendingGame,
  savePendingGame,
} from "@/lib/session";
import { supabase } from "@/integrations/supabase/client";
import apple from "@/assets/game-apple.jpg";
import crash from "@/assets/game-crash.jpg";


export const Route = createFileRoute("/games")({
  head: () => ({
    meta: [
      { title: "كريزي سكربت | سكربت الطياره وسكربت التفاحه Crash Script" },
      {
        name: "description",
        content:
          "كريزي سكربت (crazy script): سكربت الطياره Aviator، سكربت التفاحه Apple of Fortune script، crash script — إشارات وكود تفعيل مجاني.",
      },
      {
        name: "keywords",
        content:
          "سكربت الطياره, اسكربت الطياره, سكربت التفاحه, اسكربت التفاحه, كريزي سكربت, كريزي اسكربت, crazy script, crash script, apple of fortune script, aviator script",
      },
      { property: "og:title", content: "كريزي سكربت | سكربت الطياره وسكربت التفاحه Crash Script" },
      { property: "og:description", content: "سكربت الطياره، سكربت التفاحه، crash script و apple of fortune script مع كريزي سكربت." },

      { property: "og:type", content: "website" },
      { property: "og:url", content: "/games" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/games" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "CRAZY SCRIPT",
          alternateName: [
            "كريزي سكربت",
            "كريزي اسكربت",
            "سكربت الطياره",
            "اسكربت الطياره",
            "سكربت التفاحه",
            "اسكربت التفاحه",
            "crazy script",
            "crash script",
            "apple of fortune script",
            "aviator script",
          ],
          url: "/games",
          inLanguage: "ar",
          description:
            "سكربت الطياره وسكربت التفاحه وإشارات ألعاب 1xBet وLineBet مع كود تفعيل من كريزي سكربت.",
        }),
      },
    ],
  }),
  component: GamesPage,
});


const GAMES = [
  { name: "Apple of fortune", subtitle: "لعبة التفاحة", img: apple, rate: "94%", to: "/game/apple" },
  { name: "Crash", subtitle: "لعبة الطيارة", img: crash, rate: "97%", to: "/game/aviator" },

];

function GamesPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [choice, setChoice] = useState<string | null>(null);
  const [codeOpen, setCodeOpen] = useState(false);
  const [rates, setRates] = useState<Record<string, number>>({});

  // Coming back from the Telegram bot: just land on this first page,
  // no code input is opened automatically.
  useEffect(() => {
    clearAwaitingCode();
  }, []);

  // Win rates are controlled from the admin panel.
  useEffect(() => {
    void (async () => {
      const { data } = await supabase.from("game_rates").select("name, rate");
      const map: Record<string, number> = {};
      (data ?? []).forEach((r: { name: string; rate: number }) => (map[r.name] = r.rate));
      setRates(map);
    })();
  }, []);

  const rateOf = (g: { name: string; rate: string }) =>
    rates[g.name] !== undefined ? `${rates[g.name]}%` : g.rate;

  const play = (to: string) => {
    savePendingGame(to);
    setChoice(to);
  };

  const onGet = () => {
    setChoice(null);
    setLoading(true);
    setTimeout(() => navigate({ to: "/terms" }), 3000);
  };

  const onUse = () => {
    setCodeOpen(true);
  };

  const onVerified = () => {
    const to = (choice ?? readPendingGame() ?? "") || "/game/apple";
    clearAwaitingCode();
    setCodeOpen(false);
    setChoice(null);
    setLoading(true);
    setTimeout(() => navigate({ to }), 3000);
  };

  return (
    <main dir="ltr" className="relative z-10 min-h-screen bg-background pb-16">
      <TopBar showBack={false} />

      <div className="mx-auto max-w-5xl px-4 pt-7 sm:px-6 sm:pt-10">
        <div className="border-b border-border/70 pb-5">
          <h1 className="text-5xl leading-none text-foreground sm:text-7xl"><Brand /></h1>
          <p className="mt-1 text-xs font-bold uppercase text-muted-foreground">Premium signals</p>
        </div>

        <div className="mt-6 overflow-hidden rounded-md border border-border bg-card sm:mt-8">
          <video
            src="https://www.image2url.com/r2/default/videos/1787270560353-b5f64dc7-8096-44ba-9e0e-9562eaf7738c.mov"
            poster={crash}
            autoPlay loop muted playsInline controls preload="metadata"
            className="aspect-video max-h-[390px] w-full bg-card object-cover"
          />
        </div>

        <div className="mt-9 mb-5 flex items-end justify-between border-b border-border pb-3">
          <div>
            <h2 className="text-3xl leading-none text-foreground sm:text-4xl">SELECT YOUR GAME</h2>
            <p className="mt-1 text-sm text-muted-foreground" dir="rtl">اختر لعبتك للبدء</p>
          </div>
          <span className="text-sm font-semibold text-primary">02 / 02</span>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6">
          {GAMES.map((g) => (
            <article key={g.name} className="group flex min-w-0 flex-col overflow-hidden rounded-md border border-border bg-card transition-colors hover:border-primary/70">
              <div className="relative aspect-[4/3] overflow-hidden bg-card">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_42%,rgba(14,165,233,0.30),transparent_62%)]" />
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(16,17,19,0.75)_0%,transparent_30%,transparent_62%,rgba(16,17,19,0.85)_100%)]" />
                <img
                  src={g.img}
                  alt={g.name}
                  loading="lazy"
                  className="absolute left-1/2 top-1/2 h-[78%] max-h-[262px] w-auto -translate-x-1/2 -translate-y-1/2 rounded-md border border-border/80 object-cover shadow-[0_20px_45px_-12px_rgba(0,0,0,0.95)] ring-1 ring-primary/30 transition-transform duration-500 group-hover:scale-[1.05]"
                />
                <div className="absolute right-3 top-3 flex items-center gap-2 rounded-sm border border-primary/50 bg-background/90 px-2.5 py-1.5">
                  <span className="text-[10px] font-bold uppercase text-muted-foreground">Win rate</span>
                  <span className="font-['Bebas_Neue'] text-xl leading-none text-primary">{rateOf(g)}</span>
                </div>
              </div>
              <div className="flex flex-1 flex-col p-4 sm:p-5">
                <h3 className="text-3xl leading-none text-foreground sm:text-4xl">{g.name}</h3>
                <p className="mt-1.5 mb-4 text-left text-sm text-foreground/75" dir="rtl">
                  {g.subtitle}
                </p>
                <Button onClick={() => play(g.to)} className="mt-auto h-12 w-full rounded-sm text-base font-bold active:scale-[0.98]">
                  <Play className="h-4 w-4" /> اللعب الآن <ArrowRight className="ml-auto h-4 w-4" />
                </Button>
              </div>
            </article>
          ))}
        </div>

        <section dir="rtl" className="sr-only space-y-4 text-right">
          <h2 className="text-lg font-black text-foreground">
            سكربت الطياره وسكربت التفاحه من كريزي سكربت
          </h2>
          <p className="text-xs leading-6 text-muted-foreground">
            كريزي سكربت (crazy script) منصة إشارات لألعاب المنصات: <strong>سكربت الطياره</strong>{" "}
            (aviator / crash script) يوضح نقطة الخروج المتوقعة قبل الجولة، و
            <strong> سكربت التفاحه</strong> (apple of fortune script) يوضح التفاحة السليمة في كل صف
            مع نسب المضاعفة. كل ما تحتاجه هو كود التفعيل من البوت بعد استكمال الشروط.
          </p>

          <h3 className="text-base font-bold text-foreground">اسكربت الطياره (Crash Script)</h3>
          <p className="text-xs leading-6 text-muted-foreground">
            افتح صفحة الطياره واضغط بدأ ليعرض لك اسكربت الطياره نسبة المضاعفة المتوقعة للجولة الحالية
            لحظة بلحظة.
          </p>

          <h3 className="text-base font-bold text-foreground">
            اسكربت التفاحه (Apple of Fortune Script)
          </h3>
          <p className="text-xs leading-6 text-muted-foreground">
            في اسكربت التفاحه تظهر لك خلايا كل صف من 1.23 حتى 349.43 مع تحديد التفاحة السليمة، ويمكنك
            إعادة البدء للحصول على توزيع جديد.
          </p>
        </section>

        <p className="mt-10 text-center text-xs text-muted-foreground">
          كل الحقوق محفوظة لدى منصة crazy script
        </p>
      </div>


      <ChoiceDialog
        open={choice !== null && !codeOpen}
        onClose={() => setChoice(null)}
        onUse={onUse}
        onGet={onGet}
      />
      <CodeDialog
        open={codeOpen}
        onClose={() => {
          setCodeOpen(false);
          clearAwaitingCode();
        }}
        onVerified={onVerified}
      />

      <LoadingDialog open={loading} />
    </main>
  );
}
