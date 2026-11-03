import {http} from '@kit.NetworkKit';
import {asset} from '@kit.AssetStoreKit';
import {util} from '@kit.ArkTS';
class DeckConfig {apiKey:string='';model:string='gemini-3.8-flash';}
class DeckStatus {configured:boolean=false;model:string='gemini-3.8-flash';error:string='';}
class DeckResult {id:string='';ok:boolean=false;text:string='';error:string='';model:string='';}
class DeckPayload {length:number=0;offset:number=0;parts:string[]=[];at:number=0;}
/** Tablet-local generation. No URL, credential, file path or shell operation is accepted from peers. */
export class DeckService {
 private emit:(name:string,data:string)=>void;
 private payloads:Map<string,DeckPayload>=new Map();
 private requests:Map<string,http.HttpRequest>=new Map();
 private alias:Uint8Array=new util.TextEncoder().encodeInto('input-agent-deck-gemini-v1');
 constructor(emit:(name:string,data:string)=>void){this.emit=emit;}
 private query():asset.AssetMap{const q:asset.AssetMap=new Map();q.set(asset.Tag.ALIAS,this.alias);return q;}
 private read():DeckConfig|null{const q=this.query();q.set(asset.Tag.RETURN_TYPE,asset.ReturnType.ALL);try{const rows=asset.querySync(q);return rows.length?JSON.parse(new util.TextDecoder().decodeWithStream(rows[0].get(asset.Tag.SECRET) as Uint8Array,{stream:false})) as DeckConfig:null;}catch{return null;}}
 status(error:string=''):void{const c=this.read();const s:DeckStatus={configured:!!c,model:c?.model||'gemini-3.8-flash',error};this.emit('native-deck-status',JSON.stringify(s));}
 configure(key:string,model:string):string{
  key=key.trim();model=model.trim()||'gemini-3.8-flash';
  if(!/^[A-Za-z0-9_.-]{20,300}$/.test(key)||!/^gemini-[a-zA-Z0-9._-]{1,80}$/.test(model)){this.status('请输入有效的 Google API 密钥和模型');return 'failed';}
  this.cancel('');const c:DeckConfig={apiKey:key,model};const a=this.query();a.set(asset.Tag.SECRET,new util.TextEncoder().encodeInto(JSON.stringify(c)));a.set(asset.Tag.ACCESSIBILITY,asset.Accessibility.DEVICE_UNLOCKED);a.set(asset.Tag.SYNC_TYPE,asset.SyncType.NEVER);a.set(asset.Tag.CONFLICT_RESOLUTION,asset.ConflictResolution.OVERWRITE);
  try{asset.addSync(a);this.status();return 'saved';}catch{this.status('无法安全保存，请解锁平板后重试');return 'failed';}
 }
 remove():void{this.cancel('');try{asset.removeSync(this.query());this.status();}catch{this.status('请解锁平板后重试');}}
 cancel(id:string):void{if(!id){this.payloads.clear();this.requests.forEach((r:http.HttpRequest)=>r.destroy());this.requests.clear();return;}this.payloads.delete(id);const r=this.requests.get(id);this.requests.delete(id);r?.destroy();}
 begin(id:string,length:number):string{const now=Date.now();this.payloads.forEach((p:DeckPayload,key:string)=>{if(now-p.at>120000)this.payloads.delete(key);});if(!/^[a-f0-9-]{36}$/.test(id)||!Number.isInteger(length)||length<2||length>36*1024*1024||this.requests.size+this.payloads.size>=2||this.payloads.has(id)||this.requests.has(id))return 'unavailable';if(!this.read()){this.status('请先配置网页演示 API');return 'unavailable';}const p:DeckPayload={length,offset:0,parts:[],at:now};this.payloads.set(id,p);return 'ready';}
 chunk(id:string,offset:number,part:string):string{const p=this.payloads.get(id);if(!p||offset!==p.offset||part.length<1||part.length>24576||offset+part.length>p.length)return 'failed';p.parts.push(part);p.offset+=part.length;p.at=Date.now();return 'stored';}
 start(id:string,body:string):string{const p=this.payloads.get(id);this.payloads.delete(id);if(!p||body!==''||p.offset!==p.length||this.requests.size>=2)return 'unavailable';const config=this.read();if(!config)return 'unavailable';const req=http.createHttp();this.requests.set(id,req);this.run(id,p.parts.join(''),config,req);return 'pending';}

 private async run(id:string,body:string,config:DeckConfig,req:http.HttpRequest):Promise<void>{
  const result:DeckResult={id,ok:false,text:'',error:'',model:config.model};
  try{const response=await req.request('https://generativelanguage.googleapis.com/v1beta/models/'+config.model+':generateContent',{method:http.RequestMethod.POST,header:{'x-goog-api-key':config.apiKey,'Content-Type':'application/json'},extraData:body,expectDataType:http.HttpDataType.STRING,connectTimeout:15000,readTimeout:180000,maxLimit:2097152});if(response.responseCode===200){result.ok=true;result.text=String(response.result);}else result.error=response.responseCode===429?'请求额度不足，请稍后重试':response.responseCode===401||response.responseCode===403?'请检查平板网页演示 API 配置':'生成未完成，请检查网络后重试';}catch{result.error='无法连接 Gemini，请检查平板网络后重试';}
  finally{if(this.requests.get(id)===req){this.requests.delete(id);this.emit('native-deck-result',JSON.stringify(result));}req.destroy();}
 }
}
