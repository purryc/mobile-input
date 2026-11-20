import {useState} from 'react';
import {DurationWidget, type DurationUnit, type DurationWidgetProps} from '@mobile-input/controls/duration-widget';
import {WidgetProvider, WidgetSurface, type WidgetEnvironment} from '@mobile-input/controls/environment';
import '@mobile-input/controls/desktop.css';

export function DurationExample({onDone, environment}: {environment: WidgetEnvironment} & Pick<DurationWidgetProps, 'onDone'>) {
  const [value, onChange] = useState('15');
  const [unit,onUnitChange] = useState<DurationUnit>('s');
  return (
    <WidgetProvider {...environment}>
      <WidgetSurface>
        <DurationWidget unit={unit} onUnitChange={onUnitChange} value={value} onChange={onChange} onDone={onDone}/>
      </WidgetSurface>
    </WidgetProvider>
  );
}
