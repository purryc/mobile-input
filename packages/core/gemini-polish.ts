export const GEMINI_POLISH_MODEL='gemini-3.8-flash';
interface Part {text?:string;thought?:boolean;}
interface Content {parts?:Part[];}
interface Feedback {blockReason?:string;}
interface Candidate {finishReason?:string;content?:Content;}
interface Response {candidates?:Candidate[];promptFeedback?:Feedback;}
export function parseGeminiPolish(raw:string):string{
 const response=JSON.parse(raw) as Response;
 const candidate=response.candidates?.[0];
 if(response.promptFeedback?.blockReason||!candidate||candidate.finishReason!=='STOP')throw new Error('Gemini 未返回完整润色，原文已保留');
 const text=(candidate.content?.parts||[]).filter(p=>!p.thought).map(p=>p.text||'').join('').trim();
 if(!text||text.length>8000)throw new Error('Gemini 润色内容无效，原文已保留');
 return text;
}
export function geminiPolishError(code:number):string{
 if(code===401||code===403)return 'Gemini 密钥或权限不可用，请检查 API 设置';
 if(code===429)return 'Gemini 配额暂不可用，请检查额度或稍后重试';
 if(code===404)return 'Gemini 模型不可用，请检查模型设置';
 if(code===400)return 'Gemini 请求未通过，请检查密钥和模型设置';
 return 'Gemini 连接未完成，请检查手机网络后重试';
}
