import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
import coverage from '../content/extraction-coverage.json';
import bindings from '../content/component-bindings.json';
import definitions from '../../../docs/input-design-contract/definitions.json';
const root=path.resolve(import.meta.dirname,'../../..');
test('every registry ID is reviewed and shared variants reference one real owner',()=>{
 const records=coverage.records as Record<string,{kind:string;sharedOwner:string|null}>;
 assert.deepEqual(Object.keys(records).sort(),[...new Set([...definitions.components.map(c=>c.id),...Object.keys(bindings)])].sort());
 for(const [id,c] of Object.entries(records))if(c.sharedOwner)assert.ok(c.sharedOwner in bindings,id);
 for(const [id,b] of Object.entries(bindings)){assert.match(b.source,/^packages\/(?:ui|input-controls)\/src\//,id);assert.ok(readFileSync(path.join(root,b.source),'utf8').length);}
});
test('shared display imports never point into applications or perform product IO',()=>{
 for(const file of readdirSync(path.join(root,'packages/ui/src')).filter(f=>/\.tsx?$/.test(f))){
  const source=readFileSync(path.join(root,'packages/ui/src',file),'utf8');
  const ast=ts.createSourceFile(file,source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
  for(const statement of ast.statements)if(ts.isImportDeclaration(statement)){
   const name=(statement.moduleSpecifier as ts.StringLiteral).text;
   assert.ok(name.startsWith('./')||name.startsWith('../../core/')||name==='../../../docs/liquid-glass-tokens.json'||['react','react-dom','lucide-react'].includes(name),file+': '+name);
  }
  assert.doesNotMatch(source,/\b(localStorage|sessionStorage|WebSocket|MobileNative|fetch|getUserMedia)\b/,file);
 }
});
test('product adapters never import documentation or A2UI',()=>{
 for(const file of readdirSync(path.join(root,'apps/web/src')).filter(f=>/\.tsx?$/.test(f))){
  const source=readFileSync(path.join(root,'apps/web/src',file),'utf8');
  assert.doesNotMatch(source,/from\s+['"][^'"]*(?:design-system|@a2ui)/,file);
 }
});
