import React from 'react';
import {
  ShieldCheck,
  Plus,
  BookOpen,
  User,
  Layers,
  History,
  FileCheck2,
  UserPlus,
  Users,
  LogOut,
  Building,
} from 'lucide-react';
import { OnboardingCase } from '../types/kyc';
import { BankUser } from '../types/auth';

interface TopBarProps {
  currentTab: 'overview' | 'workspace' | 'audit';
  onSelectTab: (tab: 'overview' | 'workspace' | 'audit') => void;
  onOpenNewCase: () => void;
  onOpenMethodology: () => void;
  selectedCaseRef?: string;
  cases?: OnboardingCase[];
  selectedCaseId?: string | null;
  onSelectCase?: (caseId: string) => void;
  currentUser: BankUser;
  onLogout: () => void;
  onOpenProvisionModal: () => void;
  onOpenUserDirectoryModal: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  currentTab,
  onSelectTab,
  onOpenNewCase,
  onOpenMethodology,
  selectedCaseRef,
  cases = [],
  selectedCaseId,
  onSelectCase,
  currentUser,
  onLogout,
  onOpenProvisionModal,
  onOpenUserDirectoryModal,
}) => {
  const isStaffManager = currentUser.role === 'admin' || currentUser.role === 'manager';

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return (
          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-violet-950 text-violet-300 border border-violet-800 uppercase tracking-wider">
            ADMIN
          </span>
        );
      case 'manager':
        return (
          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-950 text-blue-300 border border-blue-800 uppercase tracking-wider">
            MANAGER
          </span>
        );
      case 'auditor':
        return (
          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 uppercase tracking-wider">
            AUDITOR
          </span>
        );
      default:
        return (
          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-800 uppercase tracking-wider">
            CUSTOMER
          </span>
        );
    }
  };

  return (
    <header className="border-b border-slate-800 bg-slate-900/95 backdrop-blur-md sticky top-0 z-40 shadow-lg">
      <div className="w-full max-w-[1700px] 2xl:max-w-[1920px] mx-auto px-5 sm:px-8 lg:px-10 py-3.5 flex flex-wrap items-center justify-between gap-4">
        {/* Zone 1: Brand Wordmark & Identity */}
        <div className="flex items-center gap-3.5 shrink-0">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-xl sm:text-2xl font-black tracking-tight text-white font-sans">
                KYC
              </span>
              <span className="text-xs font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-700/80 shadow-sm">
                Core Banking Engine
              </span>
            </div>
            <span className="text-xs text-slate-400 font-medium hidden sm:inline">
              Bangladesh Bank Compliant Customer Onboarding &amp; e-KYC Verification
            </span>
          </div>
        </div>

        {/* Zone 2: Navigation Tabs */}
        <nav className="flex items-center gap-2 sm:gap-3 text-sm font-bold overflow-x-auto py-1">
          <button
            onClick={() => onSelectTab('overview')}
            className={`px-4 sm:px-5 py-2.5 rounded-xl transition-all whitespace-nowrap shrink-0 flex items-center gap-2 cursor-pointer text-sm sm:text-base ${
              currentTab === 'overview'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 font-bold'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
            }`}
          >
            <Layers className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>Cases Queue</span>
            {cases.length > 0 && (
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-mono font-bold ${
                  currentTab === 'overview'
                    ? 'bg-indigo-950 text-indigo-200'
                    : 'bg-slate-800 text-slate-300'
                }`}
              >
                {cases.length}
              </span>
            )}
          </button>

          <button
            onClick={() => onSelectTab('workspace')}
            className={`px-4 sm:px-5 py-2.5 rounded-xl transition-all whitespace-nowrap shrink-0 flex items-center gap-2 cursor-pointer text-sm sm:text-base ${
              currentTab === 'workspace'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 font-bold'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
            }`}
          >
            <FileCheck2 className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>Verification Workspace</span>
            {selectedCaseRef && (
              <span className="font-mono text-xs font-bold text-indigo-200 bg-indigo-950 px-2.5 py-0.5 rounded-md border border-indigo-700/80">
                {selectedCaseRef}
              </span>
            )}
          </button>

          <button
            onClick={() => onSelectTab('audit')}
            className={`px-4 sm:px-5 py-2.5 rounded-xl transition-all whitespace-nowrap shrink-0 flex items-center gap-2 cursor-pointer text-sm sm:text-base ${
              currentTab === 'audit'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 font-bold'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
            }`}
          >
            <History className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>Audit Trail</span>
          </button>

          <button
            onClick={onOpenMethodology}
            className="px-3.5 py-2.5 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800/70 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer text-xs sm:text-sm"
          >
            <BookOpen className="w-4 h-4" />
            <span>BB Guidelines</span>
          </button>
        </nav>

        {/* Zone 3: User Provisioning, Directory, & Authenticated Profile */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Quick Case Switcher */}
          {cases.length > 0 && onSelectCase && (
            <div className="hidden 2xl:flex items-center gap-2 bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 text-xs">
              <span className="text-slate-400 font-medium">Quick Case:</span>
              <select
                value={selectedCaseId || ''}
                onChange={(e) => {
                  if (e.target.value) {
                    onSelectCase(e.target.value);
                  }
                }}
                className="bg-transparent text-slate-200 font-mono font-medium focus:outline-none cursor-pointer max-w-[130px] truncate"
              >
                {cases.map((c) => (
                  <option key={c.id} value={c.id} className="bg-slate-900 text-slate-100">
                    {c.referenceNumber} - {c.declaredData.fullName}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Internal User Provisioning & Directory (Only for Admin / Manager / Auditor) */}
          {isStaffManager && (
            <>
              <button
                onClick={onOpenProvisionModal}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-bold text-indigo-300 bg-indigo-950/90 hover:bg-indigo-900 border border-indigo-700/80 rounded-xl transition-all cursor-pointer shadow-sm active:scale-95 whitespace-nowrap"
                title="Register New User / Staff Provisioning (Inside Software)"
              >
                <UserPlus className="w-4 h-4 text-indigo-400" />
                <span className="hidden md:inline">+ Provision User</span>
              </button>

              <button
                onClick={onOpenUserDirectoryModal}
                className="flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-750 border border-slate-700 rounded-xl transition-all cursor-pointer shadow-sm whitespace-nowrap"
                title="Bank Staff & Users Directory"
              >
                <Users className="w-4 h-4 text-slate-400" />
                <span className="hidden xl:inline">Staff Directory</span>
              </button>
            </>
          )}

          {/* New Case Button */}
          {currentUser.role !== 'auditor' && (
            <button
              onClick={onOpenNewCase}
              className="flex items-center gap-1.5 px-4 sm:px-5 py-2 text-xs sm:text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-all shadow-md shadow-indigo-600/30 whitespace-nowrap shrink-0 cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>New Case</span>
            </button>
          )}

          {/* Authenticated Profile Pill & Logout */}
          <div className="flex items-center gap-2 bg-slate-950/90 border border-slate-800 rounded-2xl p-1.5 pl-3 shadow-inner">
            <div className="flex flex-col text-right pr-1 hidden sm:flex">
              <div className="flex items-center gap-1.5 justify-end">
                <span className="text-xs font-bold text-white truncate max-w-[130px]">
                  {currentUser.fullName}
                </span>
                {getRoleBadge(currentUser.role)}
              </div>
              <span className="text-[10px] text-slate-400 truncate max-w-[150px]">
                {currentUser.branchName}
              </span>
            </div>

            <button
              onClick={onLogout}
              className="p-2 rounded-xl text-slate-400 hover:text-rose-300 hover:bg-rose-950/50 border border-transparent hover:border-rose-900 transition-all cursor-pointer"
              title="Sign Out & Switch Account"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
