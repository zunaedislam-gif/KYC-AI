"""
KYC-AI: Python Validation Rules Engine
"""

from typing import List, Optional, Tuple
from datetime import datetime
import re
from backend.schemas import (
    DeclaredCustomerDataSchema,
    ExtractedFieldSchema,
    ValidationRuleResultSchema,
    ValidationOutcomeEnum,
)


def mask_sensitive_value(value: Optional[str], val_type: str = "id") -> str:
    if not value or not value.strip():
        return "[NOT PROVIDED]"
    v = value.strip()
    if val_type == "id":
        if len(v) <= 4:
            return "***"
        return f"{v[:2]}{'*' * (len(v) - 4)}{v[-2:]}"
    if val_type == "date":
        parts = re.split(r"[-/.]", v)
        if len(parts) == 3:
            return f"{parts[0][:2]}**-**-{parts[2]}"
        return "****-**-**"
    # Name
    tokens = v.split()
    return " ".join([f"{t[0]}{'*' * max(len(t)-1, 3)}" if len(t) > 1 else t for t in tokens])


def levenshtein_distance(s1: str, s2: str) -> int:
    if len(s1) < len(s2):
        return levenshtein_distance(s2, s1)
    if len(s2) == 0:
        return len(s1)
    previous_row = list(range(len(s2) + 1))
    for i, c1 in enumerate(s1):
        current_row = [i + 1]
        for j, c2 in enumerate(s2):
            insertions = previous_row[j + 1] + 1
            deletions = current_row[j] + 1
            substitutions = previous_row[j] + (c1 != c2)
            current_row.append(min(insertions, deletions, substitutions))
        previous_row = current_row
    return previous_row[-1]


def compare_names(declared: str, extracted: str) -> Tuple[ValidationOutcomeEnum, float, str]:
    tokens_a = [t.lower() for t in re.sub(r"[^a-zA-Z\s]", "", declared).split() if t]
    tokens_b = [t.lower() for t in re.sub(r"[^a-zA-Z\s]", "", extracted).split() if t]

    if not tokens_a or not tokens_b:
        return ValidationOutcomeEnum.REVIEW_REQUIRED, 0.0, "Name field empty or missing."

    str_a = " ".join(tokens_a)
    str_b = " ".join(tokens_b)

    if str_a == str_b:
        return ValidationOutcomeEnum.PASS, 1.0, "Declared name matches document extracted name exactly."

    # Subsets (e.g. middle name included on official document)
    a_in_b = all(any(part in b or b.startswith(part) for b in tokens_b) for part in tokens_a)
    b_in_a = all(any(part in a or a.startswith(part) for a in tokens_a) for part in tokens_b)

    if a_in_b or b_in_a:
        return (
            ValidationOutcomeEnum.PASS,
            0.9,
            "Declared and document names match with minor token variation (e.g. middle name on document).",
        )

    dist = levenshtein_distance(str_a, str_b)
    similarity = max(0.0, 1.0 - dist / max(len(str_a), len(str_b)))
    if similarity >= 0.8:
        return (
            ValidationOutcomeEnum.REVIEW_REQUIRED,
            similarity,
            f"Minor spelling variance (similarity: {int(similarity*100)}%). Reviewer check required.",
        )

    return (
        ValidationOutcomeEnum.REVIEW_REQUIRED,
        similarity,
        f"Substantive name mismatch (similarity: {int(similarity*100)}%). Manual reviewer inspection needed.",
    )


def execute_validation_rules(
    declared: DeclaredCustomerDataSchema,
    extracted_fields: List[ExtractedFieldSchema],
) -> List[ValidationRuleResultSchema]:
    results: List[ValidationRuleResultSchema] = []

    field_map = {f.field_name.lower(): f for f in extracted_fields}

    # Name match
    name_field = field_map.get("full_name") or field_map.get("name")
    if not name_field or not name_field.normalized_value:
        results.append(
            ValidationRuleResultSchema(
                rule_id="RULE_NAME_EXTRACTION",
                rule_title="Full Name Extraction",
                field_name="full_name",
                outcome=ValidationOutcomeEnum.REVIEW_REQUIRED,
                expected_value_masked=mask_sensitive_value(declared.full_name, "name"),
                observed_value_masked="[NOT DETECTED]",
                explanation="Full name could not be extracted from document.",
                severity="CRITICAL",
            )
        )
    else:
        outcome, sim, expl = compare_names(declared.full_name, name_field.normalized_value)
        results.append(
            ValidationRuleResultSchema(
                rule_id="RULE_NAME_MATCH",
                rule_title="Declared vs Extracted Name Verification",
                field_name="full_name",
                outcome=outcome,
                expected_value_masked=mask_sensitive_value(declared.full_name, "name"),
                observed_value_masked=mask_sensitive_value(name_field.normalized_value, "name"),
                explanation=expl,
                severity="INFO" if outcome == ValidationOutcomeEnum.PASS else "WARNING",
            )
        )

    # DOB match
    dob_field = field_map.get("date_of_birth") or field_map.get("dob")
    if not dob_field or not dob_field.normalized_value:
        results.append(
            ValidationRuleResultSchema(
                rule_id="RULE_DOB_EXTRACTION",
                rule_title="Document Date of Birth Extraction",
                field_name="date_of_birth",
                outcome=ValidationOutcomeEnum.REVIEW_REQUIRED,
                expected_value_masked=mask_sensitive_value(declared.date_of_birth, "date"),
                observed_value_masked="[NOT DETECTED]",
                explanation="Date of birth not detected by OCR.",
                severity="WARNING",
            )
        )
    else:
        is_dob_match = declared.date_of_birth.strip() == dob_field.normalized_value.strip()
        results.append(
            ValidationRuleResultSchema(
                rule_id="RULE_DOB_MATCH",
                rule_title="Date of Birth Consistency",
                field_name="date_of_birth",
                outcome=ValidationOutcomeEnum.PASS if is_dob_match else ValidationOutcomeEnum.REVIEW_REQUIRED,
                expected_value_masked=mask_sensitive_value(declared.date_of_birth, "date"),
                observed_value_masked=mask_sensitive_value(dob_field.normalized_value, "date"),
                explanation="Dates of birth match exactly." if is_dob_match else "DOB discrepancy detected.",
                severity="INFO" if is_dob_match else "WARNING",
            )
        )

    # Document Identifier Match
    doc_id_field = field_map.get("document_id") or field_map.get("id_number")
    clean_dec = re.sub(r"[^A-Za-z0-9]", "", declared.document_id).upper()

    if not doc_id_field or not doc_id_field.normalized_value:
        results.append(
            ValidationRuleResultSchema(
                rule_id="RULE_DOC_ID_EXTRACTION",
                rule_title="Document Identifier Extraction",
                field_name="document_id",
                outcome=ValidationOutcomeEnum.REVIEW_REQUIRED,
                expected_value_masked=mask_sensitive_value(declared.document_id, "id"),
                observed_value_masked="[NOT DETECTED]",
                explanation="Document identifier not detected by OCR.",
                severity="WARNING",
            )
        )
    else:
        clean_ext = re.sub(r"[^A-Za-z0-9]", "", doc_id_field.normalized_value).upper()
        is_id_match = clean_dec == clean_ext
        results.append(
            ValidationRuleResultSchema(
                rule_id="RULE_DOC_ID_MATCH",
                rule_title="Document Identifier Consistency",
                field_name="document_id",
                outcome=ValidationOutcomeEnum.PASS if is_id_match else ValidationOutcomeEnum.REVIEW_REQUIRED,
                expected_value_masked=mask_sensitive_value(declared.document_id, "id"),
                observed_value_masked=mask_sensitive_value(doc_id_field.normalized_value, "id"),
                explanation="Declared document identifier matches extraction." if is_id_match else "Document identifier mismatch.",
                severity="INFO" if is_id_match else "CRITICAL",
            )
        )

    return results
