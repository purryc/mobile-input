import {CapturePanel} from './capture-panel';
import {discardNativePhoto,useNativePhoto} from './native-photo-state';
import {usePhoneInsets} from './phone-insets';
export function NativePhotoOverlay(){const photo=useNativePhoto(),insets=usePhoneInsets();return photo?<div className="bili-phone wb-adaptive-phone native-photo-overlay" style={insets}><CapturePanel photo={photo} close={discardNativePhoto}/></div>:null;}
