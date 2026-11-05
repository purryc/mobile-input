import {startBluetoothRoute} from './bluetooth-route.mjs';
import {trustStore} from './trust-store.mjs';
import {connectionPage} from './connection-page.mjs';
import {startUsbRoute} from './usb-route.mjs';
import {SnapshotGate,snapshotFingerprint} from './snapshot-gate.mjs';
import {watchHelperLifecycle} from './helper-lifecycle.mjs';
import {createServer} from 'node:http';
import {spawn,spawnSync} from 'node:child_process';
import {createInterface} from 'node:readline';
import {randomInt,randomUUID,randomBytes} from 'node:crypto';
import {networkInterfaces,hostname,homedir} from 'node:os';
import {fileURLToPath} from 'node:url';
import {mkdirSync,statSync,readFileSync,writeFileSync} from 'node:fs';
import {WebSocketServer} from 'ws';
import {validateCommand,Receipts,matchesCredential} from './protocol.mjs';
import {FileStore} from './file-store.mjs';
const root=fileURLToPath(new URL('../../',import.meta.url));
const files=new FileStore(root+'artifacts/mac-bridge/materials');
const binary=root+'artifacts/mac-bridge/input-agent-helper';
mkdirSync(root+'artifacts/mac-bridge',{recursive:true});
if(process.platform!=='darwin')throw Error('Mac companion requires macOS');
const source=root+'scripts/mac-bridge/agent.swift',switchSource=root+'scripts/mac-bridge/app-switcher.swift';
if(!statSync(binary,{throwIfNoEntry:false})||Math.max(statSync(source).mtimeMs,statSync(switchSource).mtimeMs)>statSync(binary).mtimeMs){const main=root+'artifacts/mac-bridge/main.swift';writeFileSync(main,readFileSync(source));const r=spawnSync('/usr/bin/swiftc',['-module-name','InputAgentBridge',main,switchSource,'-o',binary],{stdio:'inherit'});if(r.status)process.exit(r.status||1);}
const helper=spawn(binary,[],{stdio:['pipe','pipe','inherit']});
const helperLifecycle=watchHelperLifecycle(helper,()=>{console.error('[InputAgent bridge] helper-exited; restarting session');process.exit(1);});
let serial=0;const requests=new Map();
createInterface({input:helper.stdout}).on('line',line=>{try{const r=JSON.parse(line),p=requests.get(r.id);if(p){clearTimeout(p.timer);requests.delete(r.id);p.resolve(r);}}catch{}});
let queue=Promise.resolve();let failed=false;
helper.stdin.on('error',()=>{failed=true;for(const p of requests.values()){clearTimeout(p.timer);p.resolve({ok:false,error:'Mac 辅助进程已停止',outcome:'unknown'});}requests.clear();});
function invoke(message,valid=()=>true){const job=()=>new Promise(resolve=>{if(!valid())return resolve({ok:false,error:'旧连接操作已取消',outcome:'rejected'});if(failed)return resolve({ok:false,error:'Mac 辅助进程已停止',outcome:'unknown'});const id=String(++serial);const timer=setTimeout(()=>{requests.delete(id);failed=true;helper.kill();resolve({ok:false,error:'Mac 未响应，已暂停控制；请重启桥接服务',outcome:'unknown'});},4000);requests.set(id,{timer,resolve});helper.stdin.write(JSON.stringify({...message,id})+'\n');});const result=queue.then(job);queue=result.catch(()=>{});return result;}
helper.on('exit',()=>{failed=true;for(const p of requests.values()){clearTimeout(p.timer);p.resolve({ok:false,error:'Mac 辅助进程已停止',outcome:'unknown'});}requests.clear();active?.close();});
const trust=trustStore(homedir()+'/Library/Application Support/Input Agent/mac-trust.json');
const bridgeId=trust.bridgeId;let liveSession=randomUUID(),liveReceipts=new Receipts();let active=null;let liveClient='';let resumeToken=trust.token;let pin=String(randomInt(100000,1000000));let expires=Date.now()+300000;let attempts=0;
const port=Number(process.env.INPUT_AGENT_MAC_PORT||39872);
const usbRoute=startUsbRoute(port,undefined,event=>console.info('[InputAgent USB] '+JSON.stringify(event)));
const addresses=()=>Object.values(networkInterfaces()).flat().filter(a=>a&&a.family==='IPv4'&&!a.internal).map(a=>a.address);
async function pairingPage(){
if(Date.now()>expires){pin=String(randomInt(100000,1000000));expires=Date.now()+300000;attempts=0;}
return connectionPage({addresses:addresses(),port,pin,expires,connected:!!active,usb:usbRoute.status(),device:hostname()});
}
const pairingPort=Number(process.env.INPUT_AGENT_MAC_PAIR_PORT||39873);
const pairingServer=createServer(async(req,res)=>{const local=['127.0.0.1','::1','::ffff:127.0.0.1'].includes(req.socket.remoteAddress);if(!local||req.url!=='/'){res.writeHead(404).end();return;}res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','Content-Security-Policy':"default-src 'none'; img-src data:; style-src 'unsafe-inline'; script-src 'self'; connect-src 'self'; frame-ancestors 'none'"}).end(await pairingPage());});
const server=createServer((_req,res)=>res.writeHead(404).end());
pairingServer.listen(pairingPort,'127.0.0.1');
const wss=new WebSocketServer({noServer:true,maxPayload:262144});
server.on('upgrade',(req,socket,head)=>{const origin=req.headers.origin||'';if(wss.clients.size>=12){socket.destroy();return;}const nativeClient=req.headers['x-input-agent-client']==='harmony-phone';if(req.url!=='/control'||origin && !nativeClient && !/^https:\/\/mobile-input\.invalid$|^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)){socket.destroy();return;}wss.handleUpgrade(req,socket,head,s=>wss.emit('connection',s));});
wss.on('connection',socket=>{
 let authenticated=false,session='',receipts=new Receipts(),pending=0,lastHeartbeat=Date.now(),polling=false,lastState='';const isBluetooth=socket.constructor.name==='BluetoothPeer';const snapshotGate=new SnapshotGate(()=>performance.now(),isBluetooth?1200:250);
 const send=m=>{if(socket.readyState===1&&socket.bufferedAmount<1048576)socket.send(JSON.stringify(m));};
 const timeout=setTimeout(()=>{if(!authenticated)socket.close();},8000);
 socket.on('message',async bytes=>{let m;try{m=JSON.parse(bytes.toString());if(!m||typeof m!=='object')return socket.close()}catch{return socket.close()}
  if(!authenticated&&m.kind==='probe'){send({kind:'route',bridgeId});return;}
  if(!authenticated){const resumed=matchesCredential(m.pin,resumeToken,/^[a-f0-9]{64}$/);const paired=Date.now()<=expires&&attempts<5&&matchesCredential(m.pin,pin,/^\d{6}$/);if(m.kind!=='pair'||m.target!=='mac'||(!resumed&&!paired)){attempts++;send({kind:'error',message:'配对码错误或已过期，请在 Mac 刷新配对页'});socket.close();return;}if(active&&active!==socket&&!resumed){send({kind:'error',message:'Mac 已连接另一手机，请先断开'});socket.close();return;}const previous=active;active=socket;authenticated=true;clearTimeout(timeout);if(!resumed){resumeToken=randomBytes(32).toString('hex');trust.setToken(resumeToken);liveSession=randomUUID();liveReceipts=new Receipts();}if(typeof m.clientId==='string'&&/^[\w-]{1,80}$/.test(m.clientId)&&m.clientId!==liveClient){liveClient=m.clientId;liveSession=randomUUID();liveReceipts=new Receipts();}session=liveSession;receipts=liveReceipts;if(socket.constructor.name==='BluetoothPeer')console.info('[InputAgent Bluetooth] app-authenticated');if(previous&&previous!==socket){previous.close();await invoke({op:'release'});}send({kind:'connected',session,resumeToken,bridgeId,device:hostname(),pointerWindow:4,...(isBluetooth?{bluetoothFeatures:['compact-pointer-v1','pointer-write-command-v1']}:{})});await poll();return;}
  if(active!==socket)return;lastHeartbeat=Date.now();if(m.kind==='ping')return send({kind:'pong'});
  if(m.kind==='sync'){await poll();return;}
  const error=validateCommand(m,session);if(error)return send({kind:'ack',id:m.id,session,ok:false,error,outcome:'rejected'});
  if(pending>=(m.op==='pointer'?8:3))return send({kind:'ack',id:m.id,session,ok:false,error:'操作过快，请稍后',outcome:'rejected'});
  const valid=()=>active===socket&&socket.readyState===1;
  const owner=`${session}/${m.window}/${m.target}`;
  if(m.op==='pointer')snapshotGate.pointer();
  pending++;
  const result=await receipts.run(m.id,m.seq,async()=>{
   if(m.op.startsWith('file-')||['workbuddy-attach','workbuddy-submit','agent-attach','agent-submit','agent-detach'].includes(m.op)){
    if(m.op==='file-chunk'){try{return await files.command(m,owner);}catch(error){return {ok:false,error:error.message,outcome:'rejected'};}}
    const current=await invoke({op:'state'},valid);if(!valid()||!['workbuddy','codex','chatgpt','gemini'].includes(current.state?.app)||current.state?.window!==m.window||current.state?.target!==m.target)return {ok:false,error:'文件或任务目标已变化',outcome:'rejected'};
    if((m.op.startsWith('file-')||m.op.endsWith('-attach'))&&!current.state.capabilities.includes('agent-attach')&&!current.state.capabilities.includes('workbuddy-attach'))return {ok:false,outcome:'rejected',error:'当前应用附件接入尚未验证，材料保留在手机'};
    if(m.op.startsWith('workbuddy-')&&current.state.app!=='workbuddy')return {ok:false,outcome:'rejected',error:'旧操作与当前应用不符'};
    try{
     if(m.op.startsWith('file-'))return await files.command(m,owner);
     const adopted=files.get(m.files,owner);return invoke({...m,paths:adopted.map(f=>f.path),names:adopted.map(f=>f.name)},valid);
    }catch(error){return {ok:false,error:error.message,outcome:'rejected'};}
   }
   return invoke(m,valid);
  });pending--;
  send({...result,kind:'ack',id:m.id,session});if(m.op!=='pointer')await poll();
 });
 async function poll(){if(polling||!authenticated||socket!==active||pending||!snapshotGate.canPoll())return;polling=true;const r=await invoke({op:'state'},()=>active===socket&&socket.readyState===1&&snapshotGate.canPoll());polling=false;if(r.outcome==='rejected')return;if(!r.ok){send({kind:'error',message:r.error||'Mac 状态读取失败'});socket.close();return;}if(r.state){const encoded=snapshotFingerprint(r.state,isBluetooth);if(encoded!==lastState){lastState=encoded;send({kind:'state',session,state:r.state});}}}
 const interval=setInterval(()=>{if(!authenticated)return;if(Date.now()-lastHeartbeat>6500){socket.close();return;}void poll();},350);
 socket.on('close',()=>{clearTimeout(timeout);clearInterval(interval);if(active===socket){active=null;void invoke({op:'release'});const owner=session;setTimeout(()=>{if(!active||liveSession!==owner)files.cancel(owner+'/');},30000).unref();}});
 socket.on('error',()=>socket.close());
});
const bluetoothRoute=startBluetoothRoute(root,socket=>wss.emit('connection',socket));
server.listen(port,'0.0.0.0',()=>console.log(`Input Agent Mac bridge: http://127.0.0.1:${pairingPort}/ (pairing page; no application content logged)`));
function shutdown(){helperLifecycle.close();usbRoute.stop();bluetoothRoute.stop();active?.close();void invoke({op:'release'}).finally(()=>{helper.stdin.end();pairingServer.close();server.close();process.exit(0);});}process.on('SIGINT',shutdown);process.on('SIGTERM',shutdown);
