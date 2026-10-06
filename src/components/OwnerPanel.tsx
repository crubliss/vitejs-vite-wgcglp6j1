import { useState, useCallback } from 'react';
import {
  Shield, Lock, Loader2, Users, Ban, CheckCircle2, AlertTriangle,
  Search, X, ShieldAlert, UserCheck, DollarSign, TrendingUp, Car,
  FlaskConical, Gamepad2, LineChart, Youtube, Wallet, ArrowLeft,
  Plus, Minus, Pencil,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { useWallet } from '@/hooks/useWallet';
import { formatMoney } from '@/lib/format';

interface UserRow {
  id: string;
  email: string;
  created_at: string;
  is_banned: boolean;
  ban_reason: string | null;
}

interface UserStats {
  email: string;
  balance: number;
  game_count: number;
  total_wagered: number;
  total_payout: number;
  car_count: number;
  drug_count: number;
  active_investments: number;
  trade_count: number;
  video_count: number;
}

type MoneyAction = 'set' | 'add' | 'remove';

export function OwnerPanel() {
  const { user } = useAuth();
  const wallet = useWallet();
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState('');
  const [pwError, setPwError] = useState<string | null>(null);
  const [pwLoading, setPwLoading] = useState(false);

  const [users, setUsers] = useState<UserRow[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [search, setSearch] = useState('');
  const [actionMsg, setActionMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [banTarget, setBanTarget] = useState<UserRow | null>(null);
  const [banReason, setBanReason] = useState('');
  const [banning, setBanning] = useState(false);

  const [detailUser, setDetailUser] = useState<UserRow | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [moneyInput, setMoneyInput] = useState('');
  const [moneyAction, setMoneyAction] = useState<MoneyAction>('set');
  const [moneyLoading, setMoneyLoading] = useState(false);

  const showMsg = useCallback((type: 'success' | 'error', text: string) => {
    setActionMsg({ type, text });
    setTimeout(() => setActionMsg(null), 4000);
  }, []);

  const checkPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setPwError('Enter the owner password');
      return;
    }
    setPwLoading(true);
    setPwError(null);
    const { data, error } = await supabase.rpc('check_owner_password', { input: password });
    setPwLoading(false);
    if (error) {
      setPwError('Error verifying password');
      return;
    }
    if (data === true) {
      setAuthed(true);
      loadUsers();
    } else {
      setPwError('Wrong password. Access denied.');
    }
  };

  const loadUsers = useCallback(async () => {
    setLoadingUsers(true);
    const { data, error } = await supabase.rpc('list_all_users');
    setLoadingUsers(false);
    if (error) {
      showMsg('error', 'Failed to load users');
      return;
    }
    setUsers((data ?? []) as UserRow[]);
  }, [showMsg]);

  const loadStats = useCallback(async (uid: string) => {
    setStatsLoading(true);
    const { data, error } = await supabase.rpc('get_user_stats', { target_uid: uid });
    setStatsLoading(false);
    if (error || !data || data.length === 0) {
      showMsg('error', 'Failed to load user stats');
      return;
    }
    const s = data[0] as unknown as UserStats;
    setStats(s);
  }, [showMsg]);

  const openDetail = (u: UserRow) => {
    setDetailUser(u);
    setStats(null);
    setMoneyInput('');
    setMoneyAction('set');
    loadStats(u.id);
  };

  const handleBan = async () => {
    if (!banTarget) return;
    const reason = banReason.trim() || 'No reason provided';
    setBanning(true);
    const { error } = await supabase.rpc('ban_user', {
      target_uid: banTarget.id,
      ban_reason: reason,
    });
    setBanning(false);
    if (error) {
      showMsg('error', `Failed to ban ${banTarget.email}`);
      return;
    }
    showMsg('success', `Banned ${banTarget.email} — ${reason}`);
    setBanTarget(null);
    setBanReason('');
    loadUsers();
  };

  const handleUnban = async (u: UserRow) => {
    const { error } = await supabase.rpc('unban_user', { target_uid: u.id });
    if (error) {
      showMsg('error', `Failed to unban ${u.email}`);
      return;
    }
    showMsg('success', `Unbanned ${u.email}`);
    loadUsers();
  };

  const handleMoneyAction = async () => {
    if (!detailUser || !stats) return;
    const amount = parseFloat(moneyInput) || 0;
    if (amount <= 0 && moneyAction !== 'set') {
      showMsg('error', 'Enter a valid amount');
      return;
    }

    setMoneyLoading(true);
    let error: { message: string } | null = null;
    let newBalance = 0;

    if (moneyAction === 'set') {
      const { error: e } = await supabase.rpc('set_user_balance', {
        target_uid: detailUser.id,
        new_balance: amount,
      });
      error = e as typeof error;
      newBalance = amount;
    } else if (moneyAction === 'add') {
      const { data: d, error: e } = await supabase.rpc('add_user_balance', {
        target_uid: detailUser.id,
        amount,
      });
      error = e as typeof error;
      newBalance = Number(d);
    } else {
      const { data: d, error: e } = await supabase.rpc('add_user_balance', {
        target_uid: detailUser.id,
        amount: -amount,
      });
      error = e as typeof error;
      newBalance = Number(d);
    }

    setMoneyLoading(false);
    if (error) {
      showMsg('error', 'Failed to update balance');
      return;
    }

    setStats({ ...stats, balance: newBalance });
    if (detailUser.id === user?.id) {
      wallet.refresh();
    }
    showMsg('success', `${detailUser.email}'s balance is now ${formatMoney(newBalance)}`);
    setMoneyInput('');
    loadUsers();
  };

  const filtered = users.filter((u) =>
    u.email.toLowerCase().includes(search.toLowerCase()),
  );

  const bannedCount = users.filter((u) => u.is_banned).length;
  const activeCount = users.length - bannedCount;

  if (!authed) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-full max-w-md">
          <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-8">
            <div className="flex items-center justify-center mb-6">
              <div className="w-14 h-14 rounded-2xl bg-red-950/40 border border-red-900/40 flex items-center justify-center">
                <ShieldAlert className="w-8 h-8 text-red-500" />
              </div>
            </div>
            <h1 className="text-xl font-bold text-zinc-100 text-center mb-1">Owner Panel</h1>
            <p className="text-sm text-zinc-500 text-center mb-6">
              Restricted access. Enter the owner password to continue.
            </p>

            {pwError && (
              <div className="mb-4 px-4 py-3 rounded-lg bg-red-900/40 border border-red-800/50 text-red-400 text-sm flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                {pwError}
              </div>
            )}

            <form onSubmit={checkPassword} className="flex flex-col gap-4">
              <div>
                <label className="text-xs text-zinc-500 mb-1.5 block">Owner Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    autoFocus
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg pl-10 pr-3 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-red-600 transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={pwLoading}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-red-700 hover:bg-red-600 text-white font-semibold rounded-lg text-sm transition-colors disabled:opacity-50"
              >
                {pwLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Shield className="w-4 h-4" /> Unlock Panel
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // ---- Detail View ----
  if (detailUser) {
    const isSelf = detailUser.id === user?.id;
    return (
      <div className="flex flex-col gap-5">
        <button
          onClick={() => setDetailUser(null)}
          className="flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-200 transition-colors w-fit"
        >
          <ArrowLeft className="w-4 h-4" /> Back to user list
        </button>

        {/* User header */}
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center">
            <Users className="w-6 h-6 text-zinc-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-zinc-100">{detailUser.email}</h2>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs text-zinc-500">
                Joined {new Date(detailUser.created_at).toLocaleDateString()}
              </span>
              {detailUser.is_banned ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-red-900/40 text-red-400 text-xs font-medium">
                  <Ban className="w-3 h-3" /> Banned
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-900/40 text-emerald-400 text-xs font-medium">
                  <CheckCircle2 className="w-3 h-3" /> Active
                </span>
              )}
            </div>
          </div>
        </div>

        {actionMsg && (
          <div
            className={`px-4 py-2.5 rounded-lg text-sm flex items-center gap-2 ${
              actionMsg.type === 'success'
                ? 'bg-emerald-900/40 text-emerald-400 border border-emerald-800/50'
                : 'bg-red-900/40 text-red-400 border border-red-800/50'
            }`}
          >
            {actionMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
            {actionMsg.text}
          </div>
        )}

        {statsLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-zinc-500" />
          </div>
        ) : stats ? (
          <>
            {/* Stats grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              <StatCard icon={Wallet} label="Balance" value={formatMoney(stats.balance)} accent="text-emerald-400" />
              <StatCard icon={Gamepad2} label="Games Played" value={stats.game_count.toString()} />
              <StatCard icon={DollarSign} label="Total Wagered" value={formatMoney(stats.total_wagered)} />
              <StatCard icon={TrendingUp} label="Total Payout" value={formatMoney(stats.total_payout)} />
              <StatCard icon={Car} label="Cars Owned" value={stats.car_count.toString()} />
              <StatCard icon={FlaskConical} label="Drugs Owned" value={stats.drug_count.toString()} />
              <StatCard icon={LineChart} label="Active Investments" value={stats.active_investments.toString()} />
              <StatCard icon={LineChart} label="Total Trades" value={stats.trade_count.toString()} />
            </div>

            {/* Money management */}
            <div className="bg-zinc-900/60 rounded-xl border border-zinc-800 p-5">
              <h3 className="text-sm font-bold text-zinc-100 mb-4 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-400" /> Manage Balance
              </h3>
              <p className="text-xs text-zinc-500 mb-4">
                Current balance: <span className="text-emerald-400 font-medium">{formatMoney(stats.balance)}</span>
              </p>

              {/* Action selector */}
              <div className="flex gap-2 mb-3">
                {([
                  { key: 'set' as const, label: 'Set', icon: Pencil },
                  { key: 'add' as const, label: 'Add', icon: Plus },
                  { key: 'remove' as const, label: 'Remove', icon: Minus },
                ]).map((opt) => {
                  const Icon = opt.icon;
                  return (
                    <button
                      key={opt.key}
                      onClick={() => setMoneyAction(opt.key)}
                      className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                        moneyAction === opt.key
                          ? opt.key === 'set'
                            ? 'bg-blue-700 text-white'
                            : opt.key === 'add'
                            ? 'bg-emerald-700 text-white'
                            : 'bg-red-700 text-white'
                          : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" /> {opt.label}
                    </button>
                  );
                })}
              </div>

              <div className="flex gap-3">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">$</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={moneyInput}
                    onChange={(e) => setMoneyInput(e.target.value)}
                    placeholder={
                      moneyAction === 'set'
                        ? 'New balance amount'
                        : moneyAction === 'add'
                        ? 'Amount to add'
                        : 'Amount to remove'
                    }
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg pl-7 pr-3 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-600"
                  />
                </div>
                <button
                  onClick={handleMoneyAction}
                  disabled={moneyLoading}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {moneyLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    'Apply'
                  )}
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-8 text-sm text-zinc-500">No stats available.</div>
        )}

        {/* Ban / Unban in detail */}
        <div className="bg-zinc-900/60 rounded-xl border border-zinc-800 p-5">
          <h3 className="text-sm font-bold text-zinc-100 mb-3 flex items-center gap-2">
            <Shield className="w-4 h-4 text-red-400" /> Account Status
          </h3>
          {isSelf ? (
            <p className="text-sm text-zinc-500">You cannot ban or unban your own account.</p>
          ) : detailUser.is_banned ? (
            <div className="flex items-center gap-3">
              <p className="text-sm text-zinc-400">
                Banned: <span className="text-red-400">{detailUser.ban_reason}</span>
              </p>
              <button
                onClick={() => handleUnban(detailUser)}
                className="px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white text-sm font-semibold transition-colors inline-flex items-center gap-1.5"
              >
                <UserCheck className="w-4 h-4" /> Unban
              </button>
            </div>
          ) : (
            <button
              onClick={() => {
                setBanTarget(detailUser);
                setBanReason('');
              }}
              className="px-4 py-2 rounded-lg bg-red-700 hover:bg-red-600 text-white text-sm font-semibold transition-colors inline-flex items-center gap-1.5"
            >
              <Ban className="w-4 h-4" /> Ban This User
            </button>
          )}
        </div>
      </div>
    );
  }

  // ---- List View ----
  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-red-950/40 border border-red-900/40 flex items-center justify-center">
          <Shield className="w-5 h-5 text-red-500" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-zinc-100">Owner Panel</h2>
          <p className="text-zinc-500 text-sm">Manage accounts, view stats, and control balances.</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-zinc-900/60 rounded-xl border border-zinc-800 p-4">
          <div className="flex items-center gap-2 text-xs text-zinc-500 mb-1">
            <Users className="w-3.5 h-3.5" /> Total Accounts
          </div>
          <div className="text-xl font-bold text-zinc-100 tabular-nums">{users.length}</div>
        </div>
        <div className="bg-zinc-900/60 rounded-xl border border-zinc-800 p-4">
          <div className="flex items-center gap-2 text-xs text-zinc-500 mb-1">
            <UserCheck className="w-3.5 h-3.5" /> Active
          </div>
          <div className="text-xl font-bold text-emerald-400 tabular-nums">{activeCount}</div>
        </div>
        <div className="bg-zinc-900/60 rounded-xl border border-zinc-800 p-4">
          <div className="flex items-center gap-2 text-xs text-zinc-500 mb-1">
            <Ban className="w-3.5 h-3.5" /> Banned
          </div>
          <div className="text-xl font-bold text-red-400 tabular-nums">{bannedCount}</div>
        </div>
      </div>

      {actionMsg && (
        <div
          className={`px-4 py-2.5 rounded-lg text-sm flex items-center gap-2 ${
            actionMsg.type === 'success'
              ? 'bg-emerald-900/40 text-emerald-400 border border-emerald-800/50'
              : 'bg-red-900/40 text-red-400 border border-red-800/50'
          }`}
        >
          {actionMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
          {actionMsg.text}
        </div>
      )}

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by email..."
          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg pl-10 pr-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-600"
        />
      </div>

      <div className="bg-zinc-900/60 rounded-xl border border-zinc-800 overflow-hidden">
        {loadingUsers ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-zinc-500" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-10 h-10 text-zinc-700 mx-auto mb-2" />
            <p className="text-sm text-zinc-500">No users found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800 text-xs text-zinc-500 uppercase tracking-wider">
                  <th className="text-left px-4 py-3 font-semibold">Email</th>
                  <th className="text-left px-4 py-3 font-semibold hidden sm:table-cell">Joined</th>
                  <th className="text-left px-4 py-3 font-semibold">Status</th>
                  <th className="text-left px-4 py-3 font-semibold hidden sm:table-cell">Ban Reason</th>
                  <th className="text-right px-4 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => {
                  const isSelf = u.id === user?.id;
                  return (
                    <tr key={u.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors cursor-pointer"
                      onClick={() => openDetail(u)}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-zinc-100 font-medium">{u.email}</span>
                          {isSelf && (
                            <span className="px-1.5 py-0.5 rounded bg-emerald-900/40 text-emerald-400 text-xs font-medium">
                              You
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-zinc-500 hidden sm:table-cell">
                        {new Date(u.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        {u.is_banned ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-red-900/40 text-red-400 text-xs font-medium">
                            <Ban className="w-3 h-3" /> Banned
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-900/40 text-emerald-400 text-xs font-medium">
                            <CheckCircle2 className="w-3 h-3" /> Active
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-zinc-500 hidden sm:table-cell max-w-[200px] truncate">
                        {u.ban_reason ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                        {isSelf ? (
                          <span className="text-xs text-zinc-600">View only</span>
                        ) : u.is_banned ? (
                          <button
                            onClick={() => handleUnban(u)}
                            className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-semibold transition-colors inline-flex items-center gap-1.5"
                          >
                            <UserCheck className="w-3.5 h-3.5" /> Unban
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              setBanTarget(u);
                              setBanReason('');
                            }}
                            className="px-3 py-1.5 rounded-lg bg-red-700 hover:bg-red-600 text-white text-xs font-semibold transition-colors inline-flex items-center gap-1.5"
                          >
                            <Ban className="w-3.5 h-3.5" /> Ban
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="text-xs text-zinc-600 text-center">
        Click any user row to view their stats and manage their balance.
      </p>

      {/* Ban modal */}
      {banTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={() => !banning && setBanTarget(null)}
        >
          <div
            className="bg-zinc-900 rounded-2xl border border-zinc-700 max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
                <Ban className="w-5 h-5 text-red-500" /> Ban User
              </h3>
              {!banning && (
                <button onClick={() => setBanTarget(null)} className="text-zinc-500 hover:text-zinc-300">
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
            <p className="text-sm text-zinc-400 mb-4">
              Banning <span className="text-zinc-100 font-medium">{banTarget.email}</span>. They will be
              blocked from signing in until unbanned.
            </p>
            <div className="mb-4">
              <label className="text-xs text-zinc-500 mb-1 block">Reason</label>
              <textarea
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                placeholder="e.g. Cheating, exploit abuse, harassment..."
                rows={3}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-red-600 resize-none"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setBanTarget(null)}
                disabled={banning}
                className="flex-1 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleBan}
                disabled={banning}
                className="flex-1 py-2 bg-red-700 hover:bg-red-600 text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {banning ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Ban className="w-4 h-4" /> Confirm Ban
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, accent }: { icon: typeof Users; label: string; value: string; accent?: string }) {
  return (
    <div className="bg-zinc-900/60 rounded-xl border border-zinc-800 p-4">
      <div className="flex items-center gap-2 text-xs text-zinc-500 mb-1">
        <Icon className="w-3.5 h-3.5" /> {label}
      </div>
      <div className={`text-base font-bold tabular-nums ${accent ?? 'text-zinc-100'}`}>{value}</div>
    </div>
  );
}
