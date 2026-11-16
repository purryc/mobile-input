import {useUI} from './ui-context';
import * as I from 'lucide-react';
export function ReplyOptions({replies,disabled=false,onReply}:{replies:string[];disabled?:boolean;onReply:(text:string)=>void}){return <div className="reply-options pop-actions">{replies.map((text,index)=><button style={{animationDelay:`${index*110}ms`}} disabled={disabled} key={text} onClick={()=>onReply(text)}>{text}<I.ChevronRight size={20}/></button>)}</div>;}
