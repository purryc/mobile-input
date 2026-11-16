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
      className={"ic-live-wb-composer " + className}
      inert={busy}
    >
      <div className="ic-live-wb-scroll">{children}</div>
      {afterContent}
      {footer && <footer>{footer}</footer>}
    </section>
  );
}

export type ComposerFrameProps = import("react").ComponentProps<typeof ComposerFrame>;
