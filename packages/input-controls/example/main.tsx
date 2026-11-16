import {Minimal} from "./minimal";
import {useEffect,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {controlKinds,type WidgetKind} from '../src';
import {WidgetPreview} from './widget-preview';
import {definition} from './choices';
import '../src/desktop.css';
import './site.css';
function App(){const [kind,setKind]=useState<WidgetKind>(()=>controlKinds.find(k=>location.hash==='#/'+k)||'duration');const [language,setLanguage]=useState('en');
useEffect(()=>{const update=()=>setKind(controlKinds.find(k=>location.hash==='#/'+k)||'duration');addEventListener('hashchange',update);return()=>removeEventListener('hashchange',update);},[]);
return <main className="example-page"><header><h1>Input Controls · React</h1><button type="button" onClick={()=>setLanguage(v=>v==='en'?'zh-CN':'en')}>{language==='en'?'中文':'English'}</button></header><p>{language==='en'?'13 independent widgets. Click a chip to try it; values stay in this example.':'13类独立控件。点击chip直接体验，数据仅保存在当前示例。'}</p><nav>{controlKinds.map(k=><a key={k} href={'#/'+k} aria-current={kind===k?'page':undefined}>{language==='en'?definition(k).en:definition(k).zh}</a>)}</nav><WidgetPreview key={kind} kind={kind} language={language} assetBase={import.meta.env.BASE_URL}/></main>;}
createRoot(document.getElementById('root')!).render(new URLSearchParams(location.search).has('minimal')?<Minimal/>:<App/>);
