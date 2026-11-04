/** UTF-16 offsets match DOM selection and macOS AXSelectedTextRange. */
export type TextSelection={start:number;end:number};
export function clampSelection(range:TextSelection,length:number):TextSelection {
 const start=Math.max(0,Math.min(length,range.start));return {start,end:Math.max(start,Math.min(length,range.end))};
}
export function selectionAfterTextChange(before:string,after:string,range:TextSelection):TextSelection {
 if(before===after)return clampSelection(range,after.length);
 let start=0;while(start<before.length&&start<after.length&&before[start]===after[start])start++;
 let oldEnd=before.length,newEnd=after.length;while(oldEnd>start&&newEnd>start&&before[oldEnd-1]===after[newEnd-1]){oldEnd--;newEnd--;}
 const map=(at:number)=>at<start?at:at<=oldEnd?newEnd:at+newEnd-oldEnd;
 return clampSelection({start:map(range.start),end:map(range.end)},after.length);
}
export function mapProjectedSelection(range:TextSelection,spans:{sourceStart:number;sourceEnd:number;targetStart:number;targetEnd:number}[],reverse=false):TextSelection {
 const map=(at:number)=>{let delta=0;for(const span of spans){const a=reverse?span.targetStart:span.sourceStart,b=reverse?span.targetEnd:span.sourceEnd,c=reverse?span.sourceStart:span.targetStart,d=reverse?span.sourceEnd:span.targetEnd;if(at<a)break;if(at<=b)return at===a?c:at===b?d:c+Math.round((at-a)*(d-c)/(b-a));delta=d-b;}return at+delta;};
 return {start:map(range.start),end:map(range.end)};
}
