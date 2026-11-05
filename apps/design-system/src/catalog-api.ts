import {z} from 'zod';
import {CommonSchemas,Catalog} from '@a2ui/web_core/v0_9';
// Dynamic string bindings without remote function execution.
const DynamicString=z.union([z.string(),z.object({path:z.string()}).strict()]).describe('Literal string or an existing data binding; this host does not execute function calls.');
export const catalogId='https://purryc.github.io/mobile-input/generated/catalog-v1.json';
export const apis={
 Column:{name:'Column',schema:z.object({children:z.array(CommonSchemas.ComponentId)}).strict()},
 Text:{name:'Text',schema:z.object({text:DynamicString}).strict()},
 ActionChip:{name:'ActionChip',schema:z.object({label:DynamicString,actionId:z.literal('activate')}).strict()},
 ColorInput:{name:'ColorInput',schema:z.object({value:DynamicString,role:z.enum(['primary','background','text'])}).strict()},
 DurationInput:{name:'DurationInput',schema:z.object({value:DynamicString}).strict()},
 ImageInput:{name:'ImageInput',schema:z.object({contextId:z.literal('demo-image')}).strict()},
 SketchInput:{name:'SketchInput',schema:z.object({contextId:z.literal('demo-sketch')}).strict()},
 AuxiliaryPanel:{name:'AuxiliaryPanel',schema:z.object({title:DynamicString,child:CommonSchemas.ComponentId}).strict()},
 ContextualPolishActions:{name:'ContextualPolishActions',schema:z.object({contextId:z.literal('demo-editor')}).strict()}
};
export const apiCatalog=new Catalog(catalogId,'v0.9.1',Object.values(apis),[]);
export type CatalogName=keyof typeof apis;
export function catalogValueIssue(component:string,value:unknown):'missing-value'|'invalid-value'|null{
 if(!['ColorInput','DurationInput'].includes(component))return null;
 if(value===''||value===null||value===undefined)return 'missing-value';
 if(typeof value!=='string')return 'invalid-value';
 if(component==='ColorInput')return /^#[0-9a-f]{6}$/i.test(value)?null:'invalid-value';
 return /^\d+$/.test(value)&&Number(value)>=1&&Number(value)<=60?null:'invalid-value';
}
export function example(name:CatalogName='ImageInput'){
 const component:Record<string,unknown>={id:'demo',component:name};
 if(name==='ActionChip')Object.assign(component,{label:'添加材料 / Add material',actionId:'activate'});
 if(name==='ColorInput')Object.assign(component,{value:{path:'/value'},role:'primary'});
 if(name==='DurationInput')Object.assign(component,{value:{path:'/value'}});
 if(name==='ImageInput')Object.assign(component,{contextId:'demo-image'});
 if(name==='SketchInput')Object.assign(component,{contextId:'demo-sketch'});
 if(name==='ContextualPolishActions')Object.assign(component,{contextId:'demo-editor'});
 if(name==='Text')Object.assign(component,{text:{path:'/title'}});
 if(name==='Column')Object.assign(component,{children:['caption']});
 if(name==='AuxiliaryPanel')Object.assign(component,{title:'辅助输入 / Auxiliary input',child:'caption'});
 const components=[{id:'root',component:'Column',children:['demo']},component];
 if(['Column','AuxiliaryPanel'].includes(name))components.push({id:'caption',component:'Text',text:'关闭保留输入 / Closing retains input'});
 return [{version:'v0.9.1',createSurface:{surfaceId:'preview',catalogId}},{version:'v0.9.1',updateDataModel:{surfaceId:'preview',path:'/',value:{title:'Mobile Input',value:name==='DurationInput'?'10':'#E03131'}}},{version:'v0.9.1',updateComponents:{surfaceId:'preview',components}}];
}
// Narrow fixture-host policy, in addition to official protocol and Catalog validation.
export function validateMessages(input:unknown):unknown[]{
 if(!Array.isArray(input)||input.length>50)throw Error('Expected an array of at most 50 messages.');
 const encoded=JSON.stringify(input);if(encoded.length>60000)throw Error('Message payload is too large.');
 const walk=(v:unknown,depth=0)=>{if(depth>20)throw Error('Nesting limit exceeded.');if(!v||typeof v!=='object')return;for(const [k,x] of Object.entries(v)){if(['__proto__','prototype','constructor','call','functionCall','serviceUrl','instruction','permissions'].includes(k))throw Error('Forbidden field: '+k);walk(x,depth+1);}};walk(input);
 const model:Record<string,unknown>=Object.create(null);const surfaces=new Set<string>();const activeComponents=new Map<string,Record<string,unknown>>();
 for(const raw of input){const m=z.object({version:z.literal('v0.9.1'),createSurface:z.object({surfaceId:z.literal('preview'),catalogId:z.literal(catalogId)}).strict().optional(),updateComponents:z.object({surfaceId:z.literal('preview'),components:z.array(z.record(z.unknown())).max(40)}).strict().optional(),updateDataModel:z.object({surfaceId:z.literal('preview'),path:z.string(),value:z.unknown()}).strict().optional(),deleteSurface:z.object({surfaceId:z.literal('preview')}).strict().optional()}).strict().parse(raw);
 if(Object.keys(m).length!==2)throw Error('One operation per message is required.');
 if(m.createSurface){if(surfaces.has('preview'))throw Error('Surface already exists.');surfaces.add('preview');}
 else if(!surfaces.has('preview'))throw Error('Create the surface before updating it.');
 if(m.deleteSurface){surfaces.delete('preview');activeComponents.clear();for(const k of Object.keys(model))delete model[k];}
 if(m.updateDataModel){const {path,value}=m.updateDataModel;if(path==='/'){if(!value||Array.isArray(value)||typeof value!=='object')throw Error('Root data must be an object.');for(const k of Object.keys(model))delete model[k];Object.assign(model,value);}else if(/^\/[a-zA-Z][\w-]*$/.test(path))model[path.slice(1)]=value;else throw Error('This host supports root or one-level data paths.');}
 if(m.updateComponents){const ids=new Set<string>();for(const c of m.updateComponents.components){if(ids.has(String(c.id)))throw Error('Duplicate component id: '+c.id);ids.add(String(c.id));activeComponents.set(String(c.id),c);}}
 for(const c of activeComponents.values()){if(typeof c.id!=='string'||!c.id)throw Error('Each component needs a stable id.');if(!Object.hasOwn(apis,String(c.component)))throw Error('Unknown component: '+c.component);const {id,component,...props}=c;apis[component as CatalogName].schema.parse(props);
 const check=(v:unknown)=>{if(v&&typeof v==='object'){if('path' in v){const path=(v as {path:unknown}).path;if(typeof path!=='string'||!/^\/[a-zA-Z][\w-]*$/.test(path)||!Object.hasOwn(model,path.slice(1)))throw Error('Unresolved data binding: '+path+'. This fixture host requires data before components.');const value=model[path.slice(1)];if(typeof value!=='string')throw Error('Expected a string binding at '+path);}else Object.values(v).forEach(check);}};Object.values(props).forEach(check);
 const rawValue=props.value;const value=typeof rawValue==='object'&&rawValue!==null?model[String((rawValue as {path:string}).path).slice(1)]:rawValue;
 if(catalogValueIssue(String(component),value))throw Error(component==='ColorInput'?'ColorInput requires a six-digit HEX color.':'DurationInput requires 1–60 minutes.');
 }
 if(m.updateComponents){
  if(activeComponents.size>40)throw Error('At most 40 active components are supported.');
  if(!activeComponents.has('root'))throw Error('The component tree needs a root.');
  const visiting=new Set<string>(),visited=new Set<string>();
  const visit=(id:string)=>{if(visiting.has(id))throw Error('Component cycle: '+id);if(visited.has(id))return;const c=activeComponents.get(id);if(!c)throw Error('Missing component reference: '+id);visiting.add(id);const children=c.component==='Column'?c.children as string[]:c.component==='AuxiliaryPanel'?[c.child as string]:[];for(const child of children)visit(child);visiting.delete(id);visited.add(id);};visit('root');
  if(visited.size!==activeComponents.size)throw Error('Every component must be reachable from root.');
 }
 }return input;
}
