import type { ReactNode } from "react";
export function ComposerFrame({
  children,
  footer,
  afterContent,
  busy = false,
  className = "",
  label,
}: {
  children: ReactNode;
  footer?: ReactNode;
  afterContent?: ReactNode;
  busy?: boolean;
  className?: string;
  label?: string;
}) {
  return (
    <section
      aria-label={label}
      className={"live-wb-composer " + className}
      inert={busy}
    >
      <div className="live-wb-scroll">{children}</div>
      {afterContent}
      {footer && <footer>{footer}</footer>}
    </section>
  );
}
