import {test} from 'node:test';
import assert from 'node:assert/strict';
import {parseGeminiPolish,geminiPolishError} from './gemini-polish';
test('Gemini polish accepts only complete visible output, never thought or partial text',()=>{
 assert.equal(parseGeminiPolish(JSON.stringify({candidates:[{finishReason:'STOP',content:{parts:[{thought:true,text:'private reasoning'},{text:'明天两点，'},{text:'讨论30套设备。'}]}}]})),'明天两点，讨论30套设备。');
 for(const response of [{},{promptFeedback:{blockReason:'SAFETY'}},{candidates:[{finishReason:'MAX_TOKENS',content:{parts:[{text:'half'}]}}]},{candidates:[{finishReason:'STOP',content:{parts:[{thought:true,text:'thought'}]}}]}])assert.throws(()=>parseGeminiPolish(JSON.stringify(response)));
 assert.throws(()=>parseGeminiPolish('not json'));
});
test('Gemini errors are actionable and do not expose API response bodies',()=>{
 assert.match(geminiPolishError(403),/密钥或权限/);assert.match(geminiPolishError(429),/额度/);assert.match(geminiPolishError(404),/模型/);assert.match(geminiPolishError(503),/网络/);
});
