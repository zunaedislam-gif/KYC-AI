/**
 * KYC-AI — Intelligent Customer Onboarding and Document Verification Platform
 * Persistent Case Database & Audit Store
 */

import {
  AuditEvent,
  CaseStatus,
  CorrectFieldRequest,
  DocumentMetadata,
  ExtractedField,
  OnboardingCase,
  ReviewAction,
  ReviewDecisionRequest,
  TamperIndicator,
  ValidationRuleResult,
} from './types.js';
import { SAMPLE_IDENTITIES } from './sampleDocuments.js';
import { maskSensitiveValue } from './validation/rules.js';

class CaseDatabase {
  private cases: Map<string, OnboardingCase> = new Map();
  private auditEvents: AuditEvent[] = [];
  private reviewActions: ReviewAction[] = [];
  private counter: number = 1000;

  constructor() {
    this.seedSampleData();
  }

  private generateId(prefix: string): string {
    this.counter++;
    return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
  }

  private generateReferenceNumber(): string {
    const year = new Date().getFullYear();
    const seq = (++this.counter).toString().padStart(5, '0');
    return `KYC-${year}-${seq}`;
  }

  /**
   * Log an immutable audit event
   */
  public logAuditEvent(
    caseId: string,
    actor: string,
    actionType: string,
    summary: string,
    detailsMasked?: Record<string, any>
  ): AuditEvent {
    const event: AuditEvent = {
      id: this.generateId('audit'),
      caseId,
      timestamp: new Date().toISOString(),
      actor,
      actionType,
      summary,
      detailsMasked,
    };
    this.auditEvents.unshift(event);
    return event;
  }

  /**
   * Seed demonstration cases for immediate reviewer exploration
   */
  private seedSampleData() {
    for (const sample of SAMPLE_IDENTITIES) {
      const caseId = sample.id;
      const ref = `KYC-2026-${(++this.counter).toString().padStart(5, '0')}`;
      const now = new Date(Date.now() - Math.floor(Math.random() * 3600000 * 24)).toISOString();

      let status: CaseStatus = 'REVIEW_REQUIRED';
      if (sample.expectedOutcome === 'CLEAN_PASS') {
        status = 'REVIEW_REQUIRED';
      }

      const docId = this.generateId('doc');
      const docMeta: DocumentMetadata = {
        id: docId,
        caseId,
        fileName: `${sample.name.toLowerCase().replace(/\s+/g, '_')}_document.svg`,
        mimeType: 'image/svg+xml',
        fileSizeBytes: sample.sampleDocumentSvg.length,
        documentType: sample.declaredData.documentType,
        uploadedAt: now,
        width: 850,
        height: 540,
        dataUrl: `data:image/svg+xml;utf8,${encodeURIComponent(sample.sampleDocumentSvg)}`,
        qualityScore: sample.id.includes('taylor') ? 48 : 95,
        preprocessingNotes: [
          'Vector graphic payload rendered to RGB matrix',
          'Luminance gradient calculated across visual zones',
          sample.id.includes('taylor')
            ? 'Low contrast threshold detected: dynamic range compressed'
            : 'Edge contrast verified: high text sharpness index',
        ],
      };

      // Mock initial extracted fields aligned with ground truth
      const extractedFields: ExtractedField[] = [];

      if (sample.id === 'sample-alex-mercer') {
        extractedFields.push(
          {
            fieldName: 'full_name',
            rawValue: 'Alex Mercer',
            normalizedValue: 'Alex Mercer',
            confidence: 96,
            status: 'VALID',
            sourceReference: 'Visual Zone: Name Field',
            boundingBox: { x0: 260, y0: 145, x1: 650, y1: 185 },
          },
          {
            fieldName: 'date_of_birth',
            rawValue: '1988-06-14',
            normalizedValue: '1988-06-14',
            confidence: 94,
            status: 'VALID',
            sourceReference: 'Visual Zone: DOB',
            boundingBox: { x0: 260, y0: 225, x1: 450, y1: 265 },
          },
          {
            fieldName: 'document_id',
            rawValue: 'HZ-8849-2194',
            normalizedValue: 'HZ88492194',
            confidence: 95,
            status: 'VALID',
            sourceReference: 'Visual Zone: Document ID',
            boundingBox: { x0: 260, y0: 295, x1: 580, y1: 345 },
          },
          {
            fieldName: 'expiry_date',
            rawValue: '2029-08-30',
            normalizedValue: '2029-08-30',
            confidence: 93,
            status: 'VALID',
            sourceReference: 'Visual Zone: Expiry',
            boundingBox: { x0: 520, y0: 295, x1: 720, y1: 345 },
          },
          {
            fieldName: 'issuing_country',
            rawValue: 'Republic of Horizon',
            normalizedValue: 'Republic of Horizon',
            confidence: 98,
            status: 'VALID',
            sourceReference: 'Header: Republic of Horizon',
            boundingBox: { x0: 110, y0: 25, x1: 500, y1: 65 },
          }
        );
      } else if (sample.id === 'sample-elena-vance') {
        extractedFields.push(
          {
            fieldName: 'full_name',
            rawValue: 'ELENA ROSTOVA VANCE',
            normalizedValue: 'Elena Rostova Vance',
            confidence: 92,
            status: 'VALID',
            sourceReference: 'MRZ Line 1: P<HORELENA<<ROSTOVA<VANCE',
            boundingBox: { x0: 260, y0: 195, x1: 650, y1: 285 },
          },
          {
            fieldName: 'date_of_birth',
            rawValue: '1992-11-20',
            normalizedValue: '1992-11-20',
            confidence: 91,
            status: 'VALID',
            sourceReference: 'MRZ Line 2 (DOB 921120)',
            boundingBox: { x0: 520, y0: 320, x1: 720, y1: 360 },
          },
          {
            fieldName: 'document_id',
            rawValue: 'P74928104',
            normalizedValue: 'P74928104',
            confidence: 94,
            status: 'VALID',
            sourceReference: 'MRZ Line 2 (Doc 1-9)',
            boundingBox: { x0: 260, y0: 130, x1: 520, y1: 175 },
          },
          {
            fieldName: 'expiry_date',
            rawValue: '2024-05-10',
            normalizedValue: '2024-05-10',
            confidence: 89,
            status: 'WARNING',
            sourceReference: 'MRZ Line 2 (Expiry 240510)',
            reviewWarning: 'Document validity date has elapsed (Expired May 2024).',
            boundingBox: { x0: 520, y0: 380, x1: 720, y1: 420 },
          },
          {
            fieldName: 'issuing_country',
            rawValue: 'Republic of Horizon',
            normalizedValue: 'Republic of Horizon',
            confidence: 98,
            status: 'VALID',
            sourceReference: 'MRZ State Code HOR',
            boundingBox: { x0: 40, y0: 40, x1: 350, y1: 90 },
          }
        );
      } else if (sample.id === 'sample-taylor-morgan') {
        extractedFields.push(
          {
            fieldName: 'full_name',
            rawValue: 'Taylor Morgan',
            normalizedValue: 'Taylor Morgan',
            confidence: 72,
            status: 'VALID',
            sourceReference: 'Visual Zone: Name',
            boundingBox: { x0: 260, y0: 145, x1: 650, y1: 185 },
          },
          {
            fieldName: 'date_of_birth',
            rawValue: '2000-03-25',
            normalizedValue: '2000-03-25',
            confidence: 68,
            status: 'VALID',
            sourceReference: 'Visual Zone: DOB',
            boundingBox: { x0: 260, y0: 225, x1: 450, y1: 265 },
          },
          {
            fieldName: 'document_id',
            rawValue: 'HZ-5512-8899',
            normalizedValue: 'HZ55128899',
            confidence: 54, // Low confidence
            status: 'WARNING',
            sourceReference: 'Visual Zone: Document ID',
            reviewWarning: 'Low OCR confidence (54%). Visual verification needed to avoid character ambiguity.',
            boundingBox: { x0: 260, y0: 295, x1: 580, y1: 345 },
          },
          {
            fieldName: 'expiry_date',
            rawValue: '2030-12-31',
            normalizedValue: '2030-12-31',
            confidence: 70,
            status: 'VALID',
            sourceReference: 'Visual Zone: Expiry',
            boundingBox: { x0: 520, y0: 295, x1: 720, y1: 345 },
          }
        );
      } else {
        // Jordan Brooks
        extractedFields.push(
          {
            fieldName: 'full_name',
            rawValue: 'Jordan Brooks',
            normalizedValue: 'Jordan Brooks',
            confidence: 90,
            status: 'VALID',
            sourceReference: 'Section 1: Applicant Name',
            boundingBox: { x0: 60, y0: 190, x1: 510, y1: 235 },
          },
          {
            fieldName: 'date_of_birth',
            rawValue: '1985-02-12',
            normalizedValue: '1985-02-12',
            confidence: 88,
            status: 'VALID',
            sourceReference: 'Section 1.2: Date of Birth',
            boundingBox: { x0: 545, y0: 190, x1: 790, y1: 235 },
          },
          {
            fieldName: 'document_id',
            rawValue: 'HZ-9933-8802', // Mismatch from declared HZ-9933-1102
            normalizedValue: 'HZ99338802',
            confidence: 89,
            status: 'WARNING',
            sourceReference: 'Section 2.1: Document ID',
            reviewWarning: 'Observed value differs from customer declaration.',
            boundingBox: { x0: 60, y0: 330, x1: 510, y1: 375 },
          }
        );
      }

      // Initial validation rules
      const valResults: ValidationRuleResult[] = [];
      if (sample.id === 'sample-alex-mercer') {
        valResults.push(
          {
            ruleId: 'RULE_NAME_MATCH',
            ruleTitle: 'Declared vs Extracted Name Verification',
            fieldName: 'full_name',
            outcome: 'PASS',
            expectedValueMasked: maskSensitiveValue(sample.declaredData.fullName, 'name'),
            observedValueMasked: maskSensitiveValue(sample.declaredData.fullName, 'name'),
            explanation: 'Declared name matches document extracted name exactly.',
            severity: 'INFO',
          },
          {
            ruleId: 'RULE_DOB_MATCH',
            ruleTitle: 'Date of Birth Consistency',
            fieldName: 'date_of_birth',
            outcome: 'PASS',
            expectedValueMasked: maskSensitiveValue(sample.declaredData.dateOfBirth, 'date'),
            observedValueMasked: maskSensitiveValue(sample.declaredData.dateOfBirth, 'date'),
            explanation: 'Declared date of birth matches document extracted date of birth exactly.',
            severity: 'INFO',
          },
          {
            ruleId: 'RULE_MINIMUM_AGE',
            ruleTitle: 'Minimum Age Requirement',
            fieldName: 'date_of_birth',
            outcome: 'PASS',
            expectedValueMasked: '>= 18 years old',
            observedValueMasked: 'Applicant age: 38 years',
            explanation: 'Applicant meets statutory adult age requirement.',
            severity: 'INFO',
          },
          {
            ruleId: 'RULE_DOC_ID_MATCH',
            ruleTitle: 'Document Identifier Consistency',
            fieldName: 'document_id',
            outcome: 'PASS',
            expectedValueMasked: maskSensitiveValue(sample.declaredData.documentId, 'id'),
            observedValueMasked: maskSensitiveValue(sample.declaredData.documentId, 'id'),
            explanation: 'Declared document identifier matches document extracted identifier exactly.',
            severity: 'INFO',
          },
          {
            ruleId: 'RULE_DOC_EXPIRY',
            ruleTitle: 'Document Validity & Expiry',
            fieldName: 'expiry_date',
            outcome: 'PASS',
            expectedValueMasked: 'Valid after 2026-10-11',
            observedValueMasked: maskSensitiveValue('2029-08-30', 'date'),
            explanation: 'Document is currently within valid date range.',
            severity: 'INFO',
          }
        );
      } else if (sample.id === 'sample-elena-vance') {
        valResults.push(
          {
            ruleId: 'RULE_NAME_MATCH',
            ruleTitle: 'Declared vs Extracted Name Verification',
            fieldName: 'full_name',
            outcome: 'PASS',
            expectedValueMasked: maskSensitiveValue(sample.declaredData.fullName, 'name'),
            observedValueMasked: maskSensitiveValue('Elena Rostova Vance', 'name'),
            explanation: 'Declared and document names match with minor name token variation (middle name included on passport).',
            severity: 'INFO',
          },
          {
            ruleId: 'RULE_DOB_MATCH',
            ruleTitle: 'Date of Birth Consistency',
            fieldName: 'date_of_birth',
            outcome: 'PASS',
            expectedValueMasked: maskSensitiveValue(sample.declaredData.dateOfBirth, 'date'),
            observedValueMasked: maskSensitiveValue(sample.declaredData.dateOfBirth, 'date'),
            explanation: 'Declared date of birth matches passport MRZ birth record exactly.',
            severity: 'INFO',
          },
          {
            ruleId: 'RULE_DOC_EXPIRY',
            ruleTitle: 'Document Validity & Expiry',
            fieldName: 'expiry_date',
            outcome: 'REVIEW_REQUIRED',
            expectedValueMasked: 'Valid after 2026-10-11',
            observedValueMasked: maskSensitiveValue('2024-05-10', 'date'),
            explanation: 'Document has expired. Expiry is a compliance review flag for renewed document collection, not proof of fraud.',
            severity: 'WARNING',
          }
        );
      } else if (sample.id === 'sample-taylor-morgan') {
        valResults.push(
          {
            ruleId: 'RULE_NAME_MATCH',
            ruleTitle: 'Declared vs Extracted Name Verification',
            fieldName: 'full_name',
            outcome: 'PASS',
            expectedValueMasked: maskSensitiveValue(sample.declaredData.fullName, 'name'),
            observedValueMasked: maskSensitiveValue(sample.declaredData.fullName, 'name'),
            explanation: 'Declared name matches document extracted name.',
            severity: 'INFO',
          },
          {
            ruleId: 'RULE_OCR_CONFIDENCE',
            ruleTitle: 'OCR Text Legibility & Confidence',
            fieldName: 'ocr_engine',
            outcome: 'REVIEW_REQUIRED',
            expectedValueMasked: 'Confidence >= 65%',
            observedValueMasked: 'Document ID field confidence: 54%',
            explanation: 'Low OCR confidence on: document_id. Image exhibits low contrast. Human review required to confirm characters.',
            severity: 'WARNING',
          }
        );
      } else {
        // Jordan Brooks
        valResults.push(
          {
            ruleId: 'RULE_DOC_ID_MATCH',
            ruleTitle: 'Document Identifier Consistency',
            fieldName: 'document_id',
            outcome: 'REVIEW_REQUIRED',
            expectedValueMasked: maskSensitiveValue('HZ-9933-1102', 'id'),
            observedValueMasked: maskSensitiveValue('HZ-9933-8802', 'id'),
            explanation: 'Document identifier mismatch between declared value and document extraction. Review required.',
            severity: 'CRITICAL',
          }
        );
      }

      const tamperingIndicators: TamperIndicator[] = [
        {
          checkId: 'HEURISTIC_BLUR_DETECTION',
          checkName: 'Image Gradient Sharpness & Blur Analysis',
          flag: 'NORMAL',
          heuristicScore: sample.id.includes('taylor') ? 42 : 88,
          details: 'Image edge sharpness within standard document threshold.',
          isExperimental: true,
        },
        {
          checkId: 'HEURISTIC_CONTRAST_DYNAMIC_RANGE',
          checkName: 'Luminance Dynamic Range & Contrast Distribution',
          flag: sample.id.includes('taylor') ? 'SUSPICIOUS' : 'NORMAL',
          heuristicScore: sample.id.includes('taylor') ? 22 : 84,
          details: sample.id.includes('taylor')
            ? 'Low dynamic range detected across visual zone. Adaptive threshold applied.'
            : 'Standard contrast balance observed.',
          isExperimental: true,
        },
      ];

      const onboardingCase: OnboardingCase = {
        id: caseId,
        referenceNumber: ref,
        status,
        createdAt: now,
        updatedAt: now,
        declaredData: sample.declaredData,
        documents: [docMeta],
        extractedFields,
        validationResults: valResults,
        tamperingIndicators,
        rawOcrText: sample.name,
        reviewNotes: [
          {
            id: this.generateId('note'),
            reviewerId: 'SYSTEM',
            timestamp: now,
            text: `Initial document processing pipeline completed for ${sample.scenarioTitle}.`,
          },
        ],
      };

      this.cases.set(caseId, onboardingCase);

      this.logAuditEvent(
        caseId,
        'SYSTEM',
        'CASE_INITIALIZED',
        `Demonstration case created for ${sample.name} (${ref})`,
        { scenario: sample.scenarioTitle }
      );
    }
  }

  // --- CRUD Methods ---

  public getAllCases(): OnboardingCase[] {
    return Array.from(this.cases.values()).sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }

  public getCaseById(caseId: string): OnboardingCase | undefined {
    return this.cases.get(caseId);
  }

  public createCase(data: {
    fullName: string;
    dateOfBirth: string;
    documentType: any;
    documentId: string;
    nationality?: string;
    address?: string;
  }): OnboardingCase {
    const caseId = this.generateId('case');
    const ref = this.generateReferenceNumber();
    const now = new Date().toISOString();

    const newCase: OnboardingCase = {
      id: caseId,
      referenceNumber: ref,
      status: 'UPLOADED',
      createdAt: now,
      updatedAt: now,
      declaredData: {
        fullName: data.fullName.trim(),
        dateOfBirth: data.dateOfBirth.trim(),
        documentType: data.documentType,
        documentId: data.documentId.trim(),
        nationality: data.nationality?.trim(),
        address: data.address?.trim(),
        declaredDate: now.slice(0, 10),
      },
      documents: [],
      extractedFields: [],
      validationResults: [],
      tamperingIndicators: [],
      reviewNotes: [],
    };

    this.cases.set(caseId, newCase);
    this.logAuditEvent(caseId, 'APPLICANT', 'CASE_CREATED', `Customer onboarding case ${ref} created`, {
      fullNameMasked: maskSensitiveValue(data.fullName, 'name'),
      documentType: data.documentType,
    });

    return newCase;
  }

  public attachDocument(
    caseId: string,
    document: Omit<DocumentMetadata, 'id' | 'caseId' | 'uploadedAt'>
  ): DocumentMetadata {
    const kase = this.cases.get(caseId);
    if (!kase) throw new Error(`Case ${caseId} not found`);

    const docId = this.generateId('doc');
    const now = new Date().toISOString();
    const docMeta: DocumentMetadata = {
      ...document,
      id: docId,
      caseId,
      uploadedAt: now,
    };

    kase.documents.push(docMeta);
    kase.updatedAt = now;
    if (kase.status === 'UPLOADED') {
      kase.status = 'UPLOADED';
    }

    this.logAuditEvent(caseId, 'APPLICANT', 'DOCUMENT_UPLOADED', `Document ${document.fileName} attached to case`, {
      documentId: docId,
      mimeType: document.mimeType,
      sizeBytes: document.fileSizeBytes,
    });

    return docMeta;
  }

  public updateCaseProcessingResults(
    caseId: string,
    extractedFields: ExtractedField[],
    validationResults: ValidationRuleResult[],
    tamperingIndicators: TamperIndicator[],
    rawOcrText: string
  ): OnboardingCase {
    const kase = this.cases.get(caseId);
    if (!kase) throw new Error(`Case ${caseId} not found`);

    kase.extractedFields = extractedFields;
    kase.validationResults = validationResults;
    kase.tamperingIndicators = tamperingIndicators;
    kase.rawOcrText = rawOcrText;
    kase.updatedAt = new Date().toISOString();

    const hasCriticalIssues = validationResults.some((r) => r.outcome === 'REVIEW_REQUIRED');
    kase.status = hasCriticalIssues ? 'REVIEW_REQUIRED' : 'IN_REVIEW';

    this.logAuditEvent(
      caseId,
      'OCR_ENGINE',
      'PROCESSING_COMPLETED',
      `OCR extraction completed with ${extractedFields.length} fields and ${validationResults.length} rule checks`,
      {
        flagsCount: validationResults.filter((r) => r.outcome === 'REVIEW_REQUIRED').length,
        statusAssigned: kase.status,
      }
    );

    return kase;
  }

  public applyFieldCorrection(caseId: string, req: CorrectFieldRequest): ExtractedField {
    const kase = this.cases.get(caseId);
    if (!kase) throw new Error(`Case ${caseId} not found`);

    const field = kase.extractedFields.find(
      (f) => f.fieldName.toLowerCase() === req.fieldName.toLowerCase()
    );
    if (!field) {
      throw new Error(`Field ${req.fieldName} not found in case`);
    }

    const previousValue = field.normalizedValue;
    field.isCorrected = true;
    field.correctedBy = req.reviewerId;
    field.correctedAt = new Date().toISOString();
    field.originalRawValue = field.rawValue;
    field.normalizedValue = req.correctedValue.trim();
    field.status = 'VALID';
    field.correctionReason = req.reason;
    kase.updatedAt = new Date().toISOString();

    // Log review action
    const action: ReviewAction = {
      id: this.generateId('action'),
      caseId,
      action: 'FIELD_CORRECTION',
      reviewerId: req.reviewerId,
      timestamp: new Date().toISOString(),
      notes: req.reason,
      fieldChanges: {
        fieldName: req.fieldName,
        oldValueMasked: maskSensitiveValue(previousValue, req.fieldName.includes('id') ? 'id' : 'name'),
        newValueMasked: maskSensitiveValue(req.correctedValue, req.fieldName.includes('id') ? 'id' : 'name'),
        reason: req.reason,
      },
    };
    this.reviewActions.unshift(action);

    this.logAuditEvent(
      caseId,
      req.reviewerId,
      'FIELD_CORRECTION',
      `Reviewer corrected field '${req.fieldName}'`,
      {
        fieldName: req.fieldName,
        reason: req.reason,
      }
    );

    return field;
  }

  public recordReviewDecision(caseId: string, req: ReviewDecisionRequest): OnboardingCase {
    const kase = this.cases.get(caseId);
    if (!kase) throw new Error(`Case ${caseId} not found`);

    const now = new Date().toISOString();
    let newStatus: CaseStatus = kase.status;

    if (req.decision === 'CLAIM_REVIEW') {
      newStatus = 'IN_REVIEW';
      kase.assignedReviewerId = req.reviewerId;
    } else if (req.decision === 'APPROVE') {
      newStatus = 'APPROVED_BY_REVIEWER';
      kase.assignedReviewerId = req.reviewerId;
    } else if (req.decision === 'RETURN_FOR_CORRECTION') {
      newStatus = 'RETURNED_FOR_CORRECTION';
      kase.assignedReviewerId = req.reviewerId;
    }

    kase.status = newStatus;
    kase.updatedAt = now;

    if (req.notes) {
      kase.reviewNotes.push({
        id: this.generateId('note'),
        reviewerId: req.reviewerId,
        timestamp: now,
        text: req.notes,
      });
    }

    const action: ReviewAction = {
      id: this.generateId('action'),
      caseId,
      action:
        req.decision === 'APPROVE'
          ? 'APPROVED_SIMULATION'
          : req.decision === 'RETURN_FOR_CORRECTION'
          ? 'RETURNED_FOR_CORRECTION'
          : 'STATUS_CHANGE',
      reviewerId: req.reviewerId,
      timestamp: now,
      notes: req.notes,
    };
    this.reviewActions.unshift(action);

    this.logAuditEvent(
      caseId,
      req.reviewerId,
      `DECISION_${req.decision}`,
      `Reviewer recorded decision: ${req.decision} (New Status: ${newStatus})`,
      { notes: req.notes }
    );

    return kase;
  }

  public addReviewNote(caseId: string, reviewerId: string, text: string) {
    const kase = this.cases.get(caseId);
    if (!kase) throw new Error(`Case ${caseId} not found`);

    const note = {
      id: this.generateId('note'),
      reviewerId,
      timestamp: new Date().toISOString(),
      text,
    };
    kase.reviewNotes.push(note);
    kase.updatedAt = new Date().toISOString();

    this.logAuditEvent(caseId, reviewerId, 'NOTE_ADDED', `Reviewer note recorded for case`);
    return note;
  }

  public getAuditHistory(caseId?: string): AuditEvent[] {
    if (!caseId) return this.auditEvents;
    return this.auditEvents.filter((e) => e.caseId === caseId);
  }

  public getReviewActions(caseId?: string): ReviewAction[] {
    if (!caseId) return this.reviewActions;
    return this.reviewActions.filter((a) => a.caseId === caseId);
  }
}

export const caseDb = new CaseDatabase();
