import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,mkdtempSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {execFileSync} from 'node:child_process';
import {validateCommand} from './protocol.mjs';
test('relative pointer packets validate finite bounded deltas without changing legacy packets',()=>{
 const p={kind:'command',id:'pointer',seq:1,session:'s',window:'w',target:'t',op:'pointer',action:'move',x:.5,y:.5};
 assert.equal(validateCommand(p,'s'),'');assert.equal(validateCommand({...p,relative:true,deltaX:-200,deltaY:300},'s'),'');
 for(const patch of [{relative:false},{relative:true,deltaX:Infinity,deltaY:0},{relative:true,deltaX:4097,deltaY:0},{relative:true,deltaX:0}])assert.notEqual(validateCommand({...p,...patch},'s'),'');
});
test('native desktop geometry crosses screens with negative and vertical origins without using Retina pixels',()=>{
 if(process.platform!=='darwin')return;
 const source=readFileSync(new URL('./agent.swift',import.meta.url),'utf8'),start=source.indexOf('func confinedPointer('),end=source.indexOf('func subapp(',start),dir=mkdtempSync(tmpdir()+'/pointer-displays-');
 try{writeFileSync(dir+'/main.swift','import Foundation\nimport CoreGraphics\n'+source.slice(start,end)+`
let first=relativePointerDestination(CGPoint(x:10,y:20),2,-4)
precondition(first==CGPoint(x:13,y:14))
let twice=relativePointerDestination(relativePointerDestination(.zero,12,-8),8,4)
precondition(twice==relativePointerDestination(.zero,20,-4))
let screens=[CGRect(x:0,y:0,width:1440,height:900),CGRect(x:1440,y:-400,width:2560,height:1440),CGRect(x:-1920,y:0,width:1920,height:1080)]
for p in [CGPoint(x:1442,y:100),CGPoint(x:-5,y:600),CGPoint(x:2000,y:-200),CGPoint(x:1400,y:899)]{precondition(confinedPointer(p,screens)==p)}
let gap=confinedPointer(CGPoint(x:100,y:-200),screens);precondition(screens.contains{$0.contains(gap)})
let outside=confinedPointer(CGPoint(x:9000,y:8000),screens);precondition(screens.contains{$0.contains(outside)})
let vertical=[CGRect(x:0,y:0,width:1440,height:900),CGRect(x:0,y:-900,width:1440,height:900)]
precondition(confinedPointer(CGPoint(x:700,y:-5),vertical)==CGPoint(x:700,y:-5))
`);execFileSync('/usr/bin/swift',[dir+'/main.swift'],{timeout:10000});}finally{rmSync(dir,{recursive:true,force:true});}
});
