import {useEffect, useRef, useState} from 'react';
import {pendingDemoRecommendations, revealDemoRecommendations, type DemoDraft} from '../../../packages/core/workbuddy-demo-state';
import type {DemoControlBinding} from '../../../packages/core/workbuddy-demo-controls';

/** Transient presentation only: no timer or unrevealed candidate is persisted. */
export function useDemoRecommendations(draft: DemoDraft | undefined, update: (owner: string, change: (draft: DemoDraft) => DemoDraft) => void, recording = false) {
  const latest = useRef({draft, update, recording}); latest.current = {draft, update, recording};
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const generation = useRef(0);
  const pausedOwner = useRef<string | undefined>(undefined);
  const suppressed = useRef<string | undefined>(undefined);
  const [visibility, setVisibility] = useState(0);
  const [pending, setPending] = useState<{key: string; controls: DemoControlBinding[]} | null>(null);
  const key = draft ? JSON.stringify([draft.id, draft.text]) : '';
  // Ignore seen flags and unrelated attachments/results. They must not restart a pause.
  const signature = JSON.stringify(draft && [draft.controls?.filter(c => c.origin !== 'recommended').map(c => [c.id, c.origin, c.phrase, c.revision, c.value]), draft.dismissedControls]);
  function clear() { generation.current++; timers.current.forEach(clearTimeout); timers.current = []; }
  function pause() {pausedOwner.current = latest.current.draft?.id; clear(); setPending(null);}
  function resume() {pausedOwner.current = undefined; suppressed.current = undefined; setVisibility(n => n + 1);}
  function cancel(current = latest.current.draft) {
    clear(); pausedOwner.current = undefined; suppressed.current = current ? JSON.stringify([current.id, current.text]) : ''; setPending(null);
  }
  useEffect(() => {
    clear(); setPending(null);
    if (suppressed.current !== key) suppressed.current = undefined;
    if (pausedOwner.current !== draft?.id) pausedOwner.current = undefined;
    if (!draft || recording || pausedOwner.current === draft.id || suppressed.current === key || document.hidden) return;
    const candidates = pendingDemoRecommendations(draft);
    if (!candidates.length) return;
    const version = generation.current;
    const valid = () => version === generation.current && !document.hidden && !latest.current.recording && latest.current.draft?.id === draft.id && latest.current.draft.text === draft.text;
    candidates.forEach((candidate, index) => {
      timers.current.push(setTimeout(() => {
        if (!valid()) return;
        setPending(previous => ({key, controls: [...(previous?.key === key ? previous.controls : []), candidate]}));
      }, 1000 + index * 220));
      timers.current.push(setTimeout(() => {
        if (!valid()) return;
        latest.current.update(draft.id, current => current.text === draft.text ? revealDemoRecommendations(current, [candidate.id]) : current);
        setPending(previous => previous?.key === key ? {...previous, controls: previous.controls.filter(c => c.id !== candidate.id)} : previous);
      }, 1400 + index * 220));
    });
    return clear;
  }, [key, signature, visibility, recording]);
  useEffect(() => {
    const hide = () => {if (document.hidden) {clear(); setPending(null);} else setVisibility(n => n + 1);};
    document.addEventListener('visibilitychange', hide);
    return () => {clear(); document.removeEventListener('visibilitychange', hide);};
  }, []);
  return {loading: pending?.key === key ? pending.controls : [], cancel, pause, resume};
}
