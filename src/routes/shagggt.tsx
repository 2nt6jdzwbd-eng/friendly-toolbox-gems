import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { Check, Loader2, Trash2, X } from "lucide-react";
import { TopBar } from "@/components/TopBar";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { PlatformManager } from "@/components/PlatformManager";

export const Route = createFileRoute("/shagggt")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "لوحة المراجعة — CRAZY SCRIPT" },
      { name: "description", content: "مراجعة إثباتات المستخدمين وقبول أو رفض طلبات التفعيل." },
      { property: "og:title", content: "لوحة المراجعة — CRAZY SCRIPT" },
      { property: "og:description", content: "قبول أو رفض طلبات التفعيل في CRAZY SCRIPT." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AdminGate,
});

type Row = {
  id: string;
  user_id: string;
  telegram_id: string | null;
  activation_code: string | null;
  duration_minutes: number | null;
  image1_url: string;
  image2_url: string;
  status: string;
  created_at: string;
};

type Tab = "pending" | "approved" | "rejected";

const TABS: { key: Tab; label: string }[] = [
  { key: "pending", label: "Pending request" },
  { key: "approved", label: "Accept" },
  { key: "rejected", label: "Rejected" },
];

const rpc = supabase.rpc.bind(supabase) as unknown as (
  fn: string,
  args: Record<string, unknown>,
) => Promise<{ data: unknown; error: unknown }>;


const GAME_NAMES = ["Apple of fortune", "Crash"];

const ADMIN_PASSWORD = "moneyegypt";
const GATE_KEY = "shagggt_unlocked";

function AdminGate() {
  const [unlocked, setUnlocked] = useState(
    () => typeof window !== "undefined" && window.sessionStorage.getItem(GATE_KEY) === "1",
  );
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);

  if (unlocked) return <AdminPage />;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      window.sessionStorage.setItem(GATE_KEY, "1");
      setUnlocked(true);
    } else {
      setError(true);
      setPassword("");
    }
  };

  return (
    <main dir="rtl" className="relative z-10 flex min-h-screen items-center justify-center bg-transparent px-4">
      <form
        onSubmit={submit}
        className="w-full max-w-xs rounded-md border border-border bg-card p-6 text-center"
      >
        <h1 className="text-lg font-black text-foreground">لوحة المراجعة</h1>
        <p className="mt-1 text-xs text-muted-foreground">اكتب كلمة السر للدخول</p>
        <input
          type="password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            setError(false);
          }}
          autoFocus
          autoComplete="current-password"
          placeholder="كلمة السر"
          className="mt-4 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-center text-sm text-foreground outline-none focus:border-primary"
        />
        {error && <p className="mt-2 text-xs font-bold text-red-400">كلمة السر غير صحيحة</p>}
        <button
          type="submit"
          className="mt-4 w-full rounded-lg bg-primary py-2.5 text-sm font-black text-primary-foreground transition active:scale-95"
        >
          دخول
        </button>
      </form>
    </main>
  );
}

function AdminPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("pending");
  const [preview, setPreview] = useState<string | null>(null);
  const [rates, setRates] = useState<Record<string, number>>({});
  const [savingRate, setSavingRate] = useState<string | null>(null);
  const pass = "HACKSD";

  const loadRates = useCallback(async () => {
    const { data } = await supabase.from("game_rates").select("name, rate");
    const map: Record<string, number> = {};
    (data ?? []).forEach((r) => (map[r.name] = r.rate));
    setRates(map);
  }, []);

  const saveRate = async (name: string) => {
    setSavingRate(name);
    const { error } = await rpc("admin_set_game_rate", {
      _pass: pass,
      _name: name,
      _rate: rates[name] ?? 90,
    });
    setSavingRate(null);
    if (error) {
      window.alert("تعذر تحديث نسبة الفوز");
      void loadRates();
    }
  };





  const load = useCallback(async () => {
    const { data } = (await rpc("admin_list_submissions", { _pass: pass })) as { data: Row[] | null };

    const sign = async (path: string) => {
      if (path.startsWith("http")) return path;
      const { data: signed } = await supabase.storage.from("proofs").createSignedUrl(path, 3600);
      return signed?.signedUrl ?? "";
    };

    const withUrls = await Promise.all(
      (data ?? []).map(async (r) => ({
        ...r,
        image1_url: await sign(r.image1_url),
        image2_url: await sign(r.image2_url),
      })),
    );
    setRows(withUrls);
    setLoading(false);
  }, [pass]);

  useEffect(() => {
    void load();
    void loadRates();
  }, [load, loadRates]);

  const setStatus = async (row: Row, status: "approved" | "rejected") => {
    setBusy(row.id);
    try {
      const statusResult = await rpc("admin_set_submission_status", {
        _pass: pass,
        _id: row.id,
        _status: status,
      });
      if (statusResult.error) throw new Error("تعذر تحديث حالة الطلب");

      setRows((current) => current.map((item) => (item.id === row.id ? { ...item, status } : item)));

      const notification = await fetch("/api/public/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pass,
          submissionId: row.id,
          telegramId: row.telegram_id,
          activationCode: row.activation_code,
          durationMinutes: row.duration_minutes,
          status,
        }),
      });

      if (!notification.ok) {
        const reason = await notification.text();
        const messages: Record<string, string> = {
          "telegram chat not linked": "المستخدم لم يبدأ محادثة البوت من رابط الموقع، لذلك لا يوجد شات لإرسال الكود إليه",
          "activation code not found": "لم يتم إنشاء كود لهذا المستخدم بعد؛ يجب أن يبدأ البوت من رابط الموقع",
          "telegram blocked": "المستخدم حظر البوت أو حذف المحادثة",
        };
        throw new Error(messages[reason] ?? `تعذر إرسال رسالة تليجرام (${reason || notification.status})`);
      }
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "حدث خطأ أثناء تنفيذ الطلب");
    } finally {
      setBusy(null);
    }
  };

  const remove = async (row: Row) => {
    setBusy(row.id);
    if (row.telegram_id) {
      await fetch("/api/public/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pass,
          submissionId: row.id,
          telegramId: row.telegram_id,
          status: "rejected",
        }),
      });
    }
    await rpc("admin_delete_submission", { _pass: pass, _id: row.id });
    setRows((r) => r.filter((x) => x.id !== row.id));
    setBusy(null);
  };

  const visible = rows.filter((r) => (tab === "pending" ? r.status !== "approved" && r.status !== "rejected" : r.status === tab));

  return (
    <main dir="ltr" className="relative z-10 min-h-screen bg-transparent pb-20">
      <TopBar />
      <div className="mx-auto max-w-md px-4 pt-6">
        <h1 className="mt-3 border-b border-border pb-3 text-center text-4xl text-foreground">لوحة المراجعة</h1>

        <PlatformManager pass={pass} />

        <section dir="rtl" className="mt-4 rounded-md border border-border bg-card p-3">
          <h2 className="text-center text-xs font-black text-foreground">نسبة الفوز (Win rate) للألعاب</h2>
          <div className="mt-3 flex flex-col gap-2">
            {GAME_NAMES.map((name) => {
              const val = rates[name] ?? 90;
              return (
                <div key={name} className="rounded-xl border border-primary/20 px-3 py-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-black text-foreground">{name}</span>
                    <span className="rounded-md border border-primary/40 px-2 py-0.5 text-[11px] font-black text-primary">
                      {val}%
                    </span>
                  </div>
                  <div className="mt-2 flex items-center gap-3">
                    <input
                      type="range"
                      min={1}
                      max={100}
                      step={1}
                      value={val}
                      onChange={(e) =>
                        setRates((cur) => ({ ...cur, [name]: Number(e.target.value) }))
                      }
                      aria-label={`نسبة الفوز ${name}`}
                      className="h-2 flex-1 cursor-pointer appearance-none rounded-full bg-primary/20 accent-primary outline-none"
                    />
                    <button
                      onClick={() => saveRate(name)}
                      disabled={savingRate === name}
                      className="rounded-lg bg-primary/20 px-3 py-1.5 text-[11px] font-black text-primary transition active:scale-95 disabled:opacity-50"
                    >
                      {savingRate === name ? "..." : "حفظ"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <div className="mt-5 grid grid-cols-3 gap-2">
          {TABS.map((t) => {
            const count = rows.filter((r) =>
              t.key === "pending" ? r.status !== "approved" && r.status !== "rejected" : r.status === t.key,
            ).length;
            const active = tab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`rounded-xl border px-2 py-2 text-[11px] font-black transition active:scale-95 ${
                  active
                    ? "border-primary bg-primary/15 text-primary"
                    : "border-primary/25 text-muted-foreground"
                }`}
              >
                {t.label}
                <span className="ml-1 opacity-70">({count})</span>
              </button>
            );
          })}
        </div>

        {loading && (
          <div className="mt-10 flex justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        )}

        {!loading && visible.length === 0 && (
          <p className="mt-10 text-center text-sm text-muted-foreground">لا توجد طلبات هنا</p>
        )}

        <div className="mt-6 flex flex-col gap-6">
          {visible.map((r) => (
            <article
              key={r.id}
               className="overflow-hidden rounded-md border border-border bg-card p-3"
            >
              <div className="grid grid-cols-2 gap-2">
                {[r.image1_url, r.image2_url].map((u, i) => (
                  <button key={i} type="button" onClick={() => setPreview(u)} className="block">
                    <img
                      src={u}
                      alt={`إثبات ${i + 1}`}
                      loading="lazy"
                      className="h-40 w-full rounded-xl border border-primary/25 object-cover"
                    />
                  </button>
                ))}
              </div>

              <p className="mt-3 text-center text-sm font-black tracking-widest text-primary">
                {r.user_id}
              </p>
              <p className="mt-1 text-center text-[11px] font-bold text-muted-foreground" dir="ltr">
                {new Date(r.created_at).toLocaleString("en-GB", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: true,
                })}
              </p>

              {r.status === "pending" ? (
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setStatus(r, "rejected")}
                    disabled={busy === r.id}
                     className="flex items-center justify-center gap-2 rounded-sm border border-destructive/60 py-3 text-sm font-black text-destructive transition active:scale-95 disabled:opacity-50"
                  >
                    <X className="h-4 w-4" /> رفض
                  </button>
                  <button
                    onClick={() => setStatus(r, "approved")}
                    disabled={busy === r.id}
                     className="flex items-center justify-center gap-2 rounded-sm bg-primary py-3 text-sm font-black text-primary-foreground transition active:scale-95 disabled:opacity-50"
                  >
                    <Check className="h-4 w-4" /> قبول
                  </button>
                </div>
              ) : (
                <p
                  className={`mt-3 text-center text-sm font-black ${
                    r.status === "approved" ? "text-primary" : "text-red-400"
                  }`}
                >
                  {r.status === "approved" ? "مقبول" : "مرفوض"}
                </p>
              )}

              <button
                onClick={() => remove(r)}
                disabled={busy === r.id}
                 className="mt-3 flex w-full items-center justify-center gap-2 rounded-sm border border-border py-2 text-xs font-bold text-muted-foreground transition active:scale-95 disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" /> حذف الطلب
              </button>
            </article>
          ))}
        </div>
      </div>

      {preview && (
        <div
          onClick={() => setPreview(null)}
           className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 p-4"
        >
          <img src={preview} alt="معاينة الإثبات" className="max-h-[85vh] max-w-full rounded-xl" />
           <Button
            type="button"
            onClick={() => setPreview(null)}
            aria-label="إغلاق"
             variant="outline"
             size="icon"
             className="absolute right-4 top-4 border-border"
          >
            <X className="h-5 w-5" />
           </Button>
        </div>
      )}
    </main>
  );
}
