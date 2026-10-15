export interface PolishAction {id:string;label:string;instruction:string;}
export interface PolishTarget {app:string;id:string;kind:string;}
const actions:PolishAction[]=[
 {id:'concise',label:'精简表达',instruction:'精简冗余和重复，保持原有语气与全部关键要求。'},
 {id:'polite',label:'更礼貌',instruction:'使表达礼貌、自然，保留原有立场，不新增承诺或客套事实。'},
 {id:'formal',label:'规范表述',instruction:'改为清楚、规范的书面表述，保持原意。'},
 {id:'chat-natural',label:'自然回复',instruction:'将聊天草稿改得口语、自然，像本人直接回复；不要替用户编造答复。'},
 {id:'chat-short',label:'简短回复',instruction:'将聊天草稿缩短为简洁回复，保留时间、事项、立场和明确要求。'},
 {id:'task-clear',label:'说清需求',instruction:'把发给 AI 助手的任务指令说清楚，区分目标、已有条件和约束。不执行任务、不提供答案、不补充用户未给出的条件或成果类型。'},
 {id:'task-points',label:'整理要点',instruction:'将任务指令整理为清晰的要点，保留要求、限制、否定和相互关系。不执行任务、不新增需求。'},
 {id:'task-short',label:'精简指令',instruction:'压缩发给 AI 助手的指令，去掉口头重复，完整保留目标和约束；不得执行该指令。'},
 {id:'mail-professional',label:'商务表达',instruction:'将邮件草稿改为自然、专业的商务表达；不新增主题、称呼、签名、承诺或交易条件。'},
 {id:'mail-request',label:'说清诉求',instruction:'整理邮件中的诉求和已给出的下一步，使收件人容易理解；缺失的时间、责任人和要求不得补造。'},
 {id:'title-clear',label:'标题清晰',instruction:'将现有标题写得清晰、准确，只输出一个标题，保留原主题，不增加未经提供的结论。'},
 {id:'title-short',label:'精简标题',instruction:'缩短现有标题，只输出一个简洁标题，保持原主题和必要信息。'},
 {id:'points',label:'提炼要点',instruction:'把已有内容整理为简洁要点，完整保留关键事实和限制，不增加新内容。'},
 {id:'speech-natural',label:'口语讲述',instruction:'将已有演讲备注改成自然的现场讲述口吻，保持论点和事实，不新编案例或开场。'},
 {id:'speech-short',label:'压缩讲稿',instruction:'压缩现有讲稿的重复和赘述，保留核心内容、数字和过渡逻辑。'},
 {id:'note-clear',label:'理顺笔记',instruction:'整理笔记中的语序和层次，保留已记录的信息；不要将想法改成已确认事实。'},
 {id:'comment-natural',label:'自然评论',instruction:'使视频评论或弹幕更自然，保留本人感受，不编造未提到的视频内容。'},
 {id:'comment-short',label:'简短弹幕',instruction:'压缩为易读的短弹幕，保留原有评价和立场，不增加新感受。'},
 {id:'label-clear',label:'清晰命名',instruction:'整理现有名称，准确保留名称中的对象和含义，只输出一个名称。'},
 {id:'fix',label:'修正语病',instruction:'只修正明确的错别字、语病和无意义重复。无法确定的识别词保留，不猜测姓名、术语或事实。'},
];
function pick(ids:string[]):PolishAction[]{return ids.map(id=>actions.find(a=>a.id===id)!);}
export function polishActionsForTarget(t:PolishTarget|null):PolishAction[]{
 if(!t||t.kind!=='text')return [];
 if(t.app==='wechat')return pick(['chat-natural','polite','chat-short']);
 if(t.app==='bilibili')return pick(['comment-natural','comment-short','polite']);
 if(t.app==='workbuddy'&&!t.id.startsWith('wb:doc:'))return pick(['task-clear','task-points','task-short']);
 if(t.app==='doubao')return pick(['task-clear','task-points','task-short']);
 if(t.app==='paint')return pick(t.id.endsWith(':name')?['label-clear','concise','fix']:['formal','concise','fix']);
 if(t.app==='slides'||t.app==='workbuddy'&&t.id.includes(':slide/')){
  if(/(?:[:/])notes$/.test(t.id))return pick(['speech-natural','points','speech-short']);
  if(/(?:[:/])title$/.test(t.id))return pick(['title-clear','title-short','fix']);
  return pick(['points','concise','formal']);
 }
 if(t.app==='mail')return pick(t.id.includes('subject')?['title-clear','title-short','polite']:['mail-professional','mail-request','concise']);
 if(t.app==='notes')return pick(['note-clear','points','concise']);
 return pick(['formal','concise','fix']);
}
export function polishInstruction(id:string):string{
 const legacy=id==='简洁'?'concise':id==='礼貌'?'polite':id==='正式'?'formal':id;
 return actions.find(a=>a.id===legacy)?.instruction||'';
}
