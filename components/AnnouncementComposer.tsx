'use client';
import { useEffect, useRef, useState } from 'react';
import {
  Megaphone, Send, Loader2, CheckCircle, AlertCircle,
  Upload, X, Image as ImageIcon, ChevronDown, Hash, Link,
} from 'lucide-react';

interface Guild {
  id: string;
  name: string;
  icon: string | null;
  memberCount: number;
}

interface Channel {
  id: string;
  name: string;
  type: number;
}

interface SentAnnouncement {
  id: string;
  guildName: string;
  header: string;
  channelName?: string;
  status: string;
}

type SendState = 'idle' | 'sending' | 'done' | 'error';
type ImageMode = 'upload' | 'url';

function resizeImage(file: File, maxW = 1200, maxH = 630): Promise<string> {
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
        canvas.getContext('2d')!.drawImage(img, 0, 0, w, h);

        let quality = 0.88;
        let dataUrl = canvas.toDataURL('image/jpeg', quality);
        while (dataUrl.length > 800_000 && quality > 0.3) {
          quality -= 0.1;
          dataUrl = canvas.toDataURL('image/jpeg', quality);
        }
        if (dataUrl.length > 900_000) {
          reject(new Error('Image is too large. Please use a URL instead.'));
          return;
        }
        resolve(dataUrl);
      };
      img.onerror = reject;
      img.src = e.target!.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function Dropdown<T extends { id: string; name: string }>({
  items,
  selected,
  onSelect,
  placeholder,
  renderItem,
  renderSelected,
}: {
  items: T[];
  selected: T | null;
  onSelect: (item: T) => void;
  placeholder: string;
  renderItem: (item: T) => React.ReactNode;
  renderSelected?: (item: T) => React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between bg-[#1e2124] border border-[#36393f] rounded-lg px-3 py-2.5 text-sm text-white hover:border-[#5865f2]/50 transition-colors"
      >
        <span className={selected ? 'text-white' : 'text-[#4f545c]'}>
          {selected ? (renderSelected ? renderSelected(selected) : selected.name) : placeholder}
        </span>
        <ChevronDown size={14} className={`text-[#72767d] transition-transform flex-shrink-0 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && items.length > 0 && (
        <div className="absolute z-30 w-full mt-1 bg-[#1e2124] border border-[#36393f] rounded-lg overflow-y-auto max-h-52 shadow-xl">
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => { onSelect(item); setOpen(false); }}
              className={`w-full text-left px-3 py-2.5 text-sm hover:bg-[#5865f2]/10 transition-colors ${
                selected?.id === item.id ? 'text-white bg-[#5865f2]/10' : 'text-[#b9bbbe]'
              }`}
            >
              {renderItem(item)}
            </button>
          ))}
        </div>
      )}
      {open && items.length === 0 && (
        <div className="absolute z-30 w-full mt-1 bg-[#1e2124] border border-[#36393f] rounded-lg px-3 py-3 text-[#72767d] text-xs shadow-xl">
          No channels found — restart the bot to sync.
        </div>
      )}
    </div>
  );
}

export default function AnnouncementComposer() {
  const [guilds, setGuilds] = useState<Guild[]>([]);
  const [selectedGuild, setSelectedGuild] = useState<Guild | null>(null);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const [channelsLoading, setChannelsLoading] = useState(false);

  const [header, setHeader] = useState('');
  const [content, setContent] = useState('');
  const [sender, setSender] = useState('');

  const [imageMode, setImageMode] = useState<ImageMode>('upload');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageData, setImageData] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState('');
  const [imageDragging, setImageDragging] = useState(false);
  const [imageErr, setImageErr] = useState('');

  const [sendState, setSendState] = useState<SendState>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [history, setHistory] = useState<SentAnnouncement[]>([]);
  const imgInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch('/api/guilds')
      .then((r) => r.json())
      .then((d) => {
        if (d.guilds?.length) {
          setGuilds(d.guilds);
          setSelectedGuild(d.guilds[0]);
        }
      })
      .catch(() => {});

    fetch('/api/announcement')
      .then((r) => r.json())
      .then((d) => setHistory(d.announcements || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedGuild) return;
    setSelectedChannel(null);
    setChannels([]);
    setChannelsLoading(true);
    fetch(`/api/channels?guildId=${selectedGuild.id}`)
      .then((r) => r.json())
      .then((d) => {
        setChannels(d.channels || []);
        if (d.channels?.length) setSelectedChannel(d.channels[0]);
      })
      .catch(() => {})
      .finally(() => setChannelsLoading(false));
  }, [selectedGuild]);

  async function handleFile(file: File) {
    if (!file.type.startsWith('image/')) return;
    setImageErr('');
    try {
      const dataUrl = await resizeImage(file);
      setImagePreview(dataUrl);
      setImageData(dataUrl);
    } catch (err: unknown) {
      setImageErr(err instanceof Error ? err.message : 'Image error');
    }
  }

  function clearImage() {
    setImagePreview(null);
    setImageData(null);
    setImageUrl('');
    setImageErr('');
  }

  function switchMode(mode: ImageMode) {
    clearImage();
    setImageMode(mode);
  }

  async function handleSend() {
    if (!selectedGuild || !header.trim() || !content.trim()) return;
    const finalImage = imageMode === 'upload' ? imageData : (imageUrl.trim() || null);
    setSendState('sending');
    setErrorMsg('');
    try {
      const res = await fetch('/api/announcement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guildId: selectedGuild.id,
          guildName: selectedGuild.name,
          channelId: selectedChannel?.id || null,
          channelName: selectedChannel?.name || null,
          header: header.trim(),
          content: content.trim(),
          imageUrl: finalImage,
          sender: sender.trim() || null,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to send');
      setSendState('done');
      const saved = { header: header.trim(), guild: selectedGuild.name, channel: selectedChannel?.name };
      setHeader('');
      setContent('');
      setSender('');
      clearImage();
      setHistory((prev) => [{
        id: json.id,
        guildName: saved.guild,
        header: saved.header,
        channelName: saved.channel,
        status: 'pending',
      }, ...prev.slice(0, 19)]);
      setTimeout(() => setSendState('idle'), 5000);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Send failed');
      setSendState('error');
      setTimeout(() => setSendState('idle'), 6000);
    }
  }

  const canSend = selectedGuild && header.trim() && content.trim() && sendState !== 'sending';

  return (
    <div className="space-y-4">
      <div className="bg-[#2c2f33] rounded-xl border border-[#36393f] overflow-hidden">
        <div className="px-5 py-4 border-b border-[#36393f] flex items-center gap-2">
          <Megaphone size={15} className="text-[#5865f2]" />
          <div>
            <h2 className="text-white font-semibold">New Announcement</h2>
            <p className="text-[#72767d] text-xs mt-0.5">
              Compose and send an announcement to a Discord server
            </p>
          </div>
        </div>

        <div className="p-5 space-y-4">
          {/* Server + Channel row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[#b9bbbe] text-xs font-semibold uppercase tracking-wide">Server</label>
              <Dropdown
                items={guilds}
                selected={selectedGuild}
                onSelect={setSelectedGuild}
                placeholder="Select a server…"
                renderItem={(g) => (
                  <div className="flex items-center gap-2">
                    {g.icon ? (
                      <img src={g.icon} alt="" className="w-5 h-5 rounded-full flex-shrink-0" />
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-[#5865f2] flex items-center justify-center text-[8px] text-white font-bold flex-shrink-0">
                        {g.name[0]}
                      </div>
                    )}
                    <span className="truncate">{g.name}</span>
                    <span className="ml-auto text-[#4f545c] text-xs flex-shrink-0">{g.memberCount}</span>
                  </div>
                )}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[#b9bbbe] text-xs font-semibold uppercase tracking-wide flex items-center gap-1">
                <Hash size={11} /> Channel
              </label>
              {channelsLoading ? (
                <div className="flex items-center gap-2 bg-[#1e2124] border border-[#36393f] rounded-lg px-3 py-2.5">
                  <Loader2 size={13} className="animate-spin text-[#72767d]" />
                  <span className="text-[#72767d] text-sm">Loading…</span>
                </div>
              ) : (
                <Dropdown
                  items={channels}
                  selected={selectedChannel}
                  onSelect={setSelectedChannel}
                  placeholder="Select a channel…"
                  renderItem={(ch) => (
                    <div className="flex items-center gap-2">
                      <Hash size={13} className="text-[#72767d] flex-shrink-0" />
                      <span className="truncate">{ch.name}</span>
                    </div>
                  )}
                  renderSelected={(ch) => (
                    <span className="flex items-center gap-1.5">
                      <Hash size={13} className="text-[#72767d]" />
                      {ch.name}
                    </span>
                  )}
                />
              )}
            </div>
          </div>

          {/* Header */}
          <div className="space-y-1.5">
            <label className="text-[#b9bbbe] text-xs font-semibold uppercase tracking-wide">
              Header / Title
            </label>
            <input
              type="text"
              value={header}
              onChange={(e) => setHeader(e.target.value)}
              maxLength={256}
              placeholder="e.g. Server Update — June 2026"
              className="w-full bg-[#1e2124] border border-[#36393f] rounded-lg px-3 py-2.5 text-white text-sm placeholder-[#4f545c] focus:outline-none focus:border-[#5865f2] transition-colors"
            />
          </div>

          {/* Content */}
          <div className="space-y-1.5">
            <label className="text-[#b9bbbe] text-xs font-semibold uppercase tracking-wide">
              Content
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={5}
              placeholder="Write your announcement message here…"
              className="w-full bg-[#1e2124] border border-[#36393f] rounded-lg px-3 py-2.5 text-white text-sm placeholder-[#4f545c] resize-none focus:outline-none focus:border-[#5865f2] transition-colors"
            />
          </div>

          {/* Image */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[#b9bbbe] text-xs font-semibold uppercase tracking-wide flex items-center gap-1.5">
                <ImageIcon size={11} />
                Image <span className="text-[#4f545c] normal-case font-normal">(optional)</span>
              </label>
              <div className="flex rounded-md overflow-hidden border border-[#36393f]">
                <button
                  type="button"
                  onClick={() => switchMode('upload')}
                  className={`flex items-center gap-1 px-2.5 py-1 text-xs transition-colors ${
                    imageMode === 'upload' ? 'bg-[#5865f2] text-white' : 'text-[#72767d] hover:text-white'
                  }`}
                >
                  <Upload size={11} /> Upload
                </button>
                <button
                  type="button"
                  onClick={() => switchMode('url')}
                  className={`flex items-center gap-1 px-2.5 py-1 text-xs transition-colors ${
                    imageMode === 'url' ? 'bg-[#5865f2] text-white' : 'text-[#72767d] hover:text-white'
                  }`}
                >
                  <Link size={11} /> URL
                </button>
              </div>
            </div>

            {imageMode === 'upload' ? (
              imagePreview ? (
                <div className="relative">
                  <img
                    src={imagePreview}
                    alt="preview"
                    className="w-full max-h-48 object-cover rounded-lg border border-[#36393f]"
                  />
                  <button
                    type="button"
                    onClick={clearImage}
                    className="absolute top-2 right-2 w-6 h-6 bg-[#ed4245] rounded-full flex items-center justify-center hover:bg-[#c03537] transition-colors"
                  >
                    <X size={11} className="text-white" />
                  </button>
                </div>
              ) : (
                <div
                  className={`flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-lg h-24 cursor-pointer transition-all
                    ${imageDragging ? 'border-[#5865f2] bg-[#5865f2]/10' : 'border-[#36393f] hover:border-[#5865f2]/50 hover:bg-[#5865f2]/5'}`}
                  onClick={() => imgInputRef.current?.click()}
                  onDragOver={(e) => { e.preventDefault(); setImageDragging(true); }}
                  onDragLeave={() => setImageDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setImageDragging(false);
                    const f = e.dataTransfer.files[0];
                    if (f) handleFile(f);
                  }}
                >
                  <Upload size={18} className="text-[#4f545c]" />
                  <p className="text-[#72767d] text-xs">
                    Drag & drop or <span className="text-[#5865f2] font-medium">browse</span>
                  </p>
                  <input
                    ref={imgInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
                  />
                </div>
              )
            ) : (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={imageUrl}
                    onChange={(e) => { setImageUrl(e.target.value); setImageErr(''); }}
                    placeholder="https://example.com/image.png"
                    className="flex-1 bg-[#1e2124] border border-[#36393f] rounded-lg px-3 py-2.5 text-white text-sm placeholder-[#4f545c] focus:outline-none focus:border-[#5865f2] transition-colors"
                  />
                  {imageUrl && (
                    <button
                      type="button"
                      onClick={clearImage}
                      className="w-10 h-10 flex items-center justify-center bg-[#1e2124] border border-[#36393f] rounded-lg text-[#72767d] hover:text-[#ed4245] transition-colors"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
                {imageUrl && (
                  <img
                    src={imageUrl}
                    alt="URL preview"
                    className="w-full max-h-40 object-cover rounded-lg border border-[#36393f]"
                    onError={() => setImageErr('Could not load image from URL')}
                  />
                )}
              </div>
            )}

            {imageErr && (
              <p className="text-[#ed4245] text-xs flex items-center gap-1">
                <AlertCircle size={11} /> {imageErr}
              </p>
            )}
          </div>

          {/* Sender */}
          <div className="space-y-1.5">
            <label className="text-[#b9bbbe] text-xs font-semibold uppercase tracking-wide">
              Sender <span className="text-[#4f545c] normal-case font-normal">(optional)</span>
            </label>
            <input
              type="text"
              value={sender}
              onChange={(e) => setSender(e.target.value)}
              maxLength={64}
              placeholder="e.g. Server Staff, Admin Team…"
              className="w-full bg-[#1e2124] border border-[#36393f] rounded-lg px-3 py-2.5 text-white text-sm placeholder-[#4f545c] focus:outline-none focus:border-[#5865f2] transition-colors"
            />
          </div>

          {/* Status */}
          {(sendState !== 'idle' || errorMsg) && (
            <div
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium
                ${sendState === 'done' ? 'bg-green-600/10 text-green-400' : ''}
                ${sendState === 'sending' ? 'bg-[#5865f2]/10 text-[#5865f2]' : ''}
                ${sendState === 'error' ? 'bg-[#ed4245]/10 text-[#ed4245]' : ''}`}
            >
              {sendState === 'sending' && <Loader2 size={13} className="animate-spin" />}
              {sendState === 'done' && <CheckCircle size={13} />}
              {sendState === 'error' && <AlertCircle size={13} />}
              {sendState === 'sending' && 'Sending announcement to Discord…'}
              {sendState === 'done' && 'Announcement queued! Bot will post it within seconds.'}
              {sendState === 'error' && (errorMsg || 'Send failed')}
            </div>
          )}

          {/* Send button */}
          <div className="flex justify-end pt-1">
            <button
              type="button"
              onClick={handleSend}
              disabled={!canSend}
              className="flex items-center gap-2 px-5 py-2 bg-[#5865f2] hover:bg-[#4752c4] disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
            >
              <Send size={14} />
              Send Announcement
            </button>
          </div>
        </div>
      </div>

      {/* History */}
      {history.length > 0 && (
        <div className="bg-[#2c2f33] rounded-xl border border-[#36393f] overflow-hidden">
          <div className="px-5 py-3 border-b border-[#36393f]">
            <h3 className="text-white text-sm font-semibold">Recent Announcements</h3>
          </div>
          <div className="divide-y divide-[#36393f]">
            {history.map((a) => (
              <div key={a.id} className="px-5 py-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-white text-sm font-medium truncate">{a.header}</p>
                  <p className="text-[#72767d] text-xs truncate">
                    {a.guildName}
                    {a.channelName ? ` · #${a.channelName}` : ''}
                  </p>
                </div>
                <span
                  className={`flex-shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                    a.status === 'sent'
                      ? 'bg-green-600/15 text-green-400'
                      : a.status === 'pending'
                      ? 'bg-[#faa61a]/15 text-[#faa61a]'
                      : 'bg-[#ed4245]/15 text-[#ed4245]'
                  }`}
                >
                  {a.status === 'sent' ? '✓ Sent' : a.status === 'pending' ? '⏳ Pending' : a.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
