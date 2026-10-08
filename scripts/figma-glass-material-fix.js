const page=await figma.getNodeByIdAsync('0:1');await figma.setCurrentPageAsync(page);let count=0;
for(const n of page.findAll(n=>'fills' in n)){if(!Array.isArray(n.fills)||!n.fills.length)continue;
let fills=n.fills.map(p=>({...p})),change=false;
if(n.name==='Ambient / theme light'){fills=fills.map(p=>({...p,opacity:.1}));change=true;}
else if(n.type==='RECTANGLE'&&n.height===5){fills=fills.map(p=>({...p,opacity:.22}));change=true;}
else if(n.type==='FRAME'&&n.effectStyleId){fills=fills.map(p=>({...p,opacity:n.name.startsWith('Game / ')?(n.name.endsWith('A')||n.name.endsWith('B')?.72:.7):.52}));change=true;}
else if(n.type==='INSTANCE'&&fills.length===2){fills=fills.map((p,i)=>({...p,opacity:i===0?.12:.42}));change=true;}
else if(n.type==='ELLIPSE'&&n.width===180){fills=fills.map(p=>({...p,opacity:.22}));change=true;}
else if(n.type==='RECTANGLE'&&n.width===60&&n.height===60){fills=fills.map((p,i)=>({...p,opacity:i===0?.13:.4}));change=true;}
if(change){n.fills=fills.map(p=>{delete p.boundVariables;return p});count++;}
}
return {mutatedCount:count};
