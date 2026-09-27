import { useCallback, useEffect, useState } from "react";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { fetchPlatforms, fileToLogoDataUrl, platformLogo, type Platform } from "@/lib/platforms";

const rpc = supabase.rpc.bind(supabase) as unknown as (
  fn: string,
  args: Record<string, unknown>,
) => Promise<{ data: unknown; error: unknown }>;

type Draft = { oldName: string; name: string; logo: string | null; link: string; usd: string; egp: string };
const empty: Draft = { oldName: "", name: "", logo: null, link: "", usd: "", egp: "" };

const input =
  "w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground outline-none focus:border-primary";

export function PlatformManager({ pass }: { pass: string }) {
  const [items, setItems] = useState<Platform[]>([]);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => setItems(await fetchPlatforms()), []);
  useEffect(() => void load(), [load]);

  const toggle = async (p: Platform) => {
    setItems((cur) => cur.map((x) => (x.name === p.name ? { ...x, disabled: !p.disabled } : x)));
    const { error } = await rpc("admin_set_platform_disabled", { _pass: pass, _name: p.name, _disabled: !p.disabled });
    if (error) {
      window.alert("تعذر تحديث حالة المنصة");
      void load();
    }
  };

  const remove = async (p: Platform) => {
    if (!window.confirm(`حذف منصة ${p.name}؟`)) return;
    const { error } = await rpc("admin_delete_platform", { _pass: pass, _name: p.name });
    if (error) window.alert("تعذر حذف المنصة");
    void load();
  };

  const save = async () => {
    if (!draft) return;
    if (!draft.name.trim()) return window.alert("اكتب اسم المنصة");
    if (!draft.oldName && !draft.logo) return window.alert("اختار صورة للمنصة");
    setSaving(true);
    const { error } = await rpc("admin_upsert_platform", {
      _pass: pass,
      _old_name: draft.oldName,
      _name: draft.name.trim(),
      _logo_url: draft.logo,
      _register_url: draft.link.trim() || null,
      _deposit_usd: draft.usd === "" ? null : Number(draft.usd),
      _deposit_egp: draft.egp === "" ? null : Number(draft.egp),
    });
    setSaving(false);
    if (error) return window.alert("تعذر حفظ المنصة (يمكن الاسم مكرر)");
    setDraft(null);
    void load();
  };

  const edit = (p: Platform) =>
    setDraft({
      oldName: p.name,
      name: p.name,
      logo: null,
      link: p.register_url ?? "",
      usd: p.deposit_usd?.toString() ?? "",
      egp: p.deposit_egp?.toString() ?? "",
    });

  return (
    <section dir="rtl" className="mt-5 rounded-md border border-border bg-card p-3">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-black text-foreground">المنصات</h2>
        <button
          onClick={() => setDraft({ ...empty })}
          className="flex items-center gap-1 rounded-lg bg-primary/20 px-3 py-1.5 text-[11px] font-black text-primary active:scale-95"
        >
          <Plus className="h-3.5 w-3.5" /> إضافة منصة
        </button>
      </div>

      <div className="mt-3 flex flex-col gap-2">
        {items.map((p) => (
          <div key={p.name} className="rounded-xl border border-primary/20 px-3 py-2">
            <div className="flex items-center gap-2">
              <img src={platformLogo(p)} alt={p.name} className="h-8 w-16 rounded object-contain" />
              <div className="min-w-0 flex-1">
                <div className="text-xs font-black text-foreground">{p.name}</div>
                <div className="text-[10px] text-muted-foreground">
                  {p.deposit_egp ?? "—"} جنيه · {p.deposit_usd ?? "—"} دولار
                </div>
              </div>
              <button onClick={() => edit(p)} aria-label="تعديل" className="rounded-lg p-1.5 text-primary">
                <Pencil className="h-4 w-4" />
              </button>
              <button onClick={() => remove(p)} aria-label="حذف" className="rounded-lg p-1.5 text-red-400">
                <Trash2 className="h-4 w-4" />
              </button>
              <button
                onClick={() => toggle(p)}
                className={`rounded-lg px-2.5 py-1.5 text-[11px] font-black active:scale-95 ${
                  p.disabled ? "bg-red-500/20 text-red-400" : "bg-primary/20 text-primary"
                }`}
              >
                {p.disabled ? "صيانة" : "تعمل"}
              </button>
            </div>
          </div>
        ))}
      </div>

      {draft && (
        <div className="mt-3 flex flex-col gap-2 rounded-xl border border-primary/40 p-3">
          <div className="text-center text-xs font-black text-primary">
            {draft.oldName ? `تعديل ${draft.oldName}` : "منصة جديدة"}
          </div>
          <input className={input} placeholder="اسم المنصة" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
          <input className={input} dir="ltr" placeholder="لينك التسجيل https://..." value={draft.link} onChange={(e) => setDraft({ ...draft, link: e.target.value })} />
          <div className="grid grid-cols-2 gap-2">
            <input className={input} type="number" placeholder="الإيداع بالجنيه" value={draft.egp} onChange={(e) => setDraft({ ...draft, egp: e.target.value })} />
            <input className={input} type="number" placeholder="الإيداع بالدولار" value={draft.usd} onChange={(e) => setDraft({ ...draft, usd: e.target.value })} />
          </div>
          <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-border px-3 py-2 text-xs text-muted-foreground">
            {draft.logo && <img src={draft.logo} alt="" className="h-8 w-16 object-contain" />}
            <span>{draft.logo ? "تغيير الصورة" : draft.oldName ? "تغيير الصورة (اختياري)" : "اختار صورة المنصة"}</span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (f) setDraft({ ...draft, logo: await fileToLogoDataUrl(f) });
              }}
            />
          </label>
          <div className="flex gap-2">
            <button onClick={save} disabled={saving} className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-primary py-2 text-xs font-black text-primary-foreground">
              {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />} حفظ
            </button>
            <button onClick={() => setDraft(null)} className="flex-1 rounded-lg border border-border py-2 text-xs font-black text-foreground">
              إلغاء
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
