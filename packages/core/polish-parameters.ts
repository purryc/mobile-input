import {extractLiveParameters} from './live-workbuddy';
export function validatePolishParameters(before:string,after:string){
 const original=extractLiveParameters(before),next=extractLiveParameters(after);
 if(original.length!==next.length||original.some(p=>!next.some(n=>n.id===p.id&&n.phrase===p.phrase&&n.value===p.value)))throw Error('润色改变了输入参数，原文已保留，请重试');
}
/** Protect parameter clauses, not just color words: roles and material
 * invitations must remain editable after a model rephrases the surrounding prose. */
export function protectPolishParameters(text:string){
 const parameters=extractLiveParameters(text),ranges:{start:number;end:number}[]=[];
 for(const p of parameters){
  let start=p.start;
  while(start>0&&!/[，,。；;\n]/.test(text[start-1]))start--;
  // An ASR-inserted full stop can separate the role from the color value.
  if(p.kind==='color'&&/^\s*$/.test(text.slice(start,p.start))&&start>0){const previous=text.slice(0,start-1);const boundary=Math.max(previous.lastIndexOf('，'),previous.lastIndexOf(','),previous.lastIndexOf('。'),previous.lastIndexOf('；'),previous.lastIndexOf('\n'))+1;if(/(?:背景|主题测试|主题色?|主色|字体|文字|标题|强调色)(?:颜色|色)?\s*(?:用|设为|设置为|改成|改为|是|为|采用)?\s*$/.test(previous.slice(boundary)))start=boundary;}
  let end=p.end;while(end<text.length&&!/[，,。；;\n]/.test(text[end]))end++;
  const previous=ranges.at(-1);if(previous&&start<=previous.end)previous.end=Math.max(previous.end,end);else ranges.push({start,end});
 }
 const prefix='MI_KEEP_'+Array.from(text).reduce((h,c)=>(Math.imul(h,31)+c.codePointAt(0)!)>>>0,7).toString(16)+'_';
 let masked='',cursor=0;const protectedParts=ranges.map((r,i)=>({token:`⟦${prefix}${i}⟧`,text:text.slice(r.start,r.end),...r}));
 for(const p of protectedParts){masked+=text.slice(cursor,p.start)+p.token;cursor=p.end;}masked+=text.slice(cursor);
 return {text:masked,restore(result:string){let restored=result;for(const p of protectedParts){if(restored.split(p.token).length!==2)throw Error('润色未完整保留输入参数，原文已保留，请重试');restored=restored.replace(p.token,p.text);}
  validatePolishParameters(text,restored);return restored;}};
}
