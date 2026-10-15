/**
 * KYC-AI — Intelligent Customer Onboarding and Document Verification Platform
 * Core Data Models and Domain Types
 */

export type CaseStatus =
  | 'UPLOADED'
  | 'PROCESSING'
  | 'REVIEW_REQUIRED'
  | 'IN_REVIEW'
  | 'APPROVED_BY_REVIEWER'
  | 'RETURNED_FOR_CORRECTION'
  | 'CLOSED';

export type DocumentType =
  | 'GENERIC_ID_CARD'
  | 'GENERIC_PASSPORT_PAGE'
  | 'GENERIC_APPLICATION_FORM';

export interface DeclaredCustomerData {
  fullName: string;
  dateOfBirth: string; // ISO YYYY-MM-DD
  documentType: DocumentType;
  documentId: string;
  nationality?: string;
  address?: string;
  declaredDate?: string;
}

export interface DocumentMetadata {
  id: string;
  caseId: string;
  fileName: string;
  mimeType: string;
  fileSizeBytes: number;
  documentType: DocumentType;
  uploadedAt: string;
  width?: number;
  height?: number;
  dataUrl?: string; // Stored temporarily for preview
  preprocessingNotes?: string[];
  qualityScore?: number; // 0-100 heuristic
}

export type FieldStatus = 'VALID' | 'WARNING' | 'UNCERTAIN' | 'MISSING';

export interface ExtractedField {
  fieldName: string;
  rawValue: string;
  normalizedValue: string;
  confidence: number | null; // null if engine does not supply meaningful confidence
  status: FieldStatus;
  sourceReference?: string;
  reviewWarning?: string;
  boundingBox?: {
    x0: number;
    y0: number;
    x1: number;
    y1: number;
  };
  isCorrected?: boolean;
  correctedBy?: string;
  correctedAt?: string;
  originalRawValue?: string;
  correctionReason?: string;
}

export type ValidationOutcome = 'PASS' | 'REVIEW_REQUIRED' | 'NOT_APPLICABLE';

export interface ValidationRuleResult {
  ruleId: string;
  ruleTitle: string;
  fieldName: string;
  outcome: ValidationOutcome;
  expectedValueMasked: string;
  observedValueMasked: string;
  explanation: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
}

export type TamperFlag = 'NORMAL' | 'SUSPICIOUS' | 'INCONCLUSIVE';

export interface TamperIndicator {
  checkId: string;
  checkName: string;
  flag: TamperFlag;
  heuristicScore: number; // 0-100
  details: string;
  isExperimental: true;
}

export interface ReviewAction {
  id: string;
  caseId: string;
  action:
    | 'ASSIGNED'
    | 'STATUS_CHANGE'
    | 'FIELD_CORRECTION'
    | 'NOTE_ADDED'
    | 'APPROVED_SIMULATION'
    | 'RETURNED_FOR_CORRECTION';
  reviewerId: string;
  timestamp: string;
  notes?: string;
  fieldChanges?: {
    fieldName: string;
    oldValueMasked: string;
    newValueMasked: string;
    reason: string;
  };
}

export interface AuditEvent {
  id: string;
  caseId: string;
  timestamp: string;
  actor: string;
  actionType: string;
  summary: string;
  detailsMasked?: Record<string, string | number | boolean | null>;
}

export interface OnboardingCase {
  id: string;
  referenceNumber: string;
  status: CaseStatus;
  createdAt: string;
  updatedAt: string;
  assignedReviewerId?: string;
  declaredData: DeclaredCustomerData;
  documents: DocumentMetadata[];
  extractedFields: ExtractedField[];
  validationResults: ValidationRuleResult[];
  tamperingIndicators: TamperIndicator[];
  rawOcrText?: string;
  reviewNotes: Array<{
    id: string;
    reviewerId: string;
    timestamp: string;
    text: string;
  }>;
}

export interface CreateCaseRequest {
  fullName: string;
  dateOfBirth: string;
  documentType: DocumentType;
  documentId: string;
  nationality?: string;
  address?: string;
}

export interface CorrectFieldRequest {
  fieldName: string;
  correctedValue: string;
  reason: string;
  reviewerId: string;
}

export interface ReviewDecisionRequest {
  decision: 'APPROVE' | 'RETURN_FOR_CORRECTION' | 'CLAIM_REVIEW';
  reviewerId: string;
  notes: string;
}
