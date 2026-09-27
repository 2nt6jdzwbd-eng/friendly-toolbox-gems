import { Button } from "@/components/ui/button";

export function Overlay({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose?: (() => void) | undefined;
  children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 px-5 backdrop-blur-md">
      <Button
        type="button"
        aria-label="close"
        onClick={onClose}
        className="absolute inset-0 cursor-default"
      />
      <div className="relative w-full max-w-sm animate-scale-in rounded-md border border-border bg-card p-5 shadow-2xl">
        {children}
      </div>
    </div>
  );
}
