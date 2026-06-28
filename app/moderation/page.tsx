'use client';

import { useState, useEffect, useCallback, FormEvent } from 'react';

interface Guild {
  id: string;
  name: string;
  icon?: string;
}

interface ModAction {
  id: string;
  action: string;
  targetTag: string;
  targetId: string;
  moderatorTag: string;
  reason: string;
  timestamp: string | null;
}

interface Warning {
  id: string;
  targetTag: string;
  targetId: string;
  moderatorTag: string;
  reason: string;
  timestamp: string | null;
}

const ACTION_COLORS: Record<string, string> = {
  ban: 'text-red-400 bg-red-400/10',
  unban: 'text-green-400 bg-green-400/10',
  kick: 'text-yellow-400 bg-yellow-400/10',
  timeout: 'text-orange-400 bg-orange-400/10',
  untimeout: 'text-blue-400 bg-blue-400/10',
  warn: 'text-yellow-300 bg-yellow-300/10',
  clearwarnings: 'text-purple-400 bg-purple-400/10',
};

const ACTION_ICONS: Record<string, string> = {
  ban: '🔨', unban: '✅', kick: '👢', timeout: '⏱️',
  untimeout: '🔓', warn: '⚠️', clearwarnings: '🗑️', lock: '🔒',
  unlock: '🔓', purge: '🗑️',
};

export default function ModerationPage() {
  const [guilds, setGuilds] = useState<Guild[]>([]);
  const [selectedGuild, setSelectedGuild] = useState('');
  const [actions, setActions] = useState<ModAction[]>([]);
  const [warnings, setWarnings] = useState<Warning[]>([]);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<'actions' | 'warnings' | 'control'>('actions');

  const [actionForm, setActionForm] = useState({
    action: 'ban',
    targetId: '',
    targetTag: '',
    reason: '',
    duration: '10m',
  });
  const [actionStatus, setActionStatus] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetch('/api/guilds').then(r => r.json()).then(d => {
      setGuilds(d.guilds || []);
      if (d.guilds?.length) setSelectedGuild(d.guilds[0].id);
    });
  }, []);

  const loadData = useCallback(async () => {
    if (!selectedGuild) return;
    setLoading(true);
    const [actRes, warnRes] = await Promise.all([
      fetch(`/api/moderation/actions?guildId=${selectedGuild}`).then(r => r.json()),
      fetch(`/api/moderation/warnings?guildId=${selectedGuild}`).then(r => r.json()),
    ]);
    setActions(actRes.actions || []);
    setWarnings(warnRes.warnings || []);
    setLoading(false);
  }, [selectedGuild]);

  useEffect(() => { loadData(); }, [loadData]);

  async function handleAction(e: FormEvent) {
    e.preventDefault();
    if (!selectedGuild || !actionForm.targetId) return;
    setActionLoading(true);
    setActionStatus('');

    const res = await fetch('/api/moderation/actions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        guildId: selectedGuild,
        action: actionForm.action,
        targetId: actionForm.targetId,
        targetTag: actionForm.targetTag || actionForm.targetId,
        reason: actionForm.reason || 'Action from dashboard',
        duration: actionForm.duration,
        moderatorTag: 'Dashboard',
      }),
    });
    const data = await res.json();
    setActionLoading(false);

    if (data.success) {
      setActionStatus('✅ Action sent to bot — check mod logs for confirmation.');
      setActionForm({ action: 'ban', targetId: '', targetTag: '', reason: '', duration: '10m' });
      setTimeout(() => { setActionStatus(''); loadData(); }, 3000);
    } else {
      setActionStatus(`❌ Error: ${data.error}`);
    }
  }

  async function deleteWarning(id: string) {
    if (!confirm('Delete this warning?')) return;
    await fetch(`/api/moderation/warnings?id=${id}`, { method: 'DELETE' });
    setWarnings(prev => prev.filter(w => w.id !== id));
  }

  function formatDate(ts: string | null) {
    if (!ts) return 'Unknown';
    return new Date(ts).toLocaleString();
  }

  const guild = guilds.find(g => g.id === selectedGuild);

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">🛡️ Moderation Dashboard</h1>
            <p className="text-gray-400 text-sm">Control your servers from the dashboard</p>
          </div>
          <select
            value={selectedGuild}
            onChange={e => setSelectedGuild(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
          >
            {guilds.map(g => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
            <div className="text-2xl font-bold text-red-400">{actions.length}</div>
            <div className="text-gray-400 text-sm">Mod Actions (last 50)</div>
          </div>
          <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
            <div className="text-2xl font-bold text-yellow-400">{warnings.length}</div>
            <div className="text-gray-400 text-sm">Active Warnings</div>
          </div>
          <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
            <div className="text-2xl font-bold text-blue-400">{guild?.name ? '🟢' : '⚫'}</div>
            <div className="text-gray-400 text-sm">{guild?.name || 'No server selected'}</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-gray-800">
          {(['actions', 'warnings', 'control'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 text-sm font-medium capitalize border-b-2 transition-colors ${tab === t ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-gray-400 hover:text-white'}`}
            >
              {t === 'actions' ? '📋 Mod Log' : t === 'warnings' ? '⚠️ Warnings' : '⚡ Control Panel'}
            </button>
          ))}
          <button onClick={loadData} className="ml-auto px-3 py-1 text-xs bg-gray-800 hover:bg-gray-700 rounded-lg text-gray-300 transition-colors mb-2">
            🔄 Refresh
          </button>
        </div>

        {loading ? (
          <div className="text-center py-16 text-gray-500">Loading...</div>
        ) : (
          <>
            {/* Mod Actions Tab */}
            {tab === 'actions' && (
              <div className="space-y-2">
                {actions.length === 0 && <div className="text-center py-12 text-gray-500">No moderation actions yet.</div>}
                {actions.map(a => (
                  <div key={a.id} className="bg-gray-900 rounded-xl p-4 border border-gray-800 flex items-start gap-4">
                    <span className="text-2xl">{ACTION_ICONS[a.action] || '🛡️'}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${ACTION_COLORS[a.action] || 'text-gray-400 bg-gray-700'}`}>{a.action}</span>
                        <span className="text-white font-medium">{a.targetTag || a.targetId}</span>
                        <span className="text-gray-500 text-xs">by {a.moderatorTag}</span>
                      </div>
                      <p className="text-gray-300 text-sm mt-1">{a.reason}</p>
                    </div>
                    <span className="text-gray-500 text-xs whitespace-nowrap">{formatDate(a.timestamp)}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Warnings Tab */}
            {tab === 'warnings' && (
              <div className="space-y-2">
                {warnings.length === 0 && <div className="text-center py-12 text-gray-500">No warnings issued.</div>}
                {warnings.map(w => (
                  <div key={w.id} className="bg-gray-900 rounded-xl p-4 border border-gray-800 flex items-start gap-4">
                    <span className="text-2xl">⚠️</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-yellow-400 font-medium">{w.targetTag}</span>
                        <span className="text-gray-500 text-xs">({w.targetId})</span>
                        <span className="text-gray-500 text-xs">by {w.moderatorTag}</span>
                      </div>
                      <p className="text-gray-300 text-sm mt-1">{w.reason}</p>
                      <p className="text-gray-500 text-xs mt-1">{formatDate(w.timestamp)}</p>
                    </div>
                    <button
                      onClick={() => deleteWarning(w.id)}
                      className="text-red-400 hover:text-red-300 text-sm px-2 py-1 rounded hover:bg-red-400/10 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Control Panel Tab */}
            {tab === 'control' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
                  <h2 className="text-lg font-bold mb-4">⚡ Take Action</h2>
                  <form onSubmit={handleAction} className="space-y-4">
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Action</label>
                      <select
                        value={actionForm.action}
                        onChange={e => setActionForm(p => ({ ...p, action: e.target.value }))}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white"
                      >
                        <option value="ban">🔨 Ban</option>
                        <option value="unban">✅ Unban</option>
                        <option value="kick">👢 Kick</option>
                        <option value="timeout">⏱️ Timeout</option>
                        <option value="untimeout">🔓 Remove Timeout</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm text-gray-400 mb-1">User ID <span className="text-red-400">*</span></label>
                      <input
                        type="text"
                        value={actionForm.targetId}
                        onChange={e => setActionForm(p => ({ ...p, targetId: e.target.value }))}
                        placeholder="Discord User ID (e.g. 123456789012345678)"
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Username (optional)</label>
                      <input
                        type="text"
                        value={actionForm.targetTag}
                        onChange={e => setActionForm(p => ({ ...p, targetTag: e.target.value }))}
                        placeholder="user#0000 (for logs)"
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-500"
                      />
                    </div>

                    {actionForm.action === 'timeout' && (
                      <div>
                        <label className="block text-sm text-gray-400 mb-1">Duration</label>
                        <select
                          value={actionForm.duration}
                          onChange={e => setActionForm(p => ({ ...p, duration: e.target.value }))}
                          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white"
                        >
                          <option value="1m">1 minute</option>
                          <option value="5m">5 minutes</option>
                          <option value="10m">10 minutes</option>
                          <option value="30m">30 minutes</option>
                          <option value="1h">1 hour</option>
                          <option value="6h">6 hours</option>
                          <option value="1d">1 day</option>
                          <option value="7d">7 days</option>
                        </select>
                      </div>
                    )}

                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Reason</label>
                      <input
                        type="text"
                        value={actionForm.reason}
                        onChange={e => setActionForm(p => ({ ...p, reason: e.target.value }))}
                        placeholder="Reason for this action"
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-500"
                      />
                    </div>

                    {actionStatus && (
                      <div className={`text-sm px-3 py-2 rounded-lg ${actionStatus.startsWith('✅') ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'}`}>
                        {actionStatus}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={actionLoading}
                      className={`w-full py-2 rounded-lg font-semibold transition-colors ${
                        actionForm.action === 'ban' ? 'bg-red-600 hover:bg-red-700' :
                        actionForm.action === 'kick' ? 'bg-yellow-600 hover:bg-yellow-700' :
                        actionForm.action === 'unban' || actionForm.action === 'untimeout' ? 'bg-green-600 hover:bg-green-700' :
                        'bg-indigo-600 hover:bg-indigo-700'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {actionLoading ? 'Sending...' : `Execute ${actionForm.action.charAt(0).toUpperCase() + actionForm.action.slice(1)}`}
                    </button>
                  </form>
                </div>

                <div className="space-y-4">
                  <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
                    <h3 className="font-bold mb-2">📋 How Control Panel Works</h3>
                    <ol className="text-gray-400 text-sm space-y-2 list-decimal list-inside">
                      <li>Select your server from the dropdown above</li>
                      <li>Choose an action (Ban, Kick, Timeout, etc.)</li>
                      <li>Enter the target's Discord User ID</li>
                      <li>Click Execute — the bot carries it out instantly</li>
                    </ol>
                  </div>
                  <div className="bg-yellow-900/20 rounded-xl p-5 border border-yellow-800/30">
                    <h3 className="font-bold text-yellow-400 mb-2">⚠️ Important</h3>
                    <p className="text-gray-400 text-sm">The bot must have the correct permissions in the server for actions to succeed. All actions are logged in the Mod Log tab.</p>
                  </div>
                  <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
                    <h3 className="font-bold mb-2">🔍 Find a User ID</h3>
                    <p className="text-gray-400 text-sm">In Discord: Enable Developer Mode in Settings → Advanced, then right-click any user and click <strong>Copy User ID</strong>.</p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
