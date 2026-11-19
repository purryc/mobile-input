import {useRef} from 'react';
import {DocumentWidget, type DocumentWidgetProps} from '@mobile-input/controls/document-widget';
import {WidgetProvider, WidgetSurface, type WidgetEnvironment} from '@mobile-input/controls/environment';
import '@mobile-input/controls/desktop.css';

export function DocumentExample({
  children, onDone, onSelect, environment,
}: Pick<DocumentWidgetProps, 'children' | 'onDone'> & {onSelect: (files: File[]) => void; environment: WidgetEnvironment}) {
  const input = useRef<HTMLInputElement>(null);
  return (
    <WidgetProvider {...environment}>
      <WidgetSurface>
        <input ref={input} type="file" accept=".pdf,.txt,.md" multiple hidden onChange={event => {
          const files = Array.from(event.currentTarget.files ?? []);
          if (files.length) onSelect(files);
          event.currentTarget.value = '';
        }}/>
        <DocumentWidget onChoose={() => input.current?.click()} onDone={onDone}>{children}</DocumentWidget>
      </WidgetSurface>
    </WidgetProvider>
  );
}
