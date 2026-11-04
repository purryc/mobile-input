import {timingSafeEqual} from 'node:crypto';
export function matchesCredential(value,expected,pattern){return typeof value==='string'&&pattern.test(value)&&typeof expected==='string'&&Buffer.byteLength(value)===Buffer.byteLength(expected)&&timingSafeEqual(Buffer.from(value),Buffer.from(expected));}
export const actions = new Set(['app-switch','activate','replace-text','insert-text','shortcut','pointer','release','file-begin','file-chunk','file-finish','workbuddy-submit','workbuddy-attach','workbuddy-task','agent-task','agent-attach','agent-attach-status','agent-submit','agent-stop','agent-action','agent-selection','agent-review']);
export function validateCommand(m, session) {
 if (!m || m.kind!=='command' || typeof m.id!=='string' || !/^[\w-]{1,80}$/.test(m.id)) return '无效命令';
 if(!Number.isSafeInteger(m.seq)||m.seq<1)return '无效序号';
 if(m.session!==session) return '连接已变化，请重新连接';
 if(!actions.has(m.op)) return '此操作未接入';
 if(m.op==='activate') return ['codex','wps','workbuddy'].includes(m.app) ? '' : '此应用尚未接入';
 if(m.op==='app-switch') return ['next','cancel'].includes(m.action) ? '' : '未登记的切换操作';
 if(m.op==='release') return '';
 if(typeof m.window!=='string'||!m.window||typeof m.target!=='string'||!m.target) return '请选择 Mac 上的目标';
 if(['workbuddy-task','agent-task'].includes(m.op)&&(typeof m.task!=='string'||!(/^(new|[a-fA-F0-9-]{36})$/.test(m.task))))return '无效任务';
 if(['workbuddy-submit','workbuddy-attach','agent-submit','agent-attach'].includes(m.op)&&(!Array.isArray(m.files)||m.files.length>10||m.files.some(id=>typeof id!=='string'||!/^[a-f0-9-]{36}$/.test(id))||typeof m.base!=='string'||m.base.length>60000))return '无效任务输入';
 if((['agent-action','agent-selection','agent-review'].includes(m.op)||m.actionId!==undefined)&&(typeof m.actionId!=='string'||!/^[-a-fA-F0-9]{36}$/.test(m.actionId)))return '无效界面操作';
 if(m.op==='agent-review'&&(typeof m.reviewId!=='string'||!/^[-a-fA-F0-9]{36}$/.test(m.reviewId)))return '无效修改建议';
 if(m.op==='agent-attach-status'&&(typeof m.uploadId!=='string'||!/^[-a-fA-F0-9]{36}$/.test(m.uploadId)))return '无效上传回执';
 if(['replace-text','insert-text'].includes(m.op) && (typeof m.text!=='string'||m.text.length>60000)) return '无效文本';
 if(m.op==='replace-text'&&typeof m.base!=='string')return '缺少内容基线';
 if(m.op==='replace-text'&&m.selection!==undefined&&(!Array.isArray(m.selection)||m.selection.length!==2||m.selection.some(v=>!Number.isSafeInteger(v)||v<0)||m.selection[0]+m.selection[1]>m.text.length))return '无效光标范围';
 if(m.op==='pointer'&&(!['move','down','up','left','right','double','scroll','cancel'].includes(m.action)||![m.x,m.y].every(v=>Number.isFinite(v)&&v>=0&&v<=1)||m.dy!==undefined&&!Number.isFinite(m.dy)))return '无效指针';
 if(m.op==='shortcut'&&!['escape','select-all','copy','cut','paste','delete','undo','redo','save','bold','italic','underline','align-left','align-center','align-right','submit'].includes(m.action))return '未登记的快捷操作';
 return '';
}
// Reserve before asynchronous execution so simultaneous duplicates cannot execute twice.
export class Receipts {
 cache=new Map(); high=0;
 run(id,seq,execute){if(this.cache.has(id))return this.cache.get(id);if(seq<=this.high)return Promise.resolve({ok:false,outcome:'rejected',error:'过期命令，不会重放'});this.high=seq;const p=Promise.resolve().then(execute).catch(()=>({ok:false,outcome:'unknown',error:'执行结果未知，请查看 Mac'}));this.cache.set(id,p);if(this.cache.size>512)this.cache.delete(this.cache.keys().next().value);return p;}
}
