import {WebDeckPlayback} from './web-deck-view';
import {InputSessionGate} from './input-session-ui';
import {PhoneDesktop} from './phone-desktop';
import {ConnectionButton} from './connection-access';
import {retryStateSync} from './runtime';
import './phone-sync.css';
import {PhoneGeneric} from './phone-generic';
import {PhonePaint} from './phone-paint';
import {PhoneBilibili} from './phone-bilibili';
import {PhoneWorkBuddy} from './phone-workbuddy';
import {PhoneConnectionState} from './input-session-ui';
import {PresentationPhone} from './phone-presentation';
import {PhoneWeChat,SwitchButton} from './phone-wechat';
import {FcController} from './phone-game';
import {useEffect,useRef,useState} from 'react';import * as I from 'lucide-react';
import {apps,type Target} from '../../../packages/core/model';import {command,useRuntime,toast,uid} from './runtime';import {Icon} from './tablet';import {AppIcon} from './desktop';
export function Phone(){
 const r=useRuntime();
 return <><InputSessionGate><PhoneScene/></InputSessionGate>{r.syncing&&<div className={'phone-state-sync'+(r.refreshing?' phone-state-refresh':'')} role="status" aria-label="正在同步大屏">{!r.refreshing&&<ConnectionButton/>}<span className="sync-orbit" aria-hidden/><strong>{r.status}</strong>{!r.refreshing&&<span>保留当前输入，等待大屏状态</span>}{r.status.includes('较慢')&&<button onClick={retryStateSync}>重新同步</button>}</div>}</>;
}
function PhoneScene(){
 const r=useRuntime();
 if(r.state.app==='workbuddy'&&r.state.workbuddy.deckPlayback)return <WebDeckPlayback phone/>;
 if(r.state.app==='paint')return <PhonePaint/>;
 if(r.state.app==='bilibili')return <PhoneBilibili/>;
 if(r.state.app==='workbuddy'&&r.state.target?.id.startsWith('wb:'))return <PhoneWorkBuddy key={r.state.target.id}/>;
 if(!r.linked&&!['slides','mario'].includes(r.state.app)&&!r.state.editSession?.key)return <PhoneConnectionState/>;
 if(r.state.app==='workbuddy'&&(r.state.workbuddy.fileBrowser?.visible||r.state.workbuddy.previewActive&&r.state.workbuddy.preview.includes(r.state.workbuddy.previewActive)))return <PhoneDesktop result/>;
 if(r.state.app==='workbuddy')return <PhoneGeneric/>;
 if(r.state.app==='slides')return <PresentationPhone/>;
 if(r.state.app==='wechat')return <PhoneWeChat/>;
 if(r.state.app==='mario')return <FcController/>;
 return r.state.app==='desktop'?<PhoneDesktop/>:<PhoneGeneric/>;
}
