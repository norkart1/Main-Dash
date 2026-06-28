'use client';
import { useEffect, useState } from 'react';
import { FileText, Loader2, CheckCircle, AlertCircle, Lock } from 'lucide-react';

type SaveState = 'idle' | 'saving' | 'done' | 'error';

export default function BotBioEditor({ isOwner }: { isOwner: boolean }) {
  const [bio, setBio] = useState('');
  const [original, setOriginal] = useState('');
  const [status, setStatus] = useState<SaveState>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const maxLen = 190;

  useEffect(() => {
    fetch('/api/bot-bio').then((r) => r.json()).then((d) => { setBio(d.bio || ''); setOriginal(d.bio || ''); }).catch(() => {});
  }, []);

  async function handleSave() {
    if (!isOwner) return;
    setStatus('saving'); setErrorMsg('');
    try {
      const res = await fetch('/api/bot-bio', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ bio }) });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Save failed');
      setOriginal(bio); setStatus('done');
      setTimeout(() => setStatus('idle'), 4000);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Save failed');
      setStatus('error');
      setTimeout(() => setStatus('idle'), 5000);
    }
  }

  const isDirty = bio !== original;
  const overLimit = bio.length > maxLen;

  return (
    <div className="bg-[#2c2f33] rounded-xl border border-[#36393f] overflow-hidden">
      <div className="px-5 py-4 border-b border-[#36393f] flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <FileText size={15} className="text-[#5865f2]" />
            <h2 className="text-white font-semibold">Bot Bio</h2>
          </div>
          <p className="text-[#72767d] text-xs mt-0.5">Update the bio shown on the bot&apos;s Discord profile</p>
        </div>
        {!isOwner && (
          <span className="flex items-center gap-1 text-[#faa61a] text-xs font-medium bg-[#faa61a]/10 px-2.5 py-1 rounded-full">
            <Lock size={11} /> Owner only
          </span>
        )}
      </div>

      <div className="p-5 space-y-3">
        <div className="relative">
          <textarea
            value={bio}
            onChange={(e) => isOwner && setBio(e.target.value)}
            rows={4}
            maxLength={maxLen + 10}
            placeholder={isOwner ? 'Enter a bio for the bot…' : 'Only the bot owner can edit this'}
            readOnly={!isOwner}
            className={`w-full bg-[#1e2124] border border-[#36393f] rounded-lg px-3 py-2.5 text-white text-sm placeholder-[#4f545c] resize-none focus:outline-none focus:border-[#5865f2] transition-colors ${!isOwner ? 'opacity-60 cursor-not-allowed' : ''}`}
          />
          <span className={`absolute bottom-3 right-3 text-[10px] font-mono ${overLimit ? 'text-[#ed4245]' : bio.length > maxLen * 0.8 ? 'text-[#faa61a]' : 'text-[#4f545c]'}`}>
            {bio.length}/{maxLen}
          </span>
        </div>

        {status !== 'idle' && (
          <div className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium
            ${status === 'done' ? 'bg-green-600/10 text-green-400' : ''}
            ${status === 'saving' ? 'bg-[#5865f2]/10 text-[#5865f2]' : ''}
            ${status === 'error' ? 'bg-[#ed4245]/10 text-[#ed4245]' : ''}`}>
            {status === 'saving' && <Loader2 size={13} className="animate-spin" />}
            {status === 'done' && <CheckCircle size={13} />}
            {status === 'error' && <AlertCircle size={13} />}
            {status === 'saving' && 'Saving bio…'}
            {status === 'done' && 'Bio updated! Changes apply in ~10s'}
            {status === 'error' && (errorMsg || 'Save failed')}
          </div>
        )}

        {isOwner && (
          <div className="flex justify-end">
            <button
              onClick={handleSave}
              disabled={!isDirty || overLimit || status === 'saving'}
              className="px-4 py-2 bg-[#5865f2] hover:bg-[#4752c4] disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
            >
              {status === 'saving' ? 'Saving…' : 'Save Bio'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
