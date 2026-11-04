import type { CSSProperties, ReactNode } from "react";
import type { DeckPage } from "../../../packages/core/web-deck";
/** Tablet and standalone adapters share the exact slide presentation layout. */
export function WebDeckPageFrame({
  page,
  title,
  body,
  photos,
}: {
  page: DeckPage;
  title: ReactNode;
  body: ReactNode;
  photos?: ReactNode;
}) {
  return (
    <article
      className={"web-deck-page layout-" + page.layout}
      style={
        {
          background: page.background,
          color: page.textColor,
          "--deck-primary": page.primary,
        } as CSSProperties
      }
    >
      <header>
        <span className="deck-eyebrow">PRODUCT PRESENTATION</span>
        {title}
      </header>
      <div className="deck-page-content">
        {!!page.photoIds.length && <div className="deck-photos">{photos}</div>}
        <div className="deck-copy">{body}</div>
      </div>
    </article>
  );
}
