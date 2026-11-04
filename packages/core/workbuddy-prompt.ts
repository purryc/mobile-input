import type {State} from './model';
import {activeFileView} from './workbuddy-files';
import {objectContext} from './workbuddy-object';
export interface PromptArtifactContext {file:string;name:string;view:string;base:number;version:number;page?:string;path?:string;start?:number;end?:number;selection?:string;content:string;}
/** Read-only context capture. Prompt writes never focus/replace artifact text. */
export function promptArtifactContext(s:State):PromptArtifactContext|undefined {
 const w=s.workbuddy;if(!w.fileBrowser||(!w.fileBrowser.visible&&!w.previewActive))return;
 const view=activeFileView(s),id=view.active||w.previewActive;if(!id)return;
 const file=w.files.find(f=>f.id===id),doc=w.fileBrowser.docs[id];if(!file||!doc)return;
 const copy=view.working[id],body=copy?.body||doc.saved,o=objectContext(s);
 const selected=o?.file===id&&o.view===view.id?o:undefined;
 return {file:id,name:file.name,view:view.id,base:doc.revision,version:copy?.version||0,page:view.promptPage?.file===id?view.promptPage.page:body.webDeck?.pages[0]?.id,...(selected?{path:selected.path,start:selected.start,end:selected.end,selection:selected.source,page:selected.path.split('/')[1]}:{}),content:(body.webDeck?JSON.stringify(body.webDeck.pages):body.text||file.content).slice(0,16000)};
}
export function promptContextMatches(s:State,context:unknown){return JSON.stringify(promptArtifactContext(s)||null)===JSON.stringify(context||null);}
