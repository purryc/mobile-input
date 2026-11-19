import type { ButtonHTMLAttributes, ReactNode } from "react";
import { LoaderCircle } from "lucide-react";

export function ApplicationActionChip({
  icon,
  loading = false,
  children,
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  icon?: ReactNode;
  loading?: boolean;
}) {
  return (
    <button
      {...props}
      className={"application-action-chip " + className}
      aria-busy={loading || undefined}
    >
      {loading ? (
        <LoaderCircle className="action-chip-loading" size={18} aria-hidden />
      ) : (
        icon
      )}
      {children}
    </button>
  );
}
