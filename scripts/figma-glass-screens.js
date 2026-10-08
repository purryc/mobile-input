// Input: L = saved design-state.json, ONLY = optional array of state keys.
// Creates editable screens; use the returned IDs to wire prototype flows separately.
const page = await figma.getNodeByIdAsync(L.pages.screens);
await figma.setCurrentPageAsync(page);
for (const style of ['Regular','Medium','Bold']) await figma.loadFontAsync({family:L.font,style});
const refs={}; for(const [key,id] of Object.entries({...L.components,...L.icons,...L.brands})) refs[key]=await figma.getNodeByIdAsync(id);
const vars={};for(const [key,id] of Object.entries(L.variables))vars[key]=await figma.variables.getVariableByIdAsync(id);
const palette={ink:'#122D39',muted:'#536C7B',subtle:'#8297A2',white:'#FFFFFF',surface:'#EAF2F7',wechat:'#07895A',email:'#2767C7',workbuddy:'#146C64',word:'#356FE4',sheet:'#238359',presentation:'#C45337',game:'#AD383B',error:'#B33A42',line:'#D6E3E9'};
const rgb=h=>({r:parseInt(h.slice(1,3),16)/255,g:parseInt(h.slice(3,5),16)/255,b:parseInt(h.slice(5,7),16)/255});
const solid=(h,o=1)=>({type:'SOLID',color:rgb(h),opacity:o});
const paint=(k,o=1)=>o<1?solid(palette[k],o):figma.variables.setBoundVariableForPaint(solid(palette[k]),'color',vars['color/'+k]);
const created=[],screens={},hotspots={};
const tr=n=>(created.push(n.id),n);
function frame(name,w,h,dir){const n=tr(figma.createFrame());n.name=name;n.resize(w,h);n.fills=[];n.clipsContent=false;if(dir){n.layoutMode=dir;n.primaryAxisSizingMode='FIXED';n.counterAxisSizingMode='FIXED';n.counterAxisAlignItems='CENTER';}return n;}
function pos(parent,n,x,y){parent.appendChild(n);n.x=x;n.y=y;return n;}
function txt(str,style='body',color='ink',w){const n=tr(figma.createText());n.fontName={family:L.font,style:'Regular'};n.textStyleId=L.styles[style];n.characters=str;n.fills=[paint(color)];n.textAutoResize=w?'HEIGHT':'WIDTH_AND_HEIGHT';if(w)n.resize(w,n.height);return n;}
function inst(k,props={},w,h){const n=tr(refs[k].createInstance());const p={};for(const [key,v]of Object.entries(props)){const full=Object.keys(n.componentProperties).find(x=>x===key||x.startsWith(key+'#'));if(full)p[full]=v;}n.setProperties(p);if(w)n.resize(w,h||n.height);return n;}
function ico(k,size=22){return inst(k,{},size,size);}
function glass(n,o=.5,r=24){n.fills=[paint('white',o)];n.strokes=[paint('white',.9)];n.cornerRadius=r;n.effectStyleId=L.effects.glass;}
function hot(s,key,n){hotspots[s]??={};hotspots[s][key]=n.id;return n;}
function row(parent,name,items,x,y,w=346,h=54,gap=12){const r=frame(name,w,h,'HORIZONTAL');r.itemSpacing=gap;pos(parent,r,x,y);for(const n of items)r.appendChild(n);return r;}
function button(s,parent,key,label,icon,x,y,w=346,theme='wechat'){const n=inst('button',{Label:label,Icon:L.icons[icon]},w,54);n.name=key;pos(parent,n,x,y);hot(s,key,n);return n;}
function tag(parent,label,x,y,theme='muted'){pos(parent,txt(label,'label',theme),x,y);}
function card(parent,label,value,x,y,w=346,h=90){const c=frame(label,w,h,'VERTICAL');glass(c,.52);c.paddingLeft=18;c.paddingRight=18;c.paddingTop=13;c.paddingBottom=13;c.itemSpacing=5;c.counterAxisAlignItems='MIN';c.appendChild(txt(label,'caption','muted'));c.appendChild(txt(value,'body','ink',w-36));pos(parent,c,x,y);return c;}
const modes={wechat:{name:'微信',title:'陈思 · 项目讨论',icon:'wechat'},email:{name:'Email',title:'方案确认',icon:'mail'},workbuddy:{name:'WorkBuddy',title:'一起推进下一步',icon:'workbuddy'},word:{name:'WPS 文字',title:'季度方案',icon:'FileText'},sheet:{name:'WPS 表格',title:'销售汇总',icon:'Table2'},presentation:{name:'WPS 演示',title:'季度业务回顾',icon:'Presentation'},game:{name:'FC · 超级玛丽',title:'WORLD 1—1',icon:'Gamepad2'}};
const defs=[
 ['wechat','wechat','selected'],['wechat-draft','wechat','draft'],['wechat-record','wechat','record'],['wechat-edit','wechat','edit'],['wechat-preview','wechat','preview'],['wechat-sent','wechat','sent'],
 ['wechat-task','wechat','task'],['wechat-missing','wechat','missing'],['feishu-task','wechat','handoff'],['wechat-return','wechat','return'],['wechat-quiet','wechat','quiet'],['wechat-target','wechat','target'],['wechat-disconnect','wechat','disconnect'],['wechat-failed','wechat','failed'],['wechat-locked','wechat','locked'],['wechat-clipboard','wechat','clipboard'],['wechat-keyboard','wechat','keyboard'],['wechat-trackpad','wechat','trackpad'],
 ['email','email','selected'],['email-edit','email','edit'],['email-preview','email','preview'],['email-sent','email','sent'],
 ['workbuddy','workbuddy','selected'],['workbuddy-running','workbuddy','running'],['workbuddy-approval','workbuddy','approval'],['workbuddy-done','workbuddy','done'],['workbuddy-stop','workbuddy','stop'],
 ['word','word','selected'],['word-preview','word','preview'],['word-applied','word','applied'],
 ['sheet','sheet','selected'],['sheet-preview','sheet','preview'],['sheet-applied','sheet','applied'],
 ['presentation','presentation','laser'],['presentation-held','presentation','held'],['presentation-pen','presentation','pen'],['presentation-ink','presentation','ink'],['presentation-notes','presentation','notes'],['presentation-next','presentation','next'],['presentation-center','presentation','center'],
 ['game','game','play'],['game-held','game','held'],['game-paused','game','paused'],['game-disconnect','game','disconnect'],['chooser','wechat','chooser']
];
function background(f,mode){f.clipsContent=true;f.cornerRadius=36;f.fills=[{type:'GRADIENT_LINEAR',gradientTransform:[[.5,.85,-.08],[-.85,.5,.66]],gradientStops:[{position:0,color:{...rgb('#E7F0F7'),a:1}},{position:.53,color:{...rgb(mode==='game'?'#ECE9DF':'#F1F5F8'),a:1}},{position:1,color:{...rgb(mode==='presentation'?'#F4DCD5':mode==='email'||mode==='word'?'#D9E8F8':mode==='game'?'#DED9CE':'#DCEEE8'),a:1}}]}];const orb=tr(figma.createEllipse());orb.resize(480,440);orb.fills=[paint(mode,.10)];orb.effects=[{type:'LAYER_BLUR',radius:85,visible:true}];pos(f,orb,-160,440);orb.name='Ambient / theme light';}
function shell(s,mode,state,index){const landscape=mode==='game';const f=frame(s,landscape?844:390,landscape?390:844);page.appendChild(f);f.x=80+(index%7)*470;f.y=120+Math.floor(index/7)*980;if(landscape){f.x=80+((index-40)%2)*924;f.y=7100+Math.floor((index-40)/2)*520;}background(f,mode);screens[s]=f.id;const conn=inst('connection');pos(f,conn,24,18);if(state==='disconnect'){const t=conn.findOne(n=>n.type==='TEXT');t.characters='连接已断开';t.fills=[paint('error')];}
 const lock=inst('circle',{Icon:L.icons[state==='locked'?'LockKeyhole':'LockKeyholeOpen']});pos(f,lock,landscape?768:314,14);hot(s,'lock',lock);
 const app=frame('Context / active application',landscape?360:280,48,'HORIZONTAL');app.itemSpacing=9;app.appendChild(ico(modes[mode].icon,26));app.appendChild(txt(modes[mode].name,'label',mode));app.appendChild(ico('ChevronDown',16));pos(f,app,24,68);hot(s,'switch',app);
 if(!landscape)pos(f,txt(modes[mode].title,'title'),24,119);
 const home=tr(figma.createRectangle());home.resize(landscape?134:120,5);home.cornerRadius=3;home.fills=[paint('ink',.22)];pos(f,home,(f.width-home.width)/2,f.height-13);
 const label=txt(s+'  /  '+state,'label','muted');pos(page,label,f.x,f.y-32);return f;}
function input(s,f,mode,draft='',record=false){const stack=frame('Input / fixed zone',346,204,'VERTICAL');stack.counterAxisAlignItems='MIN';stack.itemSpacing=12;pos(f,stack,22,608);
 const toolbar=inst('toolbar');stack.appendChild(toolbar);hot(s,'toolbar',toolbar);for(const n of toolbar.children)if(n.name.startsWith('tool/'))hot(s,n.name,n);
 const d=inst('draft',{Text:draft||'输入'+(mode==='sheet'?'数字或公式…':mode==='word'?'修改要求…':'回复…')});stack.appendChild(d);hot(s,'draft',d);if(draft){for(const t of d.findAll(n=>n.type==='TEXT'))t.fills=[paint('ink')];}
 const r=frame('Input / voice and keyboard',346,58,'HORIZONTAL');r.itemSpacing=8;r.counterAxisAlignItems='CENTER';stack.appendChild(r);const kb=inst('circle',{Icon:L.icons[mode==='sheet'?'Hash':'Keyboard']});r.appendChild(kb);hot(s,'keyboard',kb);const voice=inst('voice',{Label:record?'结束录音':'按住说话'});voice.fills=[paint(mode,.09),paint('white',.4)];for(const t of voice.findAll(n=>n.type==='TEXT'))t.fills=[paint(mode)];r.appendChild(voice);hot(s,'voice',voice);const send=inst('circle',{Icon:L.icons[record?'Square':'ArrowUp']});send.fills=[paint(mode,.14),paint('white',.45)];r.appendChild(send);hot(s,'send',send);
 if(record){const m=voice.findOne(n=>n.type==='INSTANCE');if(m)m.swapComponent(refs.Square);}
}
function quote(f,value,label='已选消息'){const q=inst('quote',{Text:value});q.resize(346,96);const qf=q.findOne(n=>n.name==='Quote text');if(qf)qf.resize(295,72);const ts=q.findAll(n=>n.type==='TEXT');const a=ts.find(n=>n.characters==='已选消息');if(a)a.characters=label;pos(f,q,22,176);return q;}
function reply(s,f,key,value,y){const n=inst('reply',{Text:value});pos(f,n,22,y);hot(s,key,n);return n;}
function appaction(s,f,key,label,brand,x,y){const n=inst('app',{Label:label,Icon:L.brands[brand]});pos(f,n,x,y);hot(s,key,n);return n;}
function edits(s,f,y=336){tag(f,'AI 编辑',24,y);row(f,'Edit choices',[hot(s,'polish',inst('button',{Label:'更自然',Icon:L.icons.Sparkles})),hot(s,'shorten',inst('button',{Label:'更简短',Icon:L.icons.Type}))],22,y+32);button(s,f,'translate','翻译为英文','Languages',22,y+100);}
function normal(s,f,mode,state){const isDraft=['draft','edit','preview','return','failed','locked','target','disconnect'].includes(state);const draft=mode==='wechat'&&isDraft?'可以，周五两点见。':mode==='email'&&['edit','preview'].includes(state)?'方案已收到，周五前给您反馈。':mode==='word'&&state==='preview'?'强调交付价值，保持简洁。':mode==='sheet'&&state==='preview'?'=SUM(C2:C8)':'';
 input(s,f,mode,draft,state==='record');
 if(mode==='wechat'){
  if(['selected','locked','draft','return'].includes(state)){quote(f,'周五下午两点，在星海会议室讨论方案，方便吗？');if(state==='draft'){edits(s,f,314);}else{tag(f,'建议回复',24,294);reply(s,f,'reply1','可以，我会准时参加。',326);reply(s,f,'reply2','方便，期待当面聊聊。',394);tag(f,'相关动作',24,479);appaction(s,f,'task','飞书 · 约会议','feishu',22,509);appaction(s,f,'map','高德 · 看路线','gaode',200,509);}}
  if(state==='record'){tag(f,'正在听',24,192,'wechat');const wave=frame('Voice / waveform',316,64,'HORIZONTAL');wave.itemSpacing=5;wave.primaryAxisAlignItems='CENTER';wave.counterAxisAlignItems='CENTER';for(let i=0;i<35;i++){const b=tr(figma.createRectangle());b.resize(3,12+Math.abs(Math.sin(i*1.3))*45);b.cornerRadius=2;b.fills=[paint('wechat',.35+.5*Math.abs(Math.sin(i)))];wave.appendChild(b);}pos(f,wave,37,251);pos(f,txt('可以，周五两点见。\n我提前把资料发给你。','title','ink',326),24,355);}
  if(state==='edit'){quote(f,'周五下午两点，在星海会议室讨论方案，方便吗？');card(f,'你的草稿','可以，周五两点见。\n我提前把资料发给你。',22,294,346,104);edits(s,f,418);}
  if(state==='preview'){tag(f,'修改预览 · 更自然',24,184);card(f,'原文','可以，周五两点见。',22,222,346,82);card(f,'修改后','没问题，周五两点见！\n我会提前把资料发给你。',22,319,346,110);button(s,f,'apply','接受修改','Check',22,455);button(s,f,'cancel','保留原文','Undo2',22,521);}
  if(['task','missing','handoff'].includes(state)){tag(f,state==='handoff'?'飞书 · 新建会议':'会议预览',24,182);card(f,'时间 · 来自所选消息','周五 14:00',22,216,346,74);card(f,'地点 · 来自所选消息',state==='missing'?'待补充地点':'星海会议室',22,302,346,74);card(f,'参与人 · 来自当前聊天','陈思、我',22,388,346,74);button(s,f,state==='missing'?'fill':state==='handoff'?'return':'open',state==='missing'?'补充星海会议室':state==='handoff'?'返回微信':'在飞书中继续',state==='handoff'?'ChevronLeft':'CalendarDays',22,486);if(state==='task')button(s,f,'missing','修改地点','Pencil',22,548);}
  if(state==='quiet'){quote(f,'哈哈，收到啦。');pos(f,ico('MessageCircle',42),174,356);pos(f,txt('随时开始回复','heading','muted'),120,425);}
  if(state==='target'){quote(f,'我们改到下周再讨论。','陈思 · 新选消息');card(f,'原草稿仍在上一条消息下','可以，周五两点见。',22,304,346,100);button(s,f,'keep','回到原消息继续','ChevronLeft',22,434);button(s,f,'new','为新消息输入','Plus',22,500);}
  if(state==='sent'){pos(f,ico('CheckCheck',44),173,263);pos(f,txt('已发送','title','wechat'),151,332);card(f,'陈思 · 项目讨论','可以，周五两点见。',22,407);button(s,f,'return','继续回复','MessageCircle',22,524);}
  if(['disconnect','failed'].includes(state)){pos(f,ico(state==='disconnect'?'WifiOff':'CircleHelp',44),173,236);pos(f,txt(state==='disconnect'?'连接中断':'发送失败','title'),139,307);card(f,'草稿已保留','可以，周五两点见。',22,379);button(s,f,'retry',state==='disconnect'?'重新连接':'重试发送','RefreshCw',22,498);}
  if(state==='clipboard'){tag(f,'剪贴板',24,187);reply(s,f,'paste','周五下午两点见。',229);reply(s,f,'paste2','星海会议室',299);button(s,f,'return','返回草稿','ChevronLeft',22,496);}
  if(state==='trackpad'){tag(f,'触控板',24,184);const pad=frame('Trackpad / gesture surface',346,290);glass(pad,.25,30);pos(f,pad,22,224);pos(pad,ico('MousePointer2',26),153,126);button(s,f,'return','回到输入','Keyboard',22,532);}
  if(state==='keyboard'){tag(f,'陈思 · 项目讨论',24,185);card(f,'草稿','可以，周五两点见。',22,222,346,88);const keys=frame('Keyboard / QWERTY',346,192,'VERTICAL');keys.itemSpacing=8;keys.counterAxisAlignItems='CENTER';for(const letters of ['QWERTYUIOP','ASDFGHJKL','ZXCVBNM']){const r=frame('Key row',letters.length*34-4,44,'HORIZONTAL');r.itemSpacing=4;for(const letter of letters)r.appendChild(inst('key',{Label:letter}));keys.appendChild(r);}const space=inst('button',{Label:'空格',Icon:L.icons.Type},238,44);keys.appendChild(space);pos(f,keys,22,345);button(s,f,'return','收起键盘','ChevronDown',22,546);}
 }
 if(mode==='email'){
  quote(f,'请确认附件中的季度方案，并反馈预计交付日期。','Alex · alex@example.com');
  if(state==='selected'){tag(f,'建议回复',24,294);reply(s,f,'reply1','已收到，我会在周五前反馈。',326);reply(s,f,'reply2','收到，请补充交付范围。',394);row(f,'Mail actions',[hot(s,'attach',inst('button',{Label:'添加附件',Icon:L.icons.Paperclip})),hot(s,'tone',inst('button',{Label:'调整语气',Icon:L.icons.SlidersHorizontal}))],22,507);}
  if(state==='edit'){edits(s,f,306);button(s,f,'preview','预览邮件','Mail',22,518);}
  if(state==='preview'){card(f,'主题 · 方案确认','Re: 季度方案与交付计划',22,293,346,79);card(f,'正文','方案已收到，我将在周五前反馈预计交付日期。',22,386,346,106);button(s,f,'confirm','确认发送','Send',22,516);}
  if(state==='sent'){pos(f,ico('CheckCheck',44),173,333);pos(f,txt('邮件已发送','title','email'),122,405);button(s,f,'return','返回邮件','Mail',22,518);}
 }
 if(mode==='workbuddy'){
  quote(f,'季度方案.docx · 销售汇总.xlsx','已引用 · 2 个文件');
  if(state==='selected'){tag(f,'下一步可以做',24,296);reply(s,f,'start','整理为客户会议准备清单',328);reply(s,f,'start2','比较本季度的业务变化',398);button(s,f,'requirements','补充要求','Plus',22,511);}
  if(state==='running'){tag(f,'正在整理会议资料',24,306,'workbuddy');card(f,'已完成','读取文档 · 汇总关键指标',22,350);button(s,f,'approval','查看待确认请求','Check',22,460);button(s,f,'stop','停止任务','Square',22,524);}
  if(state==='approval'){card(f,'待确认 · 创建共享任务','将会议准备清单交给陈思审阅。',22,304,346,106);button(s,f,'confirm','确认创建','Check',22,440);button(s,f,'stop','暂不执行','X',22,510);}
  if(['done','stop'].includes(state)){card(f,state==='done'?'已完成':'任务已停止',state==='done'?'会议准备清单 · 6 项':'已保留完成的资料整理。',22,323,346,110);button(s,f,'return','回到输入','ChevronLeft',22,480);}
 }
 if(mode==='word'){
  quote(f,'我们将通过整合现有资源，进一步提升团队在客户交付方面的效率。','已选文本 · 第 2 段');
  if(state==='selected'){tag(f,'针对选区',24,296);reply(s,f,'rewrite','精简表达，突出交付价值',328);row(f,'Formatting',[hot(s,'format',inst('button',{Label:'加粗',Icon:L.icons.Bold})),hot(s,'format2',inst('button',{Label:'项目符号',Icon:L.icons.List}))],22,407);button(s,f,'rewrite2','改为客户汇报语气','SlidersHorizontal',22,492);}
  if(state==='preview'){card(f,'改写预览 · 仅替换选区','整合团队资源，加快客户交付。',22,306,346,124);button(s,f,'apply','应用到选区','Check',22,460);button(s,f,'cancel','保留原文','Undo2',22,526);}
  if(state==='applied'){card(f,'第 2 段 · 已更新','整合团队资源，加快客户交付。',22,324,346,112);button(s,f,'undo','撤销修改','Undo2',22,490);}
 }
 if(mode==='sheet'){
  quote(f,'C2:C8 · 本周销售额','当前范围 · 销售汇总');
  if(state==='selected'){tag(f,'公式候选',24,296);reply(s,f,'sum','=SUM(C2:C8)',329);reply(s,f,'average','=AVERAGE(C2:C8)',399);button(s,f,'fill','向下填充','ArrowDown',22,512);}
  if(state==='preview'){card(f,'公式','=SUM(C2:C8)',22,303,346,78);card(f,'写入单元格 · C9','¥ 128,600',22,395,346,90);button(s,f,'apply','确认范围并写入','Check',22,516);}
  if(state==='applied'){card(f,'C9 · 已写入','=SUM(C2:C8)\n¥ 128,600',22,313,346,118);button(s,f,'undo','撤销写入','Undo2',22,484);}
 }
}
function presentation(s,f,state){tag(f,state==='next'?'05 / 12':'04 / 12',24,176,'presentation');tag(f,'08:42',308,176);const notes=card(f,state==='notes'?'演讲备注 · 自动滚动':'演讲备注',state==='next'?'接下来，介绍下季度的三个重点。\n\n首先，将交付周期缩短到两周。':'这一页重点介绍本季度的增长。\n\n先讲客户留存，再讲新业务机会。\n\n最后，说明下一季度的行动。',22,213,346,state==='notes'?220:198);if(state==='notes'){button(s,f,'speed','滚动速度 · 1.0×','SlidersHorizontal',22,447);button(s,f,'manual','切回手动滚动','Pause',22,511);}else{button(s,f,'notes','自动滚动备注','Play',22,429);}
 row(f,'Pointer mode',[hot(s,'laser',inst('button',{Label:'激光笔',Icon:L.icons.Crosshair})),hot(s,'pen',inst('button',{Label:'画笔',Icon:L.icons.Pencil}))],22,579);
 const isPen=['pen','ink'].includes(state);if(isPen){const r=row(f,'Pen options',[hot(s,'color',inst('circle',{Icon:L.icons.Pencil})),hot(s,'width',inst('button',{Label:'3 px',Icon:L.icons.SlidersHorizontal},102,52)),hot(s,'undo',inst('circle',{Icon:L.icons.Undo2})),hot(s,'clear',inst('circle',{Icon:L.icons.Eraser}))],22,509,346,52,16);r.children[0].fills=[paint('presentation',.2),paint('white',.5)];}
 const hold=button(s,f,'hold',isPen?(state==='ink'?'正在绘制':'按住绘制'):(state==='held'?'激光笔开启':'按住指向'),isPen?'Pencil':'Crosshair',22,649,266,'presentation');hold.fills=[paint('presentation',state==='held'||state==='ink'?.22:.1),paint('white',.45)];const center=inst('circle',{Icon:L.icons.RotateCcw});pos(f,center,306,650);hot(s,'center',center);
 row(f,'Slides / fixed navigation',[hot(s,'previous',inst('button',{Label:'上一页',Icon:L.icons.ChevronLeft})),hot(s,'next',inst('button',{Label:'下一页',Icon:L.icons.ChevronRight}))],22,736);
 if(state==='center')tag(f,'指向已居中',153,708,'presentation');
}
function game(s,f,state){pos(f,txt('WORLD 1—1','heading','game'),327,90);tag(f,state==='paused'?'PAUSED':state==='disconnect'?'DISCONNECTED':'MARIO  ×  03',327,126,'muted');
 const d=frame('Game / D-pad',180,180);pos(f,d,62,150);const bg=tr(figma.createEllipse());bg.resize(180,180);bg.fills=[paint('white',.22)];bg.strokes=[paint('white',.7)];d.appendChild(bg);
 for(const [key,ic,x,y]of [['up','ArrowUp',60,0],['left','ArrowLeft',0,60],['right','ArrowRight',120,60],['down','ArrowDown',60,120]]){const n=inst('circle',{Icon:L.icons[ic]},60,60);n.cornerRadius=18;n.fills=[paint('ink',state==='held'&&key==='right'?.35:.13),paint('white',.4)];pos(d,n,x,y);hot(s,key,n);}const c=tr(figma.createRectangle());c.resize(60,60);c.cornerRadius=12;c.fills=[paint('ink',.13),paint('white',.4)];pos(d,c,60,60);
 const middle=frame('Game / select and start',230,54,'HORIZONTAL');middle.itemSpacing=14;pos(f,middle,302,281);for(const key of ['SELECT','START']){const n=inst('button',{Label:key,Icon:L.icons[key==='START'?'Play':'Minus']},108,54);middle.appendChild(n);hot(s,key,n);}
 for(const [key,x,y]of [['B',585,221],['A',690,176]]){const n=frame('Game / '+key,90,90,'HORIZONTAL');n.primaryAxisAlignItems='CENTER';glass(n,.5,99);n.fills=[paint('game',state==='held'&&key==='A'?.85:.68)];const label=txt(key,'title','white');n.appendChild(label);pos(f,n,x,y);hot(s,key,n);}
 if(state==='paused'){const p=frame('Game / paused suggestions',278,112,'VERTICAL');glass(p,.73);p.paddingTop=14;p.paddingLeft=16;p.counterAxisAlignItems='MIN';p.itemSpacing=12;p.appendChild(txt('试试长按 A 跳得更远','label'));const n=inst('button',{Label:'继续游戏',Icon:L.icons.Play},246,48);p.appendChild(n);hot(s,'resume',n);pos(f,p,283,150);}
 if(state==='disconnect'){const p=frame('Game / reconnect',278,112,'VERTICAL');glass(p,.83);p.paddingTop=14;p.paddingLeft=16;p.counterAxisAlignItems='MIN';p.itemSpacing=12;p.appendChild(txt('连接中断 · 按键已释放','label','error'));const n=inst('button',{Label:'重新连接',Icon:L.icons.RefreshCw},246,48);p.appendChild(n);hot(s,'reconnect',n);pos(f,p,283,150);}
}
for(let index=0;index<defs.length;index++){const [s,mode,state]=defs[index];if(typeof ONLY!=='undefined'&&!ONLY.includes(s))continue;const f=shell(s,mode,state,index);if(mode==='presentation')presentation(s,f,state);else if(mode==='game')game(s,f,state);else if(state==='chooser'){pos(f,txt('切换控制器','title'),24,178);let y=238;for(const [key,m]of Object.entries(modes)){button(s,f,key,m.name,Object.keys(L.icons).includes(m.icon)?m.icon:key==='email'?'Mail':key==='wechat'?'MessageCircle':'Sparkles',22,y);y+=74;}}else normal(s,f,mode,state);}
return {createdNodeIds:created,screens,hotspots,defs};
