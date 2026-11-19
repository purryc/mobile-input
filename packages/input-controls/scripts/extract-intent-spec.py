"""Usage: python3 scripts/extract-intent-spec.py /path/to/alignment-final-export-text.json"""
import hashlib,json,re,sys
from pathlib import Path
source=Path(sys.argv[1]); slides=json.loads(source.read_text())
kinds=['document','photo','scanner','sketch','color','duration','capture','formats','skills','palette','connectors','font','expert']
controls=[]
for kind,page in zip(kinds,range(6,32,2)):
    detail=slides[page-1]; example=slides[page]; texts=[t[0] for t in example[3]]
    rows=[]
    for i,text in enumerate(texts):
        match=re.match(r'^(\d{2}) {2}(.+)',text)
        if not match:continue
        n=int(match[1]);rows.append(dict(id=n,clarity='explicit' if n<=10 else 'partial' if n<=15 else 'goal' if n<=20 else 'negative',zh=match[2].replace(' †',''),en=texts[i+1].replace(' †',''),unsupported='†' in text))
    assert len(rows)==25 and [r['id'] for r in rows]==list(range(1,26)),kind
    dt=[t[0] for t in detail[3]]
    controls.append(dict(kind=kind,priority=texts[2],page=page,nodeId=detail[0],examplesNodeId=example[0],name=dt[1],purpose=dt[2],rule=dt[3],cases=rows))
result=dict(source='https://www.figma.com/slides/ANhVxJPGEgYRcISFmQmgyg',thread='codex://threads/01a1cb4f-8039-7270-afac-c53047a7dc92',version='2026-11-16-final-31-pages',sourceSha256=hashlib.sha256(source.read_bytes()).hexdigest(),note='Derived read-only snapshot. Example clarity is independent of runtime support; these are not parser tests.',controls=controls)
out=Path(__file__).resolve().parents[1]/'example/intent-spec.json';out.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n');print('Extracted 13 controls and 325 bilingual cases')
