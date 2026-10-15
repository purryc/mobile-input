const additions=[],wires=[];
for(const id of ['recipe-wechat-pc','recipe-doubao-pc','recipe-sheet-pc']){
 const f=F[id],set=await figma.getNodeByIdAsync(f.id),state=id.includes('wechat')?'Recommendations':id.includes('doubao')?'Sketch':'Draft';const base=await figma.getNodeByIdAsync(f.variants['Glass/'+state]);const targets={};
 for(const inputMode of ['Keyboard','Trackpad']){const c=track(base.clone());c.name=c.name.replace('Input=Expanded','Input='+inputMode);set.appendChild(c);const mid=c.children.find(n=>n.name==='02 · 上下文自适应输入');mid.resize(1280,54);for(const n of mid.children)n.visible=false;const hint=txt(id.includes('wechat')?'陈总 · 回复当前消息':id.includes('doubao')?'澄星项目采购方案 · 草图与描述一起提交':'销售报价表 · 当前输入 D13','Label','text/muted',1232);place(hint,mid,24,14);
 const dock=c.children.find(n=>n.name==='03 · 固定输入 / Expanded');for(const n of [...dock.children])n.remove();dock.y=126;dock.resize(1280,354);place(await inst('edit-tools','Glass'),dock,24,4);const toggle=await inst('segmented','Glass',inputMode);place(toggle,dock,902,4);const comp=await inst('compact-composer','Glass','Draft',{w:1232});place(comp,dock,24,56);const val=comp.findOne(n=>n.type==='TEXT'&&n.name==='Value');val.resize(1106,val.height);const panel=await inst(inputMode==='Keyboard'?(id.includes('sheet')?'numpad':'keyboard'):'trackpad','Glass',undefined,{w:1232});place(panel,dock,24,114);
 const down=await inst('icon-button','Glass','Default',{icon:'ChevronDown'});down.name='输入区 · 收起键盘或触控板';place(down,dock,1204,60);targets[inputMode]=c.id;wires.push({from:down.id,to:base.id});wires.push({from:toggle.id,mode:inputMode});additions.push(c.id);
 }
 for(const c of set.children){const dock=c.children.find(n=>n.name==='03 · 固定输入 / Expanded');if(!dock)continue;const row=dock.children.find(n=>n.name==='Fixed voice and input modes');if(row){wires.push({from:row.children[0].id,to:targets.Keyboard},{from:row.children[1].id,to:targets.Trackpad});}}
 for(const w of wires.filter(w=>w.mode&&!w.to)){w.to=targets[w.mode==='Keyboard'?'Trackpad':'Keyboard'];delete w.mode;}
 set.children.forEach((c,i)=>{c.x=32+i%4*1304;c.y=48+Math.floor(i/4)*528;});set.resize(5250,Math.ceil(set.children.length/4)*528+80);mutated.push(set.id);
}
return {createdNodeIds:created,mutatedNodeIds:mutated,wires,additions};
