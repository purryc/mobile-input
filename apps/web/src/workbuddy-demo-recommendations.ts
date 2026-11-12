import {useEffect, useRef, useState} from 'react';
import {
  pendingDemoRecommendations,
  recommendationIdentity,
  revealDemoRecommendations,
  type DemoDraft,
} from '../../../packages/core/workbuddy-demo-state';
import type {DemoControlBinding} from '../../../packages/core/workbuddy-demo-controls';

type ScheduledEntry = {
  id: string;
  prepTimer: ReturnType<typeof setTimeout>;
  revealTimer: ReturnType<typeof setTimeout>;
};

/**
 * Progressive per-candidate recommendation scheduler.
 * Candidates whose trigger phrase has already been spoken or typed begin their
 * 1000ms stabilization and 400ms reveal cycle immediately in source order,
 * without waiting for the entire paragraph or dictation session to end.
 */
export function useDemoRecommendations(
  draft: DemoDraft | undefined,
  update: (owner: string, change: (draft: DemoDraft) => DemoDraft) => void,
  recording = false,
) {
  const latest = useRef({draft, update, recording});
  latest.current = {draft, update, recording};
  const scheduled = useRef<Map<string, ScheduledEntry>>(new Map());
  const scheduledOwner = useRef<string | undefined>(undefined);
  const generation = useRef(0);
  const pausedOwner = useRef<string | undefined>(undefined);
  const suppressed = useRef<string | undefined>(undefined);
  const [visibility, setVisibility] = useState(0);
  const [pending, setPending] = useState<{
    owner: string;
    controls: DemoControlBinding[];
  } | null>(null);
  const key = draft ? JSON.stringify([draft.id, draft.text]) : '';
  const signature = JSON.stringify(
    draft && [
      draft.controls
        ?.filter(c => c.origin !== 'recommended')
        .map(c => [c.id, c.origin, c.phrase, c.revision, c.value]),
      draft.dismissedControls,
    ],
  );

  /**
   * Cancels all scheduled candidate timers.
   */
  function clearAll() {
    generation.current++;
    for (const entry of scheduled.current.values()) {
      clearTimeout(entry.prepTimer);
      clearTimeout(entry.revealTimer);
    }
    scheduled.current.clear();
  }

  /**
   * Pauses pending recommendations for the active draft (e.g. during Send validation).
   */
  function pause() {
    pausedOwner.current = latest.current.draft?.id;
    clearAll();
    setPending(null);
  }

  /**
   * Resumes recommendation scheduling after a pause.
   */
  function resume() {
    pausedOwner.current = undefined;
    suppressed.current = undefined;
    setVisibility(n => n + 1);
  }

  /**
   * Cancels pending recommendations for the given draft snapshot.
   */
  function cancel(current = latest.current.draft) {
    clearAll();
    pausedOwner.current = undefined;
    suppressed.current = current
      ? JSON.stringify([current.id, current.text])
      : '';
    setPending(null);
  }

  useEffect(() => {
    if (suppressed.current && suppressed.current !== key) {
      suppressed.current = undefined;
    }
    if (pausedOwner.current && pausedOwner.current !== draft?.id) {
      pausedOwner.current = undefined;
    }
    if (scheduledOwner.current !== draft?.id) {
      clearAll();
      setPending(null);
      scheduledOwner.current = draft?.id;
    }
    if (
      !draft ||
      pausedOwner.current === draft.id ||
      suppressed.current === key ||
      document.hidden
    ) {
      clearAll();
      setPending(null);
      return;
    }

    const candidates = pendingDemoRecommendations(draft);
    const byIdentity = new Map(
      candidates.map(c => [recommendationIdentity(c), c]),
    );

    // Prune any previously scheduled candidate that is no longer valid in the current text
    const removedIds = new Set<string>();
    for (const [identity, entry] of scheduled.current.entries()) {
      if (!byIdentity.has(identity)) {
        clearTimeout(entry.prepTimer);
        clearTimeout(entry.revealTimer);
        scheduled.current.delete(identity);
        removedIds.add(entry.id);
      }
    }
    if (removedIds.size > 0 || candidates.length === 0) {
      setPending(previous =>
        previous && previous.owner === draft.id
          ? {
              owner: draft.id,
              controls: previous.controls
                .filter(c => !removedIds.has(c.id) && byIdentity.has(recommendationIdentity(c)))
                .map(c => byIdentity.get(recommendationIdentity(c)) || c),
            }
          : null,
      );
    } else {
      setPending(previous =>
        previous && previous.owner === draft.id && previous.controls.length
          ? {
              owner: draft.id,
              controls: previous.controls.map(
                c => byIdentity.get(recommendationIdentity(c)) || c,
              ),
            }
          : previous,
      );
    }

    if (!candidates.length) return;

    const ownerId = draft.id;
    const version = generation.current;
    let newIndex = 0;

    for (const candidate of candidates) {
      const identity = recommendationIdentity(candidate);
      if (scheduled.current.has(identity)) continue;

      const slot = newIndex++;
      const isStillValid = () =>
        version === generation.current &&
        !document.hidden &&
        latest.current.draft?.id === ownerId &&
        pendingDemoRecommendations(latest.current.draft).some(
          c => recommendationIdentity(c) === identity,
        );

      const prepTimer = setTimeout(() => {
        if (!isStillValid()) return;
        const fresh =
          pendingDemoRecommendations(latest.current.draft!).find(
            c => recommendationIdentity(c) === identity,
          ) || candidate;
        setPending(previous => ({
          owner: ownerId,
          controls: [
            ...(previous?.owner === ownerId
              ? previous.controls.filter(c => c.id !== fresh.id)
              : []),
            fresh,
          ],
        }));
      }, 1000 + slot * 220);

      const revealTimer = setTimeout(() => {
        scheduled.current.delete(identity);
        if (!isStillValid()) return;
        latest.current.update(ownerId, current =>
          pendingDemoRecommendations(current).some(
            c => recommendationIdentity(c) === identity,
          )
            ? revealDemoRecommendations(current, [candidate.id])
            : current,
        );
        setPending(previous =>
          previous?.owner === ownerId
            ? {
                owner: ownerId,
                controls: previous.controls.filter(c => c.id !== candidate.id),
              }
            : null,
        );
      }, 1400 + slot * 220);

      scheduled.current.set(identity, {
        id: candidate.id,
        prepTimer,
        revealTimer,
      });
    }
  }, [key, signature, visibility, recording]);

  useEffect(() => {
    const hide = () => {
      if (document.hidden) {
        clearAll();
        setPending(null);
      } else {
        setVisibility(n => n + 1);
      }
    };
    document.addEventListener('visibilitychange', hide);
    return () => {
      clearAll();
      document.removeEventListener('visibilitychange', hide);
    };
  }, []);

  return {
    loading:
      draft && pending?.owner === draft.id ? pending.controls : [],
    cancel,
    pause,
    resume,
  };
}
