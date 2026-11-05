import {expandBluetoothPointer} from './bluetooth-pointer-codec.mjs';
import {EventEmitter} from 'node:events';
import {spawn,spawnSync} from 'node:child_process';
import {createInterface} from 'node:readline';
import {mkdirSync,writeFileSync,statSync} from 'node:fs';

/** Reuse the authenticated companion connection handler; this is not a second protocol. */
export class BluetoothPeer extends EventEmitter {
 readyState=1;bufferedAmount=0;
 constructor(id,write){super();this.id=id;this.write=write;}
 send(data){if(this.readyState!==1)return;const size=Buffer.byteLength(data)+1;if(size>262145||this.bufferedAmount+size>1048576){this.close();return;}this.bufferedAmount+=size;this.write({kind:'data',peer:this.id,data});}
 close(){if(this.readyState!==1)return;this.readyState=3;this.write({kind:'close',peer:this.id});this.emit('close');}
 receive(data){if(this.readyState!==1)return;if(typeof data!=='string'||Buffer.byteLength(data)>262144||data.includes('\n')){this.close();return;}try{const value=JSON.parse(data);this.emit('message',Buffer.from(JSON.stringify(expandBluetoothPointer(value))));}catch{this.close();}}
}
export function startBluetoothRoute(root,onConnection){
 const dir=root+'artifacts/mac-bridge/Input Agent Bluetooth.app/Contents',bin=dir+'/MacOS/input-agent-bluetooth',src=root+'scripts/mac-bridge/bluetooth.swift';
 mkdirSync(dir+'/MacOS',{recursive:true});
 writeFileSync(dir+'/Info.plist',`<?xml version="1.0" encoding="UTF-8"?><plist version="1.0"><dict><key>CFBundleName</key><string>Input Agent Bluetooth</string><key>CFBundleIdentifier</key><string>com.hmilab.input-agent.bluetooth</string><key>CFBundleExecutable</key><string>input-agent-bluetooth</string><key>CFBundlePackageType</key><string>APPL</string><key>LSUIElement</key><true/><key>NSBluetoothAlwaysUsageDescription</key><string>Connect Input Agent on your phone to control this Mac over Bluetooth.</string><key>NSBluetoothPeripheralUsageDescription</key><string>Connect Input Agent on your phone to control this Mac over Bluetooth.</string></dict></plist>`);
 let status={status:'starting'};
 if(!statSync(bin,{throwIfNoEntry:false})||statSync(src).mtimeMs>statSync(bin).mtimeMs){const result=spawnSync('/usr/bin/swiftc',[src,'-o',bin],{encoding:'utf8'});if(result.status){console.error('[InputAgent Bluetooth] compile failed');return {stop(){},status:()=>({status:'unavailable'})};}spawnSync('/usr/bin/codesign',['--force','--sign','-',dir.replace(/\/Contents$/,'')],{stdio:'ignore'});}
 const helper=spawn(bin,[],{stdio:['pipe','pipe','pipe']});let peer=null,closed=false;
 const write=data=>{if(helper.stdin.writable&&helper.stdin.writableLength<2097152)helper.stdin.write(JSON.stringify(data)+'\n');else peer?.close();};
 createInterface({input:helper.stdout}).on('line',line=>{try{const m=JSON.parse(line);if(m.kind==='status'){status=m;console.info('[InputAgent Bluetooth] '+m.status+(m.reason?' '+m.reason:'')+(m.channel?' channel='+m.channel:''));}else if(m.kind==='open'){console.info('[InputAgent Bluetooth] gatt-handshake-received');peer?.close();peer=new BluetoothPeer(m.peer,write);onConnection(peer);}else if(m.peer===peer?.id){if(m.kind==='data')peer.receive(m.data);else if(m.kind==='buffered'&&Number.isSafeInteger(m.bytes)&&m.bytes>=0)peer.bufferedAmount=m.bytes;else if(m.kind==='close'){peer.close();peer=null;}}}catch{}});
 helper.stderr.on('data',()=>{});helper.stdin.on('error',()=>peer?.close());helper.on('error',()=>{status={status:'unavailable'};peer?.close();});helper.on('exit',()=>{status={status:'unavailable'};peer?.close();if(!closed)console.error('[InputAgent Bluetooth] helper exited');});
 return {status:()=>status,stop(){closed=true;peer?.close();helper.kill();}};
}
