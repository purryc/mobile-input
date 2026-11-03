/** Tablet-only Google calls. API keys never leave the native Asset Store. */
export interface DeckNativeStatus {configured:boolean;model:string;error:string;}
export interface DeckNative {
 deckConfigure?(key:string,model:string):string;
 deckControl?(operation:string):string;
 deckBegin?(id:string,length:number):string;
 deckChunk?(id:string,offset:number,part:string):string;
 deckModel?(id:string,body:string):string;
 deckCancel?(id:string):string;
 deckReadFile?(handle:string,offset:number):string;
 deckReleaseFile?(handle:string):string;
 deckPickFile?(id:string,kind:string):string;
}
export const deckNative=()=>window.MobileNative as (typeof window.MobileNative&DeckNative);
export const nativeDeckEnabled=()=>!!window.MobileNative;
export async function nativeDeckModel(parts:unknown[],schema:unknown,signal:AbortSignal):Promise<any>{
 const api=deckNative();if(!api?.deckModel||!api.deckBegin||!api.deckChunk)throw Error('请更新平板 Input Agent，网页演示需要新版原生组件');
 if(parts.length>40)throw Error('材料过多');
 return new Promise((resolve,reject)=>{const id=crypto.randomUUID();let timer:ReturnType<typeof setTimeout>,settled=false;
 const clean=()=>{settled=true;clearTimeout(timer);window.removeEventListener('native-deck-result',listener);window.removeEventListener('native-foreground',foreground);signal.removeEventListener('abort',abort);};
 const foreground=(event:Event)=>{if((event as CustomEvent).detail!==false)return;clean();api.deckCancel?.(id);reject(Error('生成已暂停，请返回平板后重新生成'));};
 const abort=()=>{clean();api.deckCancel?.(id);reject(new DOMException('已停止','AbortError'));};
 const listener=(e:Event)=>{const d=(e as CustomEvent).detail;if(d.id!==id)return;clean();if(!d.ok){reject(Error(d.error||'生成失败，输入已保留'));return;}try{if(typeof d.model==='string')Object.assign(nativeDeckModel,{model:d.model});const result=JSON.parse(d.text),candidate=result.candidates?.[0];if(candidate?.finishReason!=='STOP')throw Error('生成未完整结束，请重试');const text=candidate.content?.parts?.filter((p:any)=>p.text&&!p.thought).map((p:any)=>p.text).join('');resolve(JSON.parse(text));}catch(e){reject(e);}};
 if(signal.aborted){abort();return;}window.addEventListener('native-deck-result',listener);window.addEventListener('native-foreground',foreground);signal.addEventListener('abort',abort,{once:true});timer=setTimeout(()=>{clean();api.deckCancel?.(id);reject(Error('生成超时，输入已保留，可重新生成'));},185000);
 const payload=JSON.stringify({contents:[{role:'user',parts}],generationConfig:{responseMimeType:'application/json',responseSchema:schema,maxOutputTokens:16384}});
 if(payload.length>36*1024*1024){clean();reject(Error('材料过大'));return;}
 void(async()=>{try{
  if(api.deckBegin!(id,payload.length)!=='ready')throw Error('请在平板连接设置中配置网页演示，并保持平板在前台');
  for(let offset=0;offset<payload.length;offset+=24576){
   if(settled)return;
   if(signal.aborted)throw new DOMException('已停止','AbortError');
   if(api.deckChunk!(id,offset,payload.slice(offset,offset+24576))!=='stored')throw Error('材料传入失败，请重新生成');
   if(offset>0&&offset%(24576*16)===0)await new Promise(done=>setTimeout(done,0));
  }
  if(settled)return;
  if(signal.aborted)throw new DOMException('已停止','AbortError');
  if(api.deckModel!(id,'')!=='pending')throw Error('请保持平板在前台后重新生成');
 }catch(e){clean();api.deckCancel?.(id);reject(e);}})();
 });
}
