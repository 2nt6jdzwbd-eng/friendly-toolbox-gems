import { supabase } from "@/integrations/supabase/client";
import logoUltrapari from "@/assets/platform-ultrapari.png";
import logo1xBet from "@/assets/platform-1xbet.png";
import logoLineBet from "@/assets/platform-linebet.png";
import logoWinWin from "@/assets/platform-winwin.png";

export type Platform = {
  name: string;
  disabled: boolean;
  logo_url: string | null;
  register_url: string | null;
  deposit_usd: number | null;
  deposit_egp: number | null;
  sort_order: number;
};

const BUNDLED: Record<string, string> = {
  Ultrapari: logoUltrapari,
  "1xBet": logo1xBet,
  LineBet: logoLineBet,
  WinWin: logoWinWin,
};

export const platformLogo = (p: Pick<Platform, "name" | "logo_url">) =>
  p.logo_url || BUNDLED[p.name] || "";

export async function fetchPlatforms(): Promise<Platform[]> {
  const { data } = await (supabase.from("platform_status") as any)
    .select("name, disabled, logo_url, register_url, deposit_usd, deposit_egp, sort_order")
    .order("sort_order", { ascending: true });
  return ((data ?? []) as Platform[]).map((p) => ({
    ...p,
    deposit_usd: p.deposit_usd == null ? null : Number(p.deposit_usd),
    deposit_egp: p.deposit_egp == null ? null : Number(p.deposit_egp),
  }));
}

/** Resize an image file to a small data URL so it can be stored with the platform. */
export function fileToLogoDataUrl(file: File, max = 240): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const scale = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement("canvas");
      c.width = Math.round(img.width * scale);
      c.height = Math.round(img.height * scale);
      c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      resolve(c.toDataURL("image/png"));
    };
    img.onerror = reject;
    img.src = url;
  });
}
