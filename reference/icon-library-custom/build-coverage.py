"""Design-only mapping. Keeps source rows intact; lexical candidates are not reviewed commands."""
import json,csv,re,collections
from pathlib import Path
R=Path(__file__).resolve().parents[2]
D=Path(__file__).resolve().parent
icons=json.loads((D/'icons.json').read_text())
lib=json.loads((R/'reference/icon-library.json').read_text())
existing={x['name'] for x in lib['icons'] if x['family']=='Lucide'}
rows=json.loads((R/'survey/keycombiner-shortcuts/source/shortcuts.json').read_text())
norm={x['record_id']:x for x in json.loads((R/'survey/keycombiner-shortcuts/source/normalized-actions.json').read_text())}
def csvrows(name):
 return list(csv.DictReader((R/'survey/comprehensive-panel-survey/source'/name).open(encoding='utf-8-sig')))
pro=csvrows('professional-actions.csv')
# Hand-reviewed semantic mapping of all 73 professional research groups.
manual=[
'@top-view @ceiling-view','box @walkthrough','move-up move-down','move-left move-right','move-up move-down','rotate-ccw','zoom-in zoom-out','group ungroup','crosshair','@precision-move','@precision-rotate','@precision-scale','copy-plus','rotate-ccw','keyboard',
'file-plus','folder-open','save','save-pen','printer','zoom-in zoom-out','rotate-ccw-square rotate-cw-square','@layer-mask','align-center-horizontal','crop','brush','sun contrast','blend','cloud-upload','share-2',
'minus','circle','rectangle-horizontal','@polyline','@arc','move','rotate-cw','scaling','@trim @extend','@offset','@mirror-axis','@rectangular-array @polar-array','copy-plus','@hatch','ruler','ruler-dimension-line','sliders-horizontal','@object-snap','@orthographic','grid-3x3','@grid-snap','@polar-tracking','@object-tracking',
'star','list','layout-grid','factory','layers','map-pinned','file-search','file-chart-column','list-filter','minimize-2 maximize-2','chevron-left chevron-right','chart-line chart-candlestick','arrow-down-to-line arrow-up-from-line','circle-x','chevron-left chevron-right','zoom-in zoom-out','arrow-left arrow-right','calendar-clock','chart-line','chart-no-axes-combined']
assert len(manual)==len(pro),(len(manual),len(pro))
customids={x['id'] for x in icons}
def key(s):
 return ('Input Agent/'+s[1:]) if s.startswith('@') else 'Lucide/'+s
professional=[]
for i,(row,names) in enumerate(zip(pro,manual)):
 for s in names.split():
  assert (s[1:] in customids) if s.startswith('@') else (s in existing),s
 professional.append({'source':'survey/comprehensive-panel-survey/source/professional-actions.csv','row':i+2,'app':row['应用'],'mode':row['模式'],'action':row['动作组'],'icons':[key(s) for s in names.split()],'status':'semantic mapping reviewed; action labels remain necessary','sourceUrl':row['来源URL']})
# Practical, documented lexicon for existing generic actions.
specs=[
('undo-2',r'\bundo\b|撤销'),('redo-2',r'\bredo\b|重做'),('copy',r'\bcopy\b|复制'),('scissors',r'\bcut\b|剪切'),('clipboard-paste',r'\bpaste\b|粘贴'),('trash',r'\bdelete\b|删除'),
('square-dashed',r'select all|全选'),('square-dashed-mouse-pointer',r'select|selection|选择|选区'),('search',r'\bfind\b|\bsearch\b|查找|搜索'),('replace',r'\breplace\b|替换'),('command',r'command palette|命令面板'),
('file-plus',r'\bnew (file|document)\b|新建文档'),('folder-open',r'\bopen (file|folder|document)\b|打开文档'),('save',r'\bsave\b|保存'),('printer',r'\bprint\b|打印'),('download',r'\bexport\b|导出'),('upload',r'\bimport\b|导入'),
('bold',r'\bbold\b|加粗'),('italic',r'\bitalic\b|斜体'),('underline',r'\bunderline\b|下划线'),('strikethrough',r'strike|删除线'),('superscript',r'superscript|上标'),('subscript',r'subscript|下标'),('link',r'hyperlink|insert link|链接'),
('text-align-center',r'align center|center align|居中'),('text-align-start',r'align left|left align|左对齐'),('text-align-end',r'align right|right align|右对齐'),('text-align-justify',r'justify|两端对齐'),
('type',r'font|type tool|text tool|字体|字号'),('list-indent-increase',r'increase indent|增.*缩进'),('list-indent-decrease',r'decrease indent|减.*缩进'),('list-ordered',r'numbered list|编号'),('list',r'bullet|项目符号'),
('zoom-in',r'zoom in|放大'),('zoom-out',r'zoom out|缩小'),('maximize',r'full.?screen|全屏'),('focus',r'fit.*(screen|view|selection)|适应|适配'),
('hand',r'\bpan\b|hand tool|平移'),('rotate-cw',r'rotat|旋转'),('move',r'\bmove\b|移动'),('scaling',r'\bscale\b|\bresize\b|缩放'),('group',r'\bgroup\b|组合'),('ungroup',r'ungroup|解组'),('blend',r'opacity|blend|不透明'),
('bring-to-front',r'bring.*front|置顶'),('send-to-back',r'send.*back|置底'),('layers',r'\blayer|图层'),('palette',r'\bcolou?r\b|颜色'),('brush',r'\bbrush|画笔'),('pencil',r'pencil|铅笔'),('eraser',r'eraser|擦除|橡皮'),('pipette',r'eyedropper|color sampler|取色'),('crop',r'crop|裁剪'),('lasso',r'lasso|套索'),('wand-sparkles',r'magic wand|魔棒'),('pen-tool',r'pen tool|钢笔'),
('play',r'\bplay\b|播放'),('pause',r'\bpause\b|暂停'),('square',r'\bstop\b|停止'),('skip-forward',r'next (track|song)|下一首'),('skip-back',r'previous (track|song)|上一首'),('volume-2',r'volume|音量'),('volume-x',r'mute|静音'),('fast-forward',r'fast forward|快进'),('rewind',r'rewind|快退'),
('plus',r'\bincrease\b|增大|增加'),('minus',r'\bdecrease\b|减小|减少'),('table',r'cell|row|column|单元格|表格'),('sigma',r'formula|公式'),('funnel',r'filter|筛选'),('arrow-up-down',r'\bsort\b|排序'),
('app-window',r'window|窗口'),('panels-top-left',r'\btab\b|标签'),('chevron-left',r'\bprevious\b|上一'),('chevron-right',r'\bnext\b|下一'),('arrow-left',r'\bback\b|后退'),('arrow-right',r'\bforward\b|前进'),
('bug',r'debug|调试'),('code',r'code|代码'),('git-branch',r'branch|分支'),('terminal',r'terminal|终端'),('settings',r'preferences|settings|设置'),('mail',r'\bmail\b|邮件'),('reply',r'\breply\b|回复'),('send',r'\bsend\b|发送'),('calendar',r'calendar|日期|日程'),('bookmark',r'bookmark|书签'),('star',r'favorite|收藏'),('check',r'confirm|accept|确认'),('x',r'cancel|取消'),('list-checks',r'task|任务'),('keyboard',r'input method|输入法'),
]
# Avoid guessed names. This fails loudly when the pinned upstream renamed an icon.
for name,_ in specs: assert name in existing,name
candidates=[]
for row in rows:
 rid=row['record_id']; label=row['action_label']; kind=norm[rid]['record_kind']
 if kind=='syntax_reference': candidates.append({'record_id':rid,'kind':'syntax_reference','icons':[],'status':'literal text; not an action icon'});continue
 custom=[x['id'] for x in icons if re.search(x['pattern'],label,re.I)]
 generic=[name for name,pattern in specs if re.search(pattern,label,re.I)]
 exact=[name for name in existing if label.lower().strip(' .…')==name.replace('-',' ')]
 choices=list(dict.fromkeys(['Input Agent/'+x for x in custom]+['Lucide/'+x for x in exact+generic]))
 candidates.append({'record_id':rid,'kind':kind,'icons':choices,'status':'lexical candidate; keep source label; not individually reviewed' if choices else 'source-label fallback; no forced icon'})
for icon in icons:
 icon['researchRecords']=[r['record_id'] for r in rows if re.search(icon['pattern'],r['action_label'],re.I)]
 icon['professionalRows']=[x['row'] for x in professional if 'Input Agent/'+icon['id'] in x['icons']]
 icon['evidence']='existing research action / original visual metaphor' if icon['researchRecords'] or icon['professionalRows'] else 'user design requirement / original visual metaphor'
 icon['sourceRefs']=['survey/keycombiner-shortcuts/source/shortcuts.json'] if icon['researchRecords'] else []
 if icon['professionalRows']: icon['sourceRefs'].append('survey/comprehensive-panel-survey/source/professional-actions.csv')
 if not icon['sourceRefs']:icon['sourceRefs']=['docs/icon-library.md#专业图标补齐--2026-10-22','conversation: drawing, capture, agent and precision-control requirements']
(D/'icons.json').write_text(json.dumps(icons,ensure_ascii=False,indent=2)+'\n')
stats=dict(collections.Counter(x['status'] for x in candidates))
out={'date':'2026-10-22','scope':'design-only','sourceCounts':{'keycombinerCollections':len({x['collection_slug'] for x in rows}),'keycombinerRecords':len(rows),'professionalGroups':len(pro),'taskSuites':20},'originalIcons':80,'existingLibraryIcons':2000,'sourceLabelsRequired':True,'stats':stats,'professionalMapping':professional,'keycombinerCandidates':candidates,'customArtwork':[{k:v for k,v in i.items() if k!='svg'} for i in icons]}
(R/'reference/icon-library-coverage.json').write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'stats':stats,'professional':len(pro),'customWithResearch':sum(bool(i['researchRecords'] or i['professionalRows']) for i in icons),'customTotal':len(icons)},ensure_ascii=False))
