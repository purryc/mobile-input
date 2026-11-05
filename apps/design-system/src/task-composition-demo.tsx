import {useState} from 'react';
import {ActionChip} from './components';
import {Sandbox} from './sandbox';
import {PreviewHost} from './specimens';
import {compileTaskPreview,selectTaskComponents,taskSamples,componentLabel,TaskPlanError,type TaskContext,type TaskPlan,type HostProfile,type Candidate} from './task-composition';
import {t,uiText} from './i18n';


const reasons:Record<Candidate['reason'],[string,string]>={ready:['当前样例支持','Supported by this fixture'],'no-target':['目标不可编辑；保留原文，不生成操作','Target is not editable; keep the text without actions'],'missing-value':['缺少有效值：先补充颜色或 1–60 分钟','Missing valid value: provide a color or 1–60 minutes'],'unsupported-material':['此模拟目标不支持这种材料','This fixture target does not support this material'],'not-in-catalog':['参数已识别；此 Catalog 尚未接入文件控件','Parameter recognized; this Catalog has no file control yet'],'unsupported-role':['已识别颜色用途，但当前 Catalog 不支持此角色','Color purpose recognized, but this Catalog does not support that role'],'invalid-value':['值不合法：颜色需六位 HEX，时长需 1–60 分钟','Invalid value: use a six-digit HEX color or 1–60 minutes']};

export function TaskCompositionDemo(){
  const [text,setText]=useState(taskSamples[0][2]),[profile,setProfile]=useState<HostProfile>('agent');
  const [revision,setRevision]=useState(0),[plan,setPlan]=useState<TaskPlan|null>(null),[selected,setSelected]=useState('');
  const [announcement,setAnnouncement]=useState<[string,string]>(['','']),[analysisCount,setAnalysisCount]=useState(0);
  const [messages,setMessages]=useState<unknown[]|null>(null),[error,setError]=useState(''),[previewRevision,setPreviewRevision]=useState(0);
  const context:TaskContext={owner:'fixture:task-composition',revision,capabilityVersion:revision,profile};
  const showError=(e:unknown)=>setError(e instanceof TaskPlanError&&e.code==='length'?t('文字过长，请缩短后重新选择。','Shorten the text and select components again.'):t('任务或目标已变化，请重新选择控件。','The task or target changed. Select components again.'));
  const invalidate=()=>{setAnnouncement(['','']);setRevision(v=>v+1);setPlan(null);setSelected('');setMessages(null);setError('');};
  const analyze=()=>{try{const next=selectTaskComponents(text,context);setPlan(next);setAnalysisCount(v=>v+1);setAnnouncement([`第 ${analysisCount+1} 次选择：${next.candidates.length} 个候选，${next.candidates.filter(c=>c.available).length} 个可预览。`,`Selection ${analysisCount+1}: ${next.candidates.length} candidates; ${next.candidates.filter(c=>c.available).length} can be previewed.`]);setMessages(null);setSelected('');setError('');}catch(e){showError(e);}};
  const open=(candidate:Candidate)=>{if(!plan)return;try{setMessages(compileTaskPreview(plan,context,text,candidate.id));setSelected(candidate.id);setAnnouncement(['已打开：'+componentLabel(candidate.component)[0],'Opened: '+componentLabel(candidate.component)[1]]);setPreviewRevision(v=>v+1);setError('');}catch(e){showError(e);}};
  return <div className="task-composition">
    <div className="call-flow">{[t('任务与目标','Task & target'),t('识别参数','Recognize parameters'),t('筛选能力','Filter capabilities'),t('选择入口','Choose an entry'),'A2UI'].map((step,i)=><span key={step}><b>{i+1}</b>{step}</span>)}</div>
    <p className="quiet">{t('确定性规则演示 · 复用产品的中文固定语法，不调用模型。未匹配的说法保留原文；英文界面不会翻译或扩展任务识别能力。','Deterministic demo · reuses the product’s bounded Chinese grammar, without model calls. Unmatched text is retained. English UI does not translate tasks or extend recognition.')}</p>
    <div className="task-presets" aria-label={t('任务样例','Task samples')}>{taskSamples.map(([zh,en,value])=><button key={en} onClick={()=>{setText(value);invalidate();}}>{t(zh,en)}</button>)}</div>
    <label className="task-field">{t('任务描述','Task description')}<textarea aria-label={t('任务描述','Task description')} maxLength={4000} value={text} onChange={e=>{setText(e.target.value);invalidate();}}/></label>
    <div className="task-controls"><label>{t('模拟目标能力','Simulated target capabilities')}<select aria-label={t('模拟目标能力','Simulated target capabilities')} value={profile} onChange={e=>{setProfile(e.target.value as HostProfile);invalidate();}}><option value="agent">{t('Agent 草稿 · 文字、图片、草图','Agent draft · text, image, sketch')}</option><option value="text-only">{t('仅文字目标','Text-only target')}</option><option value="unavailable">{t('目标不可用','Target unavailable')}</option></select></label><button className="primary" onClick={analyze}>{t('选择控件','Select components')}</button></div>
    <p role="status" aria-live="polite" className="quiet">{t(...announcement)}</p>{error&&<p role="alert">{error}</p>}
    {plan&&<section className="task-results"><h2>{t('推荐入口与选择依据','Suggested entries and reasons')}</h2><p>{t(`识别 ${plan.candidates.length} 个候选，${plan.candidates.filter(c=>c.available).length} 个可预览。`,`Recognized ${plan.candidates.length} candidates; ${plan.candidates.filter(c=>c.available).length} can be previewed.`)}</p>
      {!plan.candidates.length&&<p>{t('当前规则没有匹配项。保留文字输入；生成图片的诉求不会自动打开图片选择。','No matches under the current rules. Keep text input; image-generation requests do not automatically open image selection.')}</p>}
      {plan.candidates.length>0&&<PreviewHost><div className="candidate-list">{plan.candidates.map(c=><div className="candidate-row" key={c.id}>
        <ActionChip disabled={!c.available} aria-pressed={selected===c.id} onClick={()=>open(c)}>{t(...componentLabel(c.component))}{c.parameter?' · '+(c.parameter.kind==='photo'?t('图片','Image'):uiText(c.parameter.role)):''}</ActionChip>
        <p>{c.parameter?<><q>{c.parameter.phrase}</q> · {c.parameter.scope==='全文'?t('全文','Whole task'):c.parameter.scope} · {c.parameter.value||(['photo','sketch','document'].includes(c.parameter.kind)?t('待选择材料','Awaiting material'):t('未赋值','No value'))}</>:t('当前文字满足润色条件','The text meets polish conditions')}</p>
        <small>{t(...reasons[c.reason])}</small>
        {c.actions&&<small>{c.actions.join(' / ')}</small>}
      </div>)}</div></PreviewHost>}
      <p className="quiet">{t('识别不会打开面板。点击一个可用入口，在下方查看组合；每次切换会重置样例。预览调节只改变副本，不回写任务文字或真实草稿。','Recognition opens no panel. Choose an available entry to see the composition below; switching resets the fixture. Preview edits affect a copy, never the task text or a real draft.')}</p>
      <details><summary>{t('查看本地计划（不是 A2UI 协议）','Inspect local plan (not the A2UI protocol)')}</summary><pre>{JSON.stringify(plan,null,2)}</pre></details>
    </section>}
    {messages&&<section className="task-preview"><h2>{t('模板组合与 A2UI 预览','Template composition & A2UI preview')}</h2><p>{t('宿主选择固定单列模板，绑定任务中的有效参数，再用同一 Catalog 校验。当前切片为标题＋一个辅助控件，尚未编排完整手机输入区。','The host selects a fixed column template, binds valid task parameters and validates against the same Catalog. This slice composes a heading and one auxiliary control; it does not orchestrate the complete phone input region.')}</p><Sandbox key={previewRevision} initialMessages={messages} editorText={plan!.text} autoRun/></section>}
    <div className="related-links"><a href="#/guides/generative-ui">{t('生成式 UI 规则','Generative UI rules')} ↗</a><a href="#/a2ui/task-integration">{t('产品接入流程与缺口','Production integration & gaps')} ↗</a></div>
  </div>;
}
