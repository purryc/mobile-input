import {writeFileSync} from 'node:fs';
import {apiCatalog,example,apis,type CatalogName} from '../src/catalog-api';
const out=new URL('../public/generated/',import.meta.url);
for(const name of ['catalog.json','catalog-v1.json'])writeFileSync(new URL(name,out),JSON.stringify(apiCatalog.toJson(),null,2));
writeFileSync(new URL('catalog-schema.json',out),JSON.stringify(apiCatalog.validationSchema,null,2));
writeFileSync(new URL('common_types.json',out),JSON.stringify({$schema:'https://json-schema.org/draft/2020-12/schema',$defs:Object.fromEntries(Object.entries(apiCatalog.validationSchema.$defs as Record<string,unknown>).filter(([key])=>key!=='anyComponent'))},null,2));
for(const name of Object.keys(apis))writeFileSync(new URL(name+'.json',out),JSON.stringify(example(name as CatalogName),null,2));
