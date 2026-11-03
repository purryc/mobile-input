import {defineConfig} from 'vite';
import {deckMiddleware} from './scripts/web-deck-service';
export default defineConfig({root:'apps/web',plugins:[{name:'local-web-decks',configureServer(server){server.middlewares.use(deckMiddleware);},configurePreviewServer(server){server.middlewares.use(deckMiddleware);}}],base:'./',build:{outDir:'../../dist',emptyOutDir:true},server:{port:5188,strictPort:true}});
