interface LogoProps {
  size?: number;
  className?: string;
}

export function Logo({ size = 64, className }: LogoProps) {
  return (
    <img
      src="/logo.png"
      alt="InGroups"
      width={size}
      className={className}
      style={{ display: 'block', height: 'auto', width: size }}
    />
  );
}

export function LogoMark({ size = 28, className }: LogoProps) {
  return (
    <img
      src="/logo-mark.png"
      alt=""
      width={size}
      aria-hidden
      className={className}
      style={{ display: 'block', height: 'auto', width: size }}
    />
  );
}
