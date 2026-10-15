// Append to figma-adaptive-kit.js with current ds ledger. One-time editable Figma migration.
const set=await figma.getNodeByIdAsync('1286:6160');
const source=await figma.getNodeByIdAsync('1286:2899');
const statusSource=source.findOne(n=>n.name==='status-row');
const statusTemplate=statusSource.clone();page.appendChild(statusTemplate);
const names=['Compose','RecognizeColor','CustomColor','PreserveColor','RecognizeLayout','Sketch','Review','Running','RoadmapComplete'];
const reuse={Compose:'1286:2899',Sketch:'1286:3151',Review:'1286:3334',Running:'1286:3451'};
const titles=['口述任务','识别颜色','自定义颜色','保留精确约束','识别布局','手绘与确认','核对累积输入','执行中','已完成'];
const masters={},hooks={},frames={};
const base='创建一份公司 Roadmap PPT，主色用红色。';
const layout='左侧是季度里程碑，右侧展示关键成果。';
function fixed(name,w,h){const n=box(name,w,h);n.layoutMode='NONE';return n;}
async function btn(label,ic,w=354){return inst('button','Glass','Default',{label,icon:ic,w});}
function smallText(p,s,x,y,w,style='Body',key='text/ink'){return place(txt(s,style,key,w),p,x,y);}
function card(name,w,h){const n=fixed(name,w,h);surface(n,'Glass','Default','surface/reading');return n;}
async function editor(state,index){
 const c=card('Adaptive / sole composer',354,154);
 smallText(c,index<4?base: index===7?'补充到当前任务…':index===8?'继续输入…':base+'\n'+layout,14,12,326,'Body',index>6?'text/muted':'text/ink');
 if(index>0&&index<7){const chip=await inst('inline-color','Glass',index===1?'Default':'Edited');place(chip,c,12,100);hooks[state].color=chip.id;}
 const s=await btn('发送','Send',88);s.name='Composer / send';s.resize(88,48);place(s,c,254,94);hooks[state].send=s.id;
 for(const i of s.findAllWithCriteria({types:['INSTANCE']}))i.visible=true;
 return c;
}
for(const [idx,state]of names.entries()){
 const c=reuse[state]?await figma.getNodeByIdAsync(reuse[state]):track(figma.createComponent());
 const bg=source.fills;for(const n of [...c.children])n.remove();if(!c.parent||c.parent!==set)set.appendChild(c);
 c.name=`State=${state}, Input=Minimized`;c.resize(390,844);c.layoutMode='NONE';c.fills=bg;c.cornerRadius=32;c.clipsContent=true;mode(c,'Glass','WorkBuddy');masters[state]=c.id;hooks[state]={};mutated.push(c.id);
 const glow=track(figma.createEllipse());glow.resize(390,430);glow.fills=[paint('theme/accent',.08)];glow.effects=[{type:'LAYER_BLUR',visible:true,radius:80}];place(glow,c,-110,380);
 const top=fixed('01 · 当前对象与任务状态',390,148);place(top,c,0,0);
 const status=statusTemplate.clone();place(status,top,18,16);
 smallText(top,'公司 Roadmap PPT',18,76,290,'Title');
 const stat=await inst('agent-task-status','Glass',idx===7?'Running':idx===8?'Complete':'Draft');place(stat,top,18,109);
 const tasks=await inst('icon-button','Glass','Default',{icon:'List'});place(tasks,top,324,80);hooks[state].tasks=tasks.id;
 const mid=fixed('02 · 上下文自适应输入',390,560);place(mid,c,0,148);
 const tools=fixed('Adaptive / contextual tools',354,378);place(tools,mid,18,0);tools.clipsContent=true;
 if(idx===0){
  smallText(tools,'当前任务',0,8,322,'Caption','text/muted');
  const a=card('Task / presentation creation',354,104);smallText(a,'演示文稿创作',16,16,322,'Title');smallText(a,'公司 Roadmap PPT',16,58,322);place(a,tools,0,40);
  const at=await btn('季度规划.docx','FileText');place(at,tools,0,160);
 }
 if(idx>=1&&idx<=3){const col=await inst('color-refinement','Glass',idx===1?'Default':idx===2?'Picker':'Edited');place(col,tools,0,8);hooks[state].palette=col.id;}
 if(idx===4||idx===5){const sk=await inst('layout-intent','Glass',idx===4?'Detected':'Review');place(sk,tools,0,8);hooks[state].layout=sk.id;}
 if(idx===6){
  const a=card('Task / accumulated review',354,304);place(a,tools,0,8);
  smallText(a,'核对任务',16,16,322,'Title');smallText(a,'创建公司 Roadmap PPT',16,56,322);
  const ch=await inst('inline-color','Glass','Edited');place(ch,a,16,94);
  smallText(a,'左：季度里程碑\n右：关键成果',16,148,322);
  smallText(a,'布局草图 · 已确认\n季度规划.docx · 1 个附件',16,218,322,'Label','text/muted');
  const back=await btn('返回修改','ChevronLeft',116);place(back,tools,0,324);hooks[state].back=back.id;
  const submit=await btn('提交任务','Check',226);place(submit,tools,128,324);hooks[state].submit=submit.id;
 }
 if(idx===7){const a=card('Agent / current step',354,208);place(a,tools,0,8);smallText(a,'正在生成演示文稿',16,16,322,'Title');smallText(a,'✓ 已整理季度里程碑\n✓ 已应用主色 #C92A2A\n正在编排左右布局…',16,68,322);const stop=await btn('停止任务','Square',168);place(stop,tools,0,236);hooks[state].stop=stop.id;const materials=await btn('待处理 · 1','Paperclip',174);place(materials,tools,180,236);hooks[state].materials=materials.id;}
 if(idx===8){const a=card('Agent / result',354,220);place(a,tools,0,8);smallText(a,'公司 Roadmap.pptx',16,16,322,'Title');smallText(a,'6 页 · 已应用主色与左右布局',16,60,322);const open=await btn('查看成果','Presentation',322);place(open,a,16,108);hooks[state].open=open.id;smallText(a,'成果已在大屏打开',16,178,322,'Caption','text/muted');}
 const ed=await editor(state,idx);place(ed,mid,18,394);hooks[state].editor=ed.id;
 if(idx===5){ed.resize(354,64);ed.children.filter(n=>n.type==='TEXT').forEach(n=>{n.characters='左侧里程碑，右侧关键成果';n.fontSize=12;n.resize(220,28);});const chip=ed.findOne(n=>n.name==='inline-color');if(chip)chip.visible=false;const send=figma.getNodeById(hooks[state].send);send.x=254;send.y=8;ed.y=484;}
 const dock=await inst('input-dock','Glass','Minimized');dock.name='03 · 固定输入 / Minimized';place(dock,c,0,708);hooks[state].dock=dock.id;
 if(idx<5){const voice=dock.findOne(n=>n.type==='INSTANCE'&&n.name==='voice');if(voice){const vv=await figma.getNodeByIdAsync(F.voice.variants['Glass/Pressed']);voice.swapComponent(vv);voice.resize(240,56);const lp=Object.keys(voice.componentProperties).find(k=>k.startsWith('Label#'));if(lp)voice.setProperties({[lp]:'松开结束'});}}
 const voice=dock.findOne(n=>n.type==='INSTANCE'&&n.name==='voice');if(voice)hooks[state].voice=voice.id;
}
statusTemplate.remove();
// Wire intentional steps. Speech and semantic recognition are externally annotated simulations.
for(const state of names){await react(figma.getNodeById(hooks[state].tasks),'1286:3619');await react(figma.getNodeById(hooks[state].send),masters.Review);}
await react(figma.getNodeById(hooks.Compose.voice),masters.RecognizeColor);
for(const state of ['RecognizeColor','CustomColor','PreserveColor']){
 const pal=figma.getNodeById(hooks[state].palette);
 const target=state==='RecognizeColor'?masters.CustomColor:state==='CustomColor'?masters.PreserveColor:masters.CustomColor;
 const b=pal.findOne(n=>n.name==='Color / confirm')||pal.findAll(n=>n.type==='INSTANCE'&&n.name==='button').pop();await react(b||pal,target);
 await react(figma.getNodeById(hooks[state].color),masters.CustomColor);
}
await react(figma.getNodeById(hooks.PreserveColor.voice),masters.RecognizeLayout);
await react(figma.getNodeById(hooks.RecognizeLayout.layout),masters.Sketch);
await react(figma.getNodeById(hooks.Review.back),masters.Sketch);
await react(figma.getNodeById(hooks.Review.submit),masters.Running);
await react(figma.getNodeById(hooks.Running.stop),'1286:4777');
await react(figma.getNodeById(hooks.Running.materials),'1286:3775');
await figma.getNodeById(masters.Running).setReactionsAsync([{trigger:{type:'AFTER_TIMEOUT',timeout:2.5},actions:[{type:'NODE',destinationId:masters.RoadmapComplete,navigation:'CHANGE_TO',transition:{type:'DISSOLVE',easing:{type:'EASE_OUT'},duration:.2}}]}]);
await react(figma.getNodeById(hooks.RoadmapComplete.open),'1286:4035');
// Publish only nine primary frames; keep meaningful existing branches in a second row group.
const demo=await figma.getNodeByIdAsync('0:1');await figma.setCurrentPageAsync(demo);
const target=await figma.getNodeByIdAsync('109:5262');
const visibleOld={Compose:'5:8435',Sketch:'15:5743',Review:'1286:6473',Running:'5:8573'};
const branches=['1286:6723','1286:6864','5:8710','5:8847','1286:7213','5:8976'];
for(const n of [...target.children])if(n.type==='TEXT')n.remove();
target.name='03 · WorkBuddy / 意图输入与任务闭环';target.resizeWithoutConstraints(2380,3180);
smallText(target,'WorkBuddy · 从一句要求，到精确约束',48,40,2250,'Section');
smallText(target,'颜色与布局累积到同一任务；框内发送进入核对，提交任务才开始执行。',48,88,2250,'Body','text/muted');
for(const [idx,state]of names.entries()){
 const f=visibleOld[state]?await figma.getNodeByIdAsync(visibleOld[state]):track(figma.createFrame());target.appendChild(f);for(const ch of [...f.children])ch.remove();
 f.layoutMode='NONE';f.resize(390,844);f.fills=[];f.clipsContent=false;f.name=`workbuddy-${String(idx+1).padStart(2,'0')}-${state.toLowerCase()}`;
 place(track(figma.getNodeById(masters[state]).createInstance()),f,0,0);f.x=48+(idx%5)*456;f.y=180+Math.floor(idx/5)*960;frames[state]=f.id;
 smallText(target,`${String(idx+1).padStart(2,'0')} · ${titles[idx]}`,f.x,f.y-32,390,'Label');
}
for(const [i,id]of branches.entries()){const n=await figma.getNodeByIdAsync(id);n.x=48+(i%5)*456;n.y=2140+Math.floor(i/5)*960;}
// Keep six established branches, fitting their own compact strip rather than duplicating main sequence.
for(const [i,id]of branches.entries()){const n=await figma.getNodeByIdAsync(id);n.x=48+i*390;n.y=2150;n.resize(390,844);}
smallText(target,'任务切换 / 补材料 / 审批 / 指向修改 / 键盘 / 修改预览',48,2080,2280,'Title');
smallText(target,'原型模拟：语音、意图识别和任务执行均为演示。稳定识别后更新中部工具；拖动或绘制期间延后。用户选色优先，录音结束不提交。\n反例：不要红色 → 排除红色；指标飘红 → 不打开选色；左右为难 → 不打开画板。旧目标识别结果不得应用到新任务。',48,3040,2280,'Caption','text/muted');
await figma.setCurrentPageAsync(page);
set.children.forEach((n,i)=>{n.x=32+(i%8)*422;n.y=48+Math.floor(i/8)*884;});set.resize(3420,Math.ceil(set.children.length/8)*884+80);
return {createdNodeIds:created,mutatedNodeIds:mutated,masters,hooks,frames,section:target.id};
