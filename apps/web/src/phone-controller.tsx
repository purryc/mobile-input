import {useRuntime,dismissToast} from './runtime';
import {InputToast} from './input-toast';
import {usePhoneControl} from './phone-control-adapter';
import {Phone} from './phone';
import {PhoneMac} from './phone-mac';
import {NativePhotoOverlay} from './native-photo-overlay';
/** One root. Dedicated scenes keep their capability-specific controls; Agent views share a shell. */
export function PhoneController(){const {snapshot}=usePhoneControl(),r=useRuntime();return <>{snapshot.destination==='demo'?<><Phone/><NativePhotoOverlay/></>:<PhoneMac/>}{r.toast&&<InputToast message={r.toast} onDismiss={()=>dismissToast(r.toast)}/>}</>;}
