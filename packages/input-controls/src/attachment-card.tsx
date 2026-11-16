import {useEffect,useState} from 'react';
import {FileText,Play,X} from 'lucide-react';
import {useWidgetText} from './environment';
export interface AttachmentCardProps {file:File; onRemove?:()=>void; onPreview?:()=>void;}
/** A controlled compact card; preview policy and ownership remain host decisions. */
export function AttachmentCard({file,onRemove,onPreview}:AttachmentCardProps){
 const t=useWidgetText();const [url,setUrl]=useState('');
 useEffect(()=>{const next=URL.createObjectURL(file);setUrl(next);return()=>URL.revokeObjectURL(next);},[file]);
 return <div className="ic-demo-material"><button type="button" title={file.name} aria-label={t('查看 ')+file.name} onClick={onPreview} disabled={!onPreview}>{file.type.startsWith('image/')?<div className="ic-demo-material-thumb"><img src={url||undefined} alt=""/></div>:file.type.startsWith('video/')?<div className="ic-demo-material-thumb"><video src={url||undefined} muted preload="metadata"/><Play size={22}/></div>:<FileText size={24}/>}<span>{file.name}</span></button>{onRemove&&<button type="button" className="ic-demo-remove" aria-label={t('移除 ')+file.name} onClick={onRemove}><X size={14}/></button>}</div>;
}
