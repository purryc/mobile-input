import type {Ref} from 'react';
import {Check, RotateCcw} from 'lucide-react';
import {useWidgetEnvironment} from './environment';

export interface WidgetResetProps {
  onReset?: () => void;
  canReset?: boolean;
}

export function WidgetFooter({onReset, canReset = Boolean(onReset), onConfirm, confirmLabel, confirmRef, disabled = false}: WidgetResetProps & {
  onConfirm?: () => void;
  confirmLabel?: string;
  confirmRef?: Ref<HTMLButtonElement>;
  disabled?: boolean;
}) {
  const en = useWidgetEnvironment().language.startsWith('en');
  const confirm = en ? 'Confirm' : '确认';
  return <footer className="ic-widget-footer">
    <button type="button" className="ic-footer-reset" disabled={!onReset || !canReset} onClick={onReset}>
      <RotateCcw size={14}/>{en ? 'Reset' : '重置'}
    </button>
    <button type="button" ref={confirmRef} className="ic-footer-confirm" aria-label={confirmLabel?.startsWith(confirm) ? confirmLabel : undefined} disabled={!onConfirm || disabled} onClick={onConfirm}>
      <Check size={16}/>{confirm}
    </button>
  </footer>;
}
