/**
 * KYC-AI — Intelligent Customer Onboarding and Document Verification Platform
 * Validation Rules Engine
 *
 * Implements deterministic compliance-support validation rules comparing
 * customer-declared form data with OCR-extracted document fields.
 *
 * CRITICAL COMPLIANCE PRINCIPLES:
 * 1. A mismatch is a REVIEW FLAG, not proof of fraud.
 * 2. Do NOT automatically reject a person because of an OCR error, missing field,
 *    document-quality issue, or format variance.
 * 3. Never use OCR alone to establish document authenticity.
 */

import {
  DeclaredCustomerData,
  ExtractedField,
  ValidationOutcome,
  ValidationRuleResult,
} from '../types.js';

/**
 * Mask sensitive values (e.g. document identifiers or names) to protect PII
 */
export function maskSensitiveValue(value: string | undefined | null, type: 'id' | 'name' | 'date' = 'id'): string {
  if (!value) return '[NOT PROVIDED]';
  const trimmed = value.trim();
  if (trimmed.length === 0) return '[EMPTY]';

  if (type === 'id') {
    if (trimmed.length <= 4) return '***';
    const start = trimmed.slice(0, 2);
    const end = trimmed.slice(-2);
    return `${start}${'*'.repeat(Math.max(trimmed.length - 4, 3))}${end}`;
  }

  if (type === 'date') {
    // 1990-05-12 -> 19**-**-12
    const parts = trimmed.split(/[-/.]/);
    if (parts.length === 3) {
      return `${parts[0].slice(0, 2)}**-**-${parts[2]}`;
    }
    return '****-**-**';
  }

  // Name: First character of each token preserved, others masked
  const tokens = trimmed.split(/\s+/);
  return tokens
    .map((t) => (t.length <= 1 ? t : `${t[0]}${'*'.repeat(Math.min(t.length - 1, 4))}`))
    .join(' ');
}

/**
 * Calculate Levenshtein distance between two strings
 */
export function levenshteinDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
  }
  return dp[m][n];
}

/**
 * Normalize and compare names, handling middle names, case, and whitespace
 */
export function compareNames(
  declaredName: string,
  extractedName: string
): {
  outcome: ValidationOutcome;
  similarity: number;
  explanation: string;
} {
  const cleanA = declaredName.toLowerCase().replace(/[^a-z\s]/g, '').trim().split(/\s+/).filter(Boolean);
  const cleanB = extractedName.toLowerCase().replace(/[^a-z\s]/g, '').trim().split(/\s+/).filter(Boolean);

  if (cleanA.length === 0 || cleanB.length === 0) {
    return {
      outcome: 'REVIEW_REQUIRED',
      similarity: 0,
      explanation: 'Name field is empty or missing in one of the data sources.',
    };
  }

  const strA = cleanA.join(' ');
  const strB = cleanB.join(' ');

  // Exact match
  if (strA === strB) {
    return {
      outcome: 'PASS',
      similarity: 1.0,
      explanation: 'Declared name matches document extracted name exactly.',
    };
  }

  // Subset check (e.g. Declared: "Alex Mercer", Document: "Alex James Mercer")
  const aInB = cleanA.every((part) => cleanB.some((bPart) => bPart === part || bPart.startsWith(part)));
  const bInA = cleanB.every((part) => cleanA.some((aPart) => aPart === part || aPart.startsWith(part)));

  if (aInB || bInA) {
    return {
      outcome: 'PASS',
      similarity: 0.9,
      explanation:
        'Declared and document names match with minor name token variation (e.g. middle name or initial omitted).',
    };
  }

  // Fuzzy edit distance
  const maxLen = Math.max(strA.length, strB.length);
  const dist = levenshteinDistance(strA, strB);
  const similarity = Math.max(0, 1 - dist / maxLen);

  if (similarity >= 0.8) {
    return {
      outcome: 'REVIEW_REQUIRED',
      similarity,
      explanation: `Minor name spelling variance detected (similarity: ${(similarity * 100).toFixed(0)}%). Review required to verify single character typo or OCR misread.`,
    };
  }

  return {
    outcome: 'REVIEW_REQUIRED',
    similarity,
    explanation: `Substantive name mismatch detected between declared value and document text (similarity: ${(similarity * 100).toFixed(0)}%). Human review required.`,
  };
}

/**
 * Standardize date strings to YYYY-MM-DD
 */
export function normalizeDateString(dateStr: string | undefined | null): {
  normalized: string | null;
  isValidDate: boolean;
  raw: string;
} {
  if (!dateStr) return { normalized: null, isValidDate: false, raw: '' };
  const raw = dateStr.trim();

  // Match ISO YYYY-MM-DD
  const isoMatch = raw.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
  if (isoMatch) {
    const [, y, m, d] = isoMatch;
    const year = parseInt(y, 10);
    const month = parseInt(m, 10);
    const day = parseInt(d, 10);
    const dateObj = new Date(year, month - 1, day);
    const isValid =
      dateObj.getFullYear() === year &&
      dateObj.getMonth() === month - 1 &&
      dateObj.getDate() === day;
    if (isValid) {
      return {
        normalized: `${year.toString().padStart(4, '0')}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`,
        isValidDate: true,
        raw,
      };
    }
    // Explicitly reject if year/month/day do not match (e.g. Feb 31 rolled over)
    return { normalized: null, isValidDate: false, raw };
  }

  // Match DD/MM/YYYY or DD-MM-YYYY
  const dmyMatch = raw.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);
  if (dmyMatch) {
    const [, d, m, y] = dmyMatch;
    const year = parseInt(y, 10);
    const month = parseInt(m, 10);
    const day = parseInt(d, 10);
    const dateObj = new Date(year, month - 1, day);
    const isValid =
      dateObj.getFullYear() === year &&
      dateObj.getMonth() === month - 1 &&
      dateObj.getDate() === day;
    if (isValid) {
      return {
        normalized: `${year.toString().padStart(4, '0')}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`,
        isValidDate: true,
        raw,
      };
    }
    return { normalized: null, isValidDate: false, raw };
  }

  // Fallback Date parser
  const parsed = new Date(raw);
  if (!isNaN(parsed.getTime())) {
    const y = parsed.getFullYear();
    const m = (parsed.getMonth() + 1).toString().padStart(2, '0');
    const d = parsed.getDate().toString().padStart(2, '0');
    return { normalized: `${y}-${m}-${d}`, isValidDate: true, raw };
  }

  return { normalized: null, isValidDate: false, raw };
}

/**
 * Execute all compliance validation rules on case data
 */
export function executeValidationRules(
  declared: DeclaredCustomerData,
  extractedFields: ExtractedField[],
  referenceDate: Date = new Date()
): ValidationRuleResult[] {
  const results: ValidationRuleResult[] = [];

  const getField = (name: string): ExtractedField | undefined =>
    extractedFields.find((f) => f.fieldName.toLowerCase() === name.toLowerCase());

  // Helper to add result
  const addResult = (
    ruleId: string,
    ruleTitle: string,
    fieldName: string,
    outcome: ValidationOutcome,
    expectedMasked: string,
    observedMasked: string,
    explanation: string,
    severity: 'INFO' | 'WARNING' | 'CRITICAL' = 'WARNING'
  ) => {
    results.push({
      ruleId,
      ruleTitle,
      fieldName,
      outcome,
      expectedValueMasked: expectedMasked,
      observedValueMasked: observedMasked,
      explanation,
      severity,
    });
  };

  // 1. RULE: Full Name Match
  const extractedFullName = getField('full_name') || getField('name');
  if (!extractedFullName || !extractedFullName.normalizedValue) {
    addResult(
      'RULE_NAME_EXTRACTION',
      'Full Name Extraction',
      'full_name',
      'REVIEW_REQUIRED',
      maskSensitiveValue(declared.fullName, 'name'),
      '[NOT DETECTED]',
      'Full name could not be reliably extracted from the identity document. Manual reviewer verification required.',
      'CRITICAL'
    );
  } else {
    const comparison = compareNames(declared.fullName, extractedFullName.normalizedValue);
    addResult(
      'RULE_NAME_MATCH',
      'Declared vs Extracted Name Verification',
      'full_name',
      comparison.outcome,
      maskSensitiveValue(declared.fullName, 'name'),
      maskSensitiveValue(extractedFullName.normalizedValue, 'name'),
      comparison.explanation,
      comparison.outcome === 'PASS' ? 'INFO' : 'WARNING'
    );
  }

  // 2. RULE: Date of Birth Match & Age Validity
  const extractedDob = getField('date_of_birth') || getField('dob');
  const declaredDobNorm = normalizeDateString(declared.dateOfBirth);

  if (!declaredDobNorm.isValidDate) {
    addResult(
      'RULE_DOB_FORMAT',
      'Declared Date of Birth Format Check',
      'date_of_birth',
      'REVIEW_REQUIRED',
      'YYYY-MM-DD',
      declared.dateOfBirth,
      'Declared date of birth is not a recognized or valid calendar date format.',
      'CRITICAL'
    );
  } else {
    // Check Age > 18 and < 120
    const birthDate = new Date(declaredDobNorm.normalized!);
    const ageDiffMs = referenceDate.getTime() - birthDate.getTime();
    const ageYears = ageDiffMs / (1000 * 60 * 60 * 24 * 365.25);

    if (ageYears < 0) {
      addResult(
        'RULE_DOB_SANITY',
        'Date of Birth Plausibility',
        'date_of_birth',
        'REVIEW_REQUIRED',
        'Date in past',
        maskSensitiveValue(declaredDobNorm.normalized, 'date'),
        'Declared date of birth is in the future. Data entry error suspected.',
        'CRITICAL'
      );
    } else if (ageYears < 18) {
      addResult(
        'RULE_MINIMUM_AGE',
        'Minimum Age Requirement',
        'date_of_birth',
        'REVIEW_REQUIRED',
        '>= 18 years old',
        `Applicant is ~${Math.floor(ageYears)} years old`,
        'Applicant age is below 18 years. Onboarding policy requires adult identity or authorized guardian review.',
        'CRITICAL'
      );
    } else {
      addResult(
        'RULE_MINIMUM_AGE',
        'Minimum Age Requirement',
        'date_of_birth',
        'PASS',
        '>= 18 years old',
        `Applicant age: ${Math.floor(ageYears)} years`,
        'Applicant meets statutory adult age requirement.',
        'INFO'
      );
    }

    if (!extractedDob || !extractedDob.normalizedValue) {
      addResult(
        'RULE_DOB_EXTRACTION',
        'Document Date of Birth Extraction',
        'date_of_birth',
        'REVIEW_REQUIRED',
        maskSensitiveValue(declaredDobNorm.normalized, 'date'),
        '[NOT DETECTED]',
        'Date of birth could not be extracted from document. Reviewer must inspect document image directly.',
        'WARNING'
      );
    } else {
      const extractedDobNorm = normalizeDateString(extractedDob.normalizedValue);
      if (declaredDobNorm.normalized === extractedDobNorm.normalized) {
        addResult(
          'RULE_DOB_MATCH',
          'Date of Birth Consistency',
          'date_of_birth',
          'PASS',
          maskSensitiveValue(declaredDobNorm.normalized, 'date'),
          maskSensitiveValue(extractedDobNorm.normalized, 'date'),
          'Declared date of birth matches document extracted date of birth exactly.',
          'INFO'
        );
      } else {
        addResult(
          'RULE_DOB_MATCH',
          'Date of Birth Consistency',
          'date_of_birth',
          'REVIEW_REQUIRED',
          maskSensitiveValue(declaredDobNorm.normalized, 'date'),
          maskSensitiveValue(extractedDob.normalizedValue, 'date'),
          `Discrepancy detected between declared date of birth and document date. Review flag for manual verification.`,
          'WARNING'
        );
      }
    }
  }

  // 3. RULE: Document Identifier Match
  const extractedDocId =
    getField('document_id') ||
    getField('id_number') ||
    getField('passport_number') ||
    getField('doc_id');

  const cleanDeclaredId = declared.documentId.replace(/[^A-Za-z0-9]/g, '').toUpperCase();

  if (!extractedDocId || !extractedDocId.normalizedValue) {
    addResult(
      'RULE_DOC_ID_EXTRACTION',
      'Document Identifier Extraction',
      'document_id',
      'REVIEW_REQUIRED',
      maskSensitiveValue(declared.documentId, 'id'),
      '[NOT DETECTED]',
      'Document identifier could not be read with high confidence. Human inspection needed.',
      'WARNING'
    );
  } else {
    const cleanExtractedId = extractedDocId.normalizedValue.replace(/[^A-Za-z0-9]/g, '').toUpperCase();

    if (cleanDeclaredId === cleanExtractedId) {
      addResult(
        'RULE_DOC_ID_MATCH',
        'Document Identifier Consistency',
        'document_id',
        'PASS',
        maskSensitiveValue(declared.documentId, 'id'),
        maskSensitiveValue(extractedDocId.normalizedValue, 'id'),
        'Declared document identifier matches document extracted identifier exactly.',
        'INFO'
      );
    } else {
      const dist = levenshteinDistance(cleanDeclaredId, cleanExtractedId);
      const isMinorTypo = dist <= 2;
      addResult(
        'RULE_DOC_ID_MATCH',
        'Document Identifier Consistency',
        'document_id',
        'REVIEW_REQUIRED',
        maskSensitiveValue(declared.documentId, 'id'),
        maskSensitiveValue(extractedDocId.normalizedValue, 'id'),
        isMinorTypo
          ? `Minor identifier variance (${dist} character difference). May be an OCR character misread (e.g., '0' vs 'O', '1' vs 'I'). Review required.`
          : 'Document identifier mismatch between declared value and document extraction. Review required.',
        'CRITICAL'
      );
    }
  }

  // 4. RULE: Document Expiry Date Check
  const extractedExpiry = getField('expiry_date') || getField('expiration_date') || getField('valid_until');
  if (extractedExpiry && extractedExpiry.normalizedValue) {
    const expNorm = normalizeDateString(extractedExpiry.normalizedValue);
    if (expNorm.isValidDate && expNorm.normalized) {
      const expDate = new Date(expNorm.normalized);
      const isExpired = expDate.getTime() < referenceDate.getTime();
      const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
      const isExpiringSoon = expDate.getTime() - referenceDate.getTime() < thirtyDaysMs && !isExpired;

      if (isExpired) {
        addResult(
          'RULE_DOC_EXPIRY',
          'Document Validity & Expiry',
          'expiry_date',
          'REVIEW_REQUIRED',
          `Valid after ${referenceDate.toISOString().slice(0, 10)}`,
          maskSensitiveValue(expNorm.normalized, 'date'),
          'Document has expired. Expiry is a compliance review flag for renewed document collection, not proof of fraud.',
          'WARNING'
        );
      } else if (isExpiringSoon) {
        addResult(
          'RULE_DOC_EXPIRY',
          'Document Validity & Expiry',
          'expiry_date',
          'REVIEW_REQUIRED',
          '> 30 days remaining',
          maskSensitiveValue(expNorm.normalized, 'date'),
          'Document will expire within 30 days. Recommend requesting updated document during onboarding.',
          'INFO'
        );
      } else {
        addResult(
          'RULE_DOC_EXPIRY',
          'Document Validity & Expiry',
          'expiry_date',
          'PASS',
          'Future expiration date',
          maskSensitiveValue(expNorm.normalized, 'date'),
          'Document is currently within valid date range.',
          'INFO'
        );
      }
    }
  } else {
    // If document type usually has an expiry date, flag for review
    if (declared.documentType === 'GENERIC_PASSPORT_PAGE' || declared.documentType === 'GENERIC_ID_CARD') {
      addResult(
        'RULE_DOC_EXPIRY',
        'Document Expiry Field Verification',
        'expiry_date',
        'REVIEW_REQUIRED',
        'Document expiry date present',
        '[NOT FOUND]',
        'Expiry date could not be parsed from identity document. Reviewer should inspect physical validity.',
        'INFO'
      );
    }
  }

  // 5. RULE: OCR Confidence Quality Threshold
  const fieldsWithConfidence = extractedFields.filter((f) => f.confidence !== null);
  if (fieldsWithConfidence.length > 0) {
    const lowConfidenceFields = fieldsWithConfidence.filter((f) => (f.confidence ?? 100) < 65);
    const avgConfidence =
      fieldsWithConfidence.reduce((acc, f) => acc + (f.confidence ?? 0), 0) / fieldsWithConfidence.length;

    if (lowConfidenceFields.length > 0) {
      addResult(
        'RULE_OCR_CONFIDENCE',
        'OCR Text Legibility & Confidence',
        'ocr_engine',
        'REVIEW_REQUIRED',
        'Confidence >= 65%',
        `${lowConfidenceFields.length} field(s) below threshold (avg: ${avgConfidence.toFixed(1)}%)`,
        `Low OCR extraction confidence on: ${lowConfidenceFields.map((f) => f.fieldName).join(', ')}. Image may be blurred, low contrast, or skewed.`,
        'WARNING'
      );
    } else {
      addResult(
        'RULE_OCR_CONFIDENCE',
        'OCR Text Legibility & Confidence',
        'ocr_engine',
        'PASS',
        'Confidence >= 65%',
        `Average confidence: ${avgConfidence.toFixed(1)}%`,
        'Document image yielded high-confidence OCR text across all identified fields.',
        'INFO'
      );
    }
  }

  return results;
}
