# Harbour Enhancement Proposals (HEPs)

HEPs document significant technical decisions for Harbour projects. The format follows [Python PEPs](https://peps.python.org/): numbered proposals with metadata, status lifecycle, and structured sections.

## Index

| HEP | Title | Status | Type |
|-----|-------|--------|------|
| [0000](./hep-0000-hep-process.md) | HEP Purpose and Process | Active | Process |

Assign the next number when creating a proposal. Do not reuse numbers.

## Status values

| Status | Meaning |
|--------|---------|
| Draft | Under discussion; not yet agreed |
| Proposed | Ready for review |
| Accepted | Approved for implementation |
| Deferred | Parked; may revive later |
| Rejected | Not adopted; document retained for history |
| Superseded | Replaced by a later HEP (link the successor) |
| Active | Meta/process documents that stay in force |

## Types

| Type | Use for |
|------|---------|
| Standards Track | Contracts, APIs, schemas, interoperability |
| Informational | Guidelines, patterns, non-normative advice |
| Process | How we work (this index, tooling, HEP process itself) |

## Creating a HEP

1. Copy [hep-template.md](./hep-template.md) to `hep-NNNN-short-title.md` (four-digit zero-padded number).
2. Fill in metadata and all required sections.
3. Add a row to the index table in this README.
4. Open a PR or review channel per your team practice; update **Status** when resolved.

Platform-wide HEPs may live in a central repo later; per-repo HEPs use the same format and number only within that repo unless a global registry is introduced.
