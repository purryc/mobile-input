import test from 'node:test';
import assert from 'node:assert/strict';
import {connectionPage} from './connection-page.mjs';
const input={addresses:['172.20.10.2'],port:39872,pin:'123456',expires:Date.now()+300000,connected:false,usb:{available:true,mapped:0},device:'Mac <script>alert(1)</script>'};
test('local connection page escapes device data and renders current network QR',async()=>{
 const html=await connectionPage(input);
 assert.ok(html.includes('data:image/png;base64,'));assert.ok(html.includes('172.20.10.2'));
 assert.ok(html.includes('&lt;script&gt;'));assert.ok(!html.includes('<script>'));
 assert.ok(html.includes('等待手机连接'));assert.ok(html.includes('content="20"'));
 assert.ok(!html.includes('resumeToken'));
});
test('no network means no unusable localhost Wi-Fi QR',async()=>{
 const html=await connectionPage({...input,addresses:[]});
 assert.ok(html.includes('当前没有可用的局域网地址'));assert.ok(!html.includes('data:image/png'));
});
test('detected USB is not presented as a confirmed tunnel or an authenticated session',async()=>{
 const pending=await connectionPage({...input,usb:{available:true,detected:1,mapped:0}});assert.ok(pending.includes('已检测到 USB，正在建立通道'));assert.ok(!pending.includes('USB 通道已就绪。'));assert.ok(pending.includes('等待手机连接'));
 const ready=await connectionPage({...input,usb:{available:true,detected:1,mapped:1}});assert.ok(ready.includes('USB 通道已就绪。'));assert.ok(ready.includes('等待手机连接'));
});
