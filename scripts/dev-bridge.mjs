import {WebSocketServer} from 'ws';
const port=Number(process.env.PORT)||5189;
const server=new WebSocketServer({port,host:process.env.HOST||'0.0.0.0',maxPayload:2097152});
let tablet=null,phone=null,pin='';
server.on('connection',socket=>{
 const timer=setTimeout(()=>{if(socket!==tablet&&socket!==phone)socket.close();},8000);
 socket.on('message',bytes=>{let m;try{m=JSON.parse(bytes.toString());}catch{return socket.close();}
  if(m.kind==='register'){
   if(m.role==='tablet'){if(tablet&&tablet!==socket)return socket.close();if(!/^\d{6}$/.test(m.pin))return socket.close();tablet=socket;pin=m.pin;clearTimeout(timer);}
   else if(m.role==='phone'&&tablet&&m.pin===pin){phone?.close();phone=socket;clearTimeout(timer);tablet.send(JSON.stringify({kind:'connected'}));phone.send(JSON.stringify({kind:'connected'}));}
   else socket.send(JSON.stringify({kind:'error',message:'配对码不正确，或平板尚未打开'}));return;
  }
  if(socket===phone&&['command','sync'].includes(m.kind))tablet?.send(bytes.toString());
  if(socket===tablet&&['snapshot','ack'].includes(m.kind))phone?.send(bytes.toString());
 });
 socket.on('close',()=>{clearTimeout(timer);if(socket===tablet){tablet=null;phone?.send(JSON.stringify({kind:'disconnected'}));phone?.close();phone=null;}if(socket===phone){phone=null;tablet?.send(JSON.stringify({kind:'disconnected'}));}});
});
console.log(`Development bridge listening on :${port}`);
