import {useState} from 'react';
import {DurationWidget, type DurationWidgetProps} from '@mobile-input/controls/duration-widget';
import {WidgetProvider, WidgetSurface, type WidgetEnvironment} from '@mobile-input/controls/environment';
import '@mobile-input/controls/desktop.css';

export function DurationExample({onDone, environment}: {environment: WidgetEnvironment} & Pick<DurationWidgetProps, 'onDone'>) {
  const [value, onChange] = useState('10');
  return (
    <WidgetProvider {...environment}>
      <WidgetSurface>
        <DurationWidget value={value} onChange={onChange} onDone={onDone}/>
      </WidgetSurface>
    </WidgetProvider>
  );
}
