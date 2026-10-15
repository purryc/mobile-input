import { image } from '@kit.ImageKit';
import { window } from '@kit.ArkUI';
import { common } from '@kit.AbilityKit';
import { util } from '@kit.ArkTS';

// Snapshot only this application's own window. The Web layer crops the active
// replica application before preview or transfer; no desktop capture is used.
export async function windowCapture(context:common.UIAbilityContext):Promise<string> {
 const current=await window.getLastWindow(context);
 const pixels=await current.snapshot();
 const packer=image.createImagePacker();
 try {
  const info=await pixels.getImageInfo();
  const scale=Math.min(1,1440/Math.max(info.size.width,info.size.height));
  if(scale<1)await pixels.scale(scale,scale);
  const data=await packer.packToData(pixels,{format:'image/jpeg',quality:85});
  return 'data:image/jpeg;base64,'+new util.Base64Helper().encodeToStringSync(new Uint8Array(data));
 }finally{await pixels.release();await packer.release();}
}
