import {extractLiveParameters} from './live-workbuddy';
export function validatePolishParameters(before:string,after:string){
 const original=extractLiveParameters(before),next=extractLiveParameters(after);
 if(original.length!==next.length||original.some(p=>!next.some(n=>n.id===p.id&&n.phrase===p.phrase&&n.value===p.value)))throw Error('润色改变了输入参数，原文已保留，请重试');
}
/** Preserve the smallest complete parameter expression; surrounding prose stays editable. */
export function protectPolishParameters(text:string){
 const parameters=extractLiveParameters(text),ranges:{start:number;end:number}[]=[];
 for(const p of parameters){
  let start=p.start,end=p.end;
  const before=text.slice(0,start),after=text.slice(end);
  const role=p.kind==='color'?/(?:背景|主题测试|主题色|主色|主题|字体|文字|标题|强调色)(?:的)?(?:颜色|色)?[\s。．，,：:]{0,6}(?:我想|我希望|希望)?(?:设置成|设置为|换成|改成|改为|设为|采用|使用|选择|要用|是用|用|要|是|为)?[\s。．，,：:]{0,6}$/:
   p.kind==='duration'?/(?:讲|演讲|汇报|时长|控制在|大约|约)\s*$/:p.kind==='document'?/(?:参考|依据|用|附上|添加|上传|选择)(?:这份|我的|一下|一份)?\s*$/:p.kind==='photo'?/(?:放入|放|加入|添加|拍|上传|提供|参考|使用|用|还有|有)(?:我的|这些|一些|几张|一下|入|张|一张|两张|[一二三四五六七八九十\d]+张)?\s*$/:/(?:布局|排版)(?:我来|我)?$/;
  const prefix=before.match(role);if(prefix)start-=prefix[0].length;
  if(p.kind==='duration'){const suffix=after.match(/^\s*分钟(?:的)?(?:演讲|演示|汇报|发言|讲话)?/);if(suffix)end+=suffix[0].length;}
  // Explicit page scope must not be rewritten into a different parameter owner.
  if(p.scope!=='全文'){const pos=text.lastIndexOf(p.scope,start);if(pos>=0&&start-pos<80)ranges.push({start:pos,end:pos+p.scope.length});}
  ranges.push({start,end});
 }
 // Negative constraints are not positive parameters, but remain binding facts.
 for(const m of text.matchAll(/(?:不要|不用|无需|不需要|别|取消)[^，,。；;\n]{0,50}(?:红色?|灰色?|黑色?|蓝色?|照片|图片|文件|资料|布局|排版|画一下)/g))ranges.push({start:m.index!,end:m.index!+m[0].length});
 ranges.sort((a,b)=>a.start-b.start);const merged:typeof ranges=[];
 for(const r of ranges){const previous=merged.at(-1);if(previous&&r.start<=previous.end)previous.end=Math.max(previous.end,r.end);else merged.push({...r});}
 const prefix='MI_KEEP_'+Array.from(text).reduce((h,c)=>(Math.imul(h,31)+c.codePointAt(0)!)>>>0,7).toString(16)+'_';
 let masked='',cursor=0;const protectedParts=merged.map((r,i)=>({token:`⟦${prefix}${i}⟧`,text:text.slice(r.start,r.end),...r}));
 for(const p of protectedParts){masked+=text.slice(cursor,p.start)+p.token;cursor=p.end;}masked+=text.slice(cursor);
 return {text:masked,restore(result:string){let restored=result,last=-1;for(const p of protectedParts){const at=result.indexOf(p.token);if(at<=last)throw Error('润色改变了输入参数顺序，原文已保留，请重试');last=at;if(restored.split(p.token).length!==2)throw Error('润色未完整保留输入参数，原文已保留，请重试');restored=restored.replace(p.token,p.text);}
  validatePolishParameters(text,restored);return restored;}};
}
