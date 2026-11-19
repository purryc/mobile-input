import {useEffect, useState, type MouseEventHandler, type ReactNode} from 'react';
import {FileText, Play, X} from 'lucide-react';
import {useWidgetText} from './environment';

export interface AttachmentCardProps {file: File; onRemove?: () => void; onPreview?: () => void;}

/** Shared shell for media thumbnails and host-owned document references. */
export function MaterialCardView({name, thumbnail, onRemove, onPreview, removeDescription, removeLabel}: {
  name: string;
  thumbnail?: ReactNode;
  onRemove?: MouseEventHandler<HTMLButtonElement>;
  onPreview?: () => void;
  removeDescription?: string;
  removeLabel?: string;
}) {
  const t = useWidgetText();
  return <div className="ic-demo-material">
    <button type="button" title={name} aria-label={t('查看 ') + name} onClick={onPreview} disabled={!onPreview}>
      {thumbnail ?? <FileText size={24} aria-hidden="true"/>}
      <span>{name}</span>
    </button>
    {onRemove && <button type="button" className="ic-demo-remove" aria-label={removeLabel ?? t('移除 ') + name}
      aria-description={removeDescription} onClick={onRemove}><X size={14} aria-hidden="true"/></button>}
  </div>;
}

export function AttachmentCard({file, onRemove, onPreview}: AttachmentCardProps) {
  const [url, setUrl] = useState('');
  useEffect(() => {
    const next = URL.createObjectURL(file);
    setUrl(next);
    return () => URL.revokeObjectURL(next);
  }, [file]);
  let thumbnail: ReactNode;
  if (file.type.startsWith('image/')) {
    thumbnail = <div className="ic-demo-material-thumb"><img src={url || undefined} alt=""/></div>;
  } else if (file.type.startsWith('video/')) {
    thumbnail = <div className="ic-demo-material-thumb"><video src={url || undefined} muted preload="metadata"/><Play size={22}/></div>;
  }
  return <MaterialCardView name={file.name} thumbnail={thumbnail} onRemove={onRemove} onPreview={onPreview}/>;
}
