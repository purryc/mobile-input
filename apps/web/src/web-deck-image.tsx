import {uiText} from './i18n';
import {useEffect,useState} from 'react';
import {resolveDeckAssetUrl} from './web-deck-api';
export function DeckImage({id,alt,style}:{id:string;alt:string;style?:React.CSSProperties}){const [url,setUrl]=useState(''),[failed,setFailed]=useState(false),[retry,setRetry]=useState(0);useEffect(()=>{let cancelled=false;setUrl('');setFailed(false);resolveDeckAssetUrl(id).then(value=>{if(!cancelled)setUrl(value);},()=>{if(!cancelled)setFailed(true);});return()=>{cancelled=true;};},[id,retry]);return url?<img src={url} alt={alt} style={style}/>:failed?<span role="status" className="deck-image-error" onClick={e=>{e.stopPropagation();setRetry(r=>r+1);}}>{uiText("图片未加载，点击重试")}</span>:<span aria-label={uiText("正在读取图片")}/>;}
