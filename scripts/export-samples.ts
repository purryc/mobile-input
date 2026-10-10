import {writeFileSync,mkdirSync} from 'node:fs';
import {initialState,totals} from '../packages/core/model';
mkdirSync('samples',{recursive:true});const s=initialState();
writeFileSync('samples/sales-demo.json',JSON.stringify({fictional:true,customer:'澄星设计',seller:'锐行办公',contact:'chen.lang@example.com',products:s.products,totals:totals(s.products),mails:s.mails,paragraphs:s.paragraphs,slides:s.slides},null,2)+'\n');

writeFileSync('samples/workbuddy-demo.json',JSON.stringify({fictional:true,version:'1.2.0',dataVersion:s.reportRevision,chains:[{prompt:'引用客户需求，整理需求摘要',kind:'brief'},{prompt:'采购分析专家比较供应商报价',kind:'quote'},{prompt:'生成客户采购方案',kind:'proposal'},{prompt:'生成六页销售汇报',kind:'slides'}],workbuddy:s.workbuddy},null,2)+'\n');
