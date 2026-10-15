/**
 * KYC-AI — Intelligent Customer Onboarding and Document Verification Platform
 * OCR Extraction Engine (powered by Tesseract.js Open-Source OCR Engine)
 */

import { createWorker, Worker } from 'tesseract.js';
import { DocumentType, ExtractedField } from '../types.js';
import { normalizeDateString } from '../validation/rules.js';

let sharedWorker: Worker | null = null;
let isInitializing = false;

/**
 * Get or initialize Tesseract worker
 */
async function getWorker(): Promise<Worker> {
  if (sharedWorker) return sharedWorker;
  if (isInitializing) {
    // Wait for in-flight initialization
    while (isInitializing) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    if (sharedWorker) return sharedWorker;
  }

  isInitializing = true;
  try {
    const worker = await createWorker('eng');
    sharedWorker = worker;
    return worker;
  } finally {
    isInitializing = false;
  }
}

export interface OcrEngineResult {
  rawText: string;
  overallConfidence: number;
  extractedFields: ExtractedField[];
  lines: Array<{
    text: string;
    confidence: number;
    bbox: { x0: number; y0: number; x1: number; y1: number };
  }>;
}

/**
 * Run OCR recognition on an image buffer and extract structured fields by template
 */
export async function performOcrExtraction(
  imageBuffer: Buffer,
  documentType: DocumentType
): Promise<OcrEngineResult> {
  let worker: Worker;
  try {
    worker = await getWorker();
  } catch (err) {
    console.warn('Tesseract worker init failed, attempting fresh instance:', err);
    worker = await createWorker('eng');
  }

  const result = await worker.recognize(imageBuffer);
  const data = result.data;
  const rawText = data.text || '';
  const overallConfidence = typeof data.confidence === 'number' ? Math.round(data.confidence) : 0;

  // Extract lines and word bounding boxes with real engine confidences
  const lines: Array<{
    text: string;
    confidence: number;
    bbox: { x0: number; y0: number; x1: number; y1: number };
  }> = [];

  const rawLines = (data as any).lines || (data.blocks ? data.blocks.flatMap((b) => b.paragraphs.flatMap((p) => p.lines)) : []);
  if (Array.isArray(rawLines)) {
    for (const l of rawLines) {
      if (l && l.text && l.text.trim()) {
        lines.push({
          text: l.text.trim(),
          confidence: Math.round(l.confidence || 0),
          bbox: {
            x0: l.bbox?.x0 || 0,
            y0: l.bbox?.y0 || 0,
            x1: l.bbox?.x1 || 0,
            y1: l.bbox?.y1 || 0,
          },
        });
      }
    }
  }

  const extractedFields = parseDocumentFields(rawText, lines, documentType);

  return {
    rawText,
    overallConfidence,
    extractedFields,
    lines,
  };
}

/**
 * Template-specific field extraction using heuristic spatial & pattern parsing
 */
function parseDocumentFields(
  rawText: string,
  lines: Array<{
    text: string;
    confidence: number;
    bbox: { x0: number; y0: number; x1: number; y1: number };
  }>,
  documentType: DocumentType
): ExtractedField[] {
  const fields: ExtractedField[] = [];
  const textLines = rawText.split('\n').map((l) => l.trim()).filter(Boolean);

  // Helper to find line with matching pattern and extract confidence
  const findLineAndConfidence = (
    predicate: (line: string) => boolean
  ): { lineText: string; confidence: number | null; bbox?: any } | null => {
    for (const item of lines) {
      if (predicate(item.text)) {
        return {
          lineText: item.text,
          confidence: item.confidence,
          bbox: item.bbox,
        };
      }
    }
    // Fallback to raw text lines
    for (const line of textLines) {
      if (predicate(line)) {
        return { lineText: line, confidence: null };
      }
    }
    return null;
  };

  if (documentType === 'GENERIC_ID_CARD') {
    // 1. Full Name
    // Look for "Name:", "Holder:", or line following "REPUBLIC OF HORIZON / IDENTITY CARD"
    let nameRaw = '';
    let nameConf: number | null = null;
    let nameBbox: any = undefined;

    const nameLineMatch = findLineAndConfidence((l) => /name\s*[:|-]/i.test(l));
    if (nameLineMatch) {
      nameRaw = nameLineMatch.lineText.replace(/.*?name\s*[:|-]\s*/i, '').trim();
      nameConf = nameLineMatch.confidence;
      nameBbox = nameLineMatch.bbox;
    } else {
      // Find title line and take subsequent non-empty line
      const titleIndex = lines.findIndex((l) => /identity\s*card|horizon/i.test(l.text));
      if (titleIndex >= 0 && titleIndex + 1 < lines.length) {
        const candidate = lines[titleIndex + 1];
        if (!/dob|date|id\s*no|expir/i.test(candidate.text)) {
          nameRaw = candidate.text;
          nameConf = candidate.confidence;
          nameBbox = candidate.bbox;
        }
      }
    }

    if (nameRaw) {
      fields.push({
        fieldName: 'full_name',
        rawValue: nameRaw,
        normalizedValue: nameRaw.replace(/[^A-Za-z\s.'-]/g, '').replace(/\s+/g, ' ').trim(),
        confidence: nameConf,
        status: (nameConf !== null && nameConf < 65) ? 'WARNING' : 'VALID',
        sourceReference: 'Visual Zone: Name Field',
        reviewWarning: (nameConf !== null && nameConf < 65) ? 'Low OCR confidence on name characters.' : undefined,
        boundingBox: nameBbox,
      });
    } else {
      fields.push({
        fieldName: 'full_name',
        rawValue: '',
        normalizedValue: '',
        confidence: null,
        status: 'MISSING',
        sourceReference: 'Visual Zone',
        reviewWarning: 'Full name could not be identified by template parser.',
      });
    }

    // 2. Date of Birth
    let dobRaw = '';
    let dobConf: number | null = null;
    let dobBbox: any = undefined;

    const dobMatch = findLineAndConfidence((l) => /dob|birth|d\.o\.b/i.test(l));
    if (dobMatch) {
      const match = dobMatch.lineText.match(/(\d{4}[-/.]\d{1,2}[-/.]\d{1,2}|\d{1,2}[-/.]\d{1,2}[-/.]\d{4})/);
      if (match) {
        dobRaw = match[1];
        dobConf = dobMatch.confidence;
        dobBbox = dobMatch.bbox;
      }
    } else {
      // Direct regex on all lines
      for (const line of lines) {
        const match = line.text.match(/(\d{4}[-/.]\d{1,2}[-/.]\d{1,2}|\d{1,2}[-/.]\d{1,2}[-/.]\d{4})/);
        if (match && !/expir|valid/i.test(line.text)) {
          dobRaw = match[1];
          dobConf = line.confidence;
          dobBbox = line.bbox;
          break;
        }
      }
    }

    const normDob = normalizeDateString(dobRaw);
    fields.push({
      fieldName: 'date_of_birth',
      rawValue: dobRaw,
      normalizedValue: normDob.normalized || dobRaw,
      confidence: dobConf,
      status: !normDob.isValidDate ? 'UNCERTAIN' : (dobConf !== null && dobConf < 65 ? 'WARNING' : 'VALID'),
      sourceReference: 'Visual Zone: Date of Birth',
      reviewWarning: !normDob.isValidDate ? 'Invalid date format extracted.' : undefined,
      boundingBox: dobBbox,
    });

    // 3. Document Identifier
    let idRaw = '';
    let idConf: number | null = null;
    let idBbox: any = undefined;

    const idMatch = findLineAndConfidence((l) => /id\s*no|card\s*no|doc\s*id|number/i.test(l));
    if (idMatch) {
      const match = idMatch.lineText.match(/([A-Z0-9]{2,4}[-\s]?[A-Z0-9]{3,5}[-\s]?[A-Z0-9]{3,5})/i);
      if (match) {
        idRaw = match[1];
        idConf = idMatch.confidence;
        idBbox = idMatch.bbox;
      } else {
        idRaw = idMatch.lineText.replace(/.*?id\s*no\s*[:|-]\s*/i, '').trim();
        idConf = idMatch.confidence;
      }
    } else {
      // Look for standard ID pattern: HZ-xxxx-xxxx or ID-xxxx-xxxx
      for (const line of lines) {
        const patternMatch = line.text.match(/([A-Z]{2}[-\s]?\d{4}[-\s]?\d{4})/i);
        if (patternMatch) {
          idRaw = patternMatch[1];
          idConf = line.confidence;
          idBbox = line.bbox;
          break;
        }
      }
    }

    fields.push({
      fieldName: 'document_id',
      rawValue: idRaw,
      normalizedValue: idRaw.replace(/[^A-Za-z0-9]/g, '').toUpperCase(),
      confidence: idConf,
      status: !idRaw ? 'MISSING' : (idConf !== null && idConf < 65 ? 'WARNING' : 'VALID'),
      sourceReference: 'Visual Zone: Document ID',
      reviewWarning: (idConf !== null && idConf < 65) ? 'Low confidence on ID characters. Inspect for 0/O or 1/I confusion.' : undefined,
      boundingBox: idBbox,
    });

    // 4. Expiry Date
    let expRaw = '';
    let expConf: number | null = null;
    let expBbox: any = undefined;

    const expMatch = findLineAndConfidence((l) => /expir|valid\s*until|exp\s*date/i.test(l));
    if (expMatch) {
      const match = expMatch.lineText.match(/(\d{4}[-/.]\d{1,2}[-/.]\d{1,2}|\d{1,2}[-/.]\d{1,2}[-/.]\d{4})/);
      if (match) {
        expRaw = match[1];
        expConf = expMatch.confidence;
        expBbox = expMatch.bbox;
      }
    }

    const normExp = normalizeDateString(expRaw);
    fields.push({
      fieldName: 'expiry_date',
      rawValue: expRaw,
      normalizedValue: normExp.normalized || expRaw,
      confidence: expConf,
      status: !expRaw ? 'MISSING' : (normExp.isValidDate ? 'VALID' : 'UNCERTAIN'),
      sourceReference: 'Visual Zone: Expiration Date',
      boundingBox: expBbox,
    });

    // 5. Issuing Country
    const hasCountry = /horizon|republic/i.test(rawText);
    fields.push({
      fieldName: 'issuing_country',
      rawValue: hasCountry ? 'Republic of Horizon' : 'Unknown',
      normalizedValue: hasCountry ? 'Republic of Horizon' : 'Unknown',
      confidence: hasCountry ? 95 : null,
      status: hasCountry ? 'VALID' : 'MISSING',
      sourceReference: 'Header: Republic of Horizon',
    });
  } else if (documentType === 'GENERIC_PASSPORT_PAGE') {
    // Look for MRZ (Machine Readable Zone) lines
    // MRZ Line 1: P<XXXSURNAME<<GIVEN<NAMES<<<<<
    // MRZ Line 2: DOCNUMBER<CHECK<DOB<SEX<EXPIRY
    const mrzLines = textLines.filter((l) => l.startsWith('P<') || (l.length >= 35 && l.includes('<<')));

    let surname = '';
    let givenNames = '';
    let passportNumber = '';
    let dob = '';
    let expiry = '';
    let nationality = 'HOR';
    let mrzConf: number | null = null;

    if (mrzLines.length >= 2) {
      const line1 = mrzLines[0].replace(/\s+/g, '');
      const line2 = mrzLines[1].replace(/\s+/g, '');
      mrzConf = 90;

      // Parse Line 1
      const namePart = line1.substring(5);
      const nameTokens = namePart.split('<<');
      surname = (nameTokens[0] || '').replace(/</g, ' ').trim();
      givenNames = (nameTokens[1] || '').replace(/</g, ' ').trim();

      // Parse Line 2
      passportNumber = line2.substring(0, 9).replace(/</g, '').trim();
      nationality = line2.substring(10, 13).replace(/</g, '').trim();
      const rawDob = line2.substring(13, 19); // YYMMDD
      if (rawDob.length === 6) {
        const yy = parseInt(rawDob.substring(0, 2), 10);
        const mm = rawDob.substring(2, 4);
        const dd = rawDob.substring(4, 6);
        const fullYear = yy > 30 ? 1900 + yy : 2000 + yy;
        dob = `${fullYear}-${mm}-${dd}`;
      }

      const rawExp = line2.substring(21, 27); // YYMMDD
      if (rawExp.length === 6) {
        const yy = parseInt(rawExp.substring(0, 2), 10);
        const mm = rawExp.substring(2, 4);
        const dd = rawExp.substring(4, 6);
        const fullYear = yy > 50 ? 1900 + yy : 2000 + yy;
        expiry = `${fullYear}-${mm}-${dd}`;
      }
    }

    // Also look at Visual Inspection Zone for fallback/confirmation
    const nameLine = findLineAndConfidence((l) => /surname|name|given/i.test(l));
    let visualName = '';
    if (nameLine) {
      visualName = nameLine.lineText.replace(/.*?name\s*[:|-]\s*/i, '').trim();
    }

    const fullNameStr = [givenNames, surname].filter(Boolean).join(' ') || visualName;
    fields.push({
      fieldName: 'full_name',
      rawValue: fullNameStr,
      normalizedValue: fullNameStr.replace(/\s+/g, ' ').trim(),
      confidence: mrzConf || (nameLine ? nameLine.confidence : null),
      status: fullNameStr ? 'VALID' : 'MISSING',
      sourceReference: mrzLines.length >= 2 ? 'MRZ Line 1 + Visual Zone' : 'Visual Inspection Zone',
    });

    const passNoMatch = findLineAndConfidence((l) => /passport\s*no|doc\s*no/i.test(l));
    const passNoVisual = passNoMatch ? passNoMatch.lineText.match(/([A-Z0-9]{8,10})/i)?.[1] : '';
    const finalPassNo = passportNumber || passNoVisual || '';

    fields.push({
      fieldName: 'document_id',
      rawValue: finalPassNo,
      normalizedValue: finalPassNo.toUpperCase().replace(/[^A-Z0-9]/g, ''),
      confidence: mrzConf || (passNoMatch ? passNoMatch.confidence : null),
      status: finalPassNo ? 'VALID' : 'MISSING',
      sourceReference: passportNumber ? 'MRZ Line 2 (Positions 1-9)' : 'Visual Inspection Zone',
    });

    fields.push({
      fieldName: 'date_of_birth',
      rawValue: dob,
      normalizedValue: dob,
      confidence: mrzConf,
      status: dob ? 'VALID' : 'MISSING',
      sourceReference: 'MRZ Line 2 (Positions 14-19)',
    });

    fields.push({
      fieldName: 'expiry_date',
      rawValue: expiry,
      normalizedValue: expiry,
      confidence: mrzConf,
      status: expiry ? 'VALID' : 'MISSING',
      sourceReference: 'MRZ Line 2 (Positions 22-27)',
    });

    fields.push({
      fieldName: 'issuing_country',
      rawValue: nationality === 'HOR' ? 'Republic of Horizon' : nationality,
      normalizedValue: nationality === 'HOR' ? 'Republic of Horizon' : nationality,
      confidence: 95,
      status: 'VALID',
      sourceReference: 'MRZ Issuing State Code',
    });
  } else {
    // GENERIC_APPLICATION_FORM
    const nameMatch = findLineAndConfidence((l) => /applicant\s*name|full\s*name/i.test(l));
    const nameVal = nameMatch ? nameMatch.lineText.replace(/.*?name\s*[:|-]\s*/i, '').trim() : '';

    fields.push({
      fieldName: 'full_name',
      rawValue: nameVal,
      normalizedValue: nameVal,
      confidence: nameMatch ? nameMatch.confidence : null,
      status: nameVal ? 'VALID' : 'MISSING',
      sourceReference: 'Form Field: Applicant Name',
    });

    const dobMatch = findLineAndConfidence((l) => /date\s*of\s*birth|dob/i.test(l));
    const rawDob = dobMatch ? dobMatch.lineText.replace(/.*?birth\s*[:|-]\s*/i, '').trim() : '';
    const normDob = normalizeDateString(rawDob);

    fields.push({
      fieldName: 'date_of_birth',
      rawValue: rawDob,
      normalizedValue: normDob.normalized || rawDob,
      confidence: dobMatch ? dobMatch.confidence : null,
      status: normDob.isValidDate ? 'VALID' : 'UNCERTAIN',
      sourceReference: 'Form Field: Date of Birth',
    });

    const idMatch = findLineAndConfidence((l) => /id\s*number|passport\s*no|national\s*id/i.test(l));
    const rawId = idMatch ? idMatch.lineText.replace(/.*?id.*?\s*[:|-]\s*/i, '').trim() : '';

    fields.push({
      fieldName: 'document_id',
      rawValue: rawId,
      normalizedValue: rawId.replace(/[^A-Za-z0-9]/g, '').toUpperCase(),
      confidence: idMatch ? idMatch.confidence : null,
      status: rawId ? 'VALID' : 'MISSING',
      sourceReference: 'Form Field: Identity Number',
    });
  }

  return fields;
}
