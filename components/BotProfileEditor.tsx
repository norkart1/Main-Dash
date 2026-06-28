'use client';
import { useRef, useState } from 'react';
import { Upload, CheckCircle, Loader2, AlertCircle, User, Image as ImageIcon, X, Lock } from 'lucide-react';

type UploadState = 'idle' | 'uploading' | 'done' | 'error';

interface ImageField {
  label: string;
  key: 'avatar' | 'banner';
  shape: 'circle' | 'rect';
  note?: string;
  maxW: number;
  maxH: number;
}

const FIELDS: ImageField[] = [
  { label: 'Bot Avatar', key: 'avatar', shape: 'circle', maxW: 256, maxH: 256 },
  { label: 'Bot Banner', key: 'banner', shape: 'rect', note: 'Requires a verified / partnered bot on Discord', maxW: 960, maxH: 384 },
];

function resizeImage(file: File, maxW: number, maxH: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new window.Image();
      img.onload = () => {
        const scale = Math.min(1, maxW / img.width, maxH / img.height);
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d')!;
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0, w, h);
        let quality = 0.88;
        let dataUrl = canvas.toDataURL('image/jpeg', quality);
        while (dataUrl.length > 800_000 && quality > 0.3) {
          quality = Math.round((quality - 0.1) * 10) / 10;
          dataUrl = canvas.toDataURL('image/jpeg', quality);
        }
        if (dataUrl.length > 900_000) { reject(new Error('Image is too large even after compression.')); return; }
        resolve(dataUrl);
      };
      img.onerror = reject;
      img.src = e.target!.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function ImageUploader({ field, isOwner }: { field: ImageField; isOwner: boolean }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [status, setStatus] = useState<UploadState>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [dragging, setDragging] = useState(false);
  const isCircle = field.shape === 'circle';

  async function handleFile(file: File) {
    if (!isOwner) return;
    if (!file.type.startsWith('image/')) { setErrorMsg('Please select an image file.'); setStatus('error'); return; }
    setStatus('uploading'); setErrorMsg('');
    try {
      const dataUrl = await resizeImage(file, field.maxW, field.maxH);
      setPreview(dataUrl);
      const res = await fetch('/api/bot-profile', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: field.key, dataUrl }) });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Upload failed');
      setStatus('done');
      setTimeout(() => setStatus('idle'), 4000);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Upload failed');
      setStatus('error');
      setTimeout(() => setStatus('idle'), 5000);
    }
  }

  function onDrop(e: React.DragEvent) {
    if (!isOwner) return;
    e.preventDefault(); setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  return (
    <div className="bg-[#1e2124] rounded-xl border border-[#36393f] p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isCircle ? <User size={14} className="text-[#5865f2]" /> : <ImageIcon size={14} className="text-[#eb459e]" />}
          <span className="text-white text-sm font-semibold">{field.label}</span>
        </div>
        <div className="flex items-center gap-2">
          {!isOwner && <span className="flex items-center gap-1 text-[#faa61a] text-[10px] font-medium bg-[#faa61a]/10 px-2 py-0.5 rounded-full"><Lock size={9} /> Owner only</span>}
          {field.note && <span className="text-[#faa61a] text-[10px] font-medium bg-[#faa61a]/10 px-2 py-0.5 rounded-full">⚠ Verified bots only</span>}
        </div>
      </div>

      <div
        className={`relative flex flex-col items-center justify-center border-2 border-dashed rounded-xl transition-all
          ${!isOwner ? 'border-[#36393f] opacity-50 cursor-not-allowed' : dragging ? 'border-[#5865f2] bg-[#5865f2]/10 cursor-pointer' : 'border-[#36393f] hover:border-[#5865f2]/50 hover:bg-[#5865f2]/5 cursor-pointer'}
          ${isCircle ? 'h-36' : 'h-28'}`}
        onClick={() => isOwner && inputRef.current?.click()}
        onDragOver={(e) => { if (isOwner) { e.preventDefault(); setDragging(true); } }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
      >
        {preview ? (
          <>
            {isCircle
              ? <img src={preview} alt="preview" className="w-20 h-20 rounded-full object-cover ring-2 ring-[#5865f2]" />
              : <img src={preview} alt="preview" className="w-full h-full object-cover rounded-xl" />}
            {isOwner && (
              <button onClick={(e) => { e.stopPropagation(); setPreview(null); setStatus('idle'); }} className="absolute top-2 right-2 w-6 h-6 bg-[#ed4245] rounded-full flex items-center justify-center hover:bg-[#c03537] transition-colors">
                <X size={11} className="text-white" />
              </button>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center gap-2 text-center px-4">
            {isOwner ? <Upload size={22} className="text-[#4f545c]" /> : <Lock size={22} className="text-[#4f545c]" />}
            <p className="text-[#72767d] text-xs">
              {isOwner ? (<>Drag & drop or <span className="text-[#5865f2] font-medium">browse</span></>) : 'Only the bot owner can upload'}
            </p>
            {isOwner && <p className="text-[#4f545c] text-[10px]">PNG, JPG, GIF — max {field.maxW}×{field.maxH}px</p>}
          </div>
        )}
        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
      </div>

      {status !== 'idle' && (
        <div className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium
          ${status === 'done' ? 'bg-green-600/10 text-green-400' : ''}
          ${status === 'uploading' ? 'bg-[#5865f2]/10 text-[#5865f2]' : ''}
          ${status === 'error' ? 'bg-[#ed4245]/10 text-[#ed4245]' : ''}`}>
          {status === 'uploading' && <Loader2 size={13} className="animate-spin" />}
          {status === 'done' && <CheckCircle size={13} />}
          {status === 'error' && <AlertCircle size={13} />}
          {status === 'uploading' && 'Uploading to bot…'}
          {status === 'done' && 'Bot profile updated! Changes apply in ~10s'}
          {status === 'error' && (errorMsg || 'Upload failed')}
        </div>
      )}
    </div>
  );
}

export default function BotProfileEditor({ isOwner }: { isOwner: boolean }) {
  return (
    <div className="bg-[#2c2f33] rounded-xl border border-[#36393f] overflow-hidden">
      <div className="px-5 py-4 border-b border-[#36393f]">
        <h2 className="text-white font-semibold">Bot Profile</h2>
        <p className="text-[#72767d] text-xs mt-0.5">Change the avatar and banner shown on the bot&apos;s Discord profile</p>
      </div>
      <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
        {FIELDS.map((field) => <ImageUploader key={field.key} field={field} isOwner={isOwner} />)}
      </div>
      <div className="px-5 pb-4">
        <p className="text-[#4f545c] text-xs">Images are resized automatically. Avatar changes apply to all servers instantly.</p>
      </div>
    </div>
  );
}
