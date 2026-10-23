import {extractIconTheme} from './extract-icon-theme.mjs';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
const dir=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(dir,'../../..');
const require=createRequire(path.join(root,'package.json'));
const {build}=require('esbuild');
const {createElement}=require('react');
const {renderToStaticMarkup}=require('react-dom/server');
const lucide=require('lucide-react');
const openui=process.env.OPENUI_NODE_MODULES||'/Users/hmi/Documents/openui-playground/app/node_modules';
const out=path.join(root,'artifacts/wps-shortcut-preview-2026-10-22');
const definitions=JSON.parse(await readFile(path.join(dir,'../definitions.json'),'utf8'));
const theme=await extractIconTheme(path.join(root,'apps/web/public/assets/apps/wps.svg'));
const accent=theme.accent;
const functions=Object.fromEntries(definitions.functions.map(f=>[f.id,f]));
const config=[['bold','format.bold','Bold'],['italic','format.italic','Italic'],['underline','format.underline','Underline'],['smaller','format.size','AArrowDown','减小字号',-1],['larger','format.size','AArrowUp','增大字号',1],['color','format.color','Palette'],['left','format.alignment','AlignLeft','左对齐','left'],['center','format.alignment','AlignCenter','居中','center'],['right','format.alignment','AlignRight','右对齐','right'],['link','format.link','Link'],['save','document.save','Save'],['strike','format.strike','Strikethrough'],['justify','format.alignment','AlignJustify','两端对齐','justify']];
const keyIcons={};const items=[];
for(const [key,id,icon,label,arg] of config){
 if(!functions[id])throw Error('Unregistered '+id);
 if(!lucide[icon])throw Error('Missing installed icon '+icon);
 keyIcons[icon]=renderToStaticMarkup(createElement(lucide[icon],{size:24,strokeWidth:1.65}));
 items.push({key,functionId:id,label:label||functions[id]['名称'],icon,arg,componentId:'professional-action-key',definitionIcon:functions[id].iconId});
}
const dockIcons={};for(const name of ['select-all','copy','cut','paste','delete','undo','redo','capture','keyboard','trackpad','mic','mouse-left','mouse-right']){
 try{dockIcons[name]=await readFile(path.join(root,'apps/web/public/assets/figma/input-dock',name+'.svg'),'utf8')}catch{if(!name.startsWith('mouse'))throw Error('Missing icon '+name)}
}
const catalog={accent,theme,background:theme.background,items,keyIcons,dockIcons,logo:await readFile(path.join(root,'apps/web/public/assets/apps/wps.svg'),'utf8'),sourceComponents:['professional-action-key','input-dock','edit-tools','stepper','color-refinement','keyboard','trackpad'],scope:'isolated-preview-document'};
await writeFile(path.join(dir,'catalog.json'),JSON.stringify(catalog,null,2)+'\n');
await mkdir(out,{recursive:true});
await build({entryPoints:[path.join(dir,'preview.tsx')],bundle:true,outfile:path.join(out,'app.js'),format:'esm',jsx:'automatic',loader:{'.svg':'dataurl'},alias:{'@openuidev/react-lang':path.join(openui,'@openuidev/react-lang'),'zod':path.join(openui,'zod'),'react':path.join(root,'node_modules/react'),'react-dom':path.join(root,'node_modules/react-dom')},define:{'process.env.NODE_ENV':'"production"'},minify:true});
await writeFile(path.join(out,'index.html'),'<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>WPS · 快捷键面板</title><link rel="stylesheet" href="app.css"><div id="root"></div><script type="module" src="app.js"></script></html>');
console.log('Built '+out);
