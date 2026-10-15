import React, { useState } from 'react';
import {
  X,
  UserPlus,
  ShieldCheck,
  Building,
  KeyRound,
  Mail,
  User,
  Phone,
  CreditCard,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import { BankUser, UserRole, ProvisionUserData } from '../types/auth';
import { provisionNewUser } from '../services/authApi';

interface ProvisionUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: BankUser;
  onUserProvisioned: (newUser: BankUser) => void;
}

export const ProvisionUserModal: React.FC<ProvisionUserModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUserProvisioned,
}) => {
  if (!isOpen) return null;

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [role, setRole] = useState<UserRole>('customer');
  const [phone, setPhone] = useState('+8801');
  const [nidNumber, setNidNumber] = useState('');
  const [branchName, setBranchName] = useState('Motijheel Corporate Branch');
  const [password, setPassword] = useState('TempPass@2026');
  const [mustChangePassword, setMustChangePassword] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!fullName.trim() || !email.trim() || !username.trim() || !password.trim()) {
      setError('Please fill in all mandatory fields.');
      return;
    }

    if (password.length < 8) {
      setError('Temporary password must be at least 8 characters long.');
      return;
    }

    setLoading(true);
    try {
      const payload: ProvisionUserData = {
        fullName: fullName.trim(),
        email: email.trim(),
        username: username.trim(),
        role,
        phone: phone.trim(),
        nidNumber: nidNumber.trim() || undefined,
        branchName: branchName.trim(),
        password: password.trim(),
        mustChangePassword,
      };

      const newUser = await provisionNewUser(payload);
      onUserProvisioned(newUser);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to provision user.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl max-h-[92vh] overflow-y-auto shadow-2xl flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 sm:p-8 border-b border-slate-800">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-indigo-950 border border-indigo-700 flex items-center justify-center text-indigo-400">
              <UserPlus className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white">
                Register &amp; Provision Banking User
              </h2>
              <p className="text-sm text-slate-400 mt-0.5">
                Internal credential provisioning by authorized officer: {currentUser.fullName} ({currentUser.role.toUpperCase()})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2.5 rounded-2xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
          {error && (
            <div className="p-4 text-sm bg-rose-950/80 border border-rose-800 text-rose-200 rounded-2xl font-medium flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Compliance Notice */}
          <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-900/60 text-xs text-indigo-200 leading-relaxed">
            <strong>BFIU COMPLIANCE NOTICE:</strong> This user will be registered in the core banking directory.
            This administrative event will be permanently recorded with your Officer ID (<span className="font-mono">{currentUser.email}</span>)
            in the immutable audit ledger.
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-200 mb-1.5">
                Full Legal Name *
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Kazi Nazrul Islam"
                required
                className="w-full px-4 py-2.5 text-base bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-200 mb-1.5">
                Official Email Address *
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. nazrul@bank.com"
                required
                className="w-full px-4 py-2.5 text-base bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-200 mb-1.5">
                System Username *
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. knazrul"
                required
                className="w-full px-4 py-2.5 text-base font-mono bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-200 mb-1.5">
                Role Assignment *
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                className="w-full px-4 py-2.5 text-base bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                {currentUser.role === 'admin' && (
                  <option value="admin">System Administrator (Full Control)</option>
                )}
                <option value="manager">Branch Operations Manager</option>
                <option value="auditor">Internal Control &amp; Auditor</option>
                <option value="customer">Retail Banking Customer / Applicant</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-200 mb-1.5">
                Phone Number (BD Format) *
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+8801XXXXXXXXX"
                required
                className="w-full px-4 py-2.5 text-base font-mono bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-200 mb-1.5">
                National ID (Smart NID / Legacy)
              </label>
              <input
                type="text"
                value={nidNumber}
                onChange={(e) => setNidNumber(e.target.value)}
                placeholder="e.g. 5918239014"
                className="w-full px-4 py-2.5 text-base font-mono bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-bold text-slate-200 mb-1.5">
                Branch / Office Allocation
              </label>
              <input
                type="text"
                value={branchName}
                onChange={(e) => setBranchName(e.target.value)}
                placeholder="e.g. Motijheel Corporate Branch"
                className="w-full px-4 py-2.5 text-base bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-bold text-slate-200 mb-1.5">
                Temporary Initial Password *
              </label>
              <input
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-2.5 text-base font-mono bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500"
              />
              <div className="text-xs text-slate-400 mt-1">
                Must be at least 8 characters with 1 uppercase, 1 lowercase, and 1 numeric digit.
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <input
              type="checkbox"
              id="mustChangePwd"
              checked={mustChangePassword}
              onChange={(e) => setMustChangePassword(e.target.checked)}
              className="w-4 h-4 text-indigo-600 rounded bg-slate-950 border-slate-800 cursor-pointer"
            />
            <label htmlFor="mustChangePwd" className="text-sm font-medium text-slate-300 cursor-pointer">
              Force password change on initial login (Bangladesh Bank Security Standard)
            </label>
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-4 pt-6 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-5 py-2.5 text-sm font-semibold text-slate-400 hover:text-white cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-7 py-3 text-base font-bold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded-2xl transition-all shadow-lg shadow-indigo-600/30 cursor-pointer active:scale-95"
            >
              {loading ? 'Registering User...' : 'Register User in System'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
