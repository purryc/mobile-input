const controllerRoots=page.findAll(n=>n.type==='COMPONENT'&&n.children.some(c=>c.name.startsWith('03 · 固定输入')));
for(const c of controllerRoots){const mid=c.children.find(n=>n.name==='02 · 上下文自适应输入');const dock=c.children.find(n=>n.name.startsWith('03 · 固定输入'));if(!mid||!dock)continue;
 for(const n of mid.children){if(n.y<0)n.y=0;if(n.y+n.height>mid.height&&n.height<=mid.height)n.y=mid.height-n.height-8;}
 for(const composer of dock.findAll(n=>n.name==='Input / draft surface')){if(composer.height<80){const att=composer.children.find(n=>n.name==='Attachment / add');if(att)att.x=248;for(const t of composer.children.filter(n=>n.type==='TEXT')){t.resize(Math.min(t.width,224),t.height);t.textTruncation='ENDING';t.maxLines=1;}}}
 for(const composer of dock.findAll(n=>n.type==='INSTANCE'&&n.name==='compact-composer')){const val=composer.findOne(n=>n.type==='TEXT'&&n.name==='Value');if(val){val.resize(composer.width-126,val.height);val.textTruncation='ENDING';val.maxLines=1;}}
 for(const b of dock.children.filter(n=>n.name==='输入区 · 最小化')){b.fills=[paint('surface/reading')];b.opacity=.95;}
 mutated.push(c.id);
}
// Keep game key geometry fixed; only make region ownership explicit.
const games=await figma.getNodeByIdAsync('109:5273');for(const c of games.findAll(n=>n.type==='FRAME'&&n.width===844&&n.height===390)){const children=[...c.children];const top=region(c,'01 · 当前对象与任务状态',0,140);const adaptive=region(c,'02 · 上下文自适应输入 / 游戏中收起',140,1);adaptive.visible=false;const fixed=region(c,'03 · 固定输入 / 游戏控制',140,250);for(const n of children){if(n.name==='Rectangle'&&n.height<8&&n.y>370){n.remove();continue;}if(n.name.startsWith('Status')||n.name==='Game / app switch'||n.type==='TEXT')moveKeep(n,top);else if(n.name.startsWith('Game / ')&&!n.name.includes('background')||n.name.startsWith('FC /'))moveKeep(n,fixed,0,140);}mutated.push(c.id);}
return {createdNodeIds:created,mutatedNodeIds:mutated};
