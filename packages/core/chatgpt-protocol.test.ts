import {test} from 'node:test';import assert from 'node:assert/strict';
import {parsePolishStream,selectPolishModel,validateIdentity} from './chatgpt-protocol';
const event=(x:object)=>'data: '+JSON.stringify(x)+'\n\n';
const message={type:'message',content:[{type:'output_text',text:'请于明天 14:00 提交报价。'}]};
test('polish requires completed inference and handles sparse final output without reasoning leakage',()=>{
 const completed=event({type:'response.completed',response:{status:'completed',output:[message]}});
 assert.equal(parsePolishStream(completed),'请于明天 14:00 提交报价。');
 assert.equal(parsePolishStream(event({type:'response.output_item.done',item:message})+event({type:'response.completed',response:{status:'completed',output:[]}})),'请于明天 14:00 提交报价。');
 for(const bad of [event({type:'response.output_text.delta',delta:'partial'}),event({type:'response.failed'}),event({type:'response.incomplete'}),completed+completed,event({type:'response.completed',response:{status:'completed',output:[{type:'function_call'}]}})])assert.throws(()=>parsePolishStream(bad));
});
test('OIDC claims bind issuer audience nonce expiration and returning account identity',()=>{
 const c={iss:'https://auth.openai.com',aud:'client-a',nonce:'n',exp:200,sub:'user-a'};
 validateIdentity(c,'client-a','n','user-a',100000);
 for(const bad of [{...c,iss:'https://invalid.example'},{...c,aud:'client-b'},{...c,nonce:'other'},{...c,exp:99},{...c,sub:'user-b'}])assert.throws(()=>validateIdentity(bad,'client-a','n','user-a',100000));
});

test('model directory accepts plan and API shapes without inventing availability',()=>{
 assert.equal(selectPolishModel(JSON.stringify({models:[{slug:'gpt-6-luna',visibility:'list'}]})),'gpt-6-luna');
 assert.equal(selectPolishModel(JSON.stringify({data:[{id:'gpt-6-luna'}]})),'gpt-6-luna');
 assert.throws(()=>selectPolishModel(JSON.stringify({models:[{slug:'gpt-6-luna',visibility:'hidden'}]})));
 assert.throws(()=>selectPolishModel('{}'));
});
