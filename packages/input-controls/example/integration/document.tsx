import {useRef} from 'react';
import {DocumentWidget, type DocumentWidgetProps} from '@mobile-input/controls/document-widget';
import {WidgetProvider, WidgetSurface, type WidgetEnvironment} from '@mobile-input/controls/environment';
import '@mobile-input/controls/desktop.css';

export function DocumentExample({
  onSelect, environment, ...widgetProps
}: Omit<DocumentWidgetProps, 'onChoose'> & {onSelect: (files: File[]) => void; environment: WidgetEnvironment}) {
  const input = useRef<HTMLInputElement>(null);
  return (
    <WidgetProvider {...environment}>
      <WidgetSurface>
        <input ref={input} type="file" accept=".pdf,.txt,.md" multiple hidden onChange={event => {
          const files = Array.from(event.currentTarget.files ?? []);
          if (files.length) onSelect(files);
          event.currentTarget.value = '';
        }}/>
        <DocumentWidget {...widgetProps} onChoose={() => input.current?.click()}/>
      </WidgetSurface>
    </WidgetProvider>
  );
}
