import {writeFileSync} from 'node:fs';
import {apiCatalog,example,apis,type CatalogName} from '../src/catalog-api';
import {selectTaskComponents,compileTaskPreview,taskSamples} from '../src/task-composition';
const out=new URL('../public/generated/',import.meta.url);
for(const name of ['catalog.json','catalog-v1.json'])writeFileSync(new URL(name,out),JSON.stringify(apiCatalog.toJson(),null,2));
writeFileSync(new URL('catalog-schema.json',out),JSON.stringify(apiCatalog.validationSchema,null,2));
writeFileSync(new URL('common_types.json',out),JSON.stringify({$schema:'https://json-schema.org/draft/2020-12/schema',$defs:Object.fromEntries(Object.entries(apiCatalog.validationSchema.$defs as Record<string,unknown>).filter(([key])=>key!=='anyComponent'))},null,2));
for(const name of Object.keys(apis))writeFileSync(new URL(name+'.json',out),JSON.stringify(example(name as CatalogName),null,2));

const plan=selectTaskComponents(taskSamples[0][2],{owner:"fixture:download",revision:0,capabilityVersion:0,profile:"agent"});
writeFileSync(new URL("task-composition.json",out),JSON.stringify({generatedBy:"scripts/export-catalog.ts",source:"src/task-composition.ts",scope:"Local deterministic fixture, not a production planner",plan,examples:plan.candidates.filter(c=>c.available).map(c=>({candidateId:c.id,messages:compileTaskPreview(plan,plan.context,plan.text,c.id)}))},null,2));
