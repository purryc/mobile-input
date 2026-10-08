import {writeFileSync,mkdirSync} from 'node:fs';
import {initialState,totals} from '../packages/core/model';
mkdirSync('samples',{recursive:true});const s=initialState();
writeFileSync('samples/sales-demo.json',JSON.stringify({fictional:true,customer:'澄星设计',seller:'锐行办公',contact:'chen.lang@example.com',products:s.products,totals:totals(s.products),mails:s.mails,paragraphs:s.paragraphs,slides:s.slides},null,2)+'\n');
