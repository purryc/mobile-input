import samplePdf from './fixtures/product-brief.pdf?raw';
import type { CaptureMaterial, WidgetKind } from '../src/types';

export const materialKinds: readonly WidgetKind[] = ['document', 'photo', 'scanner', 'sketch', 'capture'];

const sampleArtwork = {
  photo: '<rect x="58" y="33" width="204" height="130" rx="12" fill="#cdd6f9"/><path d="M74 144l54-55 34 29 28-31 56 57Z" fill="#686dc1"/><circle cx="203" cy="68" r="13" fill="#fff"/>',
  scanner: '<rect x="96" y="22" width="128" height="150" rx="4" fill="#fffdf4"/><path d="M118 55h84M118 75h62M118 113h84M118 133h74" stroke="#696969" stroke-width="4"/>',
  sketch: '<path d="M43 40l232-3 2 116-232 4zM121 41l-2 113M119 76h155" fill="none" stroke="#33456c" stroke-width="3" stroke-linejoin="round"/>',
  capture: '<rect x="23" y="28" width="274" height="136" rx="7" fill="#fff"/><path d="M28 57h265M96 57v101" stroke="#cbd1e6" stroke-width="2"/><path d="M42 43h31M114 77h82M114 101h148M114 126h135" stroke="#8895c6" stroke-width="5" stroke-linecap="round"/>',
};

function imageSample(kind: keyof typeof sampleArtwork, name: string) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="192" viewBox="0 0 320 192"><rect width="320" height="192" fill="#edf0f8"/>${sampleArtwork[kind]}</svg>`;
  return new File([svg], name, { type: 'image/svg+xml' });
}

export function boundSample(kind: WidgetKind): { files?: File[]; sketch?: File; captures?: CaptureMaterial[] } {
  switch (kind) {
    case 'document':
      return {files:[new File([samplePdf], '产品资料.pdf', {type:'application/pdf'})]};
    case 'photo':
      return { files: [imageSample(kind, '产品图片.svg')] };
    case 'sketch':
      return { sketch: imageSample(kind, '布局草图.svg') };
    case 'scanner':
    case 'capture': {
      const blob = imageSample(kind, kind === 'scanner' ? '扫描示例.svg' : '参考截图.svg');
      return { captures: [{
        id: 'bound-sample', kind: kind === 'scanner' ? 'scanner' : 'screenshot',
        name: blob.name, blob, size: blob.size, confirmed: true,
      }] };
    }
    default:
      return {};
  }
}
