import type {ComponentProps,ReactNode} from 'react';
import {AgentComposer} from './agent-input-view';
import {PolishControls} from './ai-polish';
import type {usePhoneEditing} from './use-phone-editing';
/** One presentation tree for Agent task input. Adapters supply stateful content and actions,
 * not alternative layouts. No transport or destination branching belongs here. */
export function AgentInputScene({context,auxiliary,feedback,editing,children,...composer}:{context?:ReactNode;auxiliary?:ReactNode;feedback?:ReactNode;editing:ReturnType<typeof usePhoneEditing>} & ComponentProps<typeof AgentComposer>){
 return <>{context}{auxiliary}<AgentComposer {...composer}>{children}</AgentComposer><PolishControls editing={editing}/>{feedback}</>;
}
