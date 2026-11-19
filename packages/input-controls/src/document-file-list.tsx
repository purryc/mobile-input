import {FileText, X} from 'lucide-react';
import {useWidgetEnvironment} from './environment';

export interface DocumentFile {
  id: string;
  name: string;
}

export function DocumentFileList({files, onPreview, onRemove}: {
  files: readonly DocumentFile[];
  onPreview?: (id: string) => void;
  onRemove?: (id: string) => void;
}) {
  const en = useWidgetEnvironment().language.startsWith('en');
  if (!files.length) return null;
  return (
    <ul className="ic-document-file-list" aria-label={en ? 'Selected files' : '已选文件'}>
      {files.map(({id, name}, index) => (
        <li key={id}>
          <FileText size={18} aria-hidden="true"/>
          {onPreview
            ? <button type="button" className="ic-document-name" title={name}
                aria-label={(en ? 'Preview ' : '查看 ') + name} onClick={() => onPreview(id)}>{name}</button>
            : <span className="ic-document-name" title={name}>{name}</span>}
          {onRemove && <button type="button" className="ic-document-remove"
            aria-label={(en ? 'Remove ' : '移除 ') + name}
            aria-description={en ? `Item ${index + 1} of ${files.length}` : `第 ${index + 1} 项，共 ${files.length} 项`}
            onClick={() => onRemove(id)}><X size={16} aria-hidden="true"/></button>}
        </li>
      ))}
    </ul>
  );
}
