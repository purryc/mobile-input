import {defineConfig} from 'vite';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=fileURLToPath(new URL('.',import.meta.url));
export default defineConfig({root,base:'/mobile-input/',resolve:{dedupe:['react','react-dom','zod','lucide-react']},plugins:[{name:'isolate-preview',generateBundle(){
const visited=new Set<string>();
const walk=(id:string)=>{if(visited.has(id))return;visited.add(id);if(/\/(@a2ui|zod|packages\/ui)\/|apps\/design-system\/src\/(main|sandbox|task-composition)/.test(id.replaceAll('\\','/')))throw new Error('Full library dependency leaked into compact entry: '+id);const info=this.getModuleInfo(id);if(info)for(const dependency of [...info.importedIds,...info.dynamicallyImportedIds])walk(dependency);};
walk(path.resolve(root,'src/xiaoyi-controls.tsx'));
for(const id of this.getModuleIds()){if(/apps\/web\/src\/.*\.[cm]?[jt]sx?$/.test(id.replaceAll('\\','/')))throw new Error('Product runtime leaked into site: '+id);}}}],build:{outDir:'dist',emptyOutDir:true,rollupOptions:{input:{main:path.resolve(root,'index.html'),xiaoyi:path.resolve(root,'xiaoyi-controls.html')},output:{manualChunks(id){if(id.includes('generated.json'))return 'registry';if(id.includes('/node_modules/'))return id.includes('/@a2ui/')||/\/node_modules\/(lit|lit-html|lit-element|@lit)\//.test(id)||id.includes('/zod')?'a2ui':'vendor';}}}},server:{fs:{allow:[path.resolve(root,'../..')]}}});
