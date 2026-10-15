/**
 * KYC Platform
 * Main Application Component with Banking Authentication & Internal Provisioning
 */

import React, { useState, useEffect, useCallback } from 'react';
import { TopBar } from './components/TopBar';
import { OverviewView } from './components/OverviewView';
import { ReviewWorkspace } from './components/ReviewWorkspace';
import { AuditHistoryView } from './components/AuditHistoryView';
import { NewCaseModal } from './components/NewCaseModal';
import { FieldCorrectionModal } from './components/FieldCorrectionModal';
import { MethodologyModal } from './components/MethodologyModal';
import { LoginView } from './components/LoginView';
import { ProvisionUserModal } from './components/ProvisionUserModal';
import { UserDirectoryModal } from './components/UserDirectoryModal';
import {
  fetchCases,
  fetchCase,
  fetchSampleDocuments,
  createCase,
  attachSampleDocument,
  uploadCustomDocument,
  processCase,
  applyFieldCorrection,
  submitReviewDecision,
  addCaseNote,
  fetchGlobalAuditLogs,
} from './services/api';
import {
  fetchCurrentUser,
  logoutUser,
  getStoredToken,
} from './services/authApi';
import { OnboardingCase, SampleIdentity, ExtractedField, AuditEvent } from './types/kyc';
import { BankUser } from './types/auth';

export default function App() {
  const [currentTab, setCurrentTab] = useState<'overview' | 'workspace' | 'audit'>('overview');
  const [cases, setCases] = useState<OnboardingCase[]>([]);
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [currentCase, setCurrentCase] = useState<OnboardingCase | null>(null);
  const [samples, setSamples] = useState<SampleIdentity[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Authentication State
  const [currentUser, setCurrentUser] = useState<BankUser | null>(null);
  const [authChecking, setAuthChecking] = useState<boolean>(true);

  // Modals state
  const [isNewCaseOpen, setIsNewCaseOpen] = useState<boolean>(false);
  const [isMethodologyOpen, setIsMethodologyOpen] = useState<boolean>(false);
  const [isProvisionModalOpen, setIsProvisionModalOpen] = useState<boolean>(false);
  const [isUserDirectoryOpen, setIsUserDirectoryOpen] = useState<boolean>(false);
  const [fieldToCorrect, setFieldToCorrect] = useState<ExtractedField | null>(null);

  // Notification Banner
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  const showNotification = (type: 'success' | 'error' | 'info', message: string) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification(null);
    }, 5000);
  };

  // Verify Auth Session on Startup
  useEffect(() => {
    const checkAuth = async () => {
      const token = getStoredToken();
      if (!token) {
        setAuthChecking(false);
        return;
      }
      try {
        const user = await fetchCurrentUser();
        setCurrentUser(user);
      } catch {
        setCurrentUser(null);
      } finally {
        setAuthChecking(false);
      }
    };
    checkAuth();
  }, []);

  // Load Initial Cases & Samples
  const loadInitialData = useCallback(async () => {
    setLoading(true);
    try {
      const [casesData, samplesData, logsData] = await Promise.all([
        fetchCases(),
        fetchSampleDocuments(),
        fetchGlobalAuditLogs(),
      ]);
      setCases(casesData);
      setSamples(samplesData);
      setAuditLogs(logsData);

      if (casesData.length > 0 && !selectedCaseId) {
        setSelectedCaseId(casesData[0].id);
        setCurrentCase(casesData[0]);
      }
    } catch (err: any) {
      console.error('Failed to load initial KYC data:', err);
      showNotification('error', 'Failed to connect to verification backend service.');
    } finally {
      setLoading(false);
    }
  }, [selectedCaseId]);

  useEffect(() => {
    if (currentUser) {
      loadInitialData();
    }
  }, [currentUser]);

  // When selectedCaseId changes, load full case details
  const loadSelectedCase = useCallback(async (caseId: string) => {
    try {
      const data = await fetchCase(caseId);
      setCurrentCase(data);
      setSelectedCaseId(caseId);
    } catch (err: any) {
      console.error(`Failed to load case ${caseId}:`, err);
      showNotification('error', 'Failed to retrieve case details.');
    }
  }, []);

  const handleSelectCase = async (caseId: string) => {
    await loadSelectedCase(caseId);
    setCurrentTab('workspace');
  };

  const handleLogout = async () => {
    await logoutUser();
    setCurrentUser(null);
    showNotification('info', 'Logged out of core banking session.');
  };

  // Quick load scenario shortcut
  const handleQuickLoadScenario = async (scenarioId: string) => {
    const existing = cases.find((c) => c.id === scenarioId);
    if (existing) {
      await loadSelectedCase(existing.id);
      setCurrentTab('workspace');
      showNotification('info', `Opened demonstration scenario: ${existing.referenceNumber}`);
    } else {
      const sample = samples.find((s) => s.id === scenarioId);
      if (sample) {
        try {
          const newCase = await createCase({
            fullName: sample.declaredData.fullName,
            dateOfBirth: sample.declaredData.dateOfBirth,
            documentType: sample.declaredData.documentType,
            documentId: sample.declaredData.documentId,
            nationality: sample.declaredData.nationality,
            address: sample.declaredData.address,
          });
          await attachSampleDocument(newCase.id, sample.id);
          const processed = await processCase(newCase.id);
          await loadInitialData();
          await loadSelectedCase(processed.case.id);
          setCurrentTab('workspace');
          showNotification('success', `Initialized benchmark scenario for ${sample.name}`);
        } catch (err: any) {
          showNotification('error', err.message || 'Failed to initialize scenario');
        }
      }
    }
  };

  // Create new case from modal
  const handleCreateCaseSubmit = async (data: {
    fullName: string;
    dateOfBirth: string;
    documentType: any;
    documentId: string;
    nationality: string;
    address: string;
    selectedSampleId?: string;
    customFile?: File;
  }) => {
    try {
      const newCase = await createCase({
        fullName: data.fullName,
        dateOfBirth: data.dateOfBirth,
        documentType: data.documentType,
        documentId: data.documentId,
        nationality: data.nationality,
        address: data.address,
      });

      if (data.selectedSampleId) {
        await attachSampleDocument(newCase.id, data.selectedSampleId);
      } else if (data.customFile) {
        await uploadCustomDocument(newCase.id, data.customFile);
      }

      // Execute OCR & Validation pipeline
      const processed = await processCase(newCase.id);
      await loadInitialData();
      await loadSelectedCase(processed.case.id);
      setCurrentTab('workspace');
      showNotification('success', `Case ${newCase.referenceNumber} created and processed via OCR!`);
    } catch (err: any) {
      showNotification('error', err.message || 'Case creation failed');
      throw err;
    }
  };

  // Re-run OCR
  const handleRunOcr = async (caseId: string) => {
    try {
      const res = await processCase(caseId);
      setCurrentCase(res.case);
      const updatedCases = await fetchCases();
      setCases(updatedCases);
      const updatedLogs = await fetchGlobalAuditLogs();
      setAuditLogs(updatedLogs);
      showNotification(
        'success',
        `OCR extraction completed with ${res.ocrResult.extractedFieldsCount} fields identified.`
      );
    } catch (err: any) {
      showNotification('error', err.message || 'OCR processing failed');
    }
  };

  // Correct Field
  const handleFieldCorrectionSubmit = async (data: {
    fieldName: string;
    correctedValue: string;
    reason: string;
    reviewerId: string;
  }) => {
    if (!currentCase) return;
    try {
      await applyFieldCorrection(currentCase.id, data);
      await loadSelectedCase(currentCase.id);
      const updatedCases = await fetchCases();
      setCases(updatedCases);
      const updatedLogs = await fetchGlobalAuditLogs();
      setAuditLogs(updatedLogs);
      showNotification(
        'success',
        `Field '${data.fieldName}' corrected. Validation rules re-evaluated.`
      );
    } catch (err: any) {
      showNotification('error', err.message || 'Correction failed');
      throw err;
    }
  };

  // Review Decision
  const handleReviewDecision = async (
    decision: 'APPROVE' | 'RETURN_FOR_CORRECTION' | 'CLAIM_REVIEW',
    notes: string
  ) => {
    if (!currentCase || !currentUser) return;
    try {
      const reviewerIdentifier = `${currentUser.fullName} (${currentUser.role.toUpperCase()})`;
      const updated = await submitReviewDecision(currentCase.id, {
        decision,
        reviewerId: reviewerIdentifier,
        notes,
      });
      setCurrentCase(updated);
      const updatedCases = await fetchCases();
      setCases(updatedCases);
      const updatedLogs = await fetchGlobalAuditLogs();
      setAuditLogs(updatedLogs);

      if (decision === 'APPROVE') {
        showNotification(
          'success',
          `Case ${currentCase.referenceNumber} approved by ${currentUser.fullName}.`
        );
      } else if (decision === 'RETURN_FOR_CORRECTION') {
        showNotification(
          'info',
          `Case ${currentCase.referenceNumber} returned for applicant correction.`
        );
      } else {
        showNotification('info', `Case claimed by reviewer ${currentUser.fullName}.`);
      }
    } catch (err: any) {
      showNotification('error', err.message || 'Failed to record decision');
    }
  };

  // Add Case Note
  const handleAddNote = async (text: string) => {
    if (!currentCase || !currentUser) return;
    try {
      const reviewerIdentifier = `${currentUser.fullName} (${currentUser.role.toUpperCase()})`;
      await addCaseNote(currentCase.id, reviewerIdentifier, text);
      await loadSelectedCase(currentCase.id);
      const updatedLogs = await fetchGlobalAuditLogs();
      setAuditLogs(updatedLogs);
      showNotification('success', 'Case review note recorded.');
    } catch (err: any) {
      showNotification('error', err.message || 'Failed to record note');
    }
  };

  // 1. Initial Auth Check Spinner
  if (authChecking) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center font-sans">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <div className="text-base font-bold text-white">Verifying Banking Security Session...</div>
        </div>
      </div>
    );
  }

  // 2. Unauthenticated: Render Banking-Grade Login Gate (NO public self-registration)
  if (!currentUser) {
    return (
      <LoginView
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          showNotification(
            'success',
            `Authenticated as ${user.fullName} (${user.role.toUpperCase()})`
          );
        }}
      />
    );
  }

  // 3. Authenticated: Render Main Portal
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* 3-Zone Top Navigation Bar with Auth Profile */}
      <TopBar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        onOpenNewCase={() => setIsNewCaseOpen(true)}
        onOpenMethodology={() => setIsMethodologyOpen(true)}
        selectedCaseRef={currentCase?.referenceNumber}
        cases={cases}
        selectedCaseId={selectedCaseId}
        onSelectCase={handleSelectCase}
        currentUser={currentUser}
        onLogout={handleLogout}
        onOpenProvisionModal={() => setIsProvisionModalOpen(true)}
        onOpenUserDirectoryModal={() => setIsUserDirectoryOpen(true)}
      />

      {/* Floating System Toast Notification */}
      {notification && (
        <div className="fixed top-20 right-8 z-50 animate-in fade-in slide-in-from-top-3 duration-200">
          <div
            className={`px-5 py-3.5 rounded-2xl border text-sm font-bold shadow-2xl flex items-center gap-3 ${
              notification.type === 'success'
                ? 'bg-emerald-950/95 border-emerald-700 text-emerald-200 shadow-emerald-900/40'
                : notification.type === 'error'
                ? 'bg-rose-950/95 border-rose-700 text-rose-200 shadow-rose-900/40'
                : 'bg-indigo-950/95 border-indigo-700 text-indigo-200 shadow-indigo-900/40'
            }`}
          >
            <span>{notification.message}</span>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-[1700px] 2xl:max-w-[1920px] mx-auto p-5 sm:p-8 lg:p-10">
        {currentTab === 'overview' && (
          <OverviewView
            cases={cases}
            loading={loading}
            onSelectCase={handleSelectCase}
            onOpenNewCase={() => setIsNewCaseOpen(true)}
            onQuickLoadScenario={handleQuickLoadScenario}
          />
        )}

        {currentTab === 'workspace' && currentCase && (
          <ReviewWorkspace
            currentCase={currentCase}
            reviewerId={`${currentUser.fullName} (${currentUser.role.toUpperCase()})`}
            onRunOcr={handleRunOcr}
            onCorrectField={(field) => setFieldToCorrect(field)}
            onDecision={handleReviewDecision}
            onAddNote={handleAddNote}
            onViewHistory={() => setCurrentTab('audit')}
            allCases={cases}
            onSelectCase={handleSelectCase}
          />
        )}

        {currentTab === 'workspace' && !currentCase && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-16 text-center space-y-4 max-w-xl mx-auto my-12 shadow-xl">
            <div className="w-16 h-16 rounded-2xl bg-indigo-950 border border-indigo-800 text-indigo-400 flex items-center justify-center mx-auto">
              <span className="text-2xl">📋</span>
            </div>
            <h3 className="text-xl font-bold text-white">No Case Selected for Review</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Choose an active onboarding case from the Cases Queue or launch any of the 4 benchmark test scenarios to test the OCR engine.
            </p>
            <button
              onClick={() => setCurrentTab('overview')}
              className="px-6 py-3 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl cursor-pointer shadow-lg active:scale-95 transition-all"
            >
              Browse Cases in Overview
            </button>
          </div>
        )}

        {currentTab === 'audit' && (
          <AuditHistoryView
            events={auditLogs}
            selectedCaseId={currentCase?.id}
            onSelectCaseId={handleSelectCase}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 px-6 lg:px-10 py-5 text-xs text-slate-500">
        <div className="max-w-[1700px] 2xl:max-w-[1920px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span>KYC Verification Platform</span>
            <span aria-hidden="true">·</span>
            <span>Bangladesh Bank e-KYC Directives &amp; BFIU Circular 26 Architecture</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMethodologyOpen(true)}
              className="hover:text-slate-300 transition-colors cursor-pointer"
            >
              System Limitations &amp; Principles
            </button>
            <span aria-hidden="true">·</span>
            <a
              href="/health"
              target="_blank"
              rel="noreferrer"
              className="hover:text-slate-300 transition-colors"
            >
              API Health
            </a>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <NewCaseModal
        isOpen={isNewCaseOpen}
        onClose={() => setIsNewCaseOpen(false)}
        samples={samples}
        onSubmit={handleCreateCaseSubmit}
      />

      <FieldCorrectionModal
        isOpen={!!fieldToCorrect}
        onClose={() => setFieldToCorrect(null)}
        field={fieldToCorrect}
        reviewerId={`${currentUser.fullName} (${currentUser.role.toUpperCase()})`}
        onSubmit={handleFieldCorrectionSubmit}
      />

      <MethodologyModal
        isOpen={isMethodologyOpen}
        onClose={() => setIsMethodologyOpen(false)}
      />

      {/* Internal User Provisioning Modal (Inside the Software) */}
      <ProvisionUserModal
        isOpen={isProvisionModalOpen}
        onClose={() => setIsProvisionModalOpen(false)}
        currentUser={currentUser}
        onUserProvisioned={(newUser) => {
          showNotification(
            'success',
            `Successfully provisioned ${newUser.email} as ${newUser.role.toUpperCase()} in banking registry.`
          );
        }}
      />

      {/* User Directory & Account Unlock Modal */}
      <UserDirectoryModal
        isOpen={isUserDirectoryOpen}
        onClose={() => setIsUserDirectoryOpen(false)}
        currentUser={currentUser}
        onOpenProvisionModal={() => setIsProvisionModalOpen(true)}
      />
    </div>
  );
}
