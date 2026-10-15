import React, { useState } from 'react';
import {
  Search,
  FileText,
  AlertTriangle,
  Clock,
  CheckCircle2,
  RotateCcw,
  ChevronRight,
  Sparkles,
  ArrowRight,
  Shield,
  FileCheck,
  User,
  Calendar,
  AlertOctagon,
  Eye,
  SlidersHorizontal,
  Info,
  Check,
  Zap,
} from 'lucide-react';
import { OnboardingCase, CaseStatus } from '../types/kyc';

interface OverviewViewProps {
  cases: OnboardingCase[];
  loading: boolean;
  onSelectCase: (caseId: string) => void;
  onOpenNewCase: () => void;
  onQuickLoadScenario: (scenarioId: string) => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  cases,
  loading,
  onSelectCase,
  onOpenNewCase,
  onQuickLoadScenario,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | CaseStatus>('ALL');
  const [showGuide, setShowGuide] = useState(true);

  // Compute Metrics
  const totalCount = cases.length;
  const reviewRequiredCount = cases.filter((c) => c.status === 'REVIEW_REQUIRED').length;
  const inReviewCount = cases.filter((c) => c.status === 'IN_REVIEW').length;
  const approvedCount = cases.filter((c) => c.status === 'APPROVED_BY_REVIEWER').length;
  const returnedCount = cases.filter((c) => c.status === 'RETURNED_FOR_CORRECTION').length;

  const filteredCases = cases.filter((c) => {
    const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter;
    const matchesSearch =
      c.referenceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.declaredData.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.declaredData.documentId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.declaredData.documentType.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const getStatusBadge = (status: CaseStatus) => {
    switch (status) {
      case 'APPROVED_BY_REVIEWER':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold px-3 py-1.5 rounded-lg bg-emerald-950 text-emerald-300 border border-emerald-700/80 shadow-sm">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Approved by Reviewer</span>
          </span>
        );
      case 'REVIEW_REQUIRED':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold px-3 py-1.5 rounded-lg bg-amber-950 text-amber-300 border border-amber-700/80 shadow-sm">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span>Review Required</span>
          </span>
        );
      case 'IN_REVIEW':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold px-3 py-1.5 rounded-lg bg-blue-950 text-blue-300 border border-blue-700/80 shadow-sm">
            <Clock className="w-4 h-4 text-blue-400" />
            <span>In Human Review</span>
          </span>
        );
      case 'RETURNED_FOR_CORRECTION':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold px-3 py-1.5 rounded-lg bg-rose-950 text-rose-300 border border-rose-700/80 shadow-sm">
            <RotateCcw className="w-4 h-4 text-rose-400" />
            <span>Returned for Correction</span>
          </span>
        );
      case 'PROCESSING':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold px-3 py-1.5 rounded-lg bg-indigo-950 text-indigo-300 border border-indigo-700/80 shadow-sm">
            <Clock className="w-4 h-4 text-indigo-400 animate-spin" />
            <span>Processing OCR Pipeline...</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 border border-slate-700">
            <FileText className="w-4 h-4 text-slate-400" />
            <span>Uploaded (Pending OCR)</span>
          </span>
        );
    }
  };

  const getDocTypeLabel = (docType: string) => {
    switch (docType) {
      case 'GENERIC_ID_CARD':
        return 'National ID Card';
      case 'GENERIC_PASSPORT_PAGE':
        return 'Passport Bio Page';
      case 'GENERIC_APPLICATION_FORM':
        return 'Customer Application Form';
      default:
        return docType.replace(/_/g, ' ');
    }
  };

  return (
    <div className="space-y-8 w-full">
      {/* 1. Header Banner & Quick Orientation */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/60 border border-slate-800 rounded-3xl p-6 sm:p-8 lg:p-10 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-950/90 border border-indigo-700 text-indigo-300 text-xs sm:text-sm font-bold uppercase tracking-wider shadow-sm">
              <Shield className="w-4 h-4" />
              <span>Fintech Compliance &amp; Verification Platform</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-tight">
              Customer Onboarding &amp; Document Verification
            </h1>
            <p className="text-base sm:text-lg text-slate-300 leading-relaxed">
              Automated OCR field extraction, cross-referencing against declared applicant data,
              tampering heuristics, and human reviewer case governance in one unified portal.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 shrink-0">
            <button
              onClick={onOpenNewCase}
              className="px-6 py-3.5 text-base font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-2xl transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2.5 cursor-pointer active:scale-95"
            >
              <Zap className="w-5 h-5" />
              <span>+ Create Custom Case</span>
            </button>
          </div>
        </div>

        {/* 3-Step Guided Workflow Bar */}
        {showGuide && (
          <div className="mt-8 pt-6 border-t border-slate-800/90">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-extrabold text-indigo-300 uppercase tracking-wider flex items-center gap-2">
                <Info className="w-4 h-4" />
                <span>How the Verification System Works (3 Simple Steps)</span>
              </span>
              <button
                onClick={() => setShowGuide(false)}
                className="text-xs text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                Dismiss Guide
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-slate-300">
              <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4.5 space-y-2">
                <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm">
                  <span className="w-6 h-6 rounded-full bg-indigo-950 border border-indigo-700 flex items-center justify-center text-xs text-indigo-200">
                    1
                  </span>
                  <span>Select or Submit Case</span>
                </div>
                <p className="text-sm text-slate-300 leading-relaxed">
                  Choose a pre-built test identity below or upload a custom identity document with declared form fields.
                </p>
              </div>

              <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4.5 space-y-2">
                <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm">
                  <span className="w-6 h-6 rounded-full bg-indigo-950 border border-indigo-700 flex items-center justify-center text-xs text-indigo-200">
                    2
                  </span>
                  <span>Automated OCR &amp; Rules Engine</span>
                </div>
                <p className="text-sm text-slate-300 leading-relaxed">
                  Tesseract OCR extracts fields, calculates confidence, checks expiry, and highlights any form discrepancies.
                </p>
              </div>

              <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4.5 space-y-2">
                <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm">
                  <span className="w-6 h-6 rounded-full bg-indigo-950 border border-indigo-700 flex items-center justify-center text-xs text-indigo-200">
                    3
                  </span>
                  <span>Human Reviewer Audit</span>
                </div>
                <p className="text-sm text-slate-300 leading-relaxed">
                  A human reviewer inspects the side-by-side comparison, corrects OCR misreads if needed, and issues approval or returns.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 2. Benchmark Test Scenarios - Big, Clear, One-Click Testing */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
              <Sparkles className="w-6 h-6 text-amber-400" />
              <span>Interactive Benchmark Scenarios (Click to Test Instantly)</span>
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              Test each core verification behavior with authentic synthetic identity templates.
            </p>
          </div>
          <span className="text-xs font-semibold text-slate-400 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl self-start sm:self-auto">
            4 Synthetic Ground-Truth Profiles
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
          {/* Scenario A: Clean Match */}
          <div
            onClick={() => onQuickLoadScenario('sample-alex-mercer')}
            className="bg-slate-900/90 border-2 border-slate-800 hover:border-emerald-500 hover:bg-slate-850 rounded-2xl p-5 sm:p-6 transition-all duration-200 cursor-pointer group flex flex-col justify-between space-y-4 shadow-md hover:shadow-emerald-500/10"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-300 bg-emerald-950 px-3 py-1 rounded-full border border-emerald-800">
                  SCENARIO A
                </span>
                <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Clean Match</span>
                </span>
              </div>
              <h3 className="text-lg font-extrabold text-white group-hover:text-emerald-300 transition-colors">
                Alex Mercer
              </h3>
              <div className="text-xs font-mono text-slate-400 bg-slate-950 p-2.5 rounded-xl border border-slate-800/80">
                <div>Document: National ID Card</div>
                <div>Status: High Quality Scan</div>
              </div>
              <p className="text-sm text-slate-300 leading-relaxed">
                All declared fields match OCR extraction. Passes all core rules with zero flags.
              </p>
            </div>
            <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-sm font-bold text-indigo-400 group-hover:text-emerald-300">
              <span>Test This Case</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1.5" />
            </div>
          </div>

          {/* Scenario B: Expired Flag */}
          <div
            onClick={() => onQuickLoadScenario('sample-elena-vance')}
            className="bg-slate-900/90 border-2 border-slate-800 hover:border-amber-500 hover:bg-slate-850 rounded-2xl p-5 sm:p-6 transition-all duration-200 cursor-pointer group flex flex-col justify-between space-y-4 shadow-md hover:shadow-amber-500/10"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-300 bg-amber-950 px-3 py-1 rounded-full border border-amber-800">
                  SCENARIO B
                </span>
                <span className="text-xs font-bold text-amber-400 flex items-center gap-1">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Expired Flag</span>
                </span>
              </div>
              <h3 className="text-lg font-extrabold text-white group-hover:text-amber-300 transition-colors">
                Elena Vance
              </h3>
              <div className="text-xs font-mono text-slate-400 bg-slate-950 p-2.5 rounded-xl border border-slate-800/80">
                <div>Document: Passport Bio Page</div>
                <div>MRZ: 2 Lines Machine Readable</div>
              </div>
              <p className="text-sm text-slate-300 leading-relaxed">
                Passport expired in 2024. Triggers compliant renewal flag without accusing fraud.
              </p>
            </div>
            <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-sm font-bold text-indigo-400 group-hover:text-amber-300">
              <span>Test This Case</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1.5" />
            </div>
          </div>

          {/* Scenario C: Quality / Blur */}
          <div
            onClick={() => onQuickLoadScenario('sample-taylor-morgan')}
            className="bg-slate-900/90 border-2 border-slate-800 hover:border-sky-500 hover:bg-slate-850 rounded-2xl p-5 sm:p-6 transition-all duration-200 cursor-pointer group flex flex-col justify-between space-y-4 shadow-md hover:shadow-sky-500/10"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-sky-300 bg-sky-950 px-3 py-1 rounded-full border border-sky-800">
                  SCENARIO C
                </span>
                <span className="text-xs font-bold text-sky-400 flex items-center gap-1">
                  <SlidersHorizontal className="w-4 h-4" />
                  <span>Quality Check</span>
                </span>
              </div>
              <h3 className="text-lg font-extrabold text-white group-hover:text-sky-300 transition-colors">
                Taylor Morgan
              </h3>
              <div className="text-xs font-mono text-slate-400 bg-slate-950 p-2.5 rounded-xl border border-slate-800/80">
                <div>Document: National ID (Low Light)</div>
                <div>Condition: Mobile Camera Shadow</div>
              </div>
              <p className="text-sm text-slate-300 leading-relaxed">
                Simulated dark mobile photo. Triggers low contrast and OCR confidence review warnings.
              </p>
            </div>
            <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-sm font-bold text-indigo-400 group-hover:text-sky-300">
              <span>Test This Case</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1.5" />
            </div>
          </div>

          {/* Scenario D: ID Discrepancy */}
          <div
            onClick={() => onQuickLoadScenario('sample-jordan-brooks')}
            className="bg-slate-900/90 border-2 border-slate-800 hover:border-rose-500 hover:bg-slate-850 rounded-2xl p-5 sm:p-6 transition-all duration-200 cursor-pointer group flex flex-col justify-between space-y-4 shadow-md hover:shadow-rose-500/10"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-rose-300 bg-rose-950 px-3 py-1 rounded-full border border-rose-800">
                  SCENARIO D
                </span>
                <span className="text-xs font-bold text-rose-400 flex items-center gap-1">
                  <AlertOctagon className="w-4 h-4" />
                  <span>ID Mismatch</span>
                </span>
              </div>
              <h3 className="text-lg font-extrabold text-white group-hover:text-rose-300 transition-colors">
                Jordan Brooks
              </h3>
              <div className="text-xs font-mono text-slate-400 bg-slate-950 p-2.5 rounded-xl border border-slate-800/80">
                <div>Document: Application Form</div>
                <div>Discrepancy: ID Digit Mismatch</div>
              </div>
              <p className="text-sm text-slate-300 leading-relaxed">
                Declared ID differs from form document. Routes to human auditor for manual resolution.
              </p>
            </div>
            <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-sm font-bold text-indigo-400 group-hover:text-rose-300">
              <span>Test This Case</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1.5" />
            </div>
          </div>
        </div>
      </div>

      {/* 3. KPI Metrics - Large, Bold & High Contrast */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-md space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-sm font-bold">Total Cases</span>
            <FileText className="w-5 h-5 text-indigo-400" />
          </div>
          <div className="text-4xl sm:text-5xl font-black font-mono tabular-nums text-white">
            {totalCount}
          </div>
          <div className="text-xs sm:text-sm text-slate-400 font-medium">All loaded records</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-md space-y-2">
          <div className="flex items-center justify-between text-amber-400">
            <span className="text-sm font-bold">Review Required</span>
            <AlertTriangle className="w-5 h-5 text-amber-400" />
          </div>
          <div className="text-4xl sm:text-5xl font-black font-mono tabular-nums text-amber-400">
            {reviewRequiredCount}
          </div>
          <div className="text-xs sm:text-sm text-slate-400 font-medium">Rule flags to audit</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-md space-y-2">
          <div className="flex items-center justify-between text-blue-400">
            <span className="text-sm font-bold">In Review</span>
            <Clock className="w-5 h-5 text-blue-400" />
          </div>
          <div className="text-4xl sm:text-5xl font-black font-mono tabular-nums text-blue-400">
            {inReviewCount}
          </div>
          <div className="text-xs sm:text-sm text-slate-400 font-medium">Claimed by officers</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-md space-y-2">
          <div className="flex items-center justify-between text-emerald-400">
            <span className="text-sm font-bold">Approved</span>
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="text-4xl sm:text-5xl font-black font-mono tabular-nums text-emerald-400">
            {approvedCount}
          </div>
          <div className="text-xs sm:text-sm text-slate-400 font-medium">Human sign-offs</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-md space-y-2 col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-rose-400">
            <span className="text-sm font-bold">Returned</span>
            <RotateCcw className="w-5 h-5 text-rose-400" />
          </div>
          <div className="text-4xl sm:text-5xl font-black font-mono tabular-nums text-rose-400">
            {returnedCount}
          </div>
          <div className="text-xs sm:text-sm text-slate-400 font-medium">Corrections asked</div>
        </div>
      </div>

      {/* 4. Filter Toolbar & Search - Organized & Roomy */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 shadow-md">
        <div className="relative flex-1 max-w-xl">
          <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search cases by applicant name, reference ID, document..."
            className="w-full pl-12 pr-4 py-3 text-sm sm:text-base bg-slate-950 border border-slate-800 rounded-2xl text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 shadow-inner"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto py-1">
          <button
            onClick={() => setStatusFilter('ALL')}
            className={`px-4 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
              statusFilter === 'ALL'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            All Cases ({cases.length})
          </button>
          <button
            onClick={() => setStatusFilter('REVIEW_REQUIRED')}
            className={`px-4 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
              statusFilter === 'REVIEW_REQUIRED'
                ? 'bg-amber-950 text-amber-300 border border-amber-800 shadow-md'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            Review Required ({reviewRequiredCount})
          </button>
          <button
            onClick={() => setStatusFilter('IN_REVIEW')}
            className={`px-4 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
              statusFilter === 'IN_REVIEW'
                ? 'bg-blue-950 text-blue-300 border border-blue-800 shadow-md'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            In Review ({inReviewCount})
          </button>
          <button
            onClick={() => setStatusFilter('APPROVED_BY_REVIEWER')}
            className={`px-4 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
              statusFilter === 'APPROVED_BY_REVIEWER'
                ? 'bg-emerald-950 text-emerald-300 border border-emerald-800 shadow-md'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            Approved ({approvedCount})
          </button>
          <button
            onClick={() => setStatusFilter('RETURNED_FOR_CORRECTION')}
            className={`px-4 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
              statusFilter === 'RETURNED_FOR_CORRECTION'
                ? 'bg-rose-950 text-rose-300 border border-rose-800 shadow-md'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            Returned ({returnedCount})
          </button>
        </div>
      </div>

      {/* 5. Cases Data Queue - Full-width, Clear, High Legibility */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="p-5 sm:p-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-indigo-400" />
            <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
              Case Verification Queue
            </h2>
          </div>
          <span className="text-xs sm:text-sm text-slate-400 font-mono">
            Showing {filteredCases.length} of {cases.length} cases
          </span>
        </div>

        {loading ? (
          <div className="p-20 text-center text-slate-400 text-base space-y-4">
            <Clock className="w-10 h-10 animate-spin mx-auto text-indigo-400" />
            <div className="text-lg font-bold text-slate-200">Loading Onboarding Cases...</div>
          </div>
        ) : filteredCases.length === 0 ? (
          <div className="p-16 text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
              <FileText className="w-8 h-8" />
            </div>
            <div className="text-xl font-bold text-white">No onboarding cases match your search</div>
            <p className="text-sm text-slate-400 max-w-md mx-auto">
              Try adjusting your search criteria or click any of the 4 benchmark test scenarios above to inspect the verification workflow.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('ALL');
              }}
              className="px-6 py-2.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-all cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse text-sm sm:text-base">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/80 text-slate-400 uppercase tracking-wider font-bold text-xs sm:text-sm">
                  <th className="py-5 px-6">Case Reference</th>
                  <th className="py-5 px-6">Applicant Name</th>
                  <th className="py-5 px-6">Document Type</th>
                  <th className="py-5 px-6">Status</th>
                  <th className="py-5 px-6 text-center">Extracted Fields</th>
                  <th className="py-5 px-6 text-center">Compliance Flags</th>
                  <th className="py-5 px-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 text-slate-200">
                {filteredCases.map((c) => {
                  const flags = c.validationResults.filter(
                    (r) => r.outcome === 'REVIEW_REQUIRED'
                  );
                  const flagsCount = flags.length;
                  const extractedCount = c.extractedFields.length;

                  return (
                    <tr
                      key={c.id}
                      onClick={() => onSelectCase(c.id)}
                      className="hover:bg-slate-850/80 transition-colors cursor-pointer group"
                    >
                      <td className="py-5 px-6">
                        <div className="font-mono font-bold text-indigo-300 text-sm sm:text-base">
                          {c.referenceNumber}
                        </div>
                        <div className="text-xs text-slate-400 font-mono mt-0.5">
                          ID: {c.declaredData.documentId}
                        </div>
                      </td>

                      <td className="py-5 px-6">
                        <div className="font-bold text-white text-base sm:text-lg">
                          {c.declaredData.fullName}
                        </div>
                        <div className="text-xs sm:text-sm text-slate-400 font-mono mt-0.5">
                          DOB: {c.declaredData.dateOfBirth} · {c.declaredData.nationality || 'Horizon'}
                        </div>
                      </td>

                      <td className="py-5 px-6 text-slate-300 font-medium">
                        <div className="text-sm sm:text-base text-slate-200 font-semibold">
                          {getDocTypeLabel(c.declaredData.documentType)}
                        </div>
                        <div className="text-xs text-slate-400">
                          {c.documents[0]?.fileName || 'Document Scan'}
                        </div>
                      </td>

                      <td className="py-5 px-6 whitespace-nowrap">
                        {getStatusBadge(c.status)}
                      </td>

                      <td className="py-5 px-6 text-center font-mono">
                        {extractedCount > 0 ? (
                          <span className="font-bold text-sm text-indigo-300 bg-indigo-950/80 px-3 py-1 rounded-lg border border-indigo-700/80">
                            {extractedCount} fields
                          </span>
                        ) : (
                          <span className="text-slate-500 text-sm">—</span>
                        )}
                      </td>

                      <td className="py-5 px-6 text-center">
                        {flagsCount > 0 ? (
                          <div className="inline-flex items-center gap-1.5 font-bold text-xs sm:text-sm text-amber-300 bg-amber-950 px-3 py-1 rounded-lg border border-amber-700">
                            <AlertTriangle className="w-4 h-4 text-amber-400" />
                            <span>{flagsCount} flags</span>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1 font-bold text-xs sm:text-sm text-emerald-300 bg-emerald-950 px-3 py-1 rounded-lg border border-emerald-700">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            <span>Passed</span>
                          </div>
                        )}
                      </td>

                      <td className="py-5 px-6 text-right whitespace-nowrap">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectCase(c.id);
                          }}
                          className="inline-flex items-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-all shadow-md shadow-indigo-600/30 cursor-pointer active:scale-95 group-hover:scale-105"
                        >
                          <span>Open Review</span>
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
