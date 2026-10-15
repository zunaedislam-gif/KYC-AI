/**
 * KYC-AI — Intelligent Customer Onboarding and Document Verification Platform
 * Experimental Document Tampering & Integrity Heuristics Module
 *
 * IMPORTANT COMPLIANCE NOTICE:
 * This module computes experimental heuristic quality indicators.
 * It does NOT constitute definitive forensic forgery detection or legal document authenticity proof.
 * These indicators are flagged strictly to assist human compliance reviewers in spotting
 * potential scanning anomalies or low-quality uploads.
 */

import { TamperIndicator } from '../types.js';
import { PreprocessingReport } from '../ocr/preprocess.js';

export function runTamperingHeuristicChecks(
  report: PreprocessingReport,
  rawOcrText: string,
  fileName: string
): TamperIndicator[] {
  const indicators: TamperIndicator[] = [];

  // Check 1: Image Sharpness and Blur Metric
  const isBlurry = report.sharpnessScore < 30;
  indicators.push({
    checkId: 'HEURISTIC_BLUR_DETECTION',
    checkName: 'Image Gradient Sharpness & Blur Analysis',
    flag: isBlurry ? 'SUSPICIOUS' : 'NORMAL',
    heuristicScore: report.sharpnessScore,
    details: isBlurry
      ? `Sharpness index (${report.sharpnessScore}/100) is below recommended threshold (30). Image may suffer from motion blur or artificial smoothing.`
      : `Document edge sharpness index (${report.sharpnessScore}/100) indicates adequate text edge definition.`,
    isExperimental: true,
  });

  // Check 2: Dynamic Range and Compression Contrast
  const isPoorContrast = report.contrastScore < 25;
  indicators.push({
    checkId: 'HEURISTIC_CONTRAST_DYNAMIC_RANGE',
    checkName: 'Luminance Dynamic Range & Contrast Distribution',
    flag: isPoorContrast ? 'SUSPICIOUS' : 'NORMAL',
    heuristicScore: report.contrastScore,
    details: isPoorContrast
      ? `Luminance contrast score (${report.contrastScore}/100) is low. Low dynamic range can hide spliced regions or photocopy artifacts.`
      : `Luminance contrast balance (${report.contrastScore}/100) is within standard photographic scan parameters.`,
    isExperimental: true,
  });

  // Check 3: Digital Editing Artefacts & Text Density Consistency
  const wordCount = rawOcrText.trim().split(/\s+/).filter(Boolean).length;
  const isUnusuallySparse = wordCount < 5;
  indicators.push({
    checkId: 'HEURISTIC_TEXT_DENSITY',
    checkName: 'Text Distribution & Layout Consistency',
    flag: isUnusuallySparse ? 'INCONCLUSIVE' : 'NORMAL',
    heuristicScore: Math.min(100, wordCount * 5),
    details: isUnusuallySparse
      ? `Unusually low text density detected (${wordCount} words detected). Could indicate obstructed fields, heavy glare, or non-identity document content.`
      : `Document exhibits expected text line density (${wordCount} words extracted across expected field regions).`,
    isExperimental: true,
  });

  // Check 4: Filename and Container Metadata Heuristic
  const lowerName = fileName.toLowerCase();
  const hasEditKeywords = /photoshop|gimp|edit|screenshot|screen shot|canvas|modified|tampered/i.test(lowerName);
  indicators.push({
    checkId: 'HEURISTIC_METADATA_PROVENANCE',
    checkName: 'Container Metadata & Provenance Indicator',
    flag: hasEditKeywords ? 'SUSPICIOUS' : 'NORMAL',
    heuristicScore: hasEditKeywords ? 30 : 90,
    details: hasEditKeywords
      ? `Filename or container contains editing signatures ('${fileName}'). Reviewer advised to inspect for digital manipulation.`
      : 'No suspicious graphic editor keywords identified in file container identifier.',
    isExperimental: true,
  });

  return indicators;
}
