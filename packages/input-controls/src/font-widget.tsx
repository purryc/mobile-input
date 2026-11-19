import {ChoiceWidget, type ChoiceWidgetProps} from './choice-widget';
import {windowsFontDefinition} from './windows-fonts';

export {windowsFonts, windowsFontDefinition} from './windows-fonts';
export type FontWidgetProps = Omit<ChoiceWidgetProps, 'definition'> & {
  definition?: ChoiceWidgetProps['definition'];
};

export function FontWidget({definition = windowsFontDefinition, ...props}: FontWidgetProps) {
  return <ChoiceWidget {...props} definition={definition} binding={{...props.binding, kind: 'font'}}/>;
}
