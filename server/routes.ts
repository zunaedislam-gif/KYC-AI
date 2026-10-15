/**
 * KYC-AI — Intelligent Customer Onboarding and Document Verification Platform
 * Express API Router
 */

import { Router, Request, Response } from 'express';
import multer from 'multer';
import { caseDb } from './db.js';
import { inspectImageBuffer } from './ocr/preprocess.js';
import { performOcrExtraction } from './ocr/engine.js';
import { executeValidationRules } from './validation/rules.js';
import { runTamperingHeuristicChecks } from './tampering/heuristics.js';
import { SAMPLE_IDENTITIES } from './sampleDocuments.js';
import { DocumentType } from './types.js';

export const kycRouter = Router();

// Configure multer memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
    files: 1,
  },
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file MIME type: ${file.mimetype}. Allowed: PNG, JPEG, WebP, SVG.`));
    }
  },
});

/**
 * Health check endpoint
 */
kycRouter.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'HEALTHY',
    service: 'KYC-AI Verification Platform',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    ocrEngine: 'Tesseract.js OCR (LSTM Neural Net)',
    complianceNotice: 'Educational compliance-support simulation. Not for autonomous legal decisions.',
  });
});

/**
 * Get all sample identities & templates
 */
kycRouter.get('/sample-documents', (_req: Request, res: Response) => {
  const samples = SAMPLE_IDENTITIES.map((s) => ({
    id: s.id,
    name: s.name,
    scenarioTitle: s.scenarioTitle,
    scenarioDescription: s.scenarioDescription,
    expectedOutcome: s.expectedOutcome,
    declaredData: s.declaredData,
  }));
  res.json(samples);
});

/**
 * Get specific sample SVG by ID
 */
kycRouter.get('/sample-documents/:id/svg', (req: Request, res: Response) => {
  const sample = SAMPLE_IDENTITIES.find((s) => s.id === req.params.id);
  if (!sample) {
    res.status(404).json({ error: 'Sample identity not found' });
    return;
  }
  res.setHeader('Content-Type', 'image/svg+xml');
  res.send(sample.sampleDocumentSvg);
});

/**
 * List all onboarding cases
 */
kycRouter.get('/cases', (_req: Request, res: Response) => {
  const cases = caseDb.getAllCases();
  res.json({
    total: cases.length,
    cases,
  });
});

/**
 * Create a new onboarding case
 */
kycRouter.post('/cases', (req: Request, res: Response) => {
  const { fullName, dateOfBirth, documentType, documentId, nationality, address } = req.body;

  if (!fullName || !dateOfBirth || !documentType || !documentId) {
    res.status(400).json({
      error: 'Missing required fields: fullName, dateOfBirth, documentType, documentId are mandatory',
    });
    return;
  }

  try {
    const newCase = caseDb.createCase({
      fullName,
      dateOfBirth,
      documentType: documentType as DocumentType,
      documentId,
      nationality,
      address,
    });
    res.status(201).json(newCase);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to create case' });
  }
});

/**
 * Get single case details by ID
 */
kycRouter.get('/cases/:caseId', (req: Request, res: Response) => {
  const kase = caseDb.getCaseById(req.params.caseId);
  if (!kase) {
    res.status(404).json({ error: `Case '${req.params.caseId}' not found` });
    return;
  }
  res.json(kase);
});

/**
 * Upload document to a case
 */
kycRouter.post('/cases/:caseId/documents', upload.single('file'), (req: Request, res: Response) => {
  const { caseId } = req.params;
  const kase = caseDb.getCaseById(caseId);
  if (!kase) {
    res.status(404).json({ error: `Case '${caseId}' not found` });
    return;
  }

  const file = req.file;
  if (!file) {
    res.status(400).json({ error: 'No file provided in form field "file"' });
    return;
  }

  try {
    const report = inspectImageBuffer(file.buffer, file.mimetype);
    const base64Data = file.buffer.toString('base64');
    const dataUrl = `data:${file.mimetype};base64,${base64Data}`;

    const docMeta = caseDb.attachDocument(caseId, {
      fileName: file.originalname,
      mimeType: file.mimetype,
      fileSizeBytes: file.size,
      documentType: kase.declaredData.documentType,
      width: report.width,
      height: report.height,
      dataUrl,
      preprocessingNotes: report.notes,
      qualityScore: Math.round((report.sharpnessScore + report.contrastScore) / 2),
    });

    res.status(201).json({
      document: docMeta,
      preprocessingReport: report,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Document upload failed' });
  }
});

/**
 * Attach pre-configured synthetic sample document to case
 */
kycRouter.post('/cases/:caseId/sample-document', (req: Request, res: Response) => {
  const { caseId } = req.params;
  const { sampleId } = req.body;

  const kase = caseDb.getCaseById(caseId);
  if (!kase) {
    res.status(404).json({ error: `Case '${caseId}' not found` });
    return;
  }

  const sample = SAMPLE_IDENTITIES.find((s) => s.id === sampleId);
  if (!sample) {
    res.status(404).json({ error: `Sample document '${sampleId}' not found` });
    return;
  }

  const svgData = sample.sampleDocumentSvg;
  const dataUrl = `data:image/svg+xml;utf8,${encodeURIComponent(svgData)}`;

  const docMeta = caseDb.attachDocument(caseId, {
    fileName: `${sample.name.toLowerCase().replace(/\s+/g, '_')}_specimen.svg`,
    mimeType: 'image/svg+xml',
    fileSizeBytes: svgData.length,
    documentType: sample.declaredData.documentType,
    width: 850,
    height: 540,
    dataUrl,
    preprocessingNotes: [
      'Synthetic benchmark template selected',
      'Vector visual zone mapped to text layer',
      sample.id.includes('taylor') ? 'Simulated mobile sensor low-contrast' : 'High resolution digital vector scan',
    ],
    qualityScore: sample.id.includes('taylor') ? 48 : 95,
  });

  res.json({ document: docMeta });
});

/**
 * Process document with OCR extraction & validation rules
 */
kycRouter.post('/cases/:caseId/process', async (req: Request, res: Response) => {
  const { caseId } = req.params;
  const kase = caseDb.getCaseById(caseId);
  if (!kase) {
    res.status(404).json({ error: `Case '${caseId}' not found` });
    return;
  }

  if (kase.documents.length === 0) {
    res.status(400).json({ error: 'Cannot process case without an attached document' });
    return;
  }

  try {
    const doc = kase.documents[kase.documents.length - 1];
    let imageBuffer: Buffer;

    if (doc.dataUrl?.startsWith('data:image/svg+xml')) {
      // Decode SVG from data URI
      const raw = decodeURIComponent(doc.dataUrl.replace('data:image/svg+xml;utf8,', ''));
      imageBuffer = Buffer.from(raw, 'utf-8');
    } else if (doc.dataUrl?.includes(';base64,')) {
      const base64 = doc.dataUrl.split(';base64,')[1];
      imageBuffer = Buffer.from(base64, 'base64');
    } else {
      imageBuffer = Buffer.from(doc.fileName, 'utf-8');
    }

    // 1. Run Preprocessing & Image Stats
    const prepReport = inspectImageBuffer(imageBuffer, doc.mimeType);

    // 2. Perform OCR Extraction
    const ocrResult = await performOcrExtraction(imageBuffer, doc.documentType);

    // 3. Execute Compliance Validation Rules
    const validationResults = executeValidationRules(kase.declaredData, ocrResult.extractedFields);

    // 4. Run Heuristic Tampering Checks
    const tamperingIndicators = runTamperingHeuristicChecks(
      prepReport,
      ocrResult.rawText,
      doc.fileName
    );

    // 5. Update Case State & Log Event
    const updatedCase = caseDb.updateCaseProcessingResults(
      caseId,
      ocrResult.extractedFields,
      validationResults,
      tamperingIndicators,
      ocrResult.rawText
    );

    res.json({
      case: updatedCase,
      ocrResult: {
        overallConfidence: ocrResult.overallConfidence,
        linesCount: ocrResult.lines.length,
        extractedFieldsCount: ocrResult.extractedFields.length,
      },
    });
  } catch (err: any) {
    console.error('Processing error:', err);
    res.status(500).json({ error: err.message || 'OCR processing failed' });
  }
});

/**
 * Get case results (extraction, rules, heuristics)
 */
kycRouter.get('/cases/:caseId/results', (req: Request, res: Response) => {
  const kase = caseDb.getCaseById(req.params.caseId);
  if (!kase) {
    res.status(404).json({ error: `Case '${req.params.caseId}' not found` });
    return;
  }

  res.json({
    caseId: kase.id,
    referenceNumber: kase.referenceNumber,
    status: kase.status,
    declaredData: kase.declaredData,
    extractedFields: kase.extractedFields,
    validationResults: kase.validationResults,
    tamperingIndicators: kase.tamperingIndicators,
    documents: kase.documents,
    reviewNotes: kase.reviewNotes,
  });
});

/**
 * Apply reviewer field correction
 */
kycRouter.post('/cases/:caseId/corrections', (req: Request, res: Response) => {
  const { caseId } = req.params;
  const { fieldName, correctedValue, reason, reviewerId } = req.body;

  if (!fieldName || correctedValue === undefined || !reason || !reviewerId) {
    res.status(400).json({
      error: 'Missing required parameters: fieldName, correctedValue, reason, and reviewerId are mandatory',
    });
    return;
  }

  try {
    const updatedField = caseDb.applyFieldCorrection(caseId, {
      fieldName,
      correctedValue,
      reason,
      reviewerId,
    });

    // Re-evaluate validation rules after correction
    const kase = caseDb.getCaseById(caseId)!;
    const revalidated = executeValidationRules(kase.declaredData, kase.extractedFields);
    kase.validationResults = revalidated;

    res.json({
      success: true,
      field: updatedField,
      updatedValidationResults: revalidated,
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * Record human review decision (Approve simulation or Return for correction)
 */
kycRouter.post('/cases/:caseId/review', (req: Request, res: Response) => {
  const { caseId } = req.params;
  const { decision, reviewerId, notes } = req.body;

  if (!decision || !reviewerId) {
    res.status(400).json({ error: 'Missing required parameters: decision and reviewerId are mandatory' });
    return;
  }

  if (!['APPROVE', 'RETURN_FOR_CORRECTION', 'CLAIM_REVIEW'].includes(decision)) {
    res.status(400).json({ error: `Invalid decision: ${decision}` });
    return;
  }

  try {
    const updatedCase = caseDb.recordReviewDecision(caseId, {
      decision,
      reviewerId,
      notes: notes || '',
    });
    res.json(updatedCase);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * Add note to case
 */
kycRouter.post('/cases/:caseId/notes', (req: Request, res: Response) => {
  const { caseId } = req.params;
  const { reviewerId, text } = req.body;

  if (!reviewerId || !text) {
    res.status(400).json({ error: 'reviewerId and text are required' });
    return;
  }

  try {
    const note = caseDb.addReviewNote(caseId, reviewerId, text);
    res.status(201).json(note);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * Get audit history & review actions
 */
kycRouter.get('/cases/:caseId/history', (req: Request, res: Response) => {
  const { caseId } = req.params;
  const auditEvents = caseDb.getAuditHistory(caseId);
  const reviewActions = caseDb.getReviewActions(caseId);
  res.json({
    caseId,
    auditEvents,
    reviewActions,
  });
});

/**
 * Global audit logs
 */
kycRouter.get('/audit-logs', (_req: Request, res: Response) => {
  res.json({
    total: caseDb.getAuditHistory().length,
    events: caseDb.getAuditHistory(),
  });
});

/**
 * OpenAPI Specification Documentation
 */
kycRouter.get('/openapi.json', (_req: Request, res: Response) => {
  res.json({
    openapi: '3.0.3',
    info: {
      title: 'KYC-AI Verification API',
      version: '1.0.0',
      description:
        'Intelligent Customer Onboarding and Document Verification Platform OpenAPI 3.0 specification.',
    },
    paths: {
      '/health': { get: { summary: 'System health check' } },
      '/api/kyc/cases': {
        get: { summary: 'List all onboarding cases' },
        post: { summary: 'Create new onboarding case' },
      },
      '/api/kyc/cases/{caseId}': { get: { summary: 'Get case by ID' } },
      '/api/kyc/cases/{caseId}/documents': { post: { summary: 'Upload document' } },
      '/api/kyc/cases/{caseId}/process': { post: { summary: 'Run OCR and validation engine' } },
      '/api/kyc/cases/{caseId}/results': { get: { summary: 'Get extraction and validation results' } },
      '/api/kyc/cases/{caseId}/corrections': { post: { summary: 'Apply reviewer correction' } },
      '/api/kyc/cases/{caseId}/review': { post: { summary: 'Record reviewer decision' } },
      '/api/kyc/cases/{caseId}/history': { get: { summary: 'Audit history and action logs' } },
    },
  });
});
