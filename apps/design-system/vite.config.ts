import {defineConfig} from 'vite';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=fileURLToPath(new URL('.',import.meta.url));
export default defineConfig({root,base:'/mobile-input/',resolve:{dedupe:['react','react-dom','zod','lucide-react'],alias:[{find:/^(?:\.\/i18n|.*\/apps\/web\/src\/i18n)$/,replacement:path.join(root,'src/i18n.ts')}]},plugins:[{name:'isolate-preview',generateBundle(){for(const id of this.getModuleIds()){if(/apps\/web\/src\/(runtime|mac-link|use-phone-editing|native)(\.|\/)/.test(id.replaceAll('\\','/')))throw new Error('Product runtime leaked into site: '+id);}}}],build:{outDir:'dist',emptyOutDir:true,rollupOptions:{output:{manualChunks(id){if(id.includes('generated.json'))return 'registry';if(id.includes('/node_modules/'))return id.includes('/@a2ui/')||/\/node_modules\/(lit|lit-html|lit-element|@lit)\//.test(id)||id.includes('/zod')?'a2ui':'vendor';}}}},server:{fs:{allow:[path.resolve(root,'../..')]}}});
