# Insurance & Financial Compliance — Regulatory Requirements Matrix

Reference for architect-audit skill. Use when auditing compliance agents, insurance platforms, or fintech products.

---

## Core Regulatory Frameworks

### India (IRDAI)
| Requirement | What to Check in System |
|-------------|------------------------|
| IRDAI (Insurance Regulatory and Development Authority) circulars | Is the KB updated with latest circulars? Is there a source tracker? |
| Product filing compliance | Does the system flag unauthorized product structures? |
| KYC/AML integration | Is there an AML check in the pipeline? Is it logged? |
| Grievance redressal TAT | Are SLA timers tracked for compliance violation findings? |
| Data localization | Is customer data stored on Indian servers? |
| Outsourcing guidelines | If using cloud AI APIs, is the vendor disclosed and approved? |

### US (NAIC, State-level)
| Requirement | What to Check in System |
|-------------|------------------------|
| NAIC Model Laws | Is the system jurisdiction-aware? Can it distinguish state vs federal? |
| Market conduct | Does the system check for unfair discrimination in rating/underwriting? |
| Rate filing | Does the system validate filed vs applied rates? |
| Form approval | Does the system flag unapproved policy language? |
| FCRA (if using credit) | Is adverse action notice logic present? |
| GLBA (data privacy) | Is financial data encrypted at rest and in transit? |

### EU/UK
| Requirement | What to Check in System |
|-------------|------------------------|
| Solvency II | Capital requirement calculations — is there a validation layer? |
| GDPR | Right to erasure vs audit trail conflict — is there a resolution? |
| IDD (Insurance Distribution Directive) | Are product governance checks in the compliance agent scope? |
| FCA SYSC | Is there a senior manager accountability mapping? |

---

## Universal Compliance System Requirements

### Audit Trail Requirements
- [ ] Every compliance check must be logged with: timestamp, document version, rule version, finding, confidence score, user/system that triggered it
- [ ] Logs must be immutable (append-only store, no update/delete)
- [ ] Retention minimum: 5 years (insurance), 7 years (financial advisory), check jurisdiction
- [ ] Logs must be exportable for regulatory examination

### Explainability Requirements
- [ ] Every violation finding must cite: exact document, section, clause, page number
- [ ] Reasoning chain must be human-readable (not just "LLM said so")
- [ ] Confidence score must accompany every finding
- [ ] Edge cases must escalate to human reviewer, not auto-resolve

### Document Versioning Requirements
- [ ] Every regulatory document has: source URL, publication date, effective date, jurisdiction, version ID
- [ ] Past compliance decisions must be re-traceable to the document version active at decision time
- [ ] Superseded documents must be tombstoned, not deleted
- [ ] Change log maintained when documents are updated

### Human-in-the-Loop Requirements
- [ ] High-confidence violations: auto-flag, human confirms
- [ ] Low-confidence violations: mandatory human review before action
- [ ] No automated adverse action taken solely on LLM output (US FCRA, EU AI Act high-risk)
- [ ] Escalation workflow defined and tested

### Data Privacy in Compliance Systems
- [ ] PII must not appear in LLM prompts unless necessary and consented
- [ ] Compliance check results containing PII must be access-controlled
- [ ] Data subject access requests must be satisfiable (can you find all records about a person?)
- [ ] Cross-border data flows documented and lawful basis established

---

## Common Compliance System Anti-Patterns

| Anti-Pattern | Risk | Fix |
|-------------|------|-----|
| Binary pass/fail output | Misses borderline violations; no confidence calibration | Add confidence scores + tiered severity |
| Freeform LLM text as output | Not machine-parseable; hard to audit; inconsistent format | Structured output: JSON with citation, severity, confidence |
| Single monolithic KB | Jurisdictional conflicts; old rules mixed with new | Partition by jurisdiction, product type, effective date |
| No threshold on retrieval | Returns irrelevant docs; hallucinates rules | Minimum similarity threshold + "no relevant rule found" fallback |
| LLM as sole judge | No ground truth; accuracy unknown | Golden test set + regular precision/recall measurement |
| No correction workflow | False positives have no appeal path | Dispute/correction flow with audit log of override |
| Static knowledge base | Regulations change; system doesn't know | Scheduled ingestion + change notification system |
| PII in violation reports | Data breach risk if reports shared | Redact PII in reports; full data in access-controlled audit log |

---

## Pre-Launch Checklist for Compliance Agents

### Accuracy
- [ ] Precision ≥ X% on golden test set (agree with domain experts on threshold)
- [ ] Recall ≥ Y% (missing violations is typically worse than false positives in insurance)
- [ ] Tested on adversarial documents (docs designed to confuse or inject)
- [ ] Tested on edge cases: multi-jurisdiction, conflicting rules, no applicable rule

### Operational
- [ ] KB update process documented and tested
- [ ] Rollback procedure for bad KB update
- [ ] Monitoring: violation detection rate, confidence score distribution, retrieval score distribution
- [ ] Alerting: zero detections (system down?), confidence collapse, latency spike

### Legal / Regulatory
- [ ] Legal review of system outputs (are they "legal advice"? If so, disclaimers required)
- [ ] DPO sign-off if processing personal data
- [ ] Regulatory sandbox approval if applicable (some jurisdictions require)
- [ ] Liability framework: if system misses a violation, who is responsible?
