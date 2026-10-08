import {usePhoneInsets} from './phone-insets';
import './phone-home.css';
export function PhoneHome(){
 const style=usePhoneInsets();
 return <main className="phone-home" aria-label="手机待机桌面" style={style}><img src="/reference-assets/phone-home.png" alt="" draggable={false}/></main>;
}
