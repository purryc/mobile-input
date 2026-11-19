import {ScreenCaptureWidget, type ScreenCaptureWidgetProps} from '@mobile-input/controls/capture-widget';
import {browserCaptureAdapter} from '@mobile-input/controls/capture-adapter';
import {WidgetProvider, WidgetSurface, type WidgetEnvironment} from '@mobile-input/controls/environment';
import '@mobile-input/controls/desktop.css';

export function ScreenCaptureExample({environment, ...props}: {environment: WidgetEnvironment} & ScreenCaptureWidgetProps) {
  // Mount on chip activation with screenIntent="screenshot" or "recording".
  // Omit screenIntent for the generic chooser. Start recording remains an explicit user action.
  // Pass a different adapter to use your host's acquisition implementation.
  return (
    <WidgetProvider {...environment}>
      <WidgetSurface>
        <ScreenCaptureWidget {...props} adapter={props.adapter ?? browserCaptureAdapter}/>
      </WidgetSurface>
    </WidgetProvider>
  );
}
