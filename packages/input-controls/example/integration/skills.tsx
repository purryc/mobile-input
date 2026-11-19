import {useId, useState} from 'react';
import {SkillsWidget, type SkillsWidgetProps} from '@mobile-input/controls/skills-widget';
import {WidgetProvider, WidgetSurface, type WidgetEnvironment} from '@mobile-input/controls/environment';
import '@mobile-input/controls/desktop.css';

export function SkillsExample({definition, environment, onDone}: {
  definition: SkillsWidgetProps['definition'];
  environment: WidgetEnvironment;
  onDone: (selected: string[]) => void;
}) {
  const owner = useId();
  const [value, setValue] = useState<string[]>([]);
  return (
    <WidgetProvider {...environment}>
      <WidgetSurface>
        <SkillsWidget owner={owner} definition={definition} language={environment.language}
          binding={{id: owner, kind: 'skills', origin: 'manual', value}}
          onEvent={event => {
            if (event.id !== owner || event.owner !== owner) return;
            if (event.type === 'change' && event.value) setValue(event.value);
            if (event.type === 'close') onDone(value);
          }}/>
      </WidgetSurface>
    </WidgetProvider>
  );
}
