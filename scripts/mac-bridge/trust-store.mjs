import {mkdirSync,readFileSync,writeFileSync,renameSync,chmodSync} from 'node:fs';
import {dirname} from 'node:path';
import {randomUUID} from 'node:crypto';
/** Private per-user trust, never command state or application content. */
export function trustStore(path){
 let value;try{value=JSON.parse(readFileSync(path,'utf8'));}catch{}
 if(!value||typeof value.bridgeId!=='string'||!/^[-\w]{1,80}$/.test(value.bridgeId)||!/^([a-f0-9]{64})?$/.test(value.token||''))value={bridgeId:randomUUID(),token:''};
 function save(){mkdirSync(dirname(path),{recursive:true,mode:0o700});chmodSync(dirname(path),0o700);const temporary=path+'.tmp';writeFileSync(temporary,JSON.stringify(value),{mode:0o600});chmodSync(temporary,0o600);renameSync(temporary,path);}
 save();return {get bridgeId(){return value.bridgeId;},get token(){return value.token;},setToken(token){if(!/^[a-f0-9]{64}$/.test(token))throw Error('Invalid trust credential');value={...value,token};save();}};
}
