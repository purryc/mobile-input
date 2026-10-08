import {initialChats} from './interactions';
import {CHAT_SCENE_VERSION,bossMessage,bossMessages} from './chat-scene';
import type {State} from './model';
import {salesSpeakerNotes,legacySpeakerNotes,legacyRefreshedOpening} from './sales-speaker-notes';
export function migrateSpeakerNotes(s:State,backup:(key:string,value:string)=>void):State{
 if(s.texts['speaker-notes-version']==='2')return s;
 backup('mobile-input:backup:speaker-notes-v1',JSON.stringify({savedAt:new Date().toISOString(),slides:s.slides,files:s.officeFiles.filter(f=>f.id==='sample-slides')}));
 const next=structuredClone(s);
 const upgrade=(slides:State['slides'])=>slides.forEach((slide,i)=>{
  if(next.texts[`edited:slide:${i}:notes`])return;
  if(slide.notes===legacySpeakerNotes[i]||(i===0&&slide.notes===legacyRefreshedOpening))slide.notes=salesSpeakerNotes[i];
 });
 for(const file of next.officeFiles)if(file.id==='sample-slides'&&file.slides)upgrade(file.slides);
 if(next.officeFile==='sample-slides'||!next.officeFile)upgrade(next.slides);
 next.texts['speaker-notes-version']='2';
 return next;
}
/** Back up first. If storage fails, callers keep the original scene. */
export function migrateChat(s:State,backup:(key:string,value:string)=>void){
 if(s.chat?.sceneVersion===CHAT_SCENE_VERSION)return s;
 backup(`mobile-input:backup:boss-scene-v${s.chat?.sceneVersion||1}`, JSON.stringify({savedAt:new Date().toISOString(),chat:s.chat,text:s.texts['wechat-draft']}));
 const next=structuredClone(s),fresh=initialChats();
 next.chat={...fresh,...s.chat,sceneVersion:fresh.sceneVersion,meeting:{...(s.chat?.meeting||fresh.meeting),text:bossMessage()},context:null,activation:null,
 messages:{...fresh.messages,...s.chat?.messages,'wx-boss':bossMessages()},
 drafts:{...fresh.drafts,...s.chat?.drafts}};
 return next;
}
