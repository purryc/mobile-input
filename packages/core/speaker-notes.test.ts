import test from 'node:test';
import assert from 'node:assert/strict';
import {initialState,Store} from './model';
import {migrateSpeakerNotes} from './migrate';
import {legacySpeakerNotes,legacyRefreshedOpening,salesSpeakerNotes} from './sales-speaker-notes';
test('speaker notes upgrade backs up once and preserves custom notes, files and slide content',()=>{
 const s=initialState();delete s.texts['speaker-notes-version'];s.officeFile='sample-slides';
 s.slides.forEach((slide,i)=>slide.notes=legacySpeakerNotes[i]);s.slides[0].notes=legacyRefreshedOpening;
 s.slides[1].notes='这是我自己写的讲稿';s.slides[2].body='保留自己修改的正文';s.texts['edited:slide:3:notes']='1';
 s.officeFiles.find(f=>f.id==='sample-slides')!.slides=structuredClone(s.slides);
 s.officeFiles.push({id:'my-deck',kind:'slides',name:'我的演示',slides:structuredClone(s.slides)});
 const before=JSON.stringify(s),backups:string[]=[];const next=migrateSpeakerNotes(s,(_,value)=>backups.push(value));
 assert.equal(JSON.stringify(s),before);assert.equal(backups.length,1);assert.ok(backups[0].includes(legacyRefreshedOpening));
 assert.equal(next.slides[0].notes,salesSpeakerNotes[0]);assert.equal(next.slides[1].notes,'这是我自己写的讲稿');assert.equal(next.slides[2].body,'保留自己修改的正文');assert.equal(next.slides[3].notes,legacySpeakerNotes[3]);
 assert.equal(next.officeFiles.find(f=>f.id==='sample-slides')!.slides![0].notes,salesSpeakerNotes[0]);
 assert.deepEqual(next.officeFiles.at(-1),s.officeFiles.at(-1));assert.equal(migrateSpeakerNotes(next,()=>assert.fail()),next);
 assert.throws(()=>migrateSpeakerNotes(s,()=>{throw Error('storage full');}));assert.equal(JSON.stringify(s),before);
});
test('report refresh preserves the expanded spoken notes and user revisions',()=>{
 const s=new Store();s.dispatch({id:'open',type:'open',value:'wps'});
 s.state.slides[1].notes='手动修改的讲稿';s.state.texts['edited:slide:1:notes']='1';
 const before=s.state.slides.map(slide=>slide.notes);s.state.products[0].quantity=42;
 assert.equal(s.dispatch({id:'refresh',type:'report-refresh'}).ok,true);
 assert.deepEqual(s.state.slides.map(slide=>slide.notes),before);
 assert.deepEqual(s.state.officeFiles.find(f=>f.id==='sample-slides')!.slides!.map(slide=>slide.notes),before);
});
