import {useId, useState} from 'react';
import {PaletteWidget, type PaletteWidgetProps} from '@mobile-input/controls/palette-widget';
import {WidgetProvider, WidgetSurface, type WidgetEnvironment} from '@mobile-input/controls/environment';
import '@mobile-input/controls/desktop.css';

export function PaletteExample({definition, environment, onDone}: {
  definition: PaletteWidgetProps['definition'];
  environment: WidgetEnvironment;
  onDone: (selected: string[]) => void;
}) {
  const owner = useId();
  const [value, setValue] = useState<string[]>([]);
  return (
    <WidgetProvider {...environment}>
      <WidgetSurface>
        <PaletteWidget owner={owner} definition={definition} language={environment.language}
          binding={{id: owner, kind: 'palette', origin: 'manual', value}}
          onEvent={event => {
            if (event.id !== owner || event.owner !== owner) return;
            if (event.type === 'change' && event.value) setValue(event.value);
            if (event.type === 'close') onDone(value);
          }}/>
      </WidgetSurface>
    </WidgetProvider>
  );
}
