import {useRef} from 'react';
import {ImageWidget, type ImageWidgetProps} from '@mobile-input/controls/image-widget';
import {WidgetProvider, WidgetSurface, type WidgetEnvironment} from '@mobile-input/controls/environment';
import '@mobile-input/controls/desktop.css';

export function ImageExample({
  onPick, environment, ...props
}: Omit<ImageWidgetProps, 'onChoose'> & {onPick: (pending: File[]) => void; environment: WidgetEnvironment}) {
  const input = useRef<HTMLInputElement>(null);
  return (
    <WidgetProvider {...environment}>
      <WidgetSurface>
        <input ref={input} type="file" accept="image/*" multiple hidden onChange={event => {
          const files = Array.from(event.currentTarget.files ?? []);
          if (files.length) onPick(files);
          event.currentTarget.value = '';
        }}/>
        <ImageWidget {...props} onChoose={() => input.current?.click()}/>
      </WidgetSurface>
    </WidgetProvider>
  );
}
