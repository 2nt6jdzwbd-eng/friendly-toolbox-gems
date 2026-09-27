export function Brand({ className = "" }: { className?: string }) {
  return (
    <span className={`font-['Bebas_Neue'] font-normal tracking-normal ${className}`}>
      <span className="text-foreground">CRAZY</span>{" "}
      <span className="text-primary">SCRIPT</span>
    </span>
  );
}
