/** Source coordinates remain exact even when labels repeat or a table is edited. */
export interface MarkdownUnit {start:number;end:number;text:string;heading:number;row?:number;cell?:number;header?:boolean;}
export function markdownUnits(text:string):MarkdownUnit[]{
 const units:MarkdownUnit[]=[];let offset=0,row=0;
 const lines=text.split('\n');
 for(let i=0;i<lines.length;i++){const line=lines[i],start=offset;offset+=line.length+1;
  if(!line.trim())continue;
  if(/^\s*\|?\s*:?-{3,}:?\s*\|/.test(line))continue;
  if(/^\s*\|.*\|\s*$/.test(line)){
   const matches=[...line.matchAll(/(?<!\\)\|/g)];const header=i+1<lines.length&&/^\s*\|?\s*:?-{3,}/.test(lines[i+1]);
   for(let c=0;c<matches.length-1;c++){const a=matches[c].index!+1,b=matches[c+1].index!,raw=line.slice(a,b),left=raw.length-raw.trimStart().length,right=raw.trimEnd().length;units.push({start:start+a+left,end:start+a+Math.max(left,right),text:raw.trim(),heading:0,row,cell:c,header});}row++;continue;
  }
  const prefix=line.match(/^(#{1,6})\s+|^(?:[-*+] |\d+\. |>|> )/),length=prefix?.[0].length||0;
  units.push({start:start+length,end:start+line.length,text:line.slice(length),heading:prefix?.[1]?.length||0});
 }
 return units;
}
export interface MarkdownLeaf {text:string;start:number;end:number;marks:string[];href?:string;}
export function markdownLeaves(text:string,offset=0,marks:string[]=[]):MarkdownLeaf[]{
 const re=/(\*\*([^\n]+?)\*\*|~~([^\n]+?)~~|<u>([^\n]*?)<\/u>|`([^`\n]+)`|\*([^*\n]+)\*|\[([^\]\n]+)\]\(([^)\n]+)\))/g;
 const result:MarkdownLeaf[]=[];let cursor=0;for(const m of text.matchAll(re)){const index=m.index!;if(index>cursor)result.push({text:text.slice(cursor,index),start:offset+cursor,end:offset+index,marks});
 const kind=m[2]!==undefined?'bold':m[3]!==undefined?'strike':m[4]!==undefined?'underline':m[5]!==undefined?'code':m[6]!==undefined?'italic':'link',value=m[2]??m[3]??m[4]??m[5]??m[6]??m[7],prefix=kind==='bold'||kind==='strike'?2:kind==='underline'?3:1;
 const leaves=kind==='code'?[{text:value,start:offset+index+prefix,end:offset+index+prefix+value.length,marks:[...marks,kind]}]:markdownLeaves(value,offset+index+prefix,[...marks,kind]);
 result.push(...leaves.map(l=>({...l,...(kind==='link'?{href:m[8]}:{})})));cursor=index+m[0].length;
 }if(cursor<text.length)result.push({text:text.slice(cursor),start:offset+cursor,end:offset+text.length,marks});return result;
}
export function markdownSelectionStyle(text:string,start:number,end:number){
 const leaves=markdownLeaves(text).filter(l=>l.start<end&&l.end>start),style:{bold:boolean;italic:boolean;underline:boolean;strike:boolean;href:string}={bold:false,italic:false,underline:false,strike:false,href:''},mixed:string[]=[];
 for(const key of ['bold','italic','underline','strike','href'] as const){const values=leaves.map(l=>key==='href'?l.href||'':l.marks.includes(key));if(values.some(v=>v!==values[0]))mixed.push(key);else if(values.length)(style as Record<string,unknown>)[key]=values[0];}return {style,mixed};
}
