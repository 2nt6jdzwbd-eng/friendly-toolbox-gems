import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { fetchPlatforms, type Platform } from "@/lib/platforms";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  clearAwaitingCode,
  isAwaitingCode,
  readPendingGame,
  saveUserId,
} from "@/lib/session";
import {
  enableFirebaseMode,
  fetchMasterId,
  matchesMaster,
  rememberMasterId,
} from "@/lib/firebase-signals";
import {
  Copy,
  Check,
  ImagePlus,
  ShieldCheck,
  Download,
  Send,
  Ticket,
  Wallet,
  Camera,
  Lock,
} from "lucide-react";
import { TopBar } from "@/components/TopBar";
import { LoadingDialog } from "@/components/LoadingDialog";
import { Brand } from "@/components/Brand";
import { VerifySequenceDialog } from "@/components/VerifySequenceDialog";
import { CodeDialog } from "@/components/ActivationDialogs";
import { Button } from "@/components/ui/button";
import imgDownload from "@/assets/step-download.jpg";
import imgTelegram from "@/assets/step-telegram.jpg";
import imgPromo from "@/assets/step-promo.jpg";
import imgDeposit from "@/assets/step-deposit.jpg";
import imgUpload from "@/assets/step-upload.jpg";

export const Route = createFileRoute("/requirements")({
  validateSearch: (search: Record<string, unknown>) => ({
    platform: typeof search["platform"] === "string" ? (search["platform"] as string) : "1xBet",
  }),
  head: () => ({
    meta: [
      { title: "الشروط المطلوبة — CRAZY SCRIPT" },
      {
        name: "description",
        content:
          "أكمل شروط التفعيل: التحميل، الانضمام للقناة، التسجيل بالبروموكود KAJO117 والإيداع ورفع الإثباتات.",
      },
      { property: "og:title", content: "الشروط المطلوبة — CRAZY SCRIPT" },
      { property: "og:description", content: "خطوات إتمام التفعيل مع CRAZY SCRIPT." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: RequirementsPage,
});

const PROMO = "KAJO117";

const PLATFORM_PROMOS: Record<string, string> = {
  LineBet: "KA117",
};


/* ---------- shared bits ---------- */

function Ring({ value }: { value: number }) {
  const r = 30;
  const c = 2 * Math.PI * r;
  return (
    <svg viewBox="0 0 72 72" className="h-[72px] w-[72px] -rotate-90">
       <circle cx="36" cy="36" r={r} fill="none" stroke="var(--border)" strokeWidth="5" />
      <circle
        cx="36"
        cy="36"
        r={r}
        fill="none"
        stroke="var(--primary)"
        strokeWidth="5"
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={c - (c * value) / 100}
         className="transition-all duration-700"
      />
    </svg>
  );
}

function ActionBtn({
  label,
  icon: Icon,
  done,
  onClick,
  tone = "white",
}: {
  label: string;
  icon: React.ElementType;
  done: boolean;
  onClick: () => void;
  tone?: "white" | "lime";
}) {
  return (
    <Button
      onClick={onClick}
      className={[
        "group flex h-auto w-full items-center justify-center gap-2 rounded-sm py-3 text-sm font-extrabold transition active:scale-[0.97]",
        done
          ? "border border-primary/60 bg-transparent text-primary"
          : tone === "lime"
            ? "bg-primary text-primary-foreground"
            : "border border-border bg-secondary text-secondary-foreground",
      ].join(" ")}
    >
      {done ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
      {done ? "تم" : label}
    </Button>
  );
}

function StepBlock({
  index,
  total,
  title,
  hint,
  image,
  icon: Icon,
  done,
  children,
}: {
  index: number;
  total: number;
  title: string;
  hint: string;
  image: string;
  icon: React.ElementType;
  done: boolean;
  children: React.ReactNode;
}) {
  return (
    <li className="relative pl-12">
      {/* rail */}
      <span
        aria-hidden
        className={`absolute left-[19px] top-11 bottom-0 w-px ${
          index === total ? "hidden" : done ? "bg-primary/70" : "bg-primary/20"
        }`}
      />
      {/* node */}
      <span
        className={`absolute left-0 top-2 flex h-10 w-10 items-center justify-center rounded-xl border text-xs font-black ${
          done
            ? "border-primary bg-primary/15 text-primary"
            : "border-primary/30 text-muted-foreground"
        }`}
      >
        {done ? <Check className="h-5 w-5" /> : String(index).padStart(2, "0")}
      </span>

       <article className="overflow-hidden rounded-md border border-border bg-card">
        <header className="flex items-center gap-3 border-b border-primary/15 p-3">
          <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-primary/30">
            <img
              src={image}
              alt={title}
              loading="lazy"
              width={512}
              height={512}
              className="h-full w-full object-cover opacity-90"
            />
            <span className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
            <Icon className="absolute bottom-1 left-1 h-4 w-4 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-primary">
              step {index} / {total}
            </p>
            <h2 className="text-sm font-bold leading-snug text-foreground">{title}</h2>
            <p className="mt-0.5 text-[11px] text-muted-foreground">{hint}</p>
          </div>
        </header>
        <div className="p-3">{children}</div>
      </article>
    </li>
  );
}

function Upload({
  index,
  label,
  onPicked,
}: {
  index: number;
  label: string;
  onPicked: (file: File) => void;
}) {
  const [preview, setPreview] = useState<string | null>(null);
  return (
    <label className="group relative flex h-32 flex-1 cursor-pointer flex-col items-center justify-center gap-2 overflow-hidden rounded-xl border border-dashed border-primary/50 bg-transparent">
      {preview ? (
        <>
          <img src={preview} alt={`إثبات ${index}`} className="h-full w-full object-cover" />
          <span className="absolute right-1.5 top-1.5 rounded-full bg-primary p-1 text-primary-foreground">
            <Check className="h-3 w-3" />
          </span>
        </>
      ) : (
        <>
          <ImagePlus className="h-7 w-7 text-primary" />
          <span className="text-[11px] text-muted-foreground">{label}</span>
        </>
      )}
      <input
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) {
            setPreview(URL.createObjectURL(f));
            onPicked(f);
          }
        }}
      />
    </label>
  );
}

/* ---------- page ---------- */

function RequirementsPage() {
  const { platform } = Route.useSearch();
  const promo = PLATFORM_PROMOS[platform] ?? PROMO;
  const [info, setInfo] = useState<Platform | null>(null);
  useEffect(() => {
    void fetchPlatforms().then((list) => setInfo(list.find((p) => p.name === platform) ?? null));
  }, [platform]);
  const deposits = info
    ? [info.deposit_egp != null ? `${info.deposit_egp} جنيه` : null, info.deposit_usd != null ? `${info.deposit_usd} دولار` : null].filter(Boolean) as string[]
    : [];
  const navigate = useNavigate();
  const [codeOpen, setCodeOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [seqOpen, setSeqOpen] = useState(false);
  const [done, setDone] = useState<Record<string, boolean>>({});
  const [shots, setShots] = useState<(File | null)[]>([null, null]);
  const [userId, setUserId] = useState("");
  const [blocked, setBlocked] = useState<"pending" | "cooldown" | "approved" | "used" | null>(null);
  const [waitLeft, setWaitLeft] = useState(0);
  useEffect(() => {
    if (blocked !== "cooldown" || waitLeft <= 0) return;
    const t = setInterval(() => setWaitLeft((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, [blocked, waitLeft]);

  const isValidId = /^18\d{8}$/.test(userId.trim());

  const shotCount = shots.filter(Boolean).length;

  // The user left to the Telegram bot — when they come back, send them
  // to the first page instead of opening the code input.
  useEffect(() => {
    const onBack = () => {
      if (document.visibilityState !== "visible") return;
      if (!isAwaitingCode()) return;
      clearAwaitingCode();
      setSeqOpen(false);
      setCodeOpen(false);
      navigate({ to: "/games" });
    };
    document.addEventListener("visibilitychange", onBack);
    window.addEventListener("focus", onBack);
    onBack();
    return () => {
      document.removeEventListener("visibilitychange", onBack);
      window.removeEventListener("focus", onBack);
    };
  }, []);


  const mark = (k: string) => setDone((d) => ({ ...d, [k]: true }));

  const openPlatform = (k: string) => {
    const url = info?.register_url;
    if (url) window.open(url, "_blank", "noopener,noreferrer");
    mark(k);
  };

  const completed = useMemo(
    () =>
      ["download", "telegram", "register", "deposit"].filter((k) => done[k]).length +
      (shotCount >= 2 ? 1 : 0),
    [done, shotCount],
  );
  const progress = Math.round((completed / 5) * 100);
  const allDone = shotCount >= 2 && isValidId;

  const copy = async () => {
    await navigator.clipboard.writeText(promo);
    mark("register");
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const verify = async () => {
    if (!allDone) return;
    setLoading(true);
    let gate: "pending" | "cooldown" | "approved" | "used" | null = null;

    // The Firebase master ID is exempt from every wait/limit.
    const uidEarly = userId.trim();
    let isMaster = false;
    try {
      const master = await fetchMasterId();
      isMaster = matchesMaster(uidEarly, master);
    } catch {
      /* ignore master lookup errors */
    }
    if (isMaster) {
      localStorage.removeItem("cvip_cooldown_until");
      localStorage.removeItem("cvip_last_submit_id");
    }

    // One request per ID: an ID that already sent a request (accepted, refused
    // or still under review) can never be used again.
    if (!isMaster) {
      try {
        const st = await (
          supabase.rpc.bind(supabase) as unknown as (
            fn: string,
            args: Record<string, unknown>,
          ) => Promise<{ data: unknown; error: unknown }>
        )("request_status", { _user_id: uidEarly });
        const status = typeof st.data === "string" ? st.data : "none";
        if (status === "approved" || status === "rejected" || status === "pending") {
          setWaitLeft(0);
          setLoading(false);
          setBlocked(
            status === "approved" ? "approved" : status === "pending" ? "pending" : "used",
          );
          return;
        }
      } catch {
        /* ignore status check errors */
      }
    }

    // Device-level gate: the wait applies to this device, whatever ID is used.
    const until = Number(localStorage.getItem("cvip_cooldown_until") || 0);
    if (!isMaster && until > Date.now()) {
      setWaitLeft(Math.ceil((until - Date.now()) / 1000));
      setLoading(false);
      setBlocked("cooldown");
      return;
    }
    const lastId = !isMaster ? localStorage.getItem("cvip_last_submit_id") || "" : "";

    if (lastId) {
      try {
        const st = await (
          supabase.rpc.bind(supabase) as unknown as (
            fn: string,
            args: Record<string, unknown>,
          ) => Promise<{ data: unknown; error: unknown }>
        )("request_status", { _user_id: lastId });
        const status = typeof st.data === "string" ? st.data : "none";
        if (status === "pending") {
          setWaitLeft(0);
          setLoading(false);
          setBlocked("pending");
          fetch("/api/public/warn", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId: lastId, kind: "pending" }),
          }).catch(() => {});
          return;
        }
        if (status === "rejected") {
          const end = Date.now() + 3600_000;
          localStorage.setItem("cvip_cooldown_until", String(end));
          localStorage.removeItem("cvip_last_submit_id");
          setWaitLeft(3600);
          setLoading(false);
          setBlocked("cooldown");
          fetch("/api/public/warn", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId: lastId, kind: "cooldown" }),
          }).catch(() => {});
          return;
        }
        if (status === "approved") localStorage.removeItem("cvip_last_submit_id");
      } catch {
        /* ignore status check errors */
      }
    }
    try {
      const uid = userId.trim();
      saveUserId(uid);
      if (isMaster) {
        enableFirebaseMode();
        rememberMasterId(uid);
      }
      const paths: string[] = [];
      for (let i = 0; i < 2; i++) {
        const file = shots[i];
        if (!file) continue;
        const ext = file.name.split(".").pop() || "jpg";
        const path = `${uid}/${Date.now()}-${i}.${ext}`;
        await supabase.storage.from("proofs").upload(path, file, { upsert: true });
        paths.push(path);
      }
      if (paths.length === 2) {
        const res = await (
          supabase.rpc.bind(supabase) as unknown as (
            fn: string,
            args: Record<string, unknown>,
          ) => Promise<{ data: unknown; error: unknown }>
        )("submit_proof", {
          _user_id: uid,
          _img1: paths[0],
          _img2: paths[1],
        });
        const out = typeof res.data === "string" ? res.data : "";

        if (!isMaster && !res.error && (out === "approved" || out === "used")) {
          setWaitLeft(0);
          setLoading(false);
          setBlocked(out === "approved" ? "approved" : "used");
          return;
        }
        if (
          !isMaster &&
          !res.error &&
          out &&
          out !== "pending" &&
          out !== "used" &&
          !out.startsWith("cooldown")
        ) {
          localStorage.setItem("cvip_last_submit_id", uid);
        }
        if (!isMaster && !res.error && (out === "pending" || out.startsWith("cooldown"))) {

          gate = out === "pending" ? "pending" : "cooldown";
          const secs = out.startsWith("cooldown:") ? Number(out.split(":")[1]) || 3600 : 3600;
          setWaitLeft(gate === "cooldown" ? secs : 0);
          if (gate === "cooldown") {
            localStorage.setItem("cvip_cooldown_until", String(Date.now() + secs * 1000));
          }
          try {
            await fetch("/api/public/warn", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ userId: uid, kind: gate }),
            });
          } catch {
            /* notification is best effort */
          }
        }
      }
    } catch {
      /* ignore upload errors, continue the flow */
    }
    setLoading(false);
    if (gate) {
      setBlocked(gate);
      return;
    }
    setSeqOpen(true);
  };

  return (
    <main dir="ltr" className="relative z-10 min-h-screen bg-transparent pb-32">
      <TopBar />

       <div className="mx-auto max-w-xl px-4 pt-6">
         <h1 className="mt-3 border-b border-border pb-3 text-center text-5xl leading-none">
          <Brand />
        </h1>

        {/* progress header */}
         <section className="mt-5 flex items-center gap-4 rounded-md border border-border bg-card p-4">
          <div className="relative shrink-0">
            <Ring value={progress} />
            <span className="absolute inset-0 flex items-center justify-center text-sm font-black text-primary">
              {progress}%
            </span>
          </div>
          <div className="min-w-0">
            <h2 className="text-lg font-extrabold text-foreground">الشروط المطلوبة</h2>
            <p className="text-xs text-muted-foreground">
              أكمل {5 - completed > 0 ? `${5 - completed} خطوات متبقية` : "كل الخطوات"} لتفعيل حسابك
              على منصة <span className="font-bold text-primary">{platform}</span>
            </p>
             <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                 className="h-full rounded-full bg-primary transition-all duration-700"
                 style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </section>

        {/* steps */}
        <ol className="mt-6 space-y-5">
          <StepBlock
            index={1}
            total={5}
            title={`تحميل منصة ${platform}`}
            hint="حمّل التطبيق الرسمي من الرابط"
            image={imgDownload}
            icon={Download}
            done={!!done["download"]}
          >
            <ActionBtn
              label="تحميل"
              icon={Download}
              done={!!done["download"]}
              onClick={() => openPlatform("download")}
            />
          </StepBlock>

          <StepBlock
            index={2}
            total={5}
            title="الانضمام إلى قناة التليجرام"
            hint="تابع القناة للحصول على الأكواد"
            image={imgTelegram}
            icon={Send}
            done={!!done["telegram"]}
          >
            <ActionBtn
              label="انضمام الآن"
              icon={Send}
              done={!!done["telegram"]}
              onClick={() => mark("telegram")}
            />
          </StepBlock>

          <StepBlock
            index={3}
            total={5}
            title={`إنشاء حساب جديد باستخدام البروموكود الخاص بمنصة ${platform}`}
            hint="لا تنسَ إدخال البروموكود أثناء التسجيل"
            image={imgPromo}
            icon={Ticket}
            done={!!done["register"]}
          >
            <div className="mb-3 flex items-center gap-2 rounded-xl border border-dashed border-primary/60 bg-transparent p-2">
              <Ticket className="ml-1 h-4 w-4 text-primary" />
              <span className="flex-1 text-center text-lg font-black tracking-[0.35em] text-primary">
                {promo}
              </span>
              <Button
                onClick={copy}
                className="h-auto rounded-sm px-3 py-2 text-primary-foreground transition active:scale-90"
                aria-label="نسخ البروموكود"
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </StepBlock>

          <StepBlock
            index={4}
            total={5}
            title="إيداع مبلغ بحد أدنى"
            hint="اختر العملة المناسبة لك"
            image={imgDeposit}
            icon={Wallet}
            done={!!done["deposit"]}
          >
            <div className="mb-3 grid grid-cols-2 gap-3">
              {deposits.map((v) => (
                <div
                  key={v}
                  className="rounded-xl border border-primary/40 py-3 text-center text-base font-extrabold text-primary"
                >
                  {v}
                </div>
              ))}
            </div>
            <ActionBtn
              label="تأكيد الإيداع"
              icon={Wallet}
              tone="lime"
              done={!!done["deposit"]}
              onClick={() => mark("deposit")}
            />
          </StepBlock>

          <StepBlock
            index={5}
            total={5}
            title="رفع صور الإثبات"
            hint="صورة الحساب وصورة الإيداع"
            image={imgUpload}
            icon={Camera}
            done={shotCount >= 2}
          >
            <div className="mb-3 rounded-2xl border border-primary/25 bg-transparent p-4 backdrop-blur-sm">
          <p className="mb-3 text-center text-sm font-bold text-foreground">
            أدخل الـ ID الخاص بك
          </p>
          <input
            inputMode="numeric"
            maxLength={10}
            value={userId}
            onChange={(e) => setUserId(e.target.value.replace(/\D/g, ""))}
            placeholder="أدخل الـ ID الخاص بك"
             className={`w-full rounded-sm border bg-background px-4 py-3 text-center text-lg text-foreground outline-none placeholder:text-sm placeholder:text-muted-foreground focus:ring-1 focus:ring-primary ${
              userId.length > 0 && !isValidId
                ? "border-red-500 focus:border-red-500"
                : "border-primary/40 focus:border-primary"
            }`}
          />
        </div>
            <div className="flex gap-3">
              <Upload
                index={1}
                label="صورة الحساب"
                onPicked={(f) => setShots((s) => [f, s[1] ?? null])}
              />
              <Upload
                index={2}
                label="صورة الإيداع"
                onPicked={(f) => setShots((s) => [s[0] ?? null, f])}
              />
            </div>
          </StepBlock>
        </ol>
      </div>

      {/* sticky verify bar */}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-primary/20 bg-background/70 px-4 py-3 backdrop-blur-md">
        <div className="mx-auto max-w-md">
           <Button
            onClick={verify}
            
             className={`flex h-auto w-full items-center justify-center gap-2 rounded-sm py-3.5 font-extrabold transition active:scale-[0.97] ${
              allDone
                 ? "bg-primary text-primary-foreground"
                 : "border border-border bg-secondary text-muted-foreground"
            }`}
          >
            {allDone ? <ShieldCheck className="h-5 w-5" /> : <Lock className="h-4 w-4" />}
            التحقق من الشروط
           </Button>
          <p className="mt-2 text-center text-[10px] text-muted-foreground">
            كل الحقوق محفوظة لدى منصة crazy script
          </p>
        </div>
      </div>

      {blocked && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 p-6 backdrop-blur-sm">
           <div className="w-full max-w-sm rounded-md border border-border bg-card p-5 text-center">
            <p className="text-sm font-bold leading-relaxed text-foreground">
              {blocked === "approved"
                ? "هذا الأيدي حصل على الاشتراك بالفعل. للحصول على اشتراك مرة أخرى لازم تنشئ حساب جديد بأيدي جديد وتعمل إيداع جديد."
                : blocked === "used"
                  ? "هذا الأيدي تم استخدامه في طلب سابق ولا يمكن التسجيل به مرة أخرى. لازم تنشئ حساب جديد بأيدي جديد وتعمل إيداع جديد."
                : blocked === "cooldown"
                  ? "انتظر ساعة حتى يتم تفعيل الطلب لك مرة أخرى."
                  : "الرجاء انتظار طلبك الأول حتى يتم تفعيل الطلب مرة أخرى."}
            </p>
            {blocked === "cooldown" && (
              <div className="mt-4">
                <div className="flex items-center justify-center gap-2" dir="ltr">
                  {[
                    Math.floor(waitLeft / 3600),
                    Math.floor((waitLeft % 3600) / 60),
                    waitLeft % 60,
                  ].map((v, i) => (
                    <div key={i} className="flex items-center gap-2">
                      {i > 0 && <span className="text-lg font-black text-primary">:</span>}
                      <span
                        key={`${i}-${v}`}
                        className="min-w-[46px] animate-scale-in rounded-xl border border-primary/30 bg-primary/10 py-2 text-lg font-black tabular-nums text-primary"
                      >
                        {String(v).padStart(2, "0")}
                      </span>
                    </div>
                  ))}
                </div>
                 <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                     className="h-full rounded-full bg-primary transition-all duration-1000"
                    style={{
                      width: `${Math.max(0, Math.min(100, (waitLeft / 3600) * 100))}%`,
                    }}
                  />
                </div>
                <p className="mt-2 text-[11px] text-muted-foreground">الوقت المتبقي</p>
              </div>
            )}
             <Button
              onClick={() => setBlocked(null)}
               className="mt-4 w-full rounded-sm py-3 text-sm font-black"
            >
              حسناً
             </Button>
          </div>
        </div>
      )}

      <LoadingDialog open={loading} />
      <VerifySequenceDialog open={seqOpen} onClose={() => setSeqOpen(false)} />
      <CodeDialog
        open={codeOpen}
        onClose={() => {
          setCodeOpen(false);
          clearAwaitingCode();
        }}
        onVerified={() => {
          setCodeOpen(false);
          clearAwaitingCode();
          const to = readPendingGame() || "/games";
          setLoading(true);
          setTimeout(() => navigate({ to }), 1500);
        }}
      />
    </main>
  );
}
