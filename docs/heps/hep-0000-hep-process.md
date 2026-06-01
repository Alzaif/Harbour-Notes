---
HEP: 0000
Title: HEP Purpose and Process
Author: Harbour Contributors
Status: Active
Type: Process
Created: 2026-05-24
---

# Abstract

This document defines Harbour Enhancement Proposals (HEPs): when to write them, required structure, and status lifecycle. It is the meta-HEP for all other HEPs in a Harbour repository.

# Motivation

Harbour spans multiple independent services and a platform shell. Significant choices (integration contracts, registry shape, event naming) need a durable, reviewable record. Informal notes and orphan diagrams do not scale across repos and agents.

HEPs replace ad-hoc Architecture Decision Records in `docs/` with a single, PEP-inspired format shared across Harbour projects.

# Rationale

Python PEPs provide a proven pattern: numbered documents, clear status, typed proposals, and sections that force motivation and compatibility to be explicit. Harbour adapts that pattern without requiring reStructuredText or a central PEP index server—markdown in `docs/heps/` is sufficient for self-hosted workflows.

Per-repository HEP numbering keeps scaffolding simple. A future platform-wide HEP registry can be introduced via a new HEP without changing document shape.

# Specification

## Location

- All HEPs live in `docs/heps/`.
- Filename: `hep-NNNN-short-title.md` where `NNNN` is four-digit zero-padded decimal.
- Template: `docs/heps/hep-template.md`.
- Index: `docs/heps/README.md` must list every HEP with number, title, status, and type.

## Required metadata (YAML front matter)

| Field | Required | Description |
|-------|----------|-------------|
| HEP | yes | Number matching filename |
| Title | yes | Short title |
| Author | yes | People or team responsible |
| Status | yes | See README status table |
| Type | yes | Standards Track, Informational, or Process |
| Created | yes | ISO date |
| Requires | no | HEP numbers this builds on |
| Replaces | no | HEP numbers this supersedes |

## Required body sections

1. Abstract  
2. Motivation  
3. Rationale  
4. Specification  
5. Backwards Compatibility  
6. Security Implications  
7. Reference Implementation  
8. Copyright  

Optional: **Rejected Ideas**.

## When a HEP is required

Write a HEP before implementation when the change:

- Alters a public contract in `src/contracts/`
- Changes behaviour visible to other Harbour services or the shell
- Introduces a new integration pattern (events, auth headers, registry fields)
- Is hard to reverse and needs team or future-self context

Skip a HEP for routine refactors, bug fixes, and internal changes with no cross-repo impact.

## Lifecycle

1. Author copies template → **Draft**  
2. Review → **Proposed**  
3. Agreement → **Accepted**; implement and link reference implementation  
4. If obsolete → **Superseded** with link to replacing HEP, or **Rejected** / **Deferred**

# Backwards Compatibility

Existing repos without `docs/heps/` adopt this layout when scaffolded or when the first HEP is added. No migration of historical ADRs is required unless a team chooses to convert them manually.

# Security Implications

HEPs must include a Security Implications section so auth and trust-boundary changes are never documented only in code. Process HEPs may state "None" where appropriate.

# Reference Implementation

- `docs/heps/hep-template.md` — authoring template  
- `scripts/scaffold-harbour-project.sh` — includes `docs/heps/` in new projects  
- [AGENTS.md](../../AGENTS.md) — agent guidance referencing HEPs

# Copyright

This document is placed in the public domain or under the same licence as the repository, per project policy.
