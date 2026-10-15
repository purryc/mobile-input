export interface Identity { sub:string; iss:string; aud:string|string[]; exp:number; nonce:string; email?:string; }
export function validateIdentity(c:Identity,client:string,nonce:string,subject:string,now:number):void {
 if(c.iss!=='https://auth.openai.com'||!(Array.isArray(c.aud)?c.aud:[c.aud]).includes(client)||!Number.isFinite(c.exp)||c.exp<=now/1000||c.nonce!==nonce||!c.sub||(subject&&c.sub!==subject))throw new Error('身份校验失败');
}
interface Part { type:string; text?:string; }
interface Output { type:string; content?:Part[]; }
interface Completion { status:string; output:Output[]; }
interface StreamEvent { type:string; response?:Completion; item?:Output; }
export function parsePolishStream(stream:string):string{let done=false,text='';const items:Output[]=[];
  for(const block of stream.replace(/\r\n/g,'\n').split('\n\n')){const data=block.split('\n').filter(line=>line.startsWith('data:')).map(line=>line.slice(5).trimStart()).join('\n');if(!data||data==='[DONE]')continue;const e=JSON.parse(data) as StreamEvent;if(done)throw new Error('润色结果包含重复终态');
   if(e.type==='error'||e.type==='response.failed'||e.type==='response.incomplete')throw new Error('润色未完成，原文已保留');
   if(e.type==='response.output_item.done'&&e.item?.type==='message')items.push(e.item);
   if(e.type==='response.completed'){if(done||e.response?.status!=='completed'||!Array.isArray(e.response.output))throw new Error('润色结果无效');done=true;const output=e.response.output.length?e.response.output:items;for(const item of output){if(item.type==='reasoning')continue;if(item.type!=='message')throw new Error('润色结果无效');for(const part of item.content||[]){if(part.type!=='output_text'||typeof part.text!=='string')throw new Error('润色结果无效');text+=part.text;}}}
  }if(!done||!text.trim()||text.length>8000)throw new Error('润色未完成，原文已保留');return text.trim();
 }

interface ModelEntry {slug?:string;id?:string;visibility?:string;}
interface ModelDirectory {models?:ModelEntry[];data?:ModelEntry[];}
export function selectPolishModel(raw:string):string {
 const directory=JSON.parse(raw) as ModelDirectory;
 const list=directory.models||directory.data;
 if(!Array.isArray(list))throw new Error('ChatGPT 模型目录格式暂不支持');
 const names=list.filter(m=>m.visibility===undefined||m.visibility==='list').map(m=>m.slug||m.id||'').filter(n=>/^gpt-[A-Za-z0-9._-]+$/.test(n));
 const chosen=names.find(n=>n==='gpt-6-luna')||names.find(n=>n==='gpt-6.1-sol')||names[0];
 if(!chosen)throw new Error('ChatGPT 账号暂无可用文字模型');return chosen;
}
