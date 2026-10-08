import {uid} from './runtime';
function nativeClipboard(operation:'read'|'write',text=''):Promise<string>{
 return new Promise((resolve,reject)=>{const id=uid();const done=(e:Event)=>{const d=(e as CustomEvent).detail;if(d.id!==id)return;clearTimeout(timer);window.removeEventListener('native-clipboard',done);d.ok?resolve(d.text||''):reject(new Error(d.error||'剪贴板不可用，请重试'));};const timer=setTimeout(()=>{window.removeEventListener('native-clipboard',done);reject(new Error('剪贴板未响应，请重试'));},60000);window.addEventListener('native-clipboard',done);window.MobileNative!.clipboard(id,operation,text);});
}
export async function clipboardRead(){if(window.MobileNative)return nativeClipboard('read');return navigator.clipboard.readText();}
export async function clipboardWrite(text:string){if(window.MobileNative){await nativeClipboard('write',text);return;}await navigator.clipboard.writeText(text);}
