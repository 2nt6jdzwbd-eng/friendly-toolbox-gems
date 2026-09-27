import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Check, Headphones, KeyRound, Play, Send, ShieldCheck, Youtube } from "lucide-react";
import { TopBar } from "@/components/TopBar";
import { LoadingDialog } from "@/components/LoadingDialog";
import { Brand } from "@/components/Brand";
import { Button } from "@/components/ui/button";
import { fetchPlatforms, platformLogo, type Platform } from "@/lib/platforms";



export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "الشروط — CRAZY SCRIPT" },
      { name: "description", content: "أدخل الـ ID واختر المنصة للحصول على كود التفعيل الخاص بك من CRAZY SCRIPT." },
      { property: "og:title", content: "الشروط — CRAZY SCRIPT" },
      { property: "og:description", content: "خطوات الحصول على كود التفعيل من CRAZY SCRIPT." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: TermsPage,
});


const PLATFORM_VIDEOS: Record<string, string> = {
  Ultrapari: "https://www.image2url.com/r2/default/videos/1787257394601-acdcd0ff-9b86-4771-acea-43007f5ad6f0.mp4",
  "1xBet": "https://www.image2url.com/r2/default/videos/1787235653264-c44094cc-4385-4fe3-978e-a3feb4a2e78c.mp4",
  LineBet: "https://www.image2url.com/r2/default/videos/1787234470504-9edf40ff-3f9c-4960-a26c-688a1dd565de.mp4",
  WinWin: "https://www.image2url.com/r2/default/videos/1787235488828-185d05cd-cc1a-4859-ade8-7ee4789a7d2a.mp4",
};

function Reveal({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => entries[0]?.isIntersecting && setShown(true),
      { threshold: 0.12 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ${shown ? "translate-y-0 scale-100 opacity-100" : "translate-y-10 scale-[0.97] opacity-0"}`}
    >
      {children}
    </div>
  );
}

function TimelineStep({
  n,
  label,
  active,
  done,
  children,
}: {
  n: number;
  label: string;
  active: boolean;
  done: boolean;
  children: React.ReactNode;
}) {
  return (
    <Reveal>
      <div className="relative pl-10">
        {/* rail */}
        <span className="absolute left-[15px] top-9 h-[calc(100%-1rem)] w-px bg-gradient-to-b from-primary/50 to-transparent" />
        <span
          className={`absolute left-0 top-1 flex h-8 w-8 items-center justify-center rounded-full border text-xs font-black transition-all ${
            done || active
               ? "border-primary text-primary"
              : "border-border text-muted-foreground"
          }`}
        >
          {done ? <Check className="h-4 w-4" /> : n}
        </span>

        <p className="mb-3 text-[11px] font-black uppercase tracking-[0.3em] text-muted-foreground">
          {label}
        </p>
         <div className="relative overflow-hidden rounded-md border border-border bg-card p-4">
          <span className="pointer-events-none absolute left-0 top-0 h-full w-[2px] bg-gradient-to-b from-primary/80 via-primary/20 to-transparent" />
          {children}
        </div>
      </div>
    </Reveal>
  );
}

function TermsPage() {
  const navigate = useNavigate();
  const [platform, setPlatform] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [disabled, setDisabled] = useState<string[]>([]);
  const [maintenance, setMaintenance] = useState(false);
  const [platforms, setPlatforms] = useState<Platform[]>([]);

  useEffect(() => {
    void (async () => {
      const list = await fetchPlatforms();
      setPlatforms(list);
      setDisabled(list.filter((r) => r.disabled).map((r) => r.name));
    })();
  }, []);

  const ready = Boolean(platform);

  const pick = (name: string) => {
    if (disabled.includes(name)) {
      setPlatform(null);
      setMaintenance(true);
      return;
    }
    setPlatform(name);
  };

  const submit = () => {
    if (!ready || !platform) return;
    if (disabled.includes(platform)) {
      setMaintenance(true);
      return;
    }
    setLoading(true);
    setTimeout(() => navigate({ to: "/requirements", search: { platform } }), 3000);
  };



  return (
    <main dir="ltr" className="relative z-10 min-h-screen bg-transparent pb-16">
      <TopBar />

       <div className="mx-auto max-w-xl px-4 pt-6">
        {/* hero */}
         <div className="relative border-b border-border p-5 text-center">
          <div className="relative">
             <h1 className="mt-3 text-5xl leading-none">
              <Brand />
            </h1>
             <p className="mt-2 inline-flex items-center gap-1.5 border-l-2 border-primary bg-primary/10 px-3 py-1 text-[10px] font-bold uppercase text-muted-foreground">
              <KeyRound className="h-3 w-3 text-primary" /> activation
            </p>
          </div>
        </div>

        {/* steps timeline */}
        <div className="mt-8 space-y-8">
          <TimelineStep n={1} label="step 01 — tutorial" active done={false}>
            <div
               className="relative mx-auto overflow-hidden rounded-md border border-border bg-card"
              style={{ width: 280, height: 180 }}
            >
              {platform ? (
                <video
                  key={platform}
                  src={PLATFORM_VIDEOS[platform]}
                  autoPlay
                  controls
                  playsInline
                  preload="metadata"
                  className="relative z-10 h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center gap-2 px-4 text-center">
                  <Play className="h-8 w-8 text-primary/60" />
                  <p className="text-sm font-bold text-muted-foreground">
                    الرجاء اختيار المنصه لعرض فيديو الشرح الخاص بها
                  </p>
                </div>
              )}
            </div>
            <p className="mt-2 text-center text-xs text-muted-foreground">
              {platform ? `فيديو شرح منصة ${platform}` : "اختر المنصة لعرض فيديو الشرح"}
            </p>
          </TimelineStep>

          <TimelineStep n={2} label="step 02 — platform" active={!platform} done={Boolean(platform)}>

            <div className="flex flex-wrap justify-center gap-3">
              {platforms.map((p) => (
                 <Button
                  key={p.name}
                  onClick={() => pick(p.name)}
                  style={{ width: 150, height: 80 }}
                   variant="outline"
                   className={`group relative flex flex-col items-center justify-center gap-1 overflow-hidden rounded-sm border bg-card text-sm font-black transition-all active:scale-95 ${
                    platform === p.name
                       ? "border-primary text-primary"
                      : "border-border text-foreground/80 hover:border-primary/50"
                  }`}
                >
                  {platform === p.name && <span className="absolute inset-0 bg-primary/10" />}
                  <img
                    src={platformLogo(p)}
                    alt={`${p.name} logo`}
                    loading="lazy"
                    width={96}
                    height={40}
                    className="relative z-10 h-9 w-24 object-contain"
                  />
                  <span className="relative z-10">{p.name}</span>
                  {platform === p.name && (
                    <span className="absolute right-2 top-2 z-10 rounded-full bg-primary p-1">
                      <Check className="h-3.5 w-3.5 text-primary-foreground" />
                    </span>
                  )}
                 </Button>
              ))}
            </div>
          </TimelineStep>
        </div>

        {/* actions */}
        <Reveal>
          <div className="mt-10 flex gap-3">
            <a
              href="https://t.me/A_R_1_R"
              target="_blank"
              rel="noreferrer"
               className="flex flex-1 items-center justify-center gap-2 rounded-sm border border-border bg-secondary py-3.5 text-sm font-bold text-secondary-foreground transition active:scale-95"
            >
              <Headphones className="h-4 w-4" /> التواصل مع الدعم
            </a>
             <Button
              onClick={submit}
              disabled={!ready}
               className="h-auto flex flex-1 items-center justify-center gap-2 rounded-sm py-3.5 text-sm font-black transition active:scale-95 disabled:opacity-40"
            >
              <ShieldCheck className="h-4 w-4" /> الحصول على كود تفعيل
             </Button>
          </div>
        </Reveal>

        {/* socials */}
        <div className="mt-14 flex gap-3">
          <a
            href="https://t.me/+e6g2Fxf-C2I4NzZk"
            target="_blank"
            rel="noreferrer"
             className="flex flex-1 items-center justify-center gap-2 rounded-sm border border-border bg-card py-3 text-sm font-bold text-foreground transition hover:border-primary"
          >
            <Send className="h-4 w-4 text-primary" /> Telegram channel
          </a>
          <a
            href="https://youtube.com/@1xbet1113?si=Qk6ep3-nb1oL2ezq"
            target="_blank"
            rel="noreferrer"
             className="flex flex-1 items-center justify-center gap-2 rounded-sm border border-border bg-card py-3 text-sm font-bold text-foreground transition hover:border-primary"
          >
            <Youtube className="h-4 w-4 text-primary" /> Youtube channel
          </a>
        </div>

        <p className="mt-10 text-center text-xs text-muted-foreground">
          كل الحقوق محفوظة لدى منصة crazy script
        </p>
      </div>

      {maintenance && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 p-6">
           <div dir="rtl" className="w-full max-w-sm rounded-md border border-border bg-card p-6 text-center">
            <p className="text-sm font-black leading-7 text-foreground">
              المنصة تحت الصيانة الآن، الرجاء اختيار منصة أخرى
            </p>
             <Button
              onClick={() => setMaintenance(false)}
               className="mt-5 w-full rounded-sm py-3 text-sm font-black transition active:scale-95"
            >
              حسناً
             </Button>
          </div>
        </div>
      )}

      <LoadingDialog open={loading} />
    </main>
  );
}
