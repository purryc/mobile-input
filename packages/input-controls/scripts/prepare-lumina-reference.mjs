// Build a local, independent reference iframe from the supplied ZIP. The library never imports it.
import {execFileSync} from 'node:child_process';
import {cpSync, mkdirSync, mkdtempSync, rmSync, writeFileSync} from 'node:fs';
import {dirname, join, resolve} from 'node:path';
import {tmpdir} from 'node:os';
import {fileURLToPath} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const zip=process.argv[2];
if(!zip) throw Error('Pass the path to the Lumina Chip reference ZIP.');
const work=mkdtempSync(join(tmpdir(),'lumina-original-'));
try {
  for(const file of ['src/index.css','src/components/OpticalChip.tsx','src/components/Icons.tsx','src/types/chip.ts']){
    mkdirSync(dirname(join(work,file)),{recursive:true});
    writeFileSync(join(work,file),execFileSync('unzip',['-p',resolve(zip),file]));
  }
  for(const file of ['optical-scene.tsx','optical-scene.css']) cpSync(join(root,'example',file),join(work,file));
  writeFileSync(join(work,'package.json'),JSON.stringify({private:true,type:'module',dependencies:{
    'tailwindcss':'4.3.3','@tailwindcss/vite':'4.3.3',vite:'8.0.10',react:'19.1.0','react-dom':'19.1.0'
  }}));
  writeFileSync(join(work,'vite.config.mjs'),"import tailwind from '@tailwindcss/vite';export default {base:'./',plugins:[tailwind()]};");
  writeFileSync(join(work,'index.html'),'<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="lumina-source" content="OpticalChip"><meta name="viewport" content="width=device-width"><div id="root"></div><script type="module" src="/reference.tsx"></script></html>');
  writeFileSync(join(work,'reference.tsx'),`
import React from 'react';
import {createRoot} from 'react-dom/client';
import {OpticalChip} from './src/components/OpticalChip';
import './src/index.css';
import {OpticalScene} from './optical-scene';
const config={preset:'morning-frost',radiusPx:12,luminosity:.42,frostedness:.72,motionEnabled:true,pointerSheen:true};
function Reference({state,label,kind,size,surfaceContext,open,remove}){
  return <OpticalChip {...{state,label,size,surfaceContext,config}} iconKind={kind} additionalCount={2} onAction={open} onDismiss={remove}/>;
}
createRoot(document.querySelector('#root')).render(<OpticalScene Chip={Reference}/>);
`);
  execFileSync('npm',['install','--no-audit','--no-fund'],{cwd:work,stdio:'inherit'});
  execFileSync(join(work,'node_modules/.bin/vite'),['build'],{cwd:work,stdio:'inherit'});
  cpSync(join(work,'dist'),join(root,'tests/lumina-reference'),{recursive:true});
} finally {rmSync(work,{recursive:true,force:true});}
