import {ArrowUp, ChevronDown, Folder, Mic, Pencil, Plus, ShieldCheck} from 'lucide-react';
import {useLayoutEffect, useRef, type ReactNode} from 'react';
import {assetUrl, InlineChip, useWidgetEnvironment, type WidgetKind} from '../src';

// The explicit training draft used by the Xiaoyi Work demo. Each preview shows
// the part of that desktop composer directly behind its own parameter.
type Phrase = readonly [zh: string, en: string, kind?: WidgetKind, value?: string];
const draft: readonly Phrase[] = [
  ['请为客户成功团队准备一份桌面协作助手的新品上手培训演示。先说明产品价值和适用客户，再介绍创建工作空间、邀请成员和协作整理资料的流程，最后总结常见问题与使用建议。演讲时长设为', 'Prepare a desktop collaboration training presentation for the customer success team. Introduce the product and its customers, then explain how to create a workspace, invite members and organize materials. Allow '],
  ['10', '10', 'duration'], ['分钟，主题色用', ' minutes. Use '],
  ['蓝色', 'blue', 'color', '#356FE4'], ['，背景用', ' as the theme color, '],
  ['白色', 'white', 'color', '#FFFFFF'], ['，文字用', ' for the background, and '],
  ['黑色', 'black', 'color', '#000000'], ['，字体用', ' for text. Use '],
  ['微软雅黑', 'Microsoft YaHei', 'font'], ['。配色方案选择', ' with the '],
  ['沉静专业', 'Calm & professional', 'palette'], ['，页面颜色以我明确指定的值为准。参考文件选择', ' palette, keeping the specified page colors. Refer to '],
  ['产品介绍 · Product brief.md', 'Product brief.md', 'document'], ['，上下文来源选择', ' and the product information in '],
  ['ima 知识库', 'ima Knowledge Base', 'connectors'], ['中的产品资料。我会上传', '. I will upload '],
  ['产品图片', 'product images', 'photo'], ['，并提供纸质培训提纲的', ' and provide a '],
  ['扫描件', 'scanned outline', 'scanner'], ['作为内容参考。第二页的布局以我接下来绘制的', '. Base the second slide on my '],
  ['手绘草图', 'layout sketch', 'sketch'], ['为参考。我会提供一张工作空间页面的', '. I will provide a '],
  ['参考截图', 'workspace screenshot', 'capture'], ['，供你参考视觉样式；再提供一段邀请成员流程的参考录屏，供你参考操作顺序和过渡效果。使用', ' and a recording of the invitation flow for reference. Use the '],
  ['演示设计专家', 'presentation expert', 'expert'], ['，选择', ' and the '],
  ['演示文稿制作', 'presentation skill', 'skills'], ['技能。输出格式选择', '. Deliver in '],
  ['PPT / PDF', 'PPT / PDF', 'formats'], ['。', '.'],
];

export function ComposerStage({kind, children, popover = false}: {kind: WidgetKind; children: ReactNode; popover?: boolean}) {
  const {language, assetBase} = useWidgetEnvironment();
  const scene = useRef<HTMLDivElement>(null);
  const crop = useRef<HTMLDivElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const composer = scene.current;
    const anchor = composer?.querySelector<HTMLElement>(`[data-kind="${kind}"]`);
    const frame = crop.current;
    const widget = panel.current;
    const editor = composer?.querySelector<HTMLElement>('.ic-wb-sentence-composer');
    if (!composer || !anchor || !frame || !widget || !editor) return;

    const align = () => {
      const bounds = editor.getBoundingClientRect();
      const token = anchor.getBoundingClientRect();
      if (token.bottom > bounds.bottom) editor.scrollTop += Math.ceil(token.bottom - bounds.bottom);
      else if (token.top < bounds.top) editor.scrollTop -= Math.ceil(bounds.top - token.top);
      const box = composer.getBoundingClientRect();
      const chip = anchor.getBoundingClientRect();
      const viewport = frame.getBoundingClientRect();
      const surface = widget.getBoundingClientRect();
      composer.style.left = (box.left - chip.left + surface.left - viewport.left) + 'px';
      composer.style.top = (box.top - chip.bottom - 8 + surface.top - viewport.top) + 'px';
    };
    editor.scrollTop = 0;
    align();
    const observer = new ResizeObserver(align);
    for (const element of [composer, anchor, frame, widget]) observer.observe(element);
    let active = true;
    void document.fonts.ready.then(() => { if (active) align(); });
    return () => {active = false; observer.disconnect();};
  }, [kind, language]);

  return <div className={popover ? "lite-popover-stage" : "lite-widget-stage"}>
    <div ref={panel} className="lite-widget-body">{children}</div>
    <div ref={crop} className="lite-preview-prose input-controls-theme" aria-hidden="true" inert>
      <div className="lite-reference-composer ic-demo-composer" ref={scene}>
        <div className="ic-wb-sentence-composer">
          {draft.map(([zh, en, tokenKind, value], index) => {
            const label = language === 'en' ? en : zh;
            if (!tokenKind) return label;
            const artwork = tokenKind === 'expert' ? 'design-expert-design.png'
              : tokenKind === 'skills' ? 'design-skill-ppt.png' : 'design-inline-' + tokenKind + '.svg';
            return <InlineChip key={index} token={{
              id: 'backdrop-' + index, kind: tokenKind, role: '', label, phrase: '', value: value ?? label,
              origin: 'explicit', semanticState: 'default-selected',
              iconSrc: value ? undefined : assetUrl(assetBase, 'assets/xiaoyi-work/' + artwork),
            }} expanded={false} onOpen={() => {}}/>;
          })}
        </div>
        <div className="lite-reference-polish">
          <Pencil size={18}/>{language === 'en' ? 'AI polish' : 'AI润色'}
          <span>{language === 'en' ? 'Organize' : '整理结构'}</span>
          <span>{language === 'en' ? 'Shorten' : '精简表达'}</span>
        </div>
        <div className="lite-reference-tools">
          <Plus/><Mic/><span><ArrowUp/></span>
        </div>
        <div className="lite-reference-options">
          <Folder/>{language === 'en' ? 'Select workspace' : '选择工作空间'}<ChevronDown/>
          <ShieldCheck/>{language === 'en' ? 'Default permissions' : '默认权限'}<ChevronDown/>
        </div>
      </div>
    </div>
  </div>;
}
