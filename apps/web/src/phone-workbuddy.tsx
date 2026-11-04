import {uiText} from './i18n';
import {PhoneControllerFrame} from './phone-controller-frame';
import {WebDeckComposer} from './web-deck-composer';
import {PolishControls} from './ai-polish';
import {InputDock} from './input-dock';
import {usePhoneEditing} from './use-phone-editing';
import {PhoneWorkBuddyObject} from './phone-workbuddy-object';
import {PhoneWorkBuddyAdaptive} from './phone-workbuddy-adaptive';
import { filePhoneContext } from '../../../packages/core/workbuddy-files';
import { useEffect, useRef, useState } from "react";
import * as I from "lucide-react";
import { command, useRuntime, uid } from "./runtime";
import { useWorkBuddyInput } from "./workbuddy-input";
import { clipboardRead, clipboardWrite } from "./phone-native";
import { ConnectionButton, useConnectionPrompt } from "./connection-access";
import { SwitchButton } from "./phone-wechat";
import { usePhoneInsets } from "./phone-insets";
import "./phone-workbuddy.css";
export function PhoneWorkBuddy(){const r=useRuntime(),w=r.state.workbuddy,t=w.tasks.find(t=>t.id===w.task),d=w.drafts[w.task];const modern=w.task==='new'||!!t?.deckJob||!!t&&!t.receipts&&!t.referenceRequest&&!d?.attachments.length&&!d?.input?.sketch.strokes.length;
 if(modern&&d)return <WebDeckComposer key={w.task} taskId={w.task} phone/>;
 return r.state.target?.id.startsWith('wb:object:')?<PhoneWorkBuddyObject key={r.state.target.id+':'+r.state.target.revision}/>:r.state.target?.id.startsWith('wb:draft:')?<PhoneWorkBuddyAdaptive key={r.state.target.id}/>:<LegacyPhoneWorkBuddy/>;
}
function LegacyPhoneWorkBuddy() {
 const openConnection=useConnectionPrompt();
 const r=useRuntime(),s=r.state,t=s.target!,w=s.workbuddy,task=w.tasks.find(x=>x.id===w.task),editor=useWorkBuddyInput(t.id,t.label),area=useRef<HTMLTextAreaElement>(null),editing=usePhoneEditing(editor.text,editor.update,area,t.id,r.connected&&!editor.blocked),fileContext=filePhoneContext(s),isDraft=t.id.startsWith('wb:draft:')||!!fileContext?.isAI;
 return <PhoneControllerFrame className="workbuddy-phone" beforeSwitch={editing.cancel} beforeChange={async()=>{editing.cancel();await editor.flush();}} dock={<InputDock editing={editing} area={area} disabled={editor.busy} voiceDisabled={editor.blocked||!r.connected} onVoiceUnavailable={()=>{if(!r.connected)openConnection?.();else editing.setError("请先恢复当前目标后再使用语音");}}/>}><section className="wb-phone-context"><div><img src="./assets/apps/workbuddy.svg" alt=""/><h1>{fileContext?fileContext.file.name:isDraft?task?.title||uiText("新建任务"):t.label}</h1></div><small>{fileContext?.isAI?uiText("文件 AI 指令"):isDraft?'任务输入':'内容编辑'}</small>{fileContext?.selection&&<blockquote>{fileContext.selection.text||fileContext.selection.paths.join('、')}</blockquote>}</section>
 <section className="wb-phone-editor">{editor.blocked&&<div className="wb-phone-warning">{editor.blockReason}<button onClick={editor.recover}>{uiText("恢复到当前目标")}</button></div>}<div className="wb-phone-draft"><textarea ref={area} aria-label={uiText("手机 WorkBuddy 草稿")} value={editor.text} placeholder={isDraft?uiText("描述你要完成的任务…"):'编辑内容…'} onSelect={editing.select} onChange={e=>{editing.selection.current={start:e.target.selectionStart,end:e.target.selectionEnd};editing.change(e.target.value);}}/></div>{!t.id.startsWith('wb:doc:')&&<footer><button className="wb-phone-send" aria-label={fileContext?.isAI?uiText("发送文件指令"):isDraft?uiText("发送任务"):uiText("保存修改")} disabled={editor.blocked||editor.busy||!r.connected||editing.speech!=='idle'} onClick={()=>editor.submit()}><I.Send size={18}/>{isDraft?uiText("发送"):uiText("保存")}</button></footer>}</section>{editing.polish&&<PolishControls editing={editing}/>}</PhoneControllerFrame>;
}
