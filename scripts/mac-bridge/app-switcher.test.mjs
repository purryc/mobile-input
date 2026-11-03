import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,readFileSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {execFileSync} from 'node:child_process';
test('native switcher advances, renews 1.2s deadline, cancels and never leaves Command held',()=>{
 const dir=mkdtempSync(join(tmpdir(),'input-agent-switch-'));
 try {
  const source=readFileSync(new URL('./app-switcher.swift',import.meta.url),'utf8');
  writeFileSync(join(dir,'main.swift'),source+`
var events:[String]=[];var timers:[()->Void]=[]
let controller=NativeAppSwitcher(command:{events.append($0 ? "down":"up")},tab:{events.append("tab")},escape:{events.append("escape")},schedule:{delay,work in precondition(delay==1.2);timers.append(work)})
controller.next();controller.next()
precondition(events==["down","tab","tab"])
timers[0]();precondition(controller.isActive)
timers[1]();precondition(!controller.isActive && events.last=="up")
controller.next();controller.cancel();let snapshot=events;timers[2]()
precondition(events==snapshot && events.suffix(2)==["escape","up"])
controller.cancel();precondition(events==snapshot)
print("switch-lifecycle-pass")
`);
  execFileSync('swiftc',[join(dir,'main.swift'),'-o',join(dir,'test')]);
  assert.match(execFileSync(join(dir,'test'),{encoding:'utf8'}),/switch-lifecycle-pass/);
 }finally{rmSync(dir,{recursive:true,force:true});}
});
