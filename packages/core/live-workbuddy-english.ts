import type { LiveParameter, LiveInputKind } from './live-workbuddy';
const colors: Record<string,string> = {red:'#C92A2A',blue:'#356FE4',black:'#182431',white:'#FFFFFF',gray:'#D9DEDF',grey:'#D9DEDF',green:'#238359',yellow:'#E9BF38',orange:'#DC762F',purple:'#8053B7','dark red':'#962D34'};
const numbers:Record<string,number>={one:1,two:2,three:3,four:4,five:5,six:6,seven:7,eight:8,nine:9,ten:10,eleven:11,twelve:12,thirteen:13,fourteen:14,fifteen:15,sixteen:16,seventeen:17,eighteen:18,nineteen:19,twenty:20,thirty:30,forty:40,fifty:50,sixty:60};
function minutes(s:string){return /^\d+$/.test(s)?+s:s.toLowerCase().split(/[ -]/).reduce((n,w)=>n+(numbers[w]||0),0);}
/** Match original English spans; canonical roles intentionally share Chinese bindings. */
export function extractEnglishParameters(text:string):LiveParameter[]{
 const items:LiveParameter[]=[];
 const color='(?:#[0-9a-f]{6}|dark red|red|blue|black|white|gr[ae]y|green|yellow|orange|purple)';
 const scopeAt=(start:number)=>{const clause=text.slice(0,start).split(/[.;!?\n。；]/).at(-1)||'';const pages=[...clause.matchAll(/\b(?:slide|page)\s+(\d+|one|two|three|four|five|six|seven|eight|nine|ten)\b/gi)];const page=pages.at(-1);return page?`第${minutes(page[1])}页`:'全文';};
 const negated=(start:number)=>/\b(?:no|not|never|without|don['’]t|do not|avoid|remove|skip|cancel)\b/i.test(text.slice(0,start).split(/[,.;!?\n]|\b(?:but|instead)\b/i).at(-1)||'');
 const add=(kind:LiveInputKind,m:RegExpMatchArray,phrase:string,role:string,value='')=>{const start=m.index!+m[0].lastIndexOf(phrase);if(negated(m.index!))return;items.push({id:'',kind,start,end:start+phrase.length,phrase,label:kind==='duration'?value:phrase,role,scope:scopeAt(start),value,manual:false});};
 const roles:Record<string,string>={theme:'主题色',primary:'主题色',accent:'强调色',background:'背景',font:'字体',text:'字体',title:'标题'};
 for(const m of text.matchAll(new RegExp(`\\b(theme|primary|accent|background|font|text|title)(?:\\s+colou?r)?\\s*(?:(?:is|should be|to|as|in|use|uses)\\s+|[:=]\\s*)?(${color})(?![\\w#])`,'gi')))add('color',m,m[2],roles[m[1].toLowerCase()],colors[m[2].toLowerCase()]||m[2].toUpperCase());
 for(const m of text.matchAll(new RegExp(`(${color})\\s+(?:colou?red\\s+)?(background|font|text|title|theme)(?:\\s+colou?r)?\\b`,'gi')))add('color',m,m[1],roles[m[2].toLowerCase()],colors[m[1].toLowerCase()]||m[1].toUpperCase());
 for(const m of text.matchAll(new RegExp(`\\b(?:use|choose|set|make it)\\s+(${color})(?![\\w#])`,'gi'))){const start=m.index!+m[0].lastIndexOf(m[1]);if(!items.some(p=>p.start===start))add('color',m,m[1],'颜色',colors[m[1].toLowerCase()]||m[1].toUpperCase());}
 const numeric='(?:\\d{1,3}|(?:twenty|thirty|forty|fifty)(?:[ -](?:one|two|three|four|five|six|seven|eight|nine))?|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|sixty)';
 for(const m of text.matchAll(new RegExp(`\\b(${numeric})[ -]*minutes?\\b`,'gi'))){const n=minutes(m[1]);const before=text.slice(0,m.index).split(/[,.;!?\n]/).at(-1)||'';if(/(?:\d|one|two|three|four|five|six|seven|eight|nine|ten)\s*(?:to|and|[-–])\s*$/i.test(before)||/^\s*(?:to|[-–])\s*\d/.test(text.slice(m.index!+m[0].length)))continue;if(/\d\.$/.test(text.slice(0,m.index)))continue;if(n>=1&&n<=60)add('duration',m,m[1],'演讲时长',String(n));}
 for(const m of text.matchAll(/\b(?:attach|upload|select|choose|reference|refer to|use|add)\s+(?:(?:a|an|the|my|local|reference|product|existing)\s+){0,3}((?:[\w-]+\s+){0,2}(?:files?|documents?|PDFs?)|[\w.-]+\.(?:pdf|txt|md))\b/gi))add('document',m,m[1],'参考资料');
 for(const m of text.matchAll(/\b(?:attach|upload|select|choose|add|reference|use|take|capture)\s+(?:(?:a|an|the|my|some|local|reference|product|existing)\s+){0,4}(images?|photos?|pictures?|illustrations?)\b/gi))add('photo',m,m[1],'实拍照片');
 for(const m of text.matchAll(/\b(?:layout(?: sketch)?|sketch(?: the layout)?|draw the layout)\b/gi))add('sketch',m,m[0],'布局草图');
 return items;
}
