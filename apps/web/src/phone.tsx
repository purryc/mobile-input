import {PhoneGeneric} from './phone-generic';
import {PhonePaint} from './phone-paint';
import {PhoneBilibili} from './phone-bilibili';
import {PhoneWorkBuddy} from './phone-workbuddy';
import {PhoneHome} from './phone-home';
import {PresentationPhone} from './phone-presentation';
import {PhoneWeChat,SwitchButton} from './phone-wechat';
import {FcController} from './phone-game';
import {useEffect,useRef,useState} from 'react';import * as I from 'lucide-react';
import {apps,type Target} from '../../../packages/core/model';import {command,useRuntime,toast,uid} from './runtime';import {Icon} from './tablet';import {AppIcon} from './desktop';
export function Phone(){
 const r=useRuntime();
 if(r.state.app==='paint')return <PhonePaint/>;
 if(r.state.app==='bilibili')return <PhoneBilibili/>;
 if(r.state.app==='workbuddy'&&r.state.target?.id.startsWith('wb:'))return <PhoneWorkBuddy key={r.state.target.id}/>;
 if(!r.connected&&!['slides','mario'].includes(r.state.app)&&!r.state.editSession?.key)return <PhoneHome/>;
 if(r.state.app==='workbuddy')return <PhoneGeneric/>;
 if(r.state.app==='slides')return <PresentationPhone/>;
 if(r.state.app==='wechat')return r.connected&&r.state.chat.activation?.phase==='ready'?<PhoneWeChat/>:<PhoneHome/>;
 if(r.state.app==='mario')return <FcController/>;
 return r.state.app==='desktop'?<PhoneHome/>:<PhoneGeneric/>;
}
