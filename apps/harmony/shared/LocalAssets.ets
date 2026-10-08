import { common } from '@kit.AbilityKit';
export const LOCAL_ORIGIN:string='https://mobile-input.invalid/';
// Serve packaged resources under one local origin so modules, fonts and fetch work.
// No request handled here is forwarded to the network.
export function localResponse(url:string,context:common.UIAbilityContext):WebResourceResponse {
 const response=new WebResourceResponse();
 response.setResponseEncoding('utf-8');
 try {
  if(!url.startsWith(LOCAL_ORIGIN))throw new Error('External origin');
  const path=decodeURIComponent(url.substring(LOCAL_ORIGIN.length).split('?')[0].split('#')[0])||'index.html';
  if(path.split('/').some((part:string)=>part==='..')||path.includes('\\'))throw new Error('Invalid path');
  const types=new Map<string,string>([['html','text/html'],['js','text/javascript'],['css','text/css'],['json','application/json'],['png','image/png'],['jpg','image/jpeg'],['jpeg','image/jpeg'],['gif','image/gif'],['svg','image/svg+xml'],['mp4','video/mp4'],['mp3','audio/mpeg'],['wav','audio/wav'],['otf','font/otf'],['ttf','font/ttf'],['woff','font/woff'],['woff2','font/woff2'],['txt','text/plain']]);
  const ext=path.substring(path.lastIndexOf('.')+1).toLowerCase();
  const bytes=context.resourceManager.getRawFileContentSync('web/'+path);
  response.setResponseData(bytes.buffer);
  response.setResponseMimeType(types.get(ext)||'application/octet-stream');
  response.setResponseCode(200);response.setReasonMessage('OK');
 }catch{
  response.setResponseData('Not found');response.setResponseMimeType('text/plain');
  response.setResponseCode(404);response.setReasonMessage('Not Found');
 }
 return response;
}
