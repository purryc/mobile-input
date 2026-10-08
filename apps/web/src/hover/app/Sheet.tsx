import {useBack} from '../../back';
import { useEffect, useRef } from "react";
import {clipboardWrite} from "../../phone-native";
import { X } from "lucide-react";
export function Sheet({
  title,
  onClose,
  children,
  className = "",
  showCloseButton = true,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
  showCloseButton?: boolean;
}) {
  const ref = useRef<HTMLElement>(null);
  useBack(()=>{onClose();return true;},150);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    ref.current?.focus({ preventScroll: true });
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
      if (e.key === "Tab") {
        const nodes = Array.from(
          ref.current?.querySelectorAll<HTMLElement>(
            'button,input,textarea,[tabindex="0"]',
          ) || [],
        );
        const first = nodes[0],
          last = nodes.at(-1);
        if (
          e.shiftKey &&
          (document.activeElement === first ||
            document.activeElement === ref.current)
        ) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("keydown", key);
      previous?.focus({ preventScroll: true });
    };
  }, [onClose]);
  return (
    <div
      className={`sheet-backdrop modal ${className}`}
      onPointerDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <section
        className="sheet"
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
      >
        <div className="sheet-handle" />
        <header>
          <h2>{title}</h2>
          {showCloseButton && (
            <button className="icon-button" aria-label="关闭" onClick={onClose}>
              <X size={21} />
            </button>
          )}
        </header>
        <div className="sheet-content">{children}</div>
      </section>
    </div>
  );
}
export async function copyText(text: string) { await clipboardWrite(text); }
