# VoyageVoyage - Functional Documentation (Phase 1)

## 1. Purpose of this document

This document provides a shared functional understanding of the VoyageVoyage application for developers, product stakeholders, and designers.

It explains:
- the product vision and business objectives
- the functional scope and priorities
- the proposed features by incremental batch
- user experience principles to guide implementation choices

See also: `UX_GUIDELINES.md` for the detailed UX, accessibility, and UI implementation rules.

The primary intent is to help teams build the right product with consistent behavior and a high-quality user experience.

## 2. Product vision

VoyageVoyage is a travel and expense management assistant for recurring professional trips.

It aims to simplify the full workflow:
- trip planning
- trip organization and calendar visibility
- proof/receipt collection
- expense declaration and fiscal calculations

The application must reduce manual work, improve data reliability, and provide traceable calculations for fiscal use.

## 3. Business goals and objectives

### 3.1 Main goals

- Reduce administrative workload for recurring business travel.
- Centralize data currently scattered across calendars, emails, files, and spreadsheets.
- Improve compliance through explicit, configurable fiscal rules.
- Provide accurate monthly and annual reporting with export capabilities.

### 3.2 Success indicators (functional KPIs)

- Time spent per trip planning and expense closure.
- Percentage of expenses linked to valid receipts.
- Number of manual corrections required per month.
- On-time completion of monthly expense reports.
- User satisfaction with planning and expense workflows.

## 4. Target users

- Employee with recurring professional trips.
- Independent worker managing tax-deductible travel expenses.
- Administrative/accounting user reviewing expense completeness and exports.

## 5. Product principles

- Incremental value delivery: each batch must provide usable business value.
- Traceability first: every calculation and status change should be understandable.
- Configurable rules: legal/fiscal values evolve yearly and must be editable.
- Minimize repetitive input: encourage reuse, auto-fill, and contextual defaults.
- UX clarity over complexity: users should always know what to do next.

## 6. Scope and release strategy

The implementation is split into 6 functional batches.

- Batches 1 to 4 define the functional MVP that can be used end-to-end.
- Batches 5 and 6 are enhancement layers focused on automation and integrations.

## 7. Functional features by batch

## Batch 1 - Foundation: Reference Data and Calendar

### Objective
Build the core data layer and a usable trip calendar.

### Features
- Reference data management:
  - public holidays (API import or manual entry)
  - school holidays by zone (import or manual entry)
  - personal leave days
  - travel constraints (allowed weekdays, min/max duration)
- Trip calendar:
  - monthly calendar view
  - create, edit, delete trip entries
  - visual overlays for public holidays, school holidays, and personal leave
  - trip statuses: Planned, Confirmed, Cancelled
  - ICS export for external calendar sync

### UX expectations
- Calendar readability is critical: status and day type must be instantly recognizable.
- Trip creation must require minimal clicks with clear validation errors.

## Batch 2 - Planning assistance

### Objective
Help users identify valid trip slots quickly.

### Features
- Date suggestion engine:
  - suggest slots based on configured constraints
  - exclude public holidays, school holidays, personal leave
  - conflict detection for overlapping trips
  - configurable planning horizon (for example 2 to 3 months)
- Planning dashboard:
  - upcoming trip summary
  - alerts for trips to be planned in the next X days
  - workload indicator (travel days per month)

### UX expectations
- Suggestions must be explainable (why a date is valid/invalid).
- Conflict alerts should be proactive and actionable.

## Batch 3 - Receipt and proof management

### Objective
Centralize expense proofs and structure spending data.

### Features
- Receipt upload:
  - supported files: PDF and images
  - attach to a trip or a specific day
  - categories: Train, Hotel, Meal, Urban transport, Other
- Expense entry:
  - fields: date, category, amount, description, linked proof
  - link to existing trip
  - statuses: To validate, Validated
- Storage and browsing:
  - structured archive by month and year
  - proof preview

### UX expectations
- Upload must be fast and mobile-friendly.
- Expense form should prefill context from selected trip/day when possible.
- Missing mandatory fields must be highlighted clearly.

## Batch 4 - Expense reports and fiscal rules

### Objective
Automate deductible amount calculations and produce reporting outputs.

### Features
- Fiscal rule configuration:
  - meal allowance (yearly configurable)
  - employer meal voucher contribution amount (configurable)
  - daily remote work allowance (configurable)
- Automatic calculations:
  - meal deduction logic using allowance and meal voucher contribution
  - automatic remote work day computation (working days excluding trip days and leave)
  - net deductible amount per expense
- Summary and exports:
  - monthly summary by category with gross/net totals
  - annual consolidated summary
  - PDF and Excel export

### UX expectations
- Calculation details must be visible and auditable.
- Rule changes must communicate impact (from date and affected data).
- Export actions should be accessible from summary screens.

## Batch 5 - External integrations

### Objective
Reduce manual effort through third-party connectivity.

### Features
- Booking reminders:
  - automatic J-90 reminder for train booking windows
  - configurable J-X reminder for hotel booking
- Booking confirmation import:
  - parse booking emails/documents to prefill expenses
  - ICS import from booking platforms
- Calendar sync:
  - bidirectional sync with Google Calendar or Outlook (OAuth)

### UX expectations
- Connection setup must be guided step-by-step.
- Import results must show what was created, matched, or rejected.

## Batch 6 - AI and advanced automation

### Objective
Minimize remaining manual actions and provide predictive insights.

### Features
- OCR for proofs:
  - extract amount, date, label from image/PDF
  - suggest category from extracted content
- AI planning assistant:
  - suggest dates based on history and preferences
  - detect anomalies (unusual expense, missing proof)
- Analytical dashboard:
  - monthly expense evolution
  - average cost per trip and destination
  - annual projection based on historical patterns

### UX expectations
- AI outputs must remain editable by users.
- Confidence indicators should be displayed for extracted/suggested values.

## 8. End-to-end MVP coverage (Batches 1 to 4)

After Batch 4, users should be able to:
- define reference constraints and plan trips in a calendar
- record and organize proofs and expenses
- apply fiscal rules to compute deductible amounts
- generate monthly and annual exports for accounting/tax workflows

This constitutes a complete, autonomous functional loop.

## 9. Core user journeys

### Journey A - Plan a trip
- User sets constraints and leave data.
- User opens calendar and checks valid windows.
- User creates a trip and sets status.
- User exports ICS if needed.

### Journey B - Register an expense with proof
- User uploads a proof and selects category.
- User creates or updates an expense entry.
- User links the expense to a trip/day.
- User validates the entry.

### Journey C - Close monthly expenses
- User reviews monthly summary.
- User checks gross vs net calculations.
- User resolves missing or invalid entries.
- User exports PDF/Excel.

## 10. Functional rules and constraints

- Every expense should be associated with a date and category.
- Proof attachment is expected for deductible expense items.
- Trip status impacts planning and reporting visibility.
- Fiscal parameters are configurable and should support yearly updates.
- Net deductible values must be reproducible from stored inputs and rules.

## 11. Non-functional expectations impacting UX

- Performance:
  - calendar and summary pages should remain responsive with multi-month data
- Reliability:
  - no data loss for uploads and status changes
- Security and privacy:
  - secure handling of personal and financial data
  - auditability for rule updates and validation actions
- Accessibility:
  - keyboard-friendly interactions and readable status contrasts

## 12. Open product decisions (to finalize early)

- Source of truth for public and school holiday imports.
- Exact fiscal formulas and legal references by year.
- Validation workflow: single-step vs multi-step approval.
- Export templates required by accounting stakeholders.
- Scope of mobile-first behavior for upload-heavy workflows.

## 13. Recommended implementation order

1. Batch 1 (mandatory foundation)
2. Batch 2 (planning efficiency)
3. Batch 3 (proof and expense centralization)
4. Batch 4 (fiscal automation and exports)
5. Batch 5 (integration convenience)
6. Batch 6 (advanced automation)

This order aligns with business value and technical dependency:
calendar and reference data first, then structured financial data, then calculations, then external/AI acceleration.

## 14. Definition of done (functional)

A batch is functionally complete when:
- all listed features are usable through the UI
- key user journeys are executable without workarounds
- validation and status behavior are consistent
- outputs (summaries/exports) match configured rules
- known limitations are documented

---

This document is the functional baseline for Phase 1 and should evolve with product decisions, regulatory updates, and user feedback.
