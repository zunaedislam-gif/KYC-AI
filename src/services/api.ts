import {
  OnboardingCase,
  SampleIdentity,
  AuditEvent,
  ReviewAction,
  ExtractedField,
  ValidationRuleResult,
} from '../types/kyc';

const BASE_URL = '/api/kyc';

export async function fetchHealth(): Promise<{ status: string; ocrEngine: string }> {
  const res = await fetch(`${BASE_URL}/health`);
  if (!res.ok) throw new Error('Health check failed');
  return res.json();
}

export async function fetchCases(): Promise<OnboardingCase[]> {
  const res = await fetch(`${BASE_URL}/cases`);
  if (!res.ok) throw new Error('Failed to load cases');
  const data = await res.json();
  return data.cases;
}

export async function fetchCase(caseId: string): Promise<OnboardingCase> {
  const res = await fetch(`${BASE_URL}/cases/${caseId}`);
  if (!res.ok) throw new Error(`Failed to load case ${caseId}`);
  return res.json();
}

export async function fetchSampleDocuments(): Promise<SampleIdentity[]> {
  const res = await fetch(`${BASE_URL}/sample-documents`);
  if (!res.ok) throw new Error('Failed to load sample templates');
  return res.json();
}

export async function createCase(data: {
  fullName: string;
  dateOfBirth: string;
  documentType: string;
  documentId: string;
  nationality?: string;
  address?: string;
}): Promise<OnboardingCase> {
  const res = await fetch(`${BASE_URL}/cases`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to create case');
  }
  return res.json();
}

export async function attachSampleDocument(caseId: string, sampleId: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/cases/${caseId}/sample-document`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sampleId }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to attach sample document');
  }
}

export async function uploadCustomDocument(caseId: string, file: File): Promise<void> {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${BASE_URL}/cases/${caseId}/documents`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to upload document');
  }
}

export async function processCase(caseId: string): Promise<{
  case: OnboardingCase;
  ocrResult: {
    overallConfidence: number;
    linesCount: number;
    extractedFieldsCount: number;
  };
}> {
  const res = await fetch(`${BASE_URL}/cases/${caseId}/process`, {
    method: 'POST',
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to execute OCR processing');
  }
  return res.json();
}

export async function applyFieldCorrection(
  caseId: string,
  payload: {
    fieldName: string;
    correctedValue: string;
    reason: string;
    reviewerId: string;
  }
): Promise<{
  field: ExtractedField;
  updatedValidationResults: ValidationRuleResult[];
}> {
  const res = await fetch(`${BASE_URL}/cases/${caseId}/corrections`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to apply field correction');
  }
  return res.json();
}

export async function submitReviewDecision(
  caseId: string,
  payload: {
    decision: 'APPROVE' | 'RETURN_FOR_CORRECTION' | 'CLAIM_REVIEW';
    reviewerId: string;
    notes: string;
  }
): Promise<OnboardingCase> {
  const res = await fetch(`${BASE_URL}/cases/${caseId}/review`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to submit review decision');
  }
  return res.json();
}

export async function addCaseNote(caseId: string, reviewerId: string, text: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/cases/${caseId}/notes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reviewerId, text }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to add note');
  }
}

export async function fetchCaseHistory(caseId: string): Promise<{
  auditEvents: AuditEvent[];
  reviewActions: ReviewAction[];
}> {
  const res = await fetch(`${BASE_URL}/cases/${caseId}/history`);
  if (!res.ok) throw new Error('Failed to fetch case history');
  return res.json();
}

export async function fetchGlobalAuditLogs(): Promise<AuditEvent[]> {
  const res = await fetch(`${BASE_URL}/audit-logs`);
  if (!res.ok) throw new Error('Failed to fetch audit logs');
  const data = await res.json();
  return data.events;
}
