import { picker, fileIo } from '@kit.CoreFileKit';
import { common } from '@kit.AbilityKit';
import { camera, cameraPicker } from '@kit.CameraKit';
import { util } from '@kit.ArkTS';
class PickResult {id:string='';ok:boolean=false;name:string='';size:number=0;handle:string='';error:string='';}
/** Only user-selected URIs are readable, using opaque handles and bounded chunks. */
export class MacFiles {
 private files:Map<string,fileIo.File>=new Map();
 private positions:Map<string,number>=new Map();
 private busy:boolean=false;
 private context:common.UIAbilityContext;
 private emit:(name:string,data:string)=>void;
 constructor(context:common.UIAbilityContext,emit:(name:string,data:string)=>void){this.context=context;this.emit=emit;}
 isPicking():boolean{return this.busy;}
 pick(id:string,kind:string):string {
  if(this.busy||this.files.size>=12||!['document','photo','gallery'].includes(kind))return 'unavailable';
  this.busy=true;this.choose(id,kind);return 'pending';
 }
 private async choose(id:string,kind:string):Promise<void>{
  const result:PickResult={id,ok:false,name:'',size:0,handle:'',error:''};let opened:fileIo.File|null=null;
  try{
   let uri:string='';
   if(kind==='gallery'){const view=new picker.PhotoViewPicker();const selected=await view.select({MIMEType:picker.PhotoViewMIMETypes.IMAGE_TYPE,maxSelectNumber:1});uri=selected.photoUris[0]||'';}
   else if(kind==='photo') {const selected=await cameraPicker.pick(this.context,[cameraPicker.PickerMediaType.PHOTO],{cameraPosition:camera.CameraPosition.CAMERA_POSITION_BACK});if(selected.resultCode===0)uri=selected.resultUri;}
   else {const view=new picker.DocumentViewPicker(this.context);const options=new picker.DocumentSelectOptions();options.maxSelectNumber=1;const uris=await view.select(options);uri=uris[0]||'';}
   if(!uri)throw new Error('已取消选择');
   opened=await fileIo.open(uri,fileIo.OpenMode.READ_ONLY);const stat=await fileIo.stat(opened.fd);
   if(stat.size<1||stat.size>20*1024*1024)throw new Error('请选择 20 MB 以内的文件');
   const handle=util.generateRandomUUID();let name=decodeURIComponent(uri.split('/').pop()||'参考资料').split('?')[0];
   if(kind!=='document'&&!/\.(png|jpe?g|webp)$/i.test(name))name='实拍照片-'+Date.now()+'.jpg';
   this.files.set(handle,opened);this.positions.set(handle,0);opened=null;result.ok=true;result.handle=handle;result.name=name;result.size=stat.size;
  }catch(error){result.error=(error as Error).message||'文件读取失败，原输入已保留';}
  finally{if(opened)await fileIo.close(opened);this.busy=false;this.emit('native-mac-file',JSON.stringify(result));}
 }
 read(handle:string,offset:number):string {const file=this.files.get(handle);if(!file||!Number.isInteger(offset)||offset<0||offset>20*1024*1024||this.positions.get(handle)!==offset)return '';const buffer=new ArrayBuffer(48*1024);try{const count=fileIo.readSync(file.fd,buffer,{length:buffer.byteLength});this.positions.set(handle,offset+count);return new util.Base64Helper().encodeToStringSync(new Uint8Array(buffer,0,count));}catch{return '';}}
 release(handle:string):string{const file=this.files.get(handle);if(file){fileIo.closeSync(file);this.files.delete(handle);this.positions.delete(handle);}return 'closed';}
 close():void{this.files.forEach((file:fileIo.File)=>fileIo.closeSync(file));this.files.clear();this.positions.clear();}
}
