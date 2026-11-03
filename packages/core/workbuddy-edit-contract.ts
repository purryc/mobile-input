/** Bounded selection edits shared by native Gemini, HTTP and the file reducer. */
export interface FileEditTarget {
 view:string; file:string; path:string; start:number; end:number;
 base:number; version:number; source:string;
}
export interface FileEditRequest {target:FileEditTarget; instruction:string;}
export interface FileEditPatch {text:string;}
export function validEditTarget(t:any):t is FileEditTarget {
 return !!t&&['view','file','path','source'].every(k=>typeof t[k]==='string')&&t.view.length>0&&t.file.length>0&&t.view.length<=200&&t.file.length<=200&&t.path.length<=250&&t.source.length<=20000&&Number.isInteger(t.start)&&Number.isInteger(t.end)&&t.start>=0&&t.end>=t.start&&t.end-t.start===t.source.length&&Number.isInteger(t.base)&&t.base>=0&&Number.isInteger(t.version)&&t.version>=0;
}
export function validTextRange(text:string,start:number,end:number){return Number.isInteger(start)&&Number.isInteger(end)&&start>=0&&end>=start&&end<=text.length&&![start,end].some(i=>i>0&&i<text.length&&/[\uD800-\uDBFF]/.test(text[i-1])&&/[\uDC00-\uDFFF]/.test(text[i]));}
export function markdownMark(text:string,start:number,end:number,mark:string,href=''):{text:string;start:number;end:number}|null {
 if(!validTextRange(text,start,end)||start===end)return null;
 const pairs:Record<string,[string,string]>={bold:['**','**'],italic:['*','*'],underline:['<u>','</u>'],strike:['~~','~~'],code:['`','`']};
 if(mark==='link'){if(!/^(https?:\/\/|mailto:)[^\s<>]*$/i.test(href)||href.length>2000)return null;pairs.link=['[',']('+href.replace(/[()]/g,c=>encodeURIComponent(c))+')'];}
 const pair=pairs[mark];if(!pair)return null;const [open,close]=pair;
 if(text.slice(Math.max(0,start-open.length),start)===open&&text.slice(end,end+close.length)===close)return {text:text.slice(0,start-open.length)+text.slice(start,end)+text.slice(end+close.length),start:start-open.length,end:end-open.length};
 return {text:text.slice(0,start)+open+text.slice(start,end)+close+text.slice(end),start:start+open.length,end:end+open.length};
}
