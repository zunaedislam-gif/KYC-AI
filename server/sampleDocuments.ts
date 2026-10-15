/**
 * KYC-AI — Intelligent Customer Onboarding and Document Verification Platform
 * Synthetic Document Templates & Sample Identities
 *
 * Provides fictional templates with known ground truths for compliance simulation testing:
 * 1. Alex Mercer: Clean match, high-quality National ID Card
 * 2. Elena Vance: Valid Passport Bio Page with MRZ, but expired document (Triggers Expired Warning)
 * 3. Taylor Morgan: ID Card with low contrast / OCR confidence warning
 * 4. Jordan Brooks: Application form with mismatching ID number (Triggers Discrepancy Flag)
 */

import { DocumentType } from './types.js';

export interface SampleIdentity {
  id: string;
  name: string;
  scenarioTitle: string;
  scenarioDescription: string;
  expectedOutcome: 'CLEAN_PASS' | 'REVIEW_REQUIRED_EXPIRY' | 'REVIEW_REQUIRED_QUALITY' | 'REVIEW_REQUIRED_MISMATCH';
  declaredData: {
    fullName: string;
    dateOfBirth: string;
    documentType: DocumentType;
    documentId: string;
    nationality: string;
    address: string;
  };
  sampleDocumentSvg: string;
}

export function generateIdCardSvg(data: {
  country: string;
  title: string;
  fullName: string;
  dob: string;
  docId: string;
  expiry: string;
  gender: string;
  photoColor?: string;
  isLowContrast?: boolean;
}): string {
  const bgFill = data.isLowContrast ? '#808790' : '#0f1f38';
  const headerFill = data.isLowContrast ? '#666e78' : '#1d3557';
  const textFill = data.isLowContrast ? '#b5bcc6' : '#f1faee';
  const subtextFill = data.isLowContrast ? '#9fa7b2' : '#a8dadc';
  const accentFill = data.isLowContrast ? '#8b94a0' : '#457b9d';

  return `
<svg width="850" height="540" viewBox="0 0 850 540" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${bgFill}"/>
      <stop offset="100%" stop-color="${headerFill}"/>
    </linearGradient>
    <pattern id="guilloche" width="40" height="40" patternUnits="userSpaceOnUse">
      <path d="M 0,20 Q 10,0 20,20 T 40,20" fill="none" stroke="${accentFill}" stroke-opacity="0.15" stroke-width="1"/>
      <path d="M 20,0 Q 30,20 40,0" fill="none" stroke="${accentFill}" stroke-opacity="0.1" stroke-width="1"/>
    </pattern>
  </defs>

  <!-- Card Background -->
  <rect x="10" y="10" width="830" height="520" rx="24" fill="url(#bgGrad)" stroke="#3a5a78" stroke-width="2"/>
  <rect x="10" y="10" width="830" height="520" rx="24" fill="url(#guilloche)"/>

  <!-- Top Header Strip -->
  <rect x="10" y="10" width="830" height="90" rx="24" fill="${headerFill}"/>
  <rect x="10" y="80" width="830" height="20" fill="${headerFill}"/>

  <!-- Country Emblem / Crest Symbol -->
  <circle cx="65" cy="55" r="28" fill="${accentFill}" opacity="0.8"/>
  <path d="M 65 35 L 75 50 L 55 50 Z M 65 75 L 72 58 L 58 58 Z" fill="#ffffff"/>

  <!-- Country & Document Title -->
  <text x="110" y="48" font-family="'Plus Jakarta Sans', Arial, sans-serif" font-size="24" font-weight="bold" fill="#ffffff" letter-spacing="1.5">${data.country.toUpperCase()}</text>
  <text x="110" y="74" font-family="'Plus Jakarta Sans', Arial, sans-serif" font-size="16" font-weight="600" fill="${subtextFill}" letter-spacing="3">${data.title.toUpperCase()} (SAMPLE SIMULATION)</text>

  <!-- Photo Box -->
  <g transform="translate(45, 125)">
    <rect width="180" height="230" rx="12" fill="#1b2a4a" stroke="${accentFill}" stroke-width="2"/>
    <!-- Stylized Silhouette Avatar -->
    <circle cx="90" cy="85" r="45" fill="${data.photoColor || '#457b9d'}"/>
    <path d="M 30 210 Q 90 140 150 210" fill="${data.photoColor || '#457b9d'}"/>
    <text x="90" y="222" font-family="'Plus Jakarta Sans', Arial, sans-serif" font-size="11" fill="${subtextFill}" text-anchor="middle">SYNTHETIC ID</text>
  </g>

  <!-- Document Fields Visual Zone -->
  <g transform="translate(260, 130)">
    <!-- Full Name -->
    <text x="0" y="20" font-family="'Plus Jakarta Sans', Arial, sans-serif" font-size="12" font-weight="600" fill="${subtextFill}" letter-spacing="1">FULL NAME / NOM COMPLET</text>
    <text x="0" y="48" font-family="'Plus Jakarta Sans', Arial, sans-serif" font-size="24" font-weight="bold" fill="${textFill}">${data.fullName}</text>

    <!-- Date of Birth & Gender -->
    <text x="0" y="95" font-family="'Plus Jakarta Sans', Arial, sans-serif" font-size="12" font-weight="600" fill="${subtextFill}" letter-spacing="1">DATE OF BIRTH / NÉ(E) LE</text>
    <text x="0" y="120" font-family="'JetBrains Mono', Courier, monospace" font-size="20" font-weight="bold" fill="${textFill}">${data.dob}</text>

    <text x="260" y="95" font-family="'Plus Jakarta Sans', Arial, sans-serif" font-size="12" font-weight="600" fill="${subtextFill}" letter-spacing="1">SEX / SEXE</text>
    <text x="260" y="120" font-family="'Plus Jakarta Sans', Arial, sans-serif" font-size="20" font-weight="bold" fill="${textFill}">${data.gender}</text>

    <!-- Document ID -->
    <text x="0" y="165" font-family="'Plus Jakarta Sans', Arial, sans-serif" font-size="12" font-weight="600" fill="${subtextFill}" letter-spacing="1">DOCUMENT IDENTIFIER / NO ID</text>
    <text x="0" y="195" font-family="'JetBrains Mono', Courier, monospace" font-size="26" font-weight="bold" fill="#ffd166" letter-spacing="2">${data.docId}</text>

    <text x="260" y="165" font-family="'Plus Jakarta Sans', Arial, sans-serif" font-size="12" font-weight="600" fill="${subtextFill}" letter-spacing="1">EXPIRY DATE / EXPIRATION</text>
    <text x="260" y="195" font-family="'JetBrains Mono', Courier, monospace" font-size="20" font-weight="bold" fill="${textFill}">${data.expiry}</text>
  </g>

  <!-- Bottom Optical Barcode / OCR Assist Zone -->
  <rect x="35" y="450" width="780" height="55" rx="8" fill="#08111e" stroke="#253a52"/>
  <text x="50" y="485" font-family="'JetBrains Mono', Courier, monospace" font-size="18" fill="#e2e8f0" letter-spacing="4">IDHOR&lt;${data.docId.replace(/[^A-Z0-9]/g, '')}&lt;&lt;9&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;</text>
  <text x="50" y="498" font-family="'Plus Jakarta Sans', Arial, sans-serif" font-size="9" fill="#64748b">FICTIONAL TEST SPECIMEN · NON-OFFICIAL IDENTIFICATION DOCUMENT · KYC-AI BENCHMARK</text>
</svg>
`.trim();
}

export function generatePassportPageSvg(data: {
  country: string;
  surname: string;
  givenNames: string;
  passportNo: string;
  nationality: string;
  dob: string;
  dobYYMMDD: string;
  gender: string;
  expiry: string;
  expiryYYMMDD: string;
}): string {
  // Construct ICAO 9303 compliant synthetic 2-line MRZ
  const p1Surname = data.surname.toUpperCase().replace(/[^A-Z]/g, '');
  const p1Given = data.givenNames.toUpperCase().replace(/\s+/g, '<');
  const line1Raw = `P<HOR${p1Surname}<<${p1Given}`;
  const mrzLine1 = line1Raw.padEnd(44, '<').substring(0, 44);

  const cleanPass = data.passportNo.toUpperCase().padEnd(9, '<').substring(0, 9);
  const line2Raw = `${cleanPass}8HOR${data.dobYYMMDD}2${data.gender}${data.expiryYYMMDD}5<<<<<<<<<<<<<<04`;
  const mrzLine2 = line2Raw.padEnd(44, '<').substring(0, 44);

  return `
<svg width="850" height="600" viewBox="0 0 850 600" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="passportBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fdfbf7"/>
      <stop offset="100%" stop-color="#f4ede2"/>
    </linearGradient>
  </defs>

  <rect width="850" height="600" fill="url(#passportBg)"/>
  <rect x="20" y="20" width="810" height="560" fill="none" stroke="#d5c7b3" stroke-width="3"/>

  <!-- Passport Header -->
  <text x="40" y="60" font-family="'Plus Jakarta Sans', Arial, sans-serif" font-size="20" font-weight="bold" fill="#2c3e50" letter-spacing="2">PASSPORT / PASSEPORT</text>
  <text x="40" y="85" font-family="'Plus Jakarta Sans', Arial, sans-serif" font-size="14" font-weight="600" fill="#7f8c8d" letter-spacing="1">${data.country.toUpperCase()}</text>
  <text x="650" y="60" font-family="'JetBrains Mono', monospace" font-size="16" font-weight="bold" fill="#c0392b">TYPE: P</text>
  <text x="650" y="85" font-family="'JetBrains Mono', monospace" font-size="16" font-weight="bold" fill="#2c3e50">CODE: HOR</text>

  <!-- Photo Box -->
  <g transform="translate(45, 110)">
    <rect width="180" height="240" rx="8" fill="#e8dfd3" stroke="#b8a691" stroke-width="1.5"/>
    <circle cx="90" cy="90" r="48" fill="#708090"/>
    <path d="M 30 220 Q 90 150 150 220" fill="#708090"/>
    <text x="90" y="232" font-family="'Plus Jakarta Sans', Arial, sans-serif" font-size="11" fill="#4a5568" text-anchor="middle">OFFICIAL SPECIMEN</text>
  </g>

  <!-- Visual Inspection Zone -->
  <g transform="translate(260, 115)">
    <text x="0" y="16" font-family="'Plus Jakarta Sans', Arial, sans-serif" font-size="11" fill="#7f8c8d">PASSPORT NO. / NUMÉRO DU PASSEPORT</text>
    <text x="0" y="42" font-family="'JetBrains Mono', monospace" font-size="24" font-weight="bold" fill="#1a365d" letter-spacing="2">${data.passportNo}</text>

    <text x="0" y="78" font-family="'Plus Jakarta Sans', Arial, sans-serif" font-size="11" fill="#7f8c8d">SURNAME / NOM</text>
    <text x="0" y="104" font-family="'Plus Jakarta Sans', Arial, sans-serif" font-size="20" font-weight="bold" fill="#2d3748">${data.surname}</text>

    <text x="0" y="140" font-family="'Plus Jakarta Sans', Arial, sans-serif" font-size="11" fill="#7f8c8d">GIVEN NAMES / PRÉNOMS</text>
    <text x="0" y="166" font-family="'Plus Jakarta Sans', Arial, sans-serif" font-size="20" font-weight="bold" fill="#2d3748">${data.givenNames}</text>

    <text x="0" y="202" font-family="'Plus Jakarta Sans', Arial, sans-serif" font-size="11" fill="#7f8c8d">NATIONALITY / NATIONALITÉ</text>
    <text x="0" y="226" font-family="'Plus Jakarta Sans', Arial, sans-serif" font-size="17" font-weight="600" fill="#2d3748">${data.nationality}</text>

    <text x="260" y="202" font-family="'Plus Jakarta Sans', Arial, sans-serif" font-size="11" fill="#7f8c8d">DATE OF BIRTH / DATE DE NAISSANCE</text>
    <text x="260" y="226" font-family="'JetBrains Mono', monospace" font-size="17" font-weight="bold" fill="#2d3748">${data.dob}</text>

    <text x="0" y="260" font-family="'Plus Jakarta Sans', Arial, sans-serif" font-size="11" fill="#7f8c8d">SEX / SEXE</text>
    <text x="0" y="284" font-family="'Plus Jakarta Sans', Arial, sans-serif" font-size="17" font-weight="600" fill="#2d3748">${data.gender}</text>

    <text x="260" y="260" font-family="'Plus Jakarta Sans', Arial, sans-serif" font-size="11" fill="#7f8c8d">DATE OF EXPIRY / DATE D'EXPIRATION</text>
    <text x="260" y="284" font-family="'JetBrains Mono', monospace" font-size="17" font-weight="bold" fill="#c0392b">${data.expiry}</text>
  </g>

  <!-- Machine Readable Zone (MRZ - ICAO 9303) -->
  <g transform="translate(40, 480)">
    <rect x="-10" y="-20" width="780" height="90" fill="#f0e9df" stroke="#d5c7b3" stroke-width="1"/>
    <text x="10" y="18" font-family="'JetBrains Mono', 'OCRB', monospace" font-size="22" font-weight="600" fill="#1a202c" letter-spacing="4">${mrzLine1}</text>
    <text x="10" y="52" font-family="'JetBrains Mono', 'OCRB', monospace" font-size="22" font-weight="600" fill="#1a202c" letter-spacing="4">${mrzLine2}</text>
  </g>
</svg>
`.trim();
}

export function generateApplicationFormSvg(data: {
  formTitle: string;
  applicantName: string;
  dob: string;
  docId: string;
  address: string;
  declarationDate: string;
}): string {
  return `
<svg width="850" height="650" viewBox="0 0 850 650" xmlns="http://www.w3.org/2000/svg">
  <rect width="850" height="650" fill="#ffffff" stroke="#cbd5e1" stroke-width="2"/>

  <!-- Bank / Institution Header -->
  <rect x="0" y="0" width="850" height="85" fill="#0f172a"/>
  <text x="40" y="42" font-family="'Plus Jakarta Sans', Arial, sans-serif" font-size="22" font-weight="bold" fill="#f8fafc">HORIZON APEX BANK · KYC ONBOARDING FORM</text>
  <text x="40" y="66" font-family="'Plus Jakarta Sans', Arial, sans-serif" font-size="13" fill="#94a3b8">CUSTOMER IDENTIFICATION &amp; DECLARATION SPECIMEN (SYNTHETIC SIMULATION)</text>

  <!-- Form Fields Section -->
  <g transform="translate(45, 115)">
    <!-- Section 1 -->
    <rect x="0" y="0" width="760" height="30" fill="#f1f5f9"/>
    <text x="15" y="20" font-family="'Plus Jakarta Sans', Arial, sans-serif" font-size="13" font-weight="bold" fill="#334155">SECTION 1 — APPLICANT PERSONAL PARTICULARS</text>

    <!-- Applicant Name -->
    <text x="15" y="65" font-family="'Plus Jakarta Sans', Arial, sans-serif" font-size="12" font-weight="600" fill="#64748b">1.1 FULL LEGAL NAME:</text>
    <rect x="15" y="75" width="450" height="36" fill="#f8fafc" stroke="#cbd5e1"/>
    <text x="25" y="100" font-family="'Plus Jakarta Sans', Arial, sans-serif" font-size="17" font-weight="600" fill="#0f172a">${data.applicantName}</text>

    <!-- DOB -->
    <text x="500" y="65" font-family="'Plus Jakarta Sans', Arial, sans-serif" font-size="12" font-weight="600" fill="#64748b">1.2 DATE OF BIRTH (YYYY-MM-DD):</text>
    <rect x="500" y="75" width="245" height="36" fill="#f8fafc" stroke="#cbd5e1"/>
    <text x="510" y="100" font-family="'JetBrains Mono', monospace" font-size="16" font-weight="bold" fill="#0f172a">${data.dob}</text>

    <!-- Section 2 -->
    <rect x="0" y="140" width="760" height="30" fill="#f1f5f9"/>
    <text x="15" y="160" font-family="'Plus Jakarta Sans', Arial, sans-serif" font-size="13" font-weight="bold" fill="#334155">SECTION 2 — IDENTIFICATION DOCUMENT REFERENCE</text>

    <!-- ID Number -->
    <text x="15" y="205" font-family="'Plus Jakarta Sans', Arial, sans-serif" font-size="12" font-weight="600" fill="#64748b">2.1 DOCUMENT ID NUMBER:</text>
    <rect x="15" y="215" width="450" height="36" fill="#f8fafc" stroke="#cbd5e1"/>
    <text x="25" y="240" font-family="'JetBrains Mono', monospace" font-size="18" font-weight="bold" fill="#0f172a">${data.docId}</text>

    <!-- Residential Address -->
    <text x="15" y="285" font-family="'Plus Jakarta Sans', Arial, sans-serif" font-size="12" font-weight="600" fill="#64748b">2.2 RESIDENTIAL ADDRESS:</text>
    <rect x="15" y="295" width="730" height="36" fill="#f8fafc" stroke="#cbd5e1"/>
    <text x="25" y="320" font-family="'Plus Jakarta Sans', Arial, sans-serif" font-size="15" fill="#334155">${data.address}</text>

    <!-- Section 3 Declaration -->
    <rect x="0" y="360" width="760" height="30" fill="#f1f5f9"/>
    <text x="15" y="380" font-family="'Plus Jakarta Sans', Arial, sans-serif" font-size="13" font-weight="bold" fill="#334155">SECTION 3 — CUSTOMER DECLARATION &amp; CONSENT</text>

    <text x="15" y="420" font-family="'Plus Jakarta Sans', Arial, sans-serif" font-size="12" fill="#475569">I hereby certify that the information entered above is accurate and true to the best of my knowledge.</text>

    <text x="15" y="465" font-family="'Plus Jakarta Sans', Arial, sans-serif" font-size="12" font-weight="600" fill="#64748b">APPLICANT SIGNATURE:</text>
    <text x="15" y="495" font-family="'Brush Script MT', cursive, sans-serif" font-size="28" fill="#1e3a8a">${data.applicantName}</text>
    <line x1="15" y1="505" x2="350" y2="505" stroke="#94a3b8" stroke-width="1.5"/>

    <text x="400" y="465" font-family="'Plus Jakarta Sans', Arial, sans-serif" font-size="12" font-weight="600" fill="#64748b">DECLARATION DATE:</text>
    <text x="400" y="495" font-family="'JetBrains Mono', monospace" font-size="16" fill="#0f172a">${data.declarationDate}</text>
    <line x1="400" y1="505" x2="600" y2="505" stroke="#94a3b8" stroke-width="1.5"/>
  </g>
</svg>
`.trim();
}

export const SAMPLE_IDENTITIES: SampleIdentity[] = [
  {
    id: 'sample-alex-mercer',
    name: 'Alex Mercer',
    scenarioTitle: 'Scenario A: High Quality ID Card (Clean Match)',
    scenarioDescription:
      'Clear high-resolution National ID Card. All declared data (Name, DOB, ID Number) match the document extraction. Returns PASS across core rules.',
    expectedOutcome: 'CLEAN_PASS',
    declaredData: {
      fullName: 'Alex Mercer',
      dateOfBirth: '1988-06-14',
      documentType: 'GENERIC_ID_CARD',
      documentId: 'HZ-8849-2194',
      nationality: 'Republic of Horizon',
      address: '742 Evergreen Terrace, Sector 4, Horizon City',
    },
    sampleDocumentSvg: generateIdCardSvg({
      country: 'Republic of Horizon',
      title: 'National Identity Card',
      fullName: 'Alex Mercer',
      dob: '1988-06-14',
      docId: 'HZ-8849-2194',
      expiry: '2029-08-30',
      gender: 'M',
    }),
  },
  {
    id: 'sample-elena-vance',
    name: 'Elena Rostova Vance',
    scenarioTitle: 'Scenario B: Passport Bio Page (Expired Document Warning)',
    scenarioDescription:
      'Synthetic Passport bio page with MRZ zone. Demonstrates legal name format parsing ("Elena Rostova Vance" vs "Elena Vance") and detects an expired document (2024-05-10), triggering a compliant review flag without false fraud accusation.',
    expectedOutcome: 'REVIEW_REQUIRED_EXPIRY',
    declaredData: {
      fullName: 'Elena Vance',
      dateOfBirth: '1992-11-20',
      documentType: 'GENERIC_PASSPORT_PAGE',
      documentId: 'P74928104',
      nationality: 'Republic of Horizon',
      address: '12 West Kensington Way, Horizon City',
    },
    sampleDocumentSvg: generatePassportPageSvg({
      country: 'Republic of Horizon',
      surname: 'VANCE',
      givenNames: 'ELENA ROSTOVA',
      passportNo: 'P74928104',
      nationality: 'HORIZON',
      dob: '1992-11-20',
      dobYYMMDD: '921120',
      gender: 'F',
      expiry: '2024-05-10', // Expired!
      expiryYYMMDD: '240510',
    }),
  },
  {
    id: 'sample-taylor-morgan',
    name: 'Taylor Morgan',
    scenarioTitle: 'Scenario C: Low-Contrast Scan (Quality & OCR Confidence Flag)',
    scenarioDescription:
      'Subdued, low-contrast document scan simulating adverse mobile camera lighting. Triggers OCR confidence warnings and image dynamic range review flag.',
    expectedOutcome: 'REVIEW_REQUIRED_QUALITY',
    declaredData: {
      fullName: 'Taylor Morgan',
      dateOfBirth: '2000-03-25',
      documentType: 'GENERIC_ID_CARD',
      documentId: 'HZ-5512-8899',
      nationality: 'Republic of Horizon',
      address: '88 Innovation Boulevard, Suite 300, Horizon City',
    },
    sampleDocumentSvg: generateIdCardSvg({
      country: 'Republic of Horizon',
      title: 'National Identity Card',
      fullName: 'Taylor Morgan',
      dob: '2000-03-25',
      docId: 'HZ-5512-8899',
      expiry: '2030-12-31',
      gender: 'X',
      isLowContrast: true,
    }),
  },
  {
    id: 'sample-jordan-brooks',
    name: 'Jordan Brooks',
    scenarioTitle: 'Scenario D: Form Discrepancy (Digit Mismatch Flag)',
    scenarioDescription:
      'Application form where the customer entered ID HZ-9933-1102, but the document contains HZ-9933-8802. Evaluates distance and prompts human reviewer to resolve data mismatch.',
    expectedOutcome: 'REVIEW_REQUIRED_MISMATCH',
    declaredData: {
      fullName: 'Jordan Brooks',
      dateOfBirth: '1985-02-12',
      documentType: 'GENERIC_APPLICATION_FORM',
      documentId: 'HZ-9933-1102', // Declared
      nationality: 'Republic of Horizon',
      address: '404 Data Ridge Road, Horizon City',
    },
    sampleDocumentSvg: generateApplicationFormSvg({
      formTitle: 'KYC ONBOARDING FORM',
      applicantName: 'Jordan Brooks',
      dob: '1985-02-12',
      docId: 'HZ-9933-8802', // Observed (Mismatched digits)
      address: '404 Data Ridge Road, Horizon City',
      declarationDate: '2026-09-15',
    }),
  },
];
