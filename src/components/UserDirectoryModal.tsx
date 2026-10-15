import React, { useState, useEffect } from 'react';
import {
  X,
  Users,
  UserPlus,
  ShieldAlert,
  Unlock,
  CheckCircle2,
  Clock,
  Search,
  Lock,
  RefreshCw,
} from 'lucide-react';
import { BankUser } from '../types/auth';
import { fetchAllUsers, unlockUserAccount, toggleUserActiveStatus } from '../services/authApi';

interface UserDirectoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: BankUser;
  onOpenProvisionModal: () => void;
}

export const UserDirectoryModal: React.FC<UserDirectoryModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onOpenProvisionModal,
}) => {
  if (!isOpen) return null;

  const [users, setUsers] = useState<BankUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await fetchAllUsers();
      setUsers(data);
    } catch (err: any) {
      console.error('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleUnlock = async (userId: string) => {
    try {
      await unlockUserAccount(userId);
      setActionMessage('Account successfully unlocked.');
      loadUsers();
      setTimeout(() => setActionMessage(null), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to unlock account');
    }
  };

  const handleToggleStatus = async (userId: string) => {
    try {
      await toggleUserActiveStatus(userId);
      setActionMessage('Account status updated.');
      loadUsers();
      setTimeout(() => setActionMessage(null), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to change status');
    }
  };

  const filteredUsers = users.filter((u) => {
    const q = search.toLowerCase();
    return (
      u.fullName.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.role.toLowerCase().includes(q) ||
      u.branchName.toLowerCase().includes(q)
    );
  });

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return (
          <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-violet-950 text-violet-300 border border-violet-800">
            ADMIN
          </span>
        );
      case 'manager':
        return (
          <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-blue-950 text-blue-300 border border-blue-800">
            MANAGER
          </span>
        );
      case 'auditor':
        return (
          <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-emerald-950 text-emerald-300 border border-emerald-800">
            AUDITOR
          </span>
        );
      default:
        return (
          <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-amber-950 text-amber-300 border border-amber-800">
            CUSTOMER
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-5xl max-h-[92vh] overflow-y-auto shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-6 sm:p-8 border-b border-slate-800 gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-indigo-950 border border-indigo-700 flex items-center justify-center text-indigo-400">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white">
                Core Banking Staff &amp; User Directory
              </h2>
              <p className="text-sm text-slate-400 mt-0.5">
                Centralized identity registry with brute-force tracking &amp; RBAC governance
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {(currentUser.role === 'admin' || currentUser.role === 'manager') && (
              <button
                onClick={() => {
                  onClose();
                  onOpenProvisionModal();
                }}
                className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-all shadow-md cursor-pointer active:scale-95"
              >
                <UserPlus className="w-4 h-4" />
                <span>+ Register New User</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2.5 rounded-2xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {actionMessage && (
          <div className="mx-6 sm:mx-8 mt-4 p-3 rounded-xl bg-emerald-950 border border-emerald-800 text-emerald-300 text-sm font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{actionMessage}</span>
          </div>
        )}

        {/* Search Toolbar */}
        <div className="p-6 sm:p-8 space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1">
              <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search staff & customers by name, email, role, branch..."
                className="w-full pl-12 pr-4 py-3 text-sm sm:text-base bg-slate-950 border border-slate-800 rounded-2xl text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <button
              onClick={loadUsers}
              className="p-3 rounded-2xl bg-slate-950 border border-slate-800 hover:bg-slate-800 text-slate-300 cursor-pointer"
              title="Refresh users list"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Table */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/80 text-slate-400 uppercase tracking-wider text-xs font-bold">
                    <th className="py-4 px-5">Officer / User</th>
                    <th className="py-4 px-5">Role</th>
                    <th className="py-4 px-5">Branch / Division</th>
                    <th className="py-4 px-5">Contact &amp; NID</th>
                    <th className="py-4 px-5 text-center">Status</th>
                    <th className="py-4 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 text-slate-200">
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-900/50 transition-colors">
                      <td className="py-4 px-5">
                        <div className="font-bold text-white text-base">{u.fullName}</div>
                        <div className="text-xs text-indigo-400 font-mono mt-0.5">{u.email}</div>
                      </td>

                      <td className="py-4 px-5">{getRoleBadge(u.role)}</td>

                      <td className="py-4 px-5 text-slate-300 font-medium">
                        {u.branchName || 'Head Office'}
                      </td>

                      <td className="py-4 px-5 font-mono text-xs text-slate-400">
                        <div>{u.phone}</div>
                        {u.nidNumber && <div className="text-slate-500">NID: {u.nidNumber}</div>}
                      </td>

                      <td className="py-4 px-5 text-center">
                        {u.isLocked ? (
                          <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-lg bg-rose-950 text-rose-300 border border-rose-800">
                            <Lock className="w-3.5 h-3.5 text-rose-400" />
                            <span>LOCKED (5 fails)</span>
                          </span>
                        ) : u.isActive ? (
                          <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-lg bg-emerald-950 text-emerald-300 border border-emerald-800">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            <span>ACTIVE</span>
                          </span>
                        ) : (
                          <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-slate-800 text-slate-400">
                            DEACTIVATED
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          {u.isLocked && (currentUser.role === 'admin' || currentUser.role === 'manager') && (
                            <button
                              onClick={() => handleUnlock(u.id)}
                              className="px-3 py-1.5 text-xs font-bold text-emerald-200 bg-emerald-950 hover:bg-emerald-900 rounded-lg border border-emerald-800 cursor-pointer flex items-center gap-1"
                            >
                              <Unlock className="w-3.5 h-3.5" />
                              <span>Unlock</span>
                            </button>
                          )}
                          {currentUser.role === 'admin' && u.id !== currentUser.id && (
                            <button
                              onClick={() => handleToggleStatus(u.id)}
                              className="px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg cursor-pointer"
                            >
                              {u.isActive ? 'Deactivate' : 'Activate'}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
