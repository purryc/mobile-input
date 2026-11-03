/** Recovery is a bounded exception journal, never an independent active draft. */
export function preserveMacText(target:string,phone:string,remote:string){
 if(!phone||phone===remote)return;
 try{const key='input-agent-mac-text-recovery';const entries=JSON.parse(localStorage.getItem(key)||'[]') as {target:string;phone:string;remote:string;at:number}[];
 if(entries.at(-1)?.target===target&&entries.at(-1)?.phone===phone&&entries.at(-1)?.remote===remote)return;
 entries.push({target,phone,remote,at:Date.now()});localStorage.setItem(key,JSON.stringify(entries.slice(-30)));}catch{}
}
