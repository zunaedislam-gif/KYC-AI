import React, { useState } from 'react';
import {
  ShieldCheck,
  Lock,
  Mail,
  KeyRound,
  AlertTriangle,
  ArrowRight,
  ShieldAlert,
  UserCheck,
  Building2,
  FileCheck2,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { BankUser } from '../types/auth';
import { loginUser } from '../services/authApi';

interface LoginViewProps {
  onLoginSuccess: (user: BankUser, token: string) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please provide both your official email and password.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await loginUser(email.trim(), password);
      onLoginSuccess(res.user, res.access_token);
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4 sm:p-6 lg:p-10 font-sans selection:bg-indigo-500 selection:text-white">
      <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        {/* Left Column (5/12): Banking Compliance Information */}
        <div className="lg:col-span-5 bg-gradient-to-br from-indigo-950/80 via-slate-900 to-slate-950 border border-indigo-900/50 rounded-3xl p-6 sm:p-8 flex flex-col justify-between shadow-2xl relative overflow-hidden">
          <div className="space-y-6 relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/40">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <div>
                <span className="text-2xl font-black tracking-tight text-white">KYC</span>
                <div className="text-xs font-bold uppercase tracking-wider text-indigo-300">
                  Core Banking Compliance
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-snug">
                Customer Onboarding &amp; e-KYC Verification
              </h1>
              <p className="text-sm text-slate-300 leading-relaxed">
                Enterprise document due diligence portal built under Bangladesh Bank e-KYC Directives &amp;
                BFIU Master Circular No. 26.
              </p>
            </div>

            {/* Regulatory Notice: Why NO Public Registration */}
            <div className="p-4 rounded-2xl bg-amber-950/50 border border-amber-800/80 space-y-2 text-xs">
              <div className="flex items-center gap-2 font-bold text-amber-300 uppercase tracking-wider">
                <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Zero Public Registration Mandate</span>
              </div>
              <p className="text-amber-100/90 leading-relaxed">
                By Bangladesh Bank regulations, commercial banking accounts <strong>cannot be self-registered</strong>.
                All accounts are provisioned exclusively through authorized branch administration inside the system.
              </p>
            </div>

            {/* Core Security Guarantees */}
            <div className="space-y-2.5 pt-2">
              <div className="flex items-center gap-2.5 text-xs text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>5-attempt brute-force account lockout (HTTP 423)</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Pbkdf2-SHA512 cryptographic password hashing</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Immutable append-only compliance audit ledger</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Internal staff provisioning by Branch Officers</span>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-800/80 text-[11px] text-slate-500 font-mono">
            BANGLADESH FINANCIAL INTELLIGENCE UNIT (BFIU) · COMPLIANCE SIMULATION
          </div>
        </div>

        {/* Right Column (7/12): Login Form & 1-Click Role Fill */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 flex flex-col justify-between shadow-2xl space-y-6">
          <div className="space-y-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white">Officer &amp; Customer Authentication</h2>
              <p className="text-sm text-slate-400 mt-1">
                Enter your authorized credentials or select a demonstration profile below.
              </p>
            </div>

            {error && (
              <div className="p-4 rounded-2xl bg-rose-950/80 border border-rose-800 text-rose-200 text-sm font-medium flex items-start gap-3 animate-in fade-in duration-200">
                <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold">Authentication Refused</div>
                  <div className="text-xs mt-0.5 leading-relaxed">{error}</div>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-200 mb-1.5">
                  Official Email Address
                </label>
                <div className="relative">
                  <Mail className="w-5 h-5 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. admin@bank.com or manager@bank.com"
                    required
                    className="w-full pl-11 pr-4 py-3 text-base bg-slate-950 border border-slate-800 rounded-xl text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-200 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <KeyRound className="w-5 h-5 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    required
                    className="w-full pl-11 pr-4 py-3 text-base bg-slate-950 border border-slate-800 rounded-xl text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 text-base font-bold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded-xl transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 cursor-pointer active:scale-98 mt-2"
              >
                <span>{loading ? 'Verifying Credentials...' : 'Authenticate & Enter Platform'}</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </form>

            {/* 1-Click Demo Account Quick Fill */}
            <div className="pt-4 border-t border-slate-800/80 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                  <span>One-Click Demonstration Credentials</span>
                </span>
                <span className="text-[11px] text-slate-500">Click any role to auto-fill</span>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => handleQuickFill('admin@bank.com', 'Admin@123')}
                  className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-violet-500/80 text-left transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-violet-300">ADMIN</span>
                    <span className="text-[10px] text-slate-500 font-mono">Admin@123</span>
                  </div>
                  <div className="text-xs text-white font-medium truncate mt-0.5">admin@bank.com</div>
                  <div className="text-[11px] text-slate-400 truncate">Chief Systems Officer</div>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickFill('manager@bank.com', 'Manager@123')}
                  className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-blue-500/80 text-left transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-blue-300">MANAGER</span>
                    <span className="text-[10px] text-slate-500 font-mono">Manager@123</span>
                  </div>
                  <div className="text-xs text-white font-medium truncate mt-0.5">manager@bank.com</div>
                  <div className="text-[11px] text-slate-400 truncate">Branch Operations</div>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickFill('auditor@bank.com', 'Auditor@123')}
                  className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-emerald-500/80 text-left transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-300">AUDITOR</span>
                    <span className="text-[10px] text-slate-500 font-mono">Auditor@123</span>
                  </div>
                  <div className="text-xs text-white font-medium truncate mt-0.5">auditor@bank.com</div>
                  <div className="text-[11px] text-slate-400 truncate">Inspection &amp; Compliance</div>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickFill('customer1@bank.com', 'Cust@123')}
                  className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-amber-500/80 text-left transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-300">CUSTOMER</span>
                    <span className="text-[10px] text-slate-500 font-mono">Cust@123</span>
                  </div>
                  <div className="text-xs text-white font-medium truncate mt-0.5">customer1@bank.com</div>
                  <div className="text-[11px] text-slate-400 truncate">Retail Banking Applicant</div>
                </button>
              </div>
            </div>
          </div>

          <div className="text-center text-xs text-slate-500">
            Accounts are provisioned by Branch Administration inside the system upon physical/e-KYC clearance.
          </div>
        </div>
      </div>
    </div>
  );
};
