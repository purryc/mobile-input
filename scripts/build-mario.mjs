import {build} from 'esbuild';
await build({entryPoints:['vendor/mario-js/lib/game.js'],bundle:true,format:'iife',target:'es2020',outfile:'apps/web/public/mario-classic/game.js',minify:true});
