import {usePhoneInsets} from './phone-insets';
import './phone-home.css';
export function PhoneHome({onWorkBuddy,workbuddyLabel="打开 WorkBuddy 任务"}:{onWorkBuddy?:()=>void;workbuddyLabel?:string}){
 const style=usePhoneInsets();
 return <main className="phone-home" aria-label="手机待机桌面" style={style}><img src="/reference-assets/phone-home.png" alt="" draggable={false}/>{onWorkBuddy&&<button className="phone-workbuddy-entry" onClick={onWorkBuddy}>{workbuddyLabel}</button>}</main>;
}
