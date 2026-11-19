import {useId, useRef, useState} from 'react';
import {
  AnchoredPanel, AuxiliaryPanel, InlineChip, WidgetProvider, WidgetSurface,
} from '@mobile-input/controls';
import {DurationWidget} from '@mobile-input/controls/duration-widget';
import '@mobile-input/controls/desktop.css';

export default function App() {
  const chipId = useId();
  const panelId = useId();
  const anchor = useRef<HTMLSpanElement>(null);
  const [minutes, setMinutes] = useState('10');
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <WidgetProvider language="zh-CN" translate={text => text}
      assetBase={import.meta.env.BASE_URL + 'input-controls'}>
      <WidgetSurface>
        演讲时长
        <span ref={anchor}>
          <InlineChip
            token={{
              id: chipId, kind: 'duration', role: '演讲时长',
              phrase: minutes + '分钟', label: minutes + '分钟',
              value: minutes, semanticState: 'default-selected',
              iconSrc: import.meta.env.BASE_URL + 'input-controls/assets/xiaoyi-work/design-inline-duration.svg',
            }}
            expanded={open}
            controlsId={panelId}
            onOpen={() => setOpen(previous => !previous)}
          />
        </span>
        <AnchoredPanel anchor={anchor} open={open} id={panelId} width={288}
          label="时间" onClose={close}>
          <AuxiliaryPanel title="时间" onClose={close}>
            <DurationWidget value={minutes} onChange={setMinutes} onDone={close}/>
          </AuxiliaryPanel>
        </AnchoredPanel>
      </WidgetSurface>
    </WidgetProvider>
  );
}
