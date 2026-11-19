import type {ChoiceDefinition} from './types';

const chinese = '春日来信，见字如面。';
const latin = 'Spring notes, April 2026';

export const windowsFonts = [
  {id: 'Microsoft YaHei', zh: '微软雅黑', sample: chinese},
  {id: 'SimSun', zh: '宋体', sample: chinese},
  {id: 'SimHei', zh: '黑体', sample: chinese},
  {id: 'KaiTi', zh: '楷体', sample: chinese},
  {id: 'FangSong', zh: '仿宋', sample: chinese},
  {id: 'Arial', zh: 'Arial', sample: latin},
  {id: 'Calibri', zh: 'Calibri', sample: latin},
  {id: 'Times New Roman', zh: 'Times New Roman', sample: latin},
  {id: 'Georgia', zh: 'Georgia', sample: latin},
  {id: 'Consolas', zh: 'Consolas', sample: latin},
] as const;

export const windowsFontDefinition: ChoiceDefinition = {
  kind: 'font', zh: '字体', en: 'Font',
  options: windowsFonts.map(({id, zh}) => ({id, zh, en: id})),
};

export function windowsFontSpecimen(id: string) {
  return windowsFonts.find(font => font.id === id);
}
