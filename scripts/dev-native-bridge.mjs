// Development-only USB bridge: browser tablet authority <-> native phone TCP.
// Both listeners are loopback-only. This is not USB-free device acceptance.
import net from 'node:net';
import {WebSocketServer} from 'ws';
const wsPort=Number(process.env.WS_PORT)||5193,tcpPort=Number(process.env.NATIVE_PORT)||39871;
let tablet=null,phone=null,pin='';
const sendNative=(kind,payload='')=>{if(!phone||phone.destroyed)return;const bytes=Buffer.from(JSON.stringify({kind,pin:'',payload})),length=Buffer.alloc(4);length.writeUInt32BE(bytes.length);phone.write(Buffer.concat([length,bytes]));};
const sendTablet=data=>{if(tablet?.readyState===1)tablet.send(JSON.stringify(data));};
const ws=new WebSocketServer({host:'127.0.0.1',port:wsPort,maxPayload:2097152});
ws.on('connection',socket=>{socket.on('message',raw=>{let m;try{m=JSON.parse(raw.toString());}catch{return socket.close();}if(m.kind==='register'){if(m.role!=='tablet'||!/^\d{6}$/.test(m.pin)||tablet&&tablet!==socket)return socket.close();tablet=socket;pin=m.pin;return;}if(socket===tablet&&['snapshot','ack'].includes(m.kind))sendNative('data',JSON.stringify(m));});socket.on('close',()=>{if(tablet===socket){tablet=null;phone?.destroy();phone=null;}});});
const tcp=net.createServer(socket=>{let buffer=Buffer.alloc(0),authenticated=false;const timeout=setTimeout(()=>{if(!authenticated)socket.destroy();},8000);socket.on('data',bytes=>{buffer=Buffer.concat([buffer,bytes]);while(buffer.length>=4){const size=buffer.readUInt32BE();if(size>2097152){socket.destroy();return;}if(buffer.length<size+4)return;const packet=buffer.subarray(4,size+4);buffer=buffer.subarray(size+4);let m;try{m=JSON.parse(packet.toString());}catch{socket.destroy();return;}if(m.kind==='hello'){if(!tablet||m.pin!==pin||phone&&phone!==socket){socket.destroy();return;}phone=socket;authenticated=true;clearTimeout(timeout);sendNative('welcome');sendTablet({kind:'connected'});}else if(authenticated&&phone===socket&&m.kind==='data'){let payload;try{payload=JSON.parse(m.payload);}catch{socket.destroy();return;}if(['command','sync'].includes(payload.kind))sendTablet(payload);}}});socket.on('error',()=>{});socket.on('close',()=>{clearTimeout(timeout);if(phone===socket){phone=null;sendTablet({kind:'disconnected'});}});});
tcp.listen(tcpPort,'127.0.0.1',()=>console.log(`Native development bridge: WS ${wsPort}, TCP ${tcpPort}; loopback only`));
process.on('SIGINT',()=>{phone?.destroy();for(const client of ws.clients)client.close();ws.close();tcp.close(()=>process.exit(0));});
