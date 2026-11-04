import {macCommand,macSnapshot,type MacState,type Receipt} from './mac-link';

/** Upload acceptance and task submission are separate. This function never sends a prompt. */
export async function adoptAgentMaterials(files:string[],base:string,target:MacState,
  command:typeof macCommand=macCommand, snapshot=macSnapshot,
  pause=(ms:number)=>new Promise<void>(resolve=>setTimeout(resolve,ms)),now=Date.now):Promise<Receipt>{
 const session=snapshot().session;
 const valid=()=>{const s=snapshot();return s.connected&&s.synced&&s.session===session&&s.state?.app===target.app&&s.state?.window===target.window&&s.state?.target===target.target;};
 const changed=():Receipt=>({ok:false,outcome:'rejected',error:'附件目标已变化，材料保留在手机；不会提交'});
 if(!valid())return changed();
 let result=await command('agent-attach',{files,base},target);
 const deadline=now()+90000;
 while(result.ok&&result.uploadStatus==='pending'&&result.uploadId){
  if(!valid())return changed();
  if(now()>=deadline)return {ok:false,outcome:'unknown',error:'附件上传尚未确认，请在电脑核对；材料已保留，未提交'};
  await pause(350);
  if(!valid())return changed();
  if(now()>=deadline)return {ok:false,outcome:'unknown',error:'附件上传尚未确认，请在电脑核对；材料已保留，未提交'};
  result=await command('agent-attach-status',{uploadId:result.uploadId},target);
 }
 if(!valid())return changed();
 if(result.ok&&result.outcome!=='verified')return {ok:false,outcome:'unknown',error:'附件尚未核对完成，材料已保留，未提交'};
 return result;
}
