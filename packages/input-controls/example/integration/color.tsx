import {useState} from 'react';
import {ColorWidget, type ColorWidgetProps} from '@mobile-input/controls/color-widget';
import {WidgetProvider, WidgetSurface, type WidgetEnvironment} from '@mobile-input/controls/environment';
import '@mobile-input/controls/desktop.css';

export function ColorExample({onActive, onDone, environment}: {environment: WidgetEnvironment} & Pick<ColorWidgetProps, 'onActive' | 'onDone'>) {
  const [value, onChange] = useState('#356FE4');
  return (
    <WidgetProvider {...environment}>
      <WidgetSurface>
        <ColorWidget label="Theme color" value={value} onChange={onChange}
            onActive={onActive} onDone={onDone}/>
      </WidgetSurface>
    </WidgetProvider>
  );
}
