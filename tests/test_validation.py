"""
Python Pytest Suite for KYC-AI Validation Engine
Tests Pydantic models, fuzzy name matching, date checking, and rule evaluations.
"""

import pytest
from backend.schemas import (
    DeclaredCustomerDataSchema,
    ExtractedFieldSchema,
    DocumentTypeEnum,
    FieldStatusEnum,
    ValidationOutcomeEnum,
)
from backend.validation.rules import (
    compare_names,
    mask_sensitive_value,
    levenshtein_distance,
    execute_validation_rules,
)


def test_mask_sensitive_value():
    assert mask_sensitive_value("HZ-8849-2194", "id").startswith("HZ")
    assert mask_sensitive_value("HZ-8849-2194", "id").endswith("94")
    assert "***" in mask_sensitive_value("HZ-8849-2194", "id")
    assert mask_sensitive_value("1988-06-14", "date") == "19**-**-14"
    assert mask_sensitive_value("", "id") == "[NOT PROVIDED]"


def test_levenshtein_distance():
    assert levenshtein_distance("kitten", "sitting") == 3
    assert levenshtein_distance("Alex", "Alex") == 0
    assert levenshtein_distance("Taylor", "Tailor") == 1


def test_compare_names_exact_and_subset():
    outcome, sim, expl = compare_names("Alex Mercer", "Alex Mercer")
    assert outcome == ValidationOutcomeEnum.PASS
    assert sim == 1.0

    # Middle name included on official document
    outcome, sim, expl = compare_names("Elena Vance", "Elena Rostova Vance")
    assert outcome == ValidationOutcomeEnum.PASS
    assert sim >= 0.9

    # Typo
    outcome, sim, expl = compare_names("Taylor Morgan", "Tailor Morgan")
    assert outcome == ValidationOutcomeEnum.REVIEW_REQUIRED
    assert sim >= 0.8

    # Substantive mismatch
    outcome, sim, expl = compare_names("John Doe", "Jane Smith")
    assert outcome == ValidationOutcomeEnum.REVIEW_REQUIRED
    assert sim < 0.5


def test_execute_validation_rules():
    declared = DeclaredCustomerDataSchema(
        full_name="Alex Mercer",
        date_of_birth="1988-06-14",
        document_type=DocumentTypeEnum.GENERIC_ID_CARD,
        document_id="HZ-8849-2194",
        nationality="Republic of Horizon",
    )

    extracted = [
        ExtractedFieldSchema(
            field_name="full_name",
            raw_value="Alex Mercer",
            normalized_value="Alex Mercer",
            confidence=96.0,
            status=FieldStatusEnum.VALID,
        ),
        ExtractedFieldSchema(
            field_name="date_of_birth",
            raw_value="1988-06-14",
            normalized_value="1988-06-14",
            confidence=94.0,
            status=FieldStatusEnum.VALID,
        ),
        ExtractedFieldSchema(
            field_name="document_id",
            raw_value="HZ-8849-2194",
            normalized_value="HZ88492194",
            confidence=95.0,
            status=FieldStatusEnum.VALID,
        ),
    ]

    results = execute_validation_rules(declared, extracted)
    assert len(results) >= 3

    name_rule = next(r for r in results if r.rule_id == "RULE_NAME_MATCH")
    assert name_rule.outcome == ValidationOutcomeEnum.PASS

    dob_rule = next(r for r in results if r.rule_id == "RULE_DOB_MATCH")
    assert dob_rule.outcome == ValidationOutcomeEnum.PASS

    id_rule = next(r for r in results if r.rule_id == "RULE_DOC_ID_MATCH")
    assert id_rule.outcome == ValidationOutcomeEnum.PASS
