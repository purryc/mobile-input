import {defineConfig} from 'vite';
export default defineConfig({base:'./',resolve:{dedupe:['react','react-dom','lucide-react']},build:{outDir:'dist',rollupOptions:{input:{main:'index.html',compact:'compact.html'}}}});
