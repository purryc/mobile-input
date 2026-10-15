import { camera, cameraPicker } from '@kit.CameraKit';
import { image } from '@kit.ImageKit';
import { fileIo } from '@kit.CoreFileKit';
import { common } from '@kit.AbilityKit';
import { util } from '@kit.ArkTS';

export async function photoCapture(context:common.UIAbilityContext):Promise<string> {
 const result=await cameraPicker.pick(context,[cameraPicker.PickerMediaType.PHOTO],{cameraPosition:camera.CameraPosition.CAMERA_POSITION_BACK});
 if(result.resultCode!==0||!result.resultUri)throw new Error('已取消拍照，原草稿已保留');
 const file=await fileIo.open(result.resultUri,fileIo.OpenMode.READ_ONLY);
 const source=image.createImageSource(file.fd);
 try {
  const info=await source.getImageInfo();
  const scale=Math.min(1,960/Math.max(info.size.width,info.size.height));
  const pixels=await source.createPixelMap({desiredSize:{width:Math.max(1,Math.round(info.size.width*scale)),height:Math.max(1,Math.round(info.size.height*scale))}});
  const packer=image.createImagePacker();
  try {const data=await packer.packToData(pixels,{format:'image/jpeg',quality:82});return 'data:image/jpeg;base64,'+new util.Base64Helper().encodeToStringSync(new Uint8Array(data));}
  finally{await pixels.release();await packer.release();}
 }finally{await source.release();await fileIo.close(file);}
}
