/**
 * Automated Test Suite for KYC-AI Platform
 * Tests validation rules, name fuzzy matching, date normalization,
 * expiry detection, OCR thresholding, and case audit trails.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  compareNames,
  normalizeDateString,
  maskSensitiveValue,
  levenshteinDistance,
  executeValidationRules,
} from '../server/validation/rules.js';
import { caseDb } from '../server/db.js';
import { inspectImageBuffer } from '../server/ocr/preprocess.js';
import { runTamperingHeuristicChecks } from '../server/tampering/heuristics.js';

test('1. Date Normalization & Validity', async (t) => {
  await t.test('Standardizes ISO format YYYY-MM-DD', () => {
    const res = normalizeDateString('1990-05-12');
    assert.equal(res.isValidDate, true);
    assert.equal(res.normalized, '1990-05-12');
  });

  await t.test('Normalizes European DD/MM/YYYY format', () => {
    const res = normalizeDateString('14/06/1988');
    assert.equal(res.isValidDate, true);
    assert.equal(res.normalized, '1988-06-14');
  });

  await t.test('Rejects invalid calendar dates (e.g. Feb 31)', () => {
    const res = normalizeDateString('1990-02-31');
    assert.equal(res.isValidDate, false);
    assert.equal(res.normalized, null);
  });

  await t.test('Handles empty or null date gracefully', () => {
    const res = normalizeDateString('');
    assert.equal(res.isValidDate, false);
    assert.equal(res.normalized, null);
  });
});

test('2. Name Comparison & Fuzzy Matching', async (t) => {
  await t.test('Exact match passes with 1.0 similarity', () => {
    const res = compareNames('Alex Mercer', 'Alex Mercer');
    assert.equal(res.outcome, 'PASS');
    assert.equal(res.similarity, 1.0);
  });

  await t.test('Subset variation (middle name on document) passes', () => {
    const res = compareNames('Elena Vance', 'Elena Rostova Vance');
    assert.equal(res.outcome, 'PASS');
    assert.equal(res.similarity, 0.9);
  });

  await t.test('Minor typo triggers REVIEW_REQUIRED without fraud assumption', () => {
    const res = compareNames('Taylor Morgan', 'Tailor Morgan');
    assert.equal(res.outcome, 'REVIEW_REQUIRED');
    assert.ok(res.similarity >= 0.8);
  });

  await t.test('Substantive mismatch triggers review required', () => {
    const res = compareNames('John Doe', 'Richard Roe');
    assert.equal(res.outcome, 'REVIEW_REQUIRED');
    assert.ok(res.similarity < 0.5);
  });
});

test('3. Sensitive Value Masking for Compliance & Privacy', async (t) => {
  await t.test('Masks document identifier retaining edges', () => {
    const masked = maskSensitiveValue('HZ-8849-2194', 'id');
    assert.ok(masked.startsWith('HZ'));
    assert.ok(masked.endsWith('94'));
    assert.ok(masked.includes('*'));
  });

  await t.test('Masks date preserving decade and day only', () => {
    const masked = maskSensitiveValue('1988-06-14', 'date');
    assert.equal(masked, '19**-**-14');
  });
});

test('4. Full Validation Rules Pipeline', async (t) => {
  const declared = {
    fullName: 'Alex Mercer',
    dateOfBirth: '1988-06-14',
    documentType: 'GENERIC_ID_CARD',
    documentId: 'HZ-8849-2194',
  };

  const extractedFields = [
    {
      fieldName: 'full_name',
      rawValue: 'Alex Mercer',
      normalizedValue: 'Alex Mercer',
      confidence: 95,
      status: 'VALID',
    },
    {
      fieldName: 'date_of_birth',
      rawValue: '1988-06-14',
      normalizedValue: '1988-06-14',
      confidence: 92,
      status: 'VALID',
    },
    {
      fieldName: 'document_id',
      rawValue: 'HZ-8849-2194',
      normalizedValue: 'HZ88492194',
      confidence: 96,
      status: 'VALID',
    },
    {
      fieldName: 'expiry_date',
      rawValue: '2029-08-30',
      normalizedValue: '2029-08-30',
      confidence: 90,
      status: 'VALID',
    },
  ];

  const results = executeValidationRules(declared, extractedFields, new Date('2026-10-11'));

  const nameCheck = results.find((r) => r.ruleId === 'RULE_NAME_MATCH');
  assert.ok(nameCheck);
  assert.equal(nameCheck.outcome, 'PASS');

  const dobCheck = results.find((r) => r.ruleId === 'RULE_DOB_MATCH');
  assert.ok(dobCheck);
  assert.equal(dobCheck.outcome, 'PASS');

  const expiryCheck = results.find((r) => r.ruleId === 'RULE_DOC_EXPIRY');
  assert.ok(expiryCheck);
  assert.equal(expiryCheck.outcome, 'PASS');
});

test('5. Expired Document Generates Warning (Not Autonomous Rejection)', async (t) => {
  const declared = {
    fullName: 'Elena Vance',
    dateOfBirth: '1992-11-20',
    documentType: 'GENERIC_PASSPORT_PAGE',
    documentId: 'P74928104',
  };

  const extractedFields = [
    {
      fieldName: 'full_name',
      rawValue: 'Elena Rostova Vance',
      normalizedValue: 'Elena Rostova Vance',
      confidence: 90,
      status: 'VALID',
    },
    {
      fieldName: 'date_of_birth',
      rawValue: '1992-11-20',
      normalizedValue: '1992-11-20',
      confidence: 90,
      status: 'VALID',
    },
    {
      fieldName: 'document_id',
      rawValue: 'P74928104',
      normalizedValue: 'P74928104',
      confidence: 90,
      status: 'VALID',
    },
    {
      fieldName: 'expiry_date',
      rawValue: '2024-05-10', // Expired relative to 2026
      normalizedValue: '2024-05-10',
      confidence: 90,
      status: 'WARNING',
    },
  ];

  const results = executeValidationRules(declared, extractedFields, new Date('2026-10-11'));
  const expiryCheck = results.find((r) => r.ruleId === 'RULE_DOC_EXPIRY');
  assert.ok(expiryCheck);
  assert.equal(expiryCheck.outcome, 'REVIEW_REQUIRED');
  assert.ok(expiryCheck.explanation.includes('expired'));
});

test('6. Image Preprocessing & Tamper Heuristics', async (t) => {
  // Test with dummy image buffer
  const sampleBuffer = Buffer.alloc(1024, 0x55);
  const report = inspectImageBuffer(sampleBuffer, 'image/png');
  assert.ok(report.sharpnessScore >= 0);
  assert.ok(report.contrastScore >= 0);

  const heuristics = runTamperingHeuristicChecks(report, 'REPUBLIC OF HORIZON ALEX MERCER', 'scan.png');
  assert.ok(heuristics.length >= 3);
  assert.ok(heuristics.every((h) => h.isExperimental === true));
});

test('7. Case Management, Field Corrections & Audit Trail', async (t) => {
  const newCase = caseDb.createCase({
    fullName: 'Test Applicant',
    dateOfBirth: '1995-01-01',
    documentType: 'GENERIC_ID_CARD',
    documentId: 'HZ-1234-5678',
  });

  assert.equal(newCase.status, 'UPLOADED');

  // Attach extracted fields
  caseDb.updateCaseProcessingResults(
    newCase.id,
    [
      {
        fieldName: 'full_name',
        rawValue: 'Tost Applicant', // OCR error
        normalizedValue: 'Tost Applicant',
        confidence: 62,
        status: 'WARNING',
      },
    ],
    [],
    [],
    'Tost Applicant'
  );

  // Reviewer performs manual correction
  const corrected = caseDb.applyFieldCorrection(newCase.id, {
    fieldName: 'full_name',
    correctedValue: 'Test Applicant',
    reason: 'Corrected OCR letter error "o" to "e" after inspecting photo scan',
    reviewerId: 'REV-009',
  });

  assert.equal(corrected.normalizedValue, 'Test Applicant');
  assert.equal(corrected.isCorrected, true);

  // Reviewer records decision
  const reviewed = caseDb.recordReviewDecision(newCase.id, {
    decision: 'APPROVE',
    reviewerId: 'REV-009',
    notes: 'Simulation onboarding verification approved by compliance reviewer.',
  });

  assert.equal(reviewed.status, 'APPROVED_BY_REVIEWER');

  // Verify immutable audit log
  const auditLogs = caseDb.getAuditHistory(newCase.id);
  assert.ok(auditLogs.length >= 3);
  assert.ok(auditLogs.some((e) => e.actionType === 'FIELD_CORRECTION'));
  assert.ok(auditLogs.some((e) => e.actionType === 'DECISION_APPROVE'));
});
