import {defineConfig} from 'vite';
export default defineConfig({root:'apps/web',base:'./',build:{outDir:'../../dist',emptyOutDir:true},server:{port:5188,strictPort:true}});
