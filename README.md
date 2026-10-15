# KYC-AI — Intelligent Customer Onboarding and Document Verification Platform

> **Compliance-Support and Educational Simulation Notice**:
> This platform is an educational simulation and fintech portfolio project. It is **NOT** a live bank's KYC system and does **NOT** make autonomous legal, regulatory, account-opening, or customer-eligibility decisions. All test identities and document templates are synthetic.

---

## 1. Executive Overview & Architecture

**KYC-AI** demonstrates how an enterprise bank or financial institution can streamline customer onboarding by:
1. **Extracting information** from identity documents using open-source OCR (Tesseract).
2. **Validating declared application forms** against extracted document data using multi-rule deterministic algorithms.
3. **Identifying missing fields, date anomalies, and format discrepancies** without treating errors as proof of fraud.
4. **Flagging document quality issues** through experimental image analysis heuristics.
5. **Routing ambiguous cases to a human reviewer** with field correction capabilities, justification notes, and an immutable audit trail.

### Architecture Diagram

```
+--------------------------------------------------------------------------+
|                         Frontend Client (React + TS)                     |
|  - Cases Overview & KPI Dashboard                                         |
|  - New Case Creator & Synthetic Scenario Switcher                        |
|  - Side-by-Side Review Workspace (Document Viewer + Field Comparator)     |
|  - Compliance Rule Audit Checklist                                       |
|  - Immutable Audit History & Governance View                             |
+--------------------------------------------------------------------------+
                                     │
                             REST API (JSON)
                                     ▼
+--------------------------------------------------------------------------+
|                     Full-Stack Server (Express / FastAPI)                |
|  /health                          - Health status & engine information   |
|  /api/kyc/cases                   - Case management & lifecycle          |
|  /api/kyc/cases/:id/documents     - Multi-format document attachment     |
|  /api/kyc/cases/:id/process       - OCR extraction & rule evaluation     |
|  /api/kyc/cases/:id/corrections   - Field corrections with audit logging |
|  /api/kyc/cases/:id/review        - Reviewer decisions & claims          |
|  /api/kyc/history                 - Immutable audit trail                |
+--------------------------------------------------------------------------+
          │                                            │
          ▼                                            ▼
+-----------------------+                    +--------------------+
|   OCR & Vision Engine |                    | Compliance Rules   |
| - Tesseract.js / Wasm |                    | - Fuzzy Name Match |
| - Image Preprocessing |                    | - DOB & Age Audit  |
| - Sharpness & Dynamic |                    | - Doc ID Match     |
| - Tampering Heuristic |                    | - Expiry Checker   |
+-----------------------+                    +--------------------+
```

---

## 2. Supported Fictional Document Templates

The platform features three generic, fictional benchmark templates:

1. **Generic National Identity Card (`GENERIC_ID_CARD`)**:
   - Fields: Full Name, Date of Birth, Document Identifier, Expiry Date, Sex, Issuing Country (`Republic of Horizon`).
   - Benchmark Specimen: *Alex Mercer* (`HZ-8849-2194`) — Clean match scenario.
   - Benchmark Specimen: *Taylor Morgan* (`HZ-5512-8899`) — Simulated low-contrast / mobile scan scenario.

2. **Generic Passport Bio Page (`GENERIC_PASSPORT_PAGE`)**:
   - Features: Visual Inspection Zone + 2-line ICAO 9303 compliant Machine Readable Zone (MRZ).
   - Fields: Surname, Given Names, Passport Number, Nationality (`HOR`), Date of Birth, Expiry Date, Sex.
   - Benchmark Specimen: *Elena Rostova Vance* (`P74928104`) — Expired document test scenario.

3. **Customer Application Form (`GENERIC_APPLICATION_FORM`)**:
   - Fields: Applicant Name, Date of Birth, National ID / Passport No, Residential Address, Declaration Date.
   - Benchmark Specimen: *Jordan Brooks* (`HZ-9933-1102`) — Customer data entry discrepancy test scenario.

---

## 3. Core Working Principles & Compliance Rules

1. **A mismatch is a review flag, not proof of fraud**:
   - Differently ordered names (e.g., middle names included on passports or hyphenations) are flagged for human inspection rather than immediate rejection.
2. **No automated customer rejection**:
   - Low image contrast, blurred scans, or character OCR confusion are routed to human reviewers.
3. **Expired document handling**:
   - An expired document generates a validity review flag requesting an updated document; it is never assumed to be fraudulent.
4. **OCR transparency**:
   - Confidence percentages are displayed directly from the OCR engine. If confidence is unavailable, it is marked as `null` with a clear explanation.
5. **PII Masking by default**:
   - Document identifiers and dates of birth are masked (`HZ-****-2194`, `19**-**-14`) in dashboards and audit logs, with an explicit unmask toggle for authorized reviewers.

---

## 4. Why OCR is NOT Proof of Authenticity

Optical Character Recognition (OCR) converts visible pixel patterns into digital text strings. It cannot evaluate physical counterfeit security elements:
- Optical Variable Ink (OVI) and holograms.
- Laser engraved tactile features.
- Ultraviolet (UV) and infrared (IR) luminescence.
- Embedded ICAO 9303 RFID/NFC cryptographic chips and digital signatures.

A counterfeit document can have perfectly legible text that passes OCR flawlessly. Therefore, OCR is an initial data-capture tool, not an authenticity verification engine.

---

## 5. Local Development Setup & Execution

### Node.js / Express Setup (Active Dev Server)

```bash
# 1. Install dependencies
npm install

# 2. Run automated test suite (Unit & Integration tests)
npm test

# 3. Start development server (serves API & React UI on Port 3000)
npm run dev
```

### Python / FastAPI Setup (Alternative / Reference Backend)

```bash
# 1. Create and activate virtual environment
python3 -m venv venv
source venv/bin/activate

# 2. Install requirements
pip install -r requirements.txt

# 3. Start FastAPI server
uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
```

---

## 6. Automated Testing Verification

The project includes unit and integration tests executing under `npm test`:

```bash
npm test
```

### Verified Test Cases:
1. `Date Normalization & Validity`: Tests ISO formats, European formats, and rejects invalid calendar days (e.g. Feb 31).
2. `Name Comparison & Fuzzy Matching`: Validates exact matches, subset variations (middle names), and flags typos.
3. `Sensitive Value Masking`: Confirms PII masking for document IDs and dates.
4. `Full Validation Rules Pipeline`: Executes all rules over benchmark specimen Alex Mercer.
5. `Expired Document Warnings`: Confirms that expired documents generate compliance warnings rather than fraud accusations.
6. `Image Preprocessing & Tamper Heuristics`: Computes Laplacian edge gradients and heuristic scores.
7. `Case Management & Audit Trail`: Verifies field correction, state changes, and immutable audit logs.

---

## 7. PostgreSQL Database Schema

When configured with PostgreSQL, run the provided migrations:

```bash
psql $DATABASE_URL -f database/schema.sql
```

Tables included:
- `onboarding_cases`: Core case lifecycle states, declared data, and assigned reviewer.
- `documents_metadata`: Dimensions, MIME type, file size, retention expiration timestamp.
- `extracted_fields`: Field names, raw vs normalized values, OCR confidence, reviewer corrections.
- `validation_results`: Rule identifiers, outcomes (`PASS`, `REVIEW_REQUIRED`), masked values, explanations.
- `review_actions`: Reviewer ID, decision types, field change records.
- `audit_events`: Immutable audit trail with timestamps and masked metadata.
