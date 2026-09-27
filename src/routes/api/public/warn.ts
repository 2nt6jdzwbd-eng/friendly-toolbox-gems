import { createFileRoute } from "@tanstack/react-router";
import { getBotToken } from "@/lib/bot-token.server";

export const Route = createFileRoute("/api/public/warn")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = (await request.json()) as { userId?: string; kind?: string };
        const userId = (body.userId ?? "").trim();
        if (!userId) return new Response("bad request", { status: 400 });

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data, error } = await (
          supabaseAdmin.rpc.bind(supabaseAdmin) as unknown as (
            fn: string,
            args: Record<string, unknown>,
          ) => Promise<{ data: unknown; error: unknown }>
        )("telegram_id_for_user", { _user_id: userId });

        if (error) return new Response("lookup failed", { status: 500 });
        const chatId = typeof data === "string" ? data.trim() : "";
        if (!chatId) return new Response("telegram chat not linked", { status: 409 });

        const text =
          body.kind === "cooldown"
            ? "⏳ <b>الرجاء الانتظار ساعة</b>\n\nانتظر ساعة حتى يتم تفعيل الطلب لك مرة أخرى."
            : "⏳ <b>الرجاء انتظار طلبك الأول</b>\n\nحتى يتم تفعيل الطلب مرة أخرى.";

        const res = await fetch(`https://api.telegram.org/bot${getBotToken()}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chat_id: chatId, parse_mode: "HTML", text }),
        });
        if (!res.ok) return new Response("telegram delivery failed", { status: 502 });
        return new Response("ok");
      },
    },
  },
});
