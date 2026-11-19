import {useState} from 'react';
import {SketchWidget, type SketchWidgetProps} from '@mobile-input/controls/sketch-widget';
import {createSketchFile} from '@mobile-input/controls/sketch-geometry';
import {WidgetProvider, WidgetSurface, type WidgetEnvironment} from '@mobile-input/controls/environment';
import '@mobile-input/controls/desktop.css';

export function SketchExample({environment, onAdopt}: {environment: WidgetEnvironment; onAdopt: (file: File) => void}) {
  const [strokes, onChange] = useState<SketchWidgetProps['strokes']>([]);
  return (
    <WidgetProvider {...environment}>
      <WidgetSurface>
        <SketchWidget strokes={strokes} onChange={onChange}
            onActive={() => {}} onAdopt={() => onAdopt(createSketchFile(strokes))}/>
      </WidgetSurface>
    </WidgetProvider>
  );
}
