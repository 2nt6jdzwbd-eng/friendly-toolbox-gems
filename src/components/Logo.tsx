import logo from "@/assets/logo.png";

export function Logo({ size = 120, className = "" }: { size?: number; className?: string }) {
  return (
    <img
      src={logo}
      alt="CRAZY SCRIPT logo"
      width={size}
      height={size}
      className={`mx-auto ${className}`}
      style={{ width: size, height: size }}
    />
  );
}
