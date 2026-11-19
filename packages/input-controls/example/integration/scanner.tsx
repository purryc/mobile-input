import {ScannerWidget, type ScannerWidgetProps} from '@mobile-input/controls/scanner-widget';
import {browserCaptureAdapter} from '@mobile-input/controls/capture-adapter';
import {WidgetProvider, WidgetSurface, type WidgetEnvironment} from '@mobile-input/controls/environment';
import '@mobile-input/controls/desktop.css';

export function ScannerExample({environment, ...props}: {environment: WidgetEnvironment} & ScannerWidgetProps) {
  // The host owns items, confirmation and removal.
  // Pass a different adapter to use your host's acquisition implementation.
  return (
    <WidgetProvider {...environment}>
      <WidgetSurface>
        <ScannerWidget {...props} adapter={props.adapter ?? browserCaptureAdapter}/>
      </WidgetSurface>
    </WidgetProvider>
  );
}
