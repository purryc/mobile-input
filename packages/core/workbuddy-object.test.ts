import {test} from 'node:test';import assert from 'node:assert/strict';
import {Store,type Command} from './model';
import {activeFileView,fileBody,browserState} from './workbuddy-files';
import {objectContext} from './workbuddy-object';
function fixture(){const store=new Store();let i=0;const send=(type:string,value:unknown={},extra:Partial<Command>={})=>store.dispatch({id:'obj-'+(++i),type,app:store.state.app,value,...extra});send('open','workbuddy');send('wb-fb-open',{file:'sales-slides'});const view=()=>activeFileView(store.state);const select=(path='slide/2/title')=>send('wb-object-select',{view:view().id,file:'sales-slides',path});select();const anchor=()=>({targetId:store.state.target!.id,targetRevision:store.state.target!.revision});const instruction=(text='把标题改为“季度增长路线图”，简洁一点')=>{const t=store.state.target!,d=store.state.workbuddy.entityDrafts[t.id];return send('wb-edit',{text,revision:d.revision,session:'phone',sequence:d.sequence+1},anchor());};const preview=()=>{const d=store.state.workbuddy.entityDrafts[store.state.target!.id];return send('wb-submit',{text:d.text,revision:d.revision},anchor());};const apply=()=>send('wb-object-apply',{preview:objectContext(store.state)!.preview!.id},anchor());return {store,send,view,select,anchor,instruction,preview,apply};}
test('explicit object submit saves selected text once without a phone preview',()=>{
 const f=fixture(),before=structuredClone(fileBody(f.store.state,f.view(),'sales-slides'));f.instruction();
 assert.deepEqual(fileBody(f.store.state,f.view(),'sales-slides'),before);
 assert.equal(f.send('wb-object-style',{style:{color:'#1971C2',size:32,align:'center'},revision:0},f.anchor()).ok,true);
 assert.equal(fileBody(f.store.state,f.view(),'sales-slides').slides![2].title,before.slides![2].title);
 const d=f.store.state.workbuddy.entityDrafts[f.store.state.target!.id],request={id:'explicit-submit',type:'wb-submit',app:'workbuddy' as const,value:{text:d.text,revision:d.revision},...f.anchor()};
 assert.equal(f.store.dispatch(request).ok,true);const count=browserState(f.store.state).docs['sales-slides'].changes.length;
 assert.equal(f.store.dispatch(request).ok,true);assert.equal(browserState(f.store.state).docs['sales-slides'].changes.length,count);
 const after=browserState(f.store.state).docs['sales-slides'].saved;
 assert.equal(after.slides![2].title,'季度增长路线图');assert.equal(after.slides![2].body,before.slides![2].body);assert.deepEqual(after.slides![0],before.slides![0]);
 assert.deepEqual(after.objectStyles!['slide/2/title'],{color:'#1971C2',size:32,align:'center'});
 assert.equal(f.store.state.officeFiles.find(x=>x.id==='sample-slides')!.slides![2].title,'季度增长路线图');assert.equal(objectContext(f.store.state)!.preview,null);
 assert.equal(f.send('wb-object-apply',{preview:'old'},f.anchor()).ok,false);
});
test('working-copy edits and new targets reject old object submits and preserve instructions',()=>{
 const f=fixture();f.instruction();const id=f.store.state.target!.id,anchor=f.anchor(),d=f.store.state.workbuddy.entityDrafts[id];
 const value={text:d.text,revision:d.revision};
 f.send('wb-fb-edit',{view:f.view().id,file:'sales-slides',path:'slide/2/body',text:'另一端的新内容',version:f.view().working['sales-slides'].version});
 assert.equal(f.send('wb-submit',value,anchor).ok,false);assert.equal(fileBody(f.store.state,f.view(),'sales-slides').slides![2].body,'另一端的新内容');
 f.select('slide/3/title');assert.equal(f.send('wb-submit',value,anchor).ok,false);assert.match(f.store.state.workbuddy.entityDrafts[id].text,/季度增长路线图/);
});
test('reload does not execute drafts or legacy previews; stale revisions and unknown instructions fail',()=>{
 const f=fixture();f.instruction();const old=fileBody(f.store.state,f.view(),'sales-slides').slides![2].title;
 const saved=new Store(structuredClone(f.store.state));assert.equal(saved.state.officeFiles.find(x=>x.id==='sample-slides')!.slides![2].title,old);
 const o=objectContext(saved.state)!;browserState(saved.state).docs[o.file].revision++;
 const d=saved.state.workbuddy.entityDrafts[saved.state.target!.id];assert.equal(saved.dispatch({id:'after-restore',type:'wb-submit',app:'workbuddy',value:{text:d.text,revision:d.revision},...f.anchor()}).ok,false);
 assert.equal(f.send('wb-object-style',{style:{size:900},revision:0},f.anchor()).ok,false);f.instruction('帮我做得好看点');assert.equal(f.preview().ok,false);
});

test('object pointer binds view and object version, rejects reordered samples and releases on disconnect',()=>{
 const f=fixture();const sample={gesture:'point-1',sequence:2,x:.3,y:.4,phase:'move'};
 assert.equal(f.send('wb-object-pointer',sample,f.anchor()).ok,true);
 assert.equal(f.send('wb-object-pointer',{...sample,sequence:1},f.anchor()).ok,false);
 assert.equal(f.send('wb-object-pointer',{...sample,sequence:3,x:9},f.anchor()).ok,false);
 f.send('release');assert.equal(browserState(f.store.state).objectPointer,undefined);
});
