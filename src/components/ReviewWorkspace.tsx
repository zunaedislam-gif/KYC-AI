import React, { useState } from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Clock,
  RotateCcw,
  Eye,
  EyeOff,
  Edit3,
  FileText,
  UserCheck,
  Send,
  MessageSquare,
  Sparkles,
  Info,
  Maximize2,
  Sliders,
  History,
  Check,
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronRight,
  Download,
  ShieldAlert,
  SlidersHorizontal,
  CheckCheck,
} from 'lucide-react';
import {
  OnboardingCase,
  ExtractedField,
  ValidationRuleResult,
  TamperIndicator,
  CaseStatus,
} from '../types/kyc';

interface ReviewWorkspaceProps {
  currentCase: OnboardingCase;
  reviewerId: string;
  onRunOcr: (caseId: string) => Promise<void>;
  onCorrectField: (field: ExtractedField) => void;
  onDecision: (
    decision: 'APPROVE' | 'RETURN_FOR_CORRECTION' | 'CLAIM_REVIEW',
    notes: string
  ) => Promise<void>;
  onAddNote: (text: string) => Promise<void>;
  onViewHistory: () => void;
  allCases?: OnboardingCase[];
  onSelectCase?: (caseId: string) => void;
}

export const ReviewWorkspace: React.FC<ReviewWorkspaceProps> = ({
  currentCase,
  reviewerId,
  onRunOcr,
  onCorrectField,
  onDecision,
  onAddNote,
  onViewHistory,
  allCases = [],
  onSelectCase,
}) => {
  const [activeWorkspaceTab, setActiveWorkspaceTab] = useState<
    'split' | 'fields' | 'rules' | 'heuristics' | 'notes'
  >('split');
  const [unmaskSensitive, setUnmaskSensitive] = useState(false);
  const [imageFilter, setImageFilter] = useState<'normal' | 'grayscale' | 'contrast' | 'edges'>(
    'normal'
  );
  const [zoomLevel, setZoomLevel] = useState(1);
  const [highlightedField, setHighlightedField] = useState<string | null>(null);
  const [noteText, setNoteText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showReturnDialog, setShowReturnDialog] = useState(false);
  const [decisionNotes, setDecisionNotes] = useState('');
  const [submittingDecision, setSubmittingDecision] = useState(false);

  const documentMeta = currentCase.documents[0];

  // Case navigation index
  const currentIndex = allCases.findIndex((c) => c.id === currentCase.id);
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex >= 0 && currentIndex < allCases.length - 1;

  const handlePrevCase = () => {
    if (hasPrev && onSelectCase) {
      onSelectCase(allCases[currentIndex - 1].id);
    }
  };

  const handleNextCase = () => {
    if (hasNext && onSelectCase) {
      onSelectCase(allCases[currentIndex + 1].id);
    }
  };

  const handleExportDossier = () => {
    const dossier = {
      exportTimestamp: new Date().toISOString(),
      platform: 'KYC-AI Intelligent Customer Onboarding and Document Verification',
      caseReference: currentCase.referenceNumber,
      status: currentCase.status,
      assignedReviewer: currentCase.assignedReviewerId || 'Unassigned',
      applicantDeclaredData: currentCase.declaredData,
      extractedFields: currentCase.extractedFields,
      validationRules: currentCase.validationResults,
      tamperingHeuristics: currentCase.tamperingIndicators,
      reviewNotes: currentCase.reviewNotes,
      documentMetadata: currentCase.documents.map((d) => ({
        id: d.id,
        fileName: d.fileName,
        mimeType: d.mimeType,
        sizeBytes: d.fileSizeBytes,
        qualityScore: d.qualityScore,
        preprocessingNotes: d.preprocessingNotes,
      })),
      complianceNotice:
        'Compliance-support demonstration simulation. Does not constitute official regulatory verification.',
    };

    const blob = new Blob([JSON.stringify(dossier, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentCase.referenceNumber}_compliance_dossier.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleRunOcrClick = async () => {
    setIsProcessing(true);
    try {
      await onRunOcr(currentCase.id);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAddNoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteText.trim()) return;
    await onAddNote(noteText.trim());
    setNoteText('');
  };

  const handleApproveConfirm = async () => {
    setSubmittingDecision(true);
    try {
      await onDecision('APPROVE', decisionNotes || 'Approved demonstration onboarding workflow.');
      setShowApproveDialog(false);
      setDecisionNotes('');
    } finally {
      setSubmittingDecision(false);
    }
  };

  const handleReturnConfirm = async () => {
    if (!decisionNotes.trim()) return;
    setSubmittingDecision(true);
    try {
      await onDecision('RETURN_FOR_CORRECTION', decisionNotes);
      setShowReturnDialog(false);
      setDecisionNotes('');
    } finally {
      setSubmittingDecision(false);
    }
  };

  const maskString = (val?: string) => {
    if (!val) return '—';
    if (unmaskSensitive) return val;
    if (val.length <= 4) return '***';
    return `${val.slice(0, 2)}${'*'.repeat(Math.max(val.length - 4, 3))}${val.slice(-2)}`;
  };

  const getStatusColor = (status: CaseStatus) => {
    switch (status) {
      case 'APPROVED_BY_REVIEWER':
        return 'text-emerald-300 bg-emerald-950 border-emerald-700';
      case 'REVIEW_REQUIRED':
        return 'text-amber-300 bg-amber-950 border-amber-700';
      case 'IN_REVIEW':
        return 'text-blue-300 bg-blue-950 border-blue-700';
      case 'RETURNED_FOR_CORRECTION':
        return 'text-rose-300 bg-rose-950 border-rose-700';
      case 'PROCESSING':
        return 'text-indigo-300 bg-indigo-950 border-indigo-700';
      default:
        return 'text-slate-300 bg-slate-900 border-slate-700';
    }
  };

  // Find corresponding declared value for comparison
  const getDeclaredValueForField = (fieldName: string) => {
    const fn = fieldName.toLowerCase();
    if (fn.includes('name')) return currentCase.declaredData.fullName;
    if (fn.includes('birth') || fn === 'dob') return currentCase.declaredData.dateOfBirth;
    if (fn.includes('id') || fn.includes('number') || fn.includes('passport'))
      return currentCase.declaredData.documentId;
    if (fn.includes('country') || fn.includes('national'))
      return currentCase.declaredData.nationality || 'Republic of Horizon';
    return '—';
  };

  const totalFlags = currentCase.validationResults.filter(
    (r) => r.outcome === 'REVIEW_REQUIRED'
  ).length;

  const passedChecks = currentCase.validationResults.filter((r) => r.outcome === 'PASS').length;

  return (
    <div className="space-y-6 w-full">
      {/* 1. Case Header & Action Command Center */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Left: Case Info & Metadata */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-mono text-2xl sm:text-3xl font-black text-white tracking-tight">
                {currentCase.referenceNumber}
              </span>
              <span
                className={`text-xs sm:text-sm px-3.5 py-1.5 rounded-xl border font-bold uppercase tracking-wider shadow-sm ${getStatusColor(
                  currentCase.status
                )}`}
              >
                {currentCase.status.replace(/_/g, ' ')}
              </span>
              {currentCase.status === 'REVIEW_REQUIRED' && (
                <span className="text-xs sm:text-sm font-bold text-amber-300 bg-amber-950/80 px-3 py-1.5 rounded-xl border border-amber-800 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  <span>{totalFlags} Review Flag{totalFlags > 1 ? 's' : ''} Detected</span>
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-sm sm:text-base text-slate-300 font-medium">
              <span className="flex items-center gap-2">
                <span className="text-slate-400">Applicant:</span>
                <strong className="text-white font-bold text-base sm:text-lg">
                  {currentCase.declaredData.fullName}
                </strong>
              </span>
              <span aria-hidden="true" className="text-slate-700">·</span>
              <span className="flex items-center gap-2">
                <span className="text-slate-400">Declared ID:</span>
                <strong className="font-mono text-indigo-200">
                  {maskString(currentCase.declaredData.documentId)}
                </strong>
              </span>
              <span aria-hidden="true" className="text-slate-700">·</span>
              <span className="flex items-center gap-2">
                <span className="text-slate-400">Document:</span>
                <strong className="text-slate-200">
                  {currentCase.declaredData.documentType.replace(/_/g, ' ')}
                </strong>
              </span>
              <span aria-hidden="true" className="text-slate-700">·</span>
              <span className="flex items-center gap-2">
                <span className="text-slate-400">Reviewer:</span>
                <strong className="font-mono text-emerald-300">
                  {currentCase.assignedReviewerId || reviewerId}
                </strong>
              </span>
            </div>
          </div>

          {/* Right: Primary Case Reviewer Actions */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Prev / Next Case Navigation */}
            {allCases.length > 1 && (
              <div className="flex items-center bg-slate-950 border border-slate-800 rounded-2xl p-1 text-xs">
                <button
                  onClick={handlePrevCase}
                  disabled={!hasPrev}
                  className="px-3 py-2 rounded-xl text-slate-300 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1 font-semibold"
                  title="Previous Case"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span className="hidden sm:inline">Prev</span>
                </button>
                <span className="px-2 font-mono text-slate-400 text-xs">
                  {currentIndex + 1} / {allCases.length}
                </span>
                <button
                  onClick={handleNextCase}
                  disabled={!hasNext}
                  className="px-3 py-2 rounded-xl text-slate-300 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1 font-semibold"
                  title="Next Case"
                >
                  <span className="hidden sm:inline">Next</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Mask/Unmask Sensitive Data */}
            <button
              onClick={() => setUnmaskSensitive(!unmaskSensitive)}
              className="flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-bold text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-700 transition-all cursor-pointer shadow-sm"
            >
              {unmaskSensitive ? (
                <>
                  <EyeOff className="w-4 h-4 text-slate-400" />
                  <span>Mask PII</span>
                </>
              ) : (
                <>
                  <Eye className="w-4 h-4 text-slate-400" />
                  <span>Reveal PII</span>
                </>
              )}
            </button>

            {/* Run / Re-run OCR */}
            <button
              onClick={handleRunOcrClick}
              disabled={isProcessing}
              className="flex items-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded-xl transition-all shadow-md shadow-indigo-600/30 cursor-pointer active:scale-95"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isProcessing ? 'Running OCR...' : 'Re-run OCR'}</span>
            </button>

            {/* Return for Correction */}
            <button
              onClick={() => setShowReturnDialog(true)}
              className="flex items-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-bold text-rose-200 bg-rose-950 hover:bg-rose-900 rounded-xl border border-rose-800 transition-all cursor-pointer shadow-sm active:scale-95"
            >
              <RotateCcw className="w-4 h-4 text-rose-400" />
              <span>Return for Correction</span>
            </button>

            {/* Approve Case */}
            <button
              onClick={() => setShowApproveDialog(true)}
              className="flex items-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-bold text-emerald-200 bg-emerald-950 hover:bg-emerald-900 rounded-xl border border-emerald-800 transition-all cursor-pointer shadow-sm active:scale-95"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Approve (Simulation)</span>
            </button>

            {/* Export Dossier */}
            <button
              onClick={handleExportDossier}
              className="flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-300 hover:text-white bg-slate-800 rounded-xl border border-slate-700 transition-all cursor-pointer shadow-sm"
              title="Download Compliance Audit Dossier"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Export</span>
            </button>
          </div>
        </div>

        {/* Quick Verification Status Pill Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-slate-800 text-sm">
          <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-3.5 flex items-center justify-between">
            <span className="text-slate-400 font-medium">Extracted Fields:</span>
            <span className="font-mono font-bold text-indigo-300">
              {currentCase.extractedFields.length} fields
            </span>
          </div>

          <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-3.5 flex items-center justify-between">
            <span className="text-slate-400 font-medium">Compliance Outcome:</span>
            <span
              className={`font-bold flex items-center gap-1.5 ${
                totalFlags > 0 ? 'text-amber-400' : 'text-emerald-400'
              }`}
            >
              {totalFlags > 0 ? (
                <>
                  <AlertTriangle className="w-4 h-4" />
                  <span>{totalFlags} Flag{totalFlags > 1 ? 's' : ''}</span>
                </>
              ) : (
                <>
                  <CheckCheck className="w-4 h-4" />
                  <span>Passed ({passedChecks} rules)</span>
                </>
              )}
            </span>
          </div>

          <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-3.5 flex items-center justify-between">
            <span className="text-slate-400 font-medium">Document Scan Score:</span>
            <span className="font-mono font-bold text-emerald-400">
              {documentMeta?.qualityScore || 85}/100
            </span>
          </div>

          <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-3.5 flex items-center justify-between">
            <span className="text-slate-400 font-medium">Tampering Check:</span>
            <span className="font-mono font-bold text-slate-200">
              {currentCase.tamperingIndicators[0]?.flag || 'NORMAL'}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Workspace View Switcher Tabs - Clear, Large, Intuitive */}
      <div className="flex items-center gap-2 overflow-x-auto border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveWorkspaceTab('split')}
          className={`px-5 py-3 rounded-2xl text-sm sm:text-base font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeWorkspaceTab === 'split'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'text-slate-300 hover:text-white hover:bg-slate-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Side-by-Side Review Workspace</span>
        </button>

        <button
          onClick={() => setActiveWorkspaceTab('rules')}
          className={`px-5 py-3 rounded-2xl text-sm sm:text-base font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeWorkspaceTab === 'rules'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'text-slate-300 hover:text-white hover:bg-slate-800'
          }`}
        >
          <AlertTriangle className="w-4 h-4 text-amber-400" />
          <span>Compliance Rules ({currentCase.validationResults.length})</span>
          {totalFlags > 0 && (
            <span className="bg-amber-950 text-amber-300 border border-amber-800 text-xs px-2 py-0.5 rounded-full font-mono">
              {totalFlags} flags
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveWorkspaceTab('heuristics')}
          className={`px-5 py-3 rounded-2xl text-sm sm:text-base font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeWorkspaceTab === 'heuristics'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'text-slate-300 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Sliders className="w-4 h-4 text-slate-300" />
          <span>Image Forensics &amp; Tampering</span>
        </button>

        <button
          onClick={() => setActiveWorkspaceTab('notes')}
          className={`px-5 py-3 rounded-2xl text-sm sm:text-base font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeWorkspaceTab === 'notes'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'text-slate-300 hover:text-white hover:bg-slate-800'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Reviewer Notes ({currentCase.reviewNotes.length})</span>
        </button>
      </div>

      {/* 3. Main Workspace Display Area */}
      {/* VIEW MODE 1: SPLIT VIEW (DEFAULT) */}
      {(activeWorkspaceTab === 'split' || activeWorkspaceTab === 'fields') && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column (5/12): Document Inspector */}
          <div className="lg:col-span-5 space-y-5">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <FileText className="w-5 h-5 text-indigo-400" />
                  <h3 className="text-base sm:text-lg font-black text-white">
                    Document Specimen Inspection
                  </h3>
                </div>

                {/* Preprocessing and Filter Controls */}
                <div className="flex items-center gap-1 bg-slate-950 p-1.5 rounded-xl border border-slate-800 text-xs">
                  <button
                    onClick={() => setImageFilter('normal')}
                    className={`px-3 py-1 rounded-lg font-bold cursor-pointer transition-all ${
                      imageFilter === 'normal'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Raw Scan
                  </button>
                  <button
                    onClick={() => setImageFilter('grayscale')}
                    className={`px-3 py-1 rounded-lg font-bold cursor-pointer transition-all ${
                      imageFilter === 'grayscale'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Grayscale
                  </button>
                  <button
                    onClick={() => setImageFilter('contrast')}
                    className={`px-3 py-1 rounded-lg font-bold cursor-pointer transition-all ${
                      imageFilter === 'contrast'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    High Contrast
                  </button>
                  <button
                    onClick={() => setImageFilter('edges')}
                    className={`px-3 py-1 rounded-lg font-bold cursor-pointer transition-all ${
                      imageFilter === 'edges'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Edge Map
                  </button>
                </div>
              </div>

              {/* Document Viewer Frame with Bounding Box Overlay */}
              <div className="relative rounded-2xl border-2 border-slate-800 bg-slate-950 p-3 overflow-hidden min-h-[360px] flex items-center justify-center shadow-inner">
                {documentMeta?.dataUrl ? (
                  <div className="relative w-full overflow-hidden flex justify-center">
                    <div
                      style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'top center' }}
                      className={`w-full transition-all duration-200 ${
                        imageFilter === 'grayscale'
                          ? 'grayscale contrast-125'
                          : imageFilter === 'contrast'
                          ? 'grayscale contrast-[350%] brightness-85'
                          : imageFilter === 'edges'
                          ? 'invert contrast-[300%] grayscale hue-rotate-180'
                          : ''
                      }`}
                    >
                      <img
                        src={documentMeta.dataUrl}
                        alt="Document Specimen"
                        className="w-full h-auto max-h-[500px] object-contain rounded-xl shadow-lg mx-auto"
                      />
                    </div>

                    {/* Interactive Spatial Bounding Box Overlays */}
                    {currentCase.extractedFields.map((f) => {
                      if (!f.boundingBox) return null;
                      const isHovered = highlightedField === f.fieldName;
                      const docWidth = documentMeta.width || 850;
                      const docHeight = documentMeta.height || 540;

                      const left = `${(f.boundingBox.x0 / docWidth) * 100}%`;
                      const top = `${(f.boundingBox.y0 / docHeight) * 100}%`;
                      const width = `${((f.boundingBox.x1 - f.boundingBox.x0) / docWidth) * 100}%`;
                      const height = `${((f.boundingBox.y1 - f.boundingBox.y0) / docHeight) * 100}%`;

                      return (
                        <div
                          key={f.fieldName}
                          style={{ left, top, width, height }}
                          className={`absolute pointer-events-none transition-all duration-200 rounded-lg border-2 ${
                            isHovered
                              ? 'border-indigo-400 bg-indigo-500/30 shadow-lg shadow-indigo-500/50 z-20 ring-4 ring-indigo-400/40'
                              : 'border-indigo-500/40 bg-indigo-500/10'
                          }`}
                        >
                          {isHovered && (
                            <div className="absolute -top-7 left-0 bg-indigo-600 text-white font-mono text-xs font-bold px-2 py-0.5 rounded-md shadow-md whitespace-nowrap z-30">
                              {f.fieldName}: {f.confidence !== null ? `${f.confidence}%` : 'Extracted'}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center p-12 text-slate-500 text-sm">
                    <FileText className="w-10 h-10 mx-auto mb-3 opacity-40" />
                    <span>No document specimen preview available</span>
                  </div>
                )}
              </div>

              {/* Preprocessing Diagnostics & File Specs */}
              {documentMeta && (
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-2 text-xs sm:text-sm">
                  <div className="flex items-center justify-between text-slate-300 font-medium">
                    <span>Specimen File: <strong className="text-white">{documentMeta.fileName}</strong></span>
                    <span className="font-mono text-slate-400">
                      {(documentMeta.fileSizeBytes / 1024).toFixed(1)} KB
                    </span>
                  </div>
                  {documentMeta.qualityScore !== undefined && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Image Quality Index:</span>
                      <span
                        className={`font-mono font-bold ${
                          documentMeta.qualityScore >= 70 ? 'text-emerald-400' : 'text-amber-400'
                        }`}
                      >
                        {documentMeta.qualityScore}/100 (Heuristic Sharpness &amp; Contrast)
                      </span>
                    </div>
                  )}
                  {documentMeta.preprocessingNotes &&
                    documentMeta.preprocessingNotes.length > 0 && (
                      <div className="pt-2 border-t border-slate-800 space-y-1 text-xs text-slate-400 font-mono">
                        {documentMeta.preprocessingNotes.map((note, idx) => (
                          <div key={idx} className="flex items-start gap-2">
                            <span className="text-indigo-400 font-bold">›</span>
                            <span>{note}</span>
                          </div>
                        ))}
                      </div>
                    )}
                </div>
              )}
            </div>
          </div>

          {/* Right Column (7/12): Side-by-Side Field Cross-Check */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5">
                    <ShieldCheck className="w-6 h-6 text-indigo-400" />
                    <h3 className="text-lg sm:text-xl font-black text-white">
                      Declared Form vs. OCR Extracted Fields
                    </h3>
                  </div>
                  <p className="text-sm text-slate-400">
                    Compare declared customer application entries against neural OCR readouts.
                  </p>
                </div>
                <div className="text-xs sm:text-sm text-slate-400 bg-slate-950 px-3.5 py-1.5 rounded-xl border border-slate-800">
                  Engine: <span className="font-mono text-indigo-300 font-bold">Tesseract OCR</span>
                </div>
              </div>

              {currentCase.extractedFields.length === 0 ? (
                <div className="p-12 text-center bg-slate-950 rounded-2xl border border-slate-800 space-y-3 text-slate-400">
                  <Clock className="w-8 h-8 mx-auto text-indigo-400 animate-pulse" />
                  <div className="text-base font-bold text-white">No fields extracted yet</div>
                  <p className="text-sm">Click below to run automated optical character recognition.</p>
                  <button
                    onClick={handleRunOcrClick}
                    className="px-5 py-2.5 text-sm font-bold text-white bg-indigo-600 rounded-xl cursor-pointer shadow-md"
                  >
                    Run OCR Extraction Now
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto w-full">
                  <table className="w-full text-left text-sm sm:text-base border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 bg-slate-950/80 text-slate-400 uppercase tracking-wider text-xs sm:text-sm font-bold">
                        <th className="py-4 px-5">Field Name</th>
                        <th className="py-4 px-5">Declared Entry</th>
                        <th className="py-4 px-5">OCR Extracted</th>
                        <th className="py-4 px-5 text-center">Confidence</th>
                        <th className="py-4 px-5 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {currentCase.extractedFields.map((field) => {
                        const declaredVal = getDeclaredValueForField(field.fieldName);
                        const isLowConfidence =
                          field.confidence !== null && field.confidence < 65;
                        const isHovered = highlightedField === field.fieldName;
                        const extractedVal = field.normalizedValue || field.rawValue || '';

                        // Determine if there is a mismatch
                        const hasMismatch =
                          declaredVal !== '—' &&
                          extractedVal &&
                          declaredVal.toLowerCase().replace(/[^a-z0-9]/g, '') !==
                            extractedVal.toLowerCase().replace(/[^a-z0-9]/g, '');

                        return (
                          <tr
                            key={field.fieldName}
                            onMouseEnter={() => setHighlightedField(field.fieldName)}
                            onMouseLeave={() => setHighlightedField(null)}
                            className={`transition-colors cursor-pointer ${
                              isHovered
                                ? 'bg-indigo-950/40'
                                : hasMismatch
                                ? 'bg-amber-950/20 hover:bg-amber-950/30'
                                : 'hover:bg-slate-850/60'
                            }`}
                          >
                            <td className="py-4.5 px-5">
                              <div className="font-mono font-bold text-white text-sm sm:text-base">
                                {field.fieldName}
                              </div>
                              <div className="text-xs text-slate-400 mt-0.5">
                                Zone: {field.sourceReference || 'Visual Zone'}
                              </div>
                            </td>

                            <td className="py-4.5 px-5 font-mono text-slate-300 text-sm sm:text-base font-semibold">
                              {field.fieldName.includes('id') || field.fieldName.includes('name')
                                ? maskString(declaredVal)
                                : declaredVal}
                            </td>

                            <td className="py-4.5 px-5">
                              <div className="font-mono font-bold text-white text-sm sm:text-base flex items-center gap-2">
                                <span
                                  className={
                                    hasMismatch
                                      ? 'text-amber-300 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-800'
                                      : 'text-white'
                                  }
                                >
                                  {field.fieldName.includes('id') ||
                                  field.fieldName.includes('name')
                                    ? maskString(extractedVal)
                                    : extractedVal || '[MISSING / BLANK]'}
                                </span>
                                {field.isCorrected && (
                                  <span className="text-xs font-bold text-amber-300 bg-amber-950 px-2 py-0.5 rounded border border-amber-800 uppercase">
                                    CORRECTED
                                  </span>
                                )}
                              </div>
                              {hasMismatch && (
                                <div className="text-xs font-bold text-amber-400 flex items-center gap-1 mt-1">
                                  <AlertTriangle className="w-3.5 h-3.5" />
                                  <span>Mismatch with declared form</span>
                                </div>
                              )}
                              {field.reviewWarning && !hasMismatch && (
                                <div className="text-xs text-amber-400 font-medium mt-1">
                                  {field.reviewWarning}
                                </div>
                              )}
                            </td>

                            <td className="py-4.5 px-5 text-center">
                              {field.confidence !== null ? (
                                <div className="flex flex-col items-center">
                                  <span
                                    className={`font-mono text-sm sm:text-base font-bold tabular-nums ${
                                      isLowConfidence ? 'text-amber-400' : 'text-emerald-400'
                                    }`}
                                  >
                                    {field.confidence}%
                                  </span>
                                  <div className="w-20 h-2 bg-slate-800 rounded-full overflow-hidden mt-1.5">
                                    <div
                                      className={`h-full ${
                                        isLowConfidence ? 'bg-amber-400' : 'bg-emerald-400'
                                      }`}
                                      style={{ width: `${field.confidence}%` }}
                                    />
                                  </div>
                                </div>
                              ) : (
                                <span className="text-slate-500 text-xs font-mono">N/A</span>
                              )}
                            </td>

                            <td className="py-4.5 px-5 text-right whitespace-nowrap">
                              <button
                                onClick={() => onCorrectField(field)}
                                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-bold text-slate-100 hover:text-white bg-slate-800 hover:bg-indigo-600 rounded-xl transition-all shadow-sm cursor-pointer active:scale-95"
                              >
                                <Edit3 className="w-4 h-4 text-indigo-400" />
                                <span>Correct</span>
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

            {/* Quick Section: Active Compliance Rule Flags Preview */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <AlertTriangle className="w-5 h-5 text-amber-400" />
                  <h3 className="text-base sm:text-lg font-black text-white">
                    Compliance Rules Engine Outcome
                  </h3>
                </div>
                <button
                  onClick={() => setActiveWorkspaceTab('rules')}
                  className="text-xs sm:text-sm text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-1 cursor-pointer"
                >
                  <span>View All ({currentCase.validationResults.length})</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3">
                {currentCase.validationResults.slice(0, 3).map((rule) => {
                  const isPass = rule.outcome === 'PASS';
                  const isReviewRequired = rule.outcome === 'REVIEW_REQUIRED';

                  return (
                    <div
                      key={rule.ruleId}
                      className={`p-4 rounded-2xl border transition-colors ${
                        isPass
                          ? 'bg-slate-950/70 border-slate-800'
                          : 'bg-amber-950/30 border-amber-800'
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          {isPass ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                          ) : (
                            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
                          )}
                          <span className="text-sm sm:text-base font-bold text-white">
                            {rule.ruleTitle}
                          </span>
                        </div>
                        <span
                          className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider ${
                            isPass
                              ? 'text-emerald-300 bg-emerald-950 border border-emerald-800'
                              : 'text-amber-300 bg-amber-950 border border-amber-800'
                          }`}
                        >
                          {rule.outcome.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <p className="text-sm text-slate-300 mt-2 leading-relaxed">
                        {rule.explanation}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW MODE 2: COMPLIANCE RULES CHECKLIST TAB */}
      {activeWorkspaceTab === 'rules' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
            <div className="space-y-1">
              <h3 className="text-xl sm:text-2xl font-black text-white flex items-center gap-3">
                <AlertTriangle className="w-6 h-6 text-amber-400" />
                <span>Deterministic Compliance Rules Engine Checklist</span>
              </h3>
              <p className="text-sm sm:text-base text-slate-300">
                A mismatch is a <strong className="text-amber-300 underline font-bold">review flag</strong> for
                human attention, never proof of fraud.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs sm:text-sm font-bold text-emerald-300 bg-emerald-950 px-3.5 py-1.5 rounded-xl border border-emerald-800">
                {passedChecks} Passed
              </span>
              <span className="text-xs sm:text-sm font-bold text-amber-300 bg-amber-950 px-3.5 py-1.5 rounded-xl border border-amber-800">
                {totalFlags} Review Flag{totalFlags > 1 ? 's' : ''}
              </span>
            </div>
          </div>

          <div className="space-y-4">
            {currentCase.validationResults.map((rule) => {
              const isPass = rule.outcome === 'PASS';
              const isReviewRequired = rule.outcome === 'REVIEW_REQUIRED';

              return (
                <div
                  key={rule.ruleId}
                  className={`p-6 rounded-2xl border transition-all ${
                    isPass
                      ? 'bg-slate-950/70 border-slate-800'
                      : isReviewRequired
                      ? 'bg-amber-950/30 border-amber-700 shadow-md'
                      : 'bg-slate-950/50 border-slate-800'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {isPass ? (
                        <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
                      ) : isReviewRequired ? (
                        <AlertTriangle className="w-6 h-6 text-amber-400 shrink-0" />
                      ) : (
                        <Info className="w-6 h-6 text-slate-400 shrink-0" />
                      )}
                      <div>
                        <div className="text-base sm:text-lg font-bold text-white">
                          {rule.ruleTitle}
                        </div>
                        <div className="text-xs font-mono text-slate-400">Rule ID: {rule.ruleId}</div>
                      </div>
                    </div>

                    <span
                      className={`text-xs sm:text-sm font-bold px-3.5 py-1.5 rounded-xl uppercase tracking-wider ${
                        isPass
                          ? 'text-emerald-300 bg-emerald-950 border border-emerald-800'
                          : 'text-amber-300 bg-amber-950 border border-amber-700'
                      }`}
                    >
                      {rule.outcome.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <p className="text-base text-slate-200 mt-3 leading-relaxed">
                    {rule.explanation}
                  </p>

                  <div className="mt-4 pt-3.5 border-t border-slate-800 flex flex-wrap items-center gap-6 text-sm font-mono text-slate-300">
                    <div>
                      Expected / Declared:{' '}
                      <span className="text-white font-bold bg-slate-900 px-3 py-1 rounded-lg border border-slate-800">
                        {rule.expectedValueMasked}
                      </span>
                    </div>
                    <div>
                      Observed / Extracted:{' '}
                      <span className="text-white font-bold bg-slate-900 px-3 py-1 rounded-lg border border-slate-800">
                        {rule.observedValueMasked}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW MODE 3: TAMPERING & QUALITY FORENSICS TAB */}
      {activeWorkspaceTab === 'heuristics' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-xl space-y-6">
          <div className="space-y-2 border-b border-slate-800 pb-5">
            <div className="flex items-center gap-3">
              <Sliders className="w-6 h-6 text-amber-400" />
              <h3 className="text-xl sm:text-2xl font-black text-white">
                Document Quality &amp; Experimental Tampering Heuristics
              </h3>
            </div>
            <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-800 text-sm text-amber-200/90 leading-relaxed">
              <strong className="font-bold text-amber-100">COMPLIANCE NOTICE:</strong> These mathematical
              indicators evaluate blur, edge noise variance, and luminance histograms. They are experimental
              heuristic indicators, NOT proof of document forgery. OCR is not proof of authenticity.
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {currentCase.tamperingIndicators.map((t) => (
              <div
                key={t.checkId}
                className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-base font-bold text-white">{t.checkName}</span>
                  <span
                    className={`font-mono text-xs sm:text-sm font-bold px-3 py-1 rounded-full ${
                      t.flag === 'NORMAL'
                        ? 'text-emerald-300 bg-emerald-950 border border-emerald-800'
                        : 'text-amber-300 bg-amber-950 border border-amber-800'
                    }`}
                  >
                    {t.flag} ({t.heuristicScore}/100)
                  </span>
                </div>
                <p className="text-sm text-slate-300 leading-relaxed">{t.details}</p>
                <div className="text-xs font-mono text-slate-400 pt-2 border-t border-slate-850">
                  ID: {t.checkId}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIEW MODE 4: REVIEWER NOTES & AUDIT COMMENTS TAB */}
      {activeWorkspaceTab === 'notes' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-xl space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-800 pb-5">
            <MessageSquare className="w-6 h-6 text-indigo-400" />
            <h3 className="text-xl sm:text-2xl font-black text-white">
              Reviewer Audit Notes &amp; Observations
            </h3>
          </div>

          <form onSubmit={handleAddNoteSubmit} className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Record a compliance finding, customer clarification, or reason for return..."
              className="flex-1 px-5 py-3.5 text-base bg-slate-950 border border-slate-800 rounded-2xl text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 shadow-inner"
            />
            <button
              type="submit"
              disabled={!noteText.trim()}
              className="px-6 py-3.5 text-base font-bold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded-2xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap active:scale-95"
            >
              <Send className="w-5 h-5" />
              <span>Record Audit Note</span>
            </button>
          </form>

          <div className="space-y-3 pt-4">
            {currentCase.reviewNotes.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-sm italic bg-slate-950 rounded-2xl border border-slate-800">
                No notes recorded yet for this case. Use the box above to add reviewer observations.
              </div>
            ) : (
              currentCase.reviewNotes.map((note) => (
                <div
                  key={note.id}
                  className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-sm"
                >
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span className="font-bold text-indigo-300 font-mono text-sm">
                      {note.reviewerId}
                    </span>
                    <span className="font-mono">{new Date(note.timestamp).toLocaleString()}</span>
                  </div>
                  <p className="text-base text-slate-200 leading-relaxed">{note.text}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Approve Confirmation Dialog */}
      {showApproveDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg p-8 space-y-5 shadow-2xl">
            <div className="flex items-center gap-3 text-emerald-400">
              <CheckCircle2 className="w-7 h-7" />
              <h3 className="text-xl font-bold text-white">Approve Verification Case</h3>
            </div>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              You are certifying that the assigned human reviewer has examined document extraction, reviewed
              any discrepancies, and concluded this educational simulation case.
            </p>
            <div className="p-4 bg-amber-950/40 rounded-2xl border border-amber-800 text-xs sm:text-sm text-amber-200/90 leading-relaxed">
              Notice: This action applies strictly to this simulation platform and does not constitute official
              statutory KYC approval.
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">
                Reviewer Approval Remarks (Optional)
              </label>
              <textarea
                value={decisionNotes}
                onChange={(e) => setDecisionNotes(e.target.value)}
                placeholder="e.g. Document image quality verified, applicant identity confirmed against benchmark..."
                rows={3}
                className="w-full px-4 py-3 text-sm bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div className="flex items-center justify-end gap-3 pt-3">
              <button
                onClick={() => setShowApproveDialog(false)}
                className="px-5 py-2.5 text-sm font-semibold text-slate-400 hover:text-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleApproveConfirm}
                disabled={submittingDecision}
                className="px-6 py-2.5 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl cursor-pointer shadow-lg active:scale-95"
              >
                {submittingDecision ? 'Approving...' : 'Confirm Approval'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Return for Correction Dialog */}
      {showReturnDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg p-8 space-y-5 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-400">
              <RotateCcw className="w-7 h-7" />
              <h3 className="text-xl font-bold text-white">Return Case for Customer Correction</h3>
            </div>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              Specify the exact reason and correction instructions for the customer (e.g. upload unexpired ID,
              clear photo without glare, correct declared DOB).
            </p>
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">
                Mandatory Reason for Return *
              </label>
              <textarea
                value={decisionNotes}
                onChange={(e) => setDecisionNotes(e.target.value)}
                placeholder="e.g. Passport has expired in 2024. Please upload current valid passport bio page..."
                rows={3}
                className="w-full px-4 py-3 text-sm bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-rose-500"
              />
            </div>
            <div className="flex items-center justify-end gap-3 pt-3">
              <button
                onClick={() => setShowReturnDialog(false)}
                className="px-5 py-2.5 text-sm font-semibold text-slate-400 hover:text-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleReturnConfirm}
                disabled={submittingDecision || !decisionNotes.trim()}
                className="px-6 py-2.5 text-sm font-bold text-white bg-rose-600 hover:bg-rose-500 disabled:opacity-50 rounded-xl cursor-pointer shadow-lg active:scale-95"
              >
                {submittingDecision ? 'Returning...' : 'Return Case'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
