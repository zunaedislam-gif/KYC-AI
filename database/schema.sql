-- =============================================================================
-- KYC-AI Platform: PostgreSQL Relational Database Schema
-- Compliance-Support and Customer Onboarding Document Verification
-- =============================================================================

-- 1. Onboarding Cases
CREATE TABLE IF NOT EXISTS onboarding_cases (
    id VARCHAR(64) PRIMARY KEY,
    reference_number VARCHAR(32) NOT NULL UNIQUE,
    status VARCHAR(32) NOT NULL CHECK (status IN (
        'UPLOADED',
        'PROCESSING',
        'REVIEW_REQUIRED',
        'IN_REVIEW',
        'APPROVED_BY_REVIEWER',
        'RETURNED_FOR_CORRECTION',
        'CLOSED'
    )),
    declared_full_name VARCHAR(150) NOT NULL,
    declared_dob DATE NOT NULL,
    declared_doc_type VARCHAR(50) NOT NULL,
    declared_doc_id_masked VARCHAR(50) NOT NULL,
    declared_nationality VARCHAR(100),
    declared_address TEXT,
    assigned_reviewer_id VARCHAR(64),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX idx_onboarding_cases_status ON onboarding_cases(status);
CREATE INDEX idx_onboarding_cases_ref ON onboarding_cases(reference_number);
CREATE INDEX idx_onboarding_cases_created ON onboarding_cases(created_at DESC);

-- 2. Documents Metadata
CREATE TABLE IF NOT EXISTS documents_metadata (
    id VARCHAR(64) PRIMARY KEY,
    case_id VARCHAR(64) NOT NULL REFERENCES onboarding_cases(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    file_size_bytes BIGINT NOT NULL CHECK (file_size_bytes > 0 AND file_size_bytes <= 10485760),
    document_type VARCHAR(50) NOT NULL,
    width_px INT,
    height_px INT,
    quality_score INT CHECK (quality_score BETWEEN 0 AND 100),
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    retention_expires_at TIMESTAMP WITH TIME ZONE DEFAULT (CURRENT_TIMESTAMP + INTERVAL '30 days')
);

CREATE INDEX idx_documents_case_id ON documents_metadata(case_id);

-- 3. Extracted Fields
CREATE TABLE IF NOT EXISTS extracted_fields (
    id VARCHAR(64) PRIMARY KEY,
    case_id VARCHAR(64) NOT NULL REFERENCES onboarding_cases(id) ON DELETE CASCADE,
    document_id VARCHAR(64) REFERENCES documents_metadata(id) ON DELETE SET NULL,
    field_name VARCHAR(64) NOT NULL,
    raw_value TEXT NOT NULL,
    normalized_value TEXT NOT NULL,
    ocr_confidence NUMERIC(5,2) CHECK (ocr_confidence IS NULL OR (ocr_confidence >= 0 AND ocr_confidence <= 100)),
    status VARCHAR(32) NOT NULL CHECK (status IN ('VALID', 'WARNING', 'UNCERTAIN', 'MISSING')),
    source_reference VARCHAR(150),
    review_warning TEXT,
    is_corrected BOOLEAN DEFAULT FALSE NOT NULL,
    corrected_by VARCHAR(64),
    corrected_at TIMESTAMP WITH TIME ZONE,
    correction_reason TEXT
);

CREATE INDEX idx_extracted_fields_case ON extracted_fields(case_id, field_name);

-- 4. Validation Results
CREATE TABLE IF NOT EXISTS validation_results (
    id VARCHAR(64) PRIMARY KEY,
    case_id VARCHAR(64) NOT NULL REFERENCES onboarding_cases(id) ON DELETE CASCADE,
    rule_id VARCHAR(64) NOT NULL,
    rule_title VARCHAR(150) NOT NULL,
    field_name VARCHAR(64) NOT NULL,
    outcome VARCHAR(32) NOT NULL CHECK (outcome IN ('PASS', 'REVIEW_REQUIRED', 'NOT_APPLICABLE')),
    expected_value_masked TEXT NOT NULL,
    observed_value_masked TEXT NOT NULL,
    explanation TEXT NOT NULL,
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('INFO', 'WARNING', 'CRITICAL')),
    evaluated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX idx_validation_results_case ON validation_results(case_id);

-- 5. Review Actions
CREATE TABLE IF NOT EXISTS review_actions (
    id VARCHAR(64) PRIMARY KEY,
    case_id VARCHAR(64) NOT NULL REFERENCES onboarding_cases(id) ON DELETE CASCADE,
    reviewer_id VARCHAR(64) NOT NULL,
    action_type VARCHAR(50) NOT NULL CHECK (action_type IN (
        'ASSIGNED',
        'STATUS_CHANGE',
        'FIELD_CORRECTION',
        'NOTE_ADDED',
        'APPROVED_SIMULATION',
        'RETURNED_FOR_CORRECTION'
    )),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX idx_review_actions_case ON review_actions(case_id, created_at DESC);

-- 6. Immutable Audit Events
CREATE TABLE IF NOT EXISTS audit_events (
    id VARCHAR(64) PRIMARY KEY,
    case_id VARCHAR(64) NOT NULL REFERENCES onboarding_cases(id) ON DELETE CASCADE,
    actor VARCHAR(64) NOT NULL,
    action_type VARCHAR(64) NOT NULL,
    summary TEXT NOT NULL,
    details_json JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX idx_audit_events_case ON audit_events(case_id, created_at DESC);
CREATE INDEX idx_audit_events_actor ON audit_events(actor);
