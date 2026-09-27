import { BadgeCheck, ChevronLeft, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Brand } from "@/components/Brand";
import { Button } from "@/components/ui/button";

export function TopBar({ showBack = true }: { showBack?: boolean }) {
  const [online, setOnline] = useState(1284);
  const navigate = useNavigate();

  useEffect(() => {
    const rand = () => 1000 + Math.floor(Math.random() * 9001);
    setOnline(rand());
    const t = setInterval(() => setOnline(rand()), 1500);
    return () => clearInterval(t);
  }, []);

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-2 px-4 sm:px-6">
        <div className="flex items-center gap-2">
          {showBack && (
            <Button
              type="button"
              aria-label="رجوع"
              onClick={() => navigate({ to: "/games" })}
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-sm border-border text-primary"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          )}
          <Brand className="text-3xl leading-none" />
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 whitespace-nowrap text-xs font-semibold text-foreground">
            <span>سكريبت موثق</span>
            <BadgeCheck
              aria-label="موثق"
              className="h-4 w-4 shrink-0 fill-success/15 text-success"
            />
          </span>
          <span className="hidden items-center gap-1.5 border-l-2 border-primary bg-primary/10 px-3 py-1 text-[11px] font-semibold text-foreground min-[400px]:flex">
            <Users className="h-3.5 w-3.5 text-primary" />
            <span className="notranslate">{online}</span>
          </span>
        </div>
      </div>
    </header>
  );
}
