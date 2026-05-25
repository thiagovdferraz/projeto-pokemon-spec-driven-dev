<!--
SYNC IMPACT REPORT
Version change: [unversioned template] → 1.0.0
Principles added:
  - I. Pure Front-End (No Backend)
  - II. Client-Side Persistence
  - III. Testable Probabilistic Distribution
  - IV. Mandatory Responsiveness
  - V. Disk-Organized Assets
Sections added:
  - Core Principles (5 principles)
  - Development Constraints
  - Quality Gates
  - Governance
Sections removed: N/A (initial adoption)
Templates reviewed:
  ✅ .specify/templates/plan-template.md — Constitution Check section is generic; no update required
  ✅ .specify/templates/spec-template.md — No constitution-specific references; no update required
  ✅ .specify/templates/tasks-template.md — No constitution-specific references; no update required
  ✅ No command template files found under .specify/templates/commands/
Deferred TODOs: None — all fields resolved.
-->

# Spec Kit Project Constitution

## Core Principles

### I. Pure Front-End (No Backend)

The application MUST be implemented exclusively as a client-side front-end application.
No server-side runtime, API server, or backend service of any kind is permitted at runtime.
All logic — including data processing, business rules, and state management — MUST execute
in the browser. Build tools (bundlers, transpilers, linters) are permitted during development
but MUST NOT produce any server-dependent runtime artifact.

**Rationale**: Eliminates infrastructure costs, deployment complexity, and operational overhead.
The application runs entirely in the user's browser, enabling zero-server distribution and
offline-capable delivery from any static host (CDN, GitHub Pages, local filesystem).

### II. Client-Side Persistence

All persistent state MUST be stored using browser-native client-side mechanisms
(e.g., `localStorage`, `IndexedDB`, `sessionStorage`, or Cache API).
No external database, cloud sync, or server-side session storage is permitted.
Data MUST survive page reloads within the same browser profile.
Loss of data on browser storage clearance is acceptable and MUST be documented in
user-facing guidance. Features MUST degrade gracefully when storage is unavailable
(e.g., private/incognito mode) rather than crashing.

**Rationale**: Preserves the no-backend constraint (Principle I) while enabling stateful
user experiences without requiring network connectivity.

### III. Testable Probabilistic Distribution

Any feature that relies on randomness or probabilistic selection MUST expose a seeded
or mockable interface so that outcomes are fully deterministic in tests. Probability
weights MUST be declared as explicit, auditable configuration — never as hardcoded magic
numbers scattered across logic files. Tests MUST assert distribution properties
(e.g., frequency bands over N iterations, chi-squared tolerance) rather than
single-sample outputs.

**Rationale**: Random behavior that cannot be reproduced in tests is untestable behavior.
Explicit, centralized weights double as living documentation of intended distribution and
make rebalancing a one-line configuration change.

### IV. Mandatory Responsiveness

Every user interface component MUST be fully functional and visually coherent across all
viewport sizes from 320 px (mobile) to 2560 px (large desktop). Layouts MUST use fluid
and responsive techniques (CSS Grid, Flexbox, relative units such as `rem`, `%`, `vw`).
Fixed-pixel widths for layout containers are prohibited. Fixed pixels for icons and
purely decorative elements are allowed up to a maximum of 48 px. Each feature MUST be
validated on at least mobile (≤ 480 px) and desktop (≥ 1024 px) breakpoints before
it is considered complete.

**Rationale**: The absence of a backend means the application can be accessed from any
device without friction. Restricting usability to desktop-only would exclude the majority
of potential users and contradict the zero-infrastructure goal of Principle I.

### V. Disk-Organized Assets

All static assets (images, audio, fonts, data files, icons, JSON fixtures) MUST be placed
under a structured directory tree documented in `docs/assets.md` with a declared naming
convention. Assets MUST NOT be inlined as base64 strings inside source code files except
for icons smaller than 1 KB. Asset paths referenced in code MUST be expressed as named
constants or ES module imports — never as raw string literals duplicated across files.

**Rationale**: Consistent asset organization prevents duplication, eases search and
maintenance, and makes the build reproducible across environments without relying on a
file server or asset pipeline with implicit conventions.

## Development Constraints

- No external runtime dependencies that require a server process or cloud credential
  at runtime are permitted.
- Third-party libraries MUST be audited for browser/client-side compatibility before
  adoption. Node.js-only packages are prohibited in the production bundle.
- Any dependency adding more than 50 KB (gzipped) to the bundle MUST be explicitly
  justified in the PR description with an evaluation of lighter alternatives.
- All storage writes MUST be wrapped in `try/catch` to handle quota-exceeded errors
  and storage-unavailable conditions without an uncaught exception.

## Quality Gates

Before any feature branch is merged, ALL of the following checks MUST pass:

1. **No-backend gate**: No network requests target server-side endpoints; no server
   process is required to run the application (serve via `file://` or any static host).
2. **Persistence gate**: User state survives a full page reload in a normal browser session.
3. **Probabilistic gate**: If the feature involves randomness, a deterministic test using
   a fixed seed passes and distribution assertions hold over ≥ 1 000 iterations.
4. **Responsiveness gate**: Feature tested and functional at 320 px, 768 px, and 1280 px
   viewport widths (manual inspection or automated screenshot diffing).
5. **Asset gate**: All new assets are registered in `docs/assets.md` following the
   declared naming convention; no raw string asset paths appear in source code.

## Governance

This Constitution supersedes all other project conventions and practices. Any practice
not explicitly addressed here defaults to simplicity (YAGNI) and current front-end
community standards.

**Amendment procedure**:
1. Open a pull request updating this file with a version bump following semantic versioning:
   - MAJOR: removal or redefinition of an existing principle.
   - MINOR: addition of a new principle or materially expanded guidance.
   - PATCH: clarifications, wording fixes, or non-semantic refinements.
2. Update the Sync Impact Report comment at the top of this file.
3. Update any templates or guidance files identified in the report.
4. Obtain review and approval from the project maintainer before merge.

Compliance is verified at every PR review against the Quality Gates above.
Runtime development guidance is maintained in `CLAUDE.md`.

**Version**: 1.0.0 | **Ratified**: 2026-05-25 | **Last Amended**: 2026-05-25
