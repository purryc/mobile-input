#!/usr/bin/env node
import {cpSync, mkdirSync} from 'node:fs';
import {resolve} from 'node:path';

const target = resolve(process.argv[2] ?? 'public/input-controls');
mkdirSync(target, {recursive: true});
for (const name of ['assets', 'reference-assets', 'ASSET-SOURCES.md']) {
  cpSync(new URL('../public/' + name, import.meta.url), resolve(target, name), {recursive: true});
}
console.log('Input control assets are ready in ' + target);
