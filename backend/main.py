"""
KYC-AI: FastAPI Application Entry Point
Intelligent Customer Onboarding and Document Verification Platform
"""

from fastapi import FastAPI, HTTPException, UploadFile, File, Form, status
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional
import datetime
import uuid

from backend.schemas import (
    OnboardingCaseSchema,
    CreateCaseRequest,
    CorrectFieldRequest,
    ReviewDecisionRequest,
    DocumentMetadataSchema,
    CaseStatusEnum,
)
from backend.validation.rules import execute_validation_rules

app = FastAPI(
    title="KYC-AI Verification Platform",
    description="Intelligent Customer Onboarding and Document Verification Platform (Simulation & Compliance Support)",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory case registry for Python demonstration
cases_store = {}


@app.get("/health")
def health_check():
    return {
        "status": "HEALTHY",
        "service": "KYC-AI Verification Platform",
        "framework": "FastAPI",
        "compliance_notice": "Compliance-support and educational simulation.",
    }


@app.get("/api/kyc/cases", response_model=List[OnboardingCaseSchema])
def list_cases():
    return list(cases_store.values())


@app.post("/api/kyc/cases", response_model=OnboardingCaseSchema, status_code=status.HTTP_201_CREATED)
def create_case(payload: CreateCaseRequest):
    case_id = f"case-{uuid.uuid4().hex[:8]}"
    ref = f"KYC-{datetime.datetime.now().year}-{len(cases_store)+1001}"
    now = datetime.datetime.now(datetime.timezone.utc)

    new_case = OnboardingCaseSchema(
        id=case_id,
        reference_number=ref,
        status=CaseStatusEnum.UPLOADED,
        created_at=now,
        updated_at=now,
        declared_data=payload,
        documents=[],
        extracted_fields=[],
        validation_results=[],
        tampering_indicators=[],
    )
    cases_store[case_id] = new_case
    return new_case


@app.get("/api/kyc/cases/{case_id}", response_model=OnboardingCaseSchema)
def get_case(case_id: str):
    if case_id not in cases_store:
        raise HTTPException(status_code=404, detail="Case not found")
    return cases_store[case_id]


@app.post("/api/kyc/cases/{case_id}/review")
def review_decision(case_id: str, payload: ReviewDecisionRequest):
    if case_id not in cases_store:
        raise HTTPException(status_code=404, detail="Case not found")
    kase = cases_store[case_id]
    if payload.decision == "APPROVE":
        kase.status = CaseStatusEnum.APPROVED_BY_REVIEWER
    elif payload.decision == "RETURN_FOR_CORRECTION":
        kase.status = CaseStatusEnum.RETURNED_FOR_CORRECTION
    elif payload.decision == "CLAIM_REVIEW":
        kase.status = CaseStatusEnum.IN_REVIEW
    kase.assigned_reviewer_id = payload.reviewer_id
    kase.updated_at = datetime.datetime.now(datetime.timezone.utc)
    return kase
