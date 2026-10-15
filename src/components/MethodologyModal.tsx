import React from 'react';
import { X, BookOpen, AlertCircle, ShieldCheck, Cpu, Code2, ExternalLink } from 'lucide-react';

interface MethodologyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MethodologyModal: React.FC<MethodologyModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-950 flex items-center justify-center text-indigo-400 border border-indigo-800">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                Platform Architecture, Principles &amp; Limitations
              </h2>
              <p className="text-xs sm:text-sm text-slate-400">
                Compliance-support specification and technical documentation
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 sm:p-8 space-y-6 text-sm text-slate-300 leading-relaxed">
          {/* Section 1: Non-Autonomous Decision Disclaimer */}
          <div className="p-5 rounded-2xl bg-amber-950/40 border border-amber-800 space-y-2">
            <div className="flex items-center gap-2 font-bold text-amber-300 text-base">
              <AlertCircle className="w-5 h-5" />
              <span>Critical Compliance &amp; Regulatory Notice</span>
            </div>
            <p className="text-sm text-amber-100/90 leading-relaxed">
              This application is an educational simulation and fintech portfolio benchmark. It is{' '}
              <strong className="text-amber-200 underline font-bold">NOT</strong> a live banking KYC system and does not make
              autonomous legal, regulatory, or customer-eligibility decisions. All test identities and
              specimens are synthetic.
            </p>
          </div>

          {/* Section 2: Core Engineering Principles */}
          <div className="space-y-3">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-indigo-400" />
              <span>Core Operational &amp; Verification Rules</span>
            </h3>
            <ul className="list-disc pl-5 space-y-2 text-slate-300 text-sm">
              <li>
                <strong className="text-white">A mismatch is a review flag, not proof of fraud:</strong> Name spelling variations
                (such as middle names or hyphenations) and typographical OCR misreads are routed to human
                reviewers with clear explanations.
              </li>
              <li>
                <strong className="text-white">No autonomous rejection:</strong> Missing fields, blurred scans, and format discrepancies
                generate review warnings instead of automated disqualification.
              </li>
              <li>
                <strong className="text-white">OCR confidence transparency:</strong> Only genuine confidence scores emitted by the
                Tesseract neural net are reported; uncertain fields are tagged for manual verification.
              </li>
              <li>
                <strong className="text-white">Expired document governance:</strong> Expired credentials generate validity warnings
                requesting renewed documentation, never criminal allegations.
              </li>
            </ul>
          </div>

          {/* Section 3: Why OCR is Not Proof of Authenticity */}
          <div className="space-y-3">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Cpu className="w-5 h-5 text-indigo-400" />
              <span>Why OCR Alone Cannot Establish Document Authenticity</span>
            </h3>
            <p className="text-sm leading-relaxed text-slate-300">
              Optical Character Recognition (OCR) converts pixel patterns into text characters. It does not
              verify physical security features such as holograms, microprinting, UV reactive ink, or embedded
              cryptographic NFC chips (e.g., ICAO e-Passports). An attacker can fabricate a document with valid text
              that OCR will read perfectly. Real-world KYC requires multi-layered checks (NFC chip verification,
              government registry lookups, biometric liveness) alongside human review.
            </p>
          </div>

          {/* Section 4: Architecture Pipeline */}
          <div className="space-y-3">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Code2 className="w-5 h-5 text-indigo-400" />
              <span>Pipeline Architecture &amp; API Specifications</span>
            </h3>
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 font-mono text-xs sm:text-sm space-y-1.5 text-slate-300 leading-relaxed">
              <div>1. Document Upload &rarr; MIME validation, dimension check, sharpness calculation</div>
              <div>2. Preprocessing &rarr; Luminance contrast, gradient Laplacian edge detection</div>
              <div>3. Tesseract OCR Engine &rarr; Text line extraction, word confidence bounding boxes</div>
              <div>4. Deterministic Rules Engine &rarr; Fuzzy Levenshtein name match, ISO date audit, expiry check</div>
              <div>5. Case Review Workspace &rarr; Field corrections with immutable audit trail</div>
            </div>
            <div className="pt-2 flex items-center gap-3">
              <a
                href="/api/kyc/openapi.json"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-sm text-indigo-400 hover:text-indigo-300 font-bold"
              >
                <span>View Raw OpenAPI 3.0 JSON Specification</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end p-5 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-all cursor-pointer shadow-md"
          >
            Close Documentation
          </button>
        </div>
      </div>
    </div>
  );
};
