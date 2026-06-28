'use client';
import { useState, useEffect } from 'react';
import { Gamepad2, Eye, Music, Trophy, CheckCircle, Loader2, RefreshCw, Lock } from 'lucide-react';

const ACTIVITY_TYPES = [
  { value: 'PLAYING', label: 'Playing', icon: Gamepad2, color: '#57f287', example: 'Minecraft' },
  { value: 'WATCHING', label: 'Watching', icon: Eye, color: '#5865f2', example: 'your server 👀' },
  { value: 'LISTENING', label: 'Listening to', icon: Music, color: '#eb459e', example: 'lo-fi beats' },
  { value: 'COMPETING', label: 'Competing in', icon: Trophy, color: '#faa61a', example: 'a tournament' },
];

export default function BotStatusEditor({ isOwner }: { isOwner: boolean }) {
  const [type, setType] = useState('WATCHING');
  const [text, setText] = useState('your server 👀');
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/bot-status').then((r) => r.json()).then((d) => {
      if (d.type) setType(d.type);
      if (d.text) setText(d.text);
    }).finally(() => setLoading(false));
  }, []);

  async function handleSave() {
    if (!isOwner) return;
    setStatus('saving');
    try {
      const res = await fetch('/api/bot-status', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type, text }) });
      if (res.ok) { setStatus('saved'); setTimeout(() => setStatus('idle'), 3000); }
      else { setStatus('error'); setTimeout(() => setStatus('idle'), 3000); }
    } catch {
      setStatus('error'); setTimeout(() => setStatus('idle'), 3000);
    }
  }

  const selectedType = ACTIVITY_TYPES.find((t) => t.value === type)!;

  return (
    <div className="bg-[#2c2f33] rounded-xl border border-[#36393f] overflow-hidden">
      <div className="px-5 py-4 border-b border-[#36393f] flex items-center justify-between">
        <div>
          <h2 className="text-white font-semibold">Bot Activity Status</h2>
          <p className="text-[#72767d] text-xs mt-0.5">What the bot shows on its Discord profile</p>
        </div>
        <div className="flex items-center gap-2">
          {!isOwner && (
            <span className="flex items-center gap-1 text-[#faa61a] text-xs font-medium bg-[#faa61a]/10 px-2.5 py-1 rounded-full">
              <Lock size={11} /> Owner only
            </span>
          )}
          <div className="flex items-center gap-2 bg-[#1e2124] rounded-full px-3 py-1.5">
            <span className="w-2 h-2 rounded-full bg-green-400 flex-shrink-0" />
            <span className="text-[#72767d] text-xs">Live</span>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 size={20} className="text-[#5865f2] animate-spin" />
        </div>
      ) : (
        <div className="p-5 space-y-5">
          <div className="bg-[#1e2124] rounded-xl p-4 border border-[#36393f]">
            <p className="text-[#72767d] text-xs font-semibold uppercase tracking-wide mb-2">Preview</p>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-[#5865f2] flex items-center justify-center flex-shrink-0 text-white text-sm font-bold">B</div>
              <div>
                <p className="text-white text-sm font-semibold">Your Bot</p>
                <div className="mt-1 bg-[#2c2f33] rounded-lg px-3 py-2 inline-block">
                  <p className="text-[#72767d] text-xs">{selectedType.label}</p>
                  <p className="text-[#dcddde] text-sm font-medium">{text || selectedType.example}</p>
                </div>
              </div>
            </div>
          </div>

          <div className={!isOwner ? 'opacity-60 pointer-events-none' : ''}>
            <label className="block text-[#b9bbbe] text-xs font-semibold uppercase tracking-wide mb-2">Activity Type</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {ACTIVITY_TYPES.map(({ value, label, icon: Icon, color }) => (
                <button key={value} onClick={() => isOwner && setType(value)}
                  className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-lg border transition-all text-xs font-medium ${type === value ? 'border-[#5865f2] bg-[#5865f2]/10 text-white' : 'border-[#36393f] bg-[#1e2124] text-[#72767d] hover:border-[#4f545c] hover:text-[#b9bbbe]'}`}>
                  <Icon size={16} style={{ color: type === value ? color : undefined }} />
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className={!isOwner ? 'opacity-60' : ''}>
            <label className="block text-[#b9bbbe] text-xs font-semibold uppercase tracking-wide mb-1.5">Status Text</label>
            <input
              type="text" value={text}
              onChange={(e) => isOwner && setText(e.target.value)}
              readOnly={!isOwner}
              maxLength={128}
              placeholder={isOwner ? selectedType.example : 'Only the bot owner can edit this'}
              className={`w-full bg-[#1e2124] border border-[#36393f] rounded-lg px-3 py-2.5 text-white text-sm placeholder-[#4f545c] focus:outline-none focus:border-[#5865f2] transition-colors ${!isOwner ? 'cursor-not-allowed' : ''}`}
            />
            <p className="text-[#4f545c] text-xs mt-1 text-right">{text.length}/128</p>
          </div>

          {isOwner && (
            <button onClick={handleSave} disabled={status === 'saving' || !text.trim()}
              className={`w-full py-2.5 rounded-lg font-semibold text-sm transition-all flex items-center justify-center gap-2 ${status === 'saved' ? 'bg-green-600 text-white' : status === 'error' ? 'bg-[#ed4245] text-white' : 'bg-[#5865f2] hover:bg-[#4752c4] disabled:opacity-50 disabled:cursor-not-allowed text-white'}`}>
              {status === 'saving' && <Loader2 size={15} className="animate-spin" />}
              {status === 'saved' && <CheckCircle size={15} />}
              {status === 'error' && <RefreshCw size={15} />}
              {status === 'saving' ? 'Updating bot...' : status === 'saved' ? 'Updated! Bot status changed' : status === 'error' ? 'Failed — try again' : 'Update Bot Status'}
            </button>
          )}

          <p className="text-[#4f545c] text-xs text-center">Changes apply to the bot within ~10 seconds</p>
        </div>
      )}
    </div>
  );
}
