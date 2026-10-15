"""
KYC-AI: Pydantic Data Models & Request/Response Schemas
Intelligent Customer Onboarding and Document Verification Platform
"""

from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from enum import Enum
from datetime import datetime


class CaseStatusEnum(str, Enum):
    UPLOADED = "UPLOADED"
    PROCESSING = "PROCESSING"
    REVIEW_REQUIRED = "REVIEW_REQUIRED"
    IN_REVIEW = "IN_REVIEW"
    APPROVED_BY_REVIEWER = "APPROVED_BY_REVIEWER"
    RETURNED_FOR_CORRECTION = "RETURNED_FOR_CORRECTION"
    CLOSED = "CLOSED"


class DocumentTypeEnum(str, Enum):
    GENERIC_ID_CARD = "GENERIC_ID_CARD"
    GENERIC_PASSPORT_PAGE = "GENERIC_PASSPORT_PAGE"
    GENERIC_APPLICATION_FORM = "GENERIC_APPLICATION_FORM"


class ValidationOutcomeEnum(str, Enum):
    PASS = "PASS"
    REVIEW_REQUIRED = "REVIEW_REQUIRED"
    NOT_APPLICABLE = "NOT_APPLICABLE"


class FieldStatusEnum(str, Enum):
    VALID = "VALID"
    WARNING = "WARNING"
    UNCERTAIN = "UNCERTAIN"
    MISSING = "MISSING"


class DeclaredCustomerDataSchema(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=150)
    date_of_birth: str = Field(..., pattern=r"^\d{4}[-/.]\d{1,2}[-/.]\d{1,2}$")
    document_type: DocumentTypeEnum
    document_id: str = Field(..., min_length=3, max_length=50)
    nationality: Optional[str] = None
    address: Optional[str] = None


class ExtractedFieldSchema(BaseModel):
    field_name: str
    raw_value: str
    normalized_value: str
    confidence: Optional[float] = Field(None, ge=0.0, le=100.0)
    status: FieldStatusEnum
    source_reference: Optional[str] = None
    review_warning: Optional[str] = None
    is_corrected: bool = False
    corrected_by: Optional[str] = None
    correction_reason: Optional[str] = None


class ValidationRuleResultSchema(BaseModel):
    rule_id: str
    rule_title: str
    field_name: str
    outcome: ValidationOutcomeEnum
    expected_value_masked: str
    observed_value_masked: str
    explanation: str
    severity: str = "WARNING"


class TamperIndicatorSchema(BaseModel):
    check_id: str
    check_name: str
    flag: str
    heuristic_score: float
    details: str
    is_experimental: bool = True


class DocumentMetadataSchema(BaseModel):
    id: str
    case_id: str
    file_name: str
    mime_type: str
    file_size_bytes: int
    document_type: DocumentTypeEnum
    uploaded_at: datetime
    width: Optional[int] = None
    height: Optional[int] = None
    quality_score: Optional[int] = None
    preprocessing_notes: List[str] = []


class OnboardingCaseSchema(BaseModel):
    id: str
    reference_number: str
    status: CaseStatusEnum
    created_at: datetime
    updated_at: datetime
    assigned_reviewer_id: Optional[str] = None
    declared_data: DeclaredCustomerDataSchema
    documents: List[DocumentMetadataSchema] = []
    extracted_fields: List[ExtractedFieldSchema] = []
    validation_results: List[ValidationRuleResultSchema] = []
    tampering_indicators: List[TamperIndicatorSchema] = []


class CreateCaseRequest(BaseModel):
    full_name: str
    date_of_birth: str
    document_type: DocumentTypeEnum
    document_id: str
    nationality: Optional[str] = None
    address: Optional[str] = None


class CorrectFieldRequest(BaseModel):
    field_name: str
    corrected_value: str
    reason: str
    reviewer_id: str


class ReviewDecisionRequest(BaseModel):
    decision: str  # APPROVE, RETURN_FOR_CORRECTION, CLAIM_REVIEW
    reviewer_id: str
    notes: Optional[str] = ""
