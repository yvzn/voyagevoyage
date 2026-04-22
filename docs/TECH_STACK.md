# VoyageVoyage - Tech Stack and Developer Onboarding

## 1. Purpose

This document explains the technical stack used for VoyageVoyage and the implementation principles expected across the project.

It is intended to help developers understand:
- what technologies are used
- why they are used
- how responsibilities are split between the front end, backend, and batch layer
- what implementation patterns should be followed when adding features

This document complements:
- `FUNCTIONAL_DOCUMENTATION.md` for product scope and business behavior
- `UX_GUIDELINES.md` for accessibility, UX, and UI implementation expectations

## 2. High-level architecture

The application is organized into three technical areas:

- `front/`: Angular application for the user interface
- `server/`: .NET Web API for business operations and data access
- `batch/`: Azure Functions in .NET for asynchronous or scheduled processing

At a high level:

- the Angular front end handles screens, forms, navigation, and client-side state
- the .NET Web API exposes application endpoints and contains the core business logic
- Azure Cosmos DB stores application data
- Azure Storage stores uploaded files such as receipts or other supporting documents
- Azure Functions handle occasional background processing, scheduled jobs, or technical workflows that should not run inside the main API request cycle

## 3. Stack summary

### Front end

- Angular
- Tailwind CSS
- Flowbite
- NgRx
- Reactive Forms
- Standalone components
- Angular signals (when appropriate)
- Angular control flow blocks
- `@angular/localize` (i18n and localisation)

### Backend

- .NET Web API
- Controller / service decomposition
- Azure Cosmos DB
- Azure Storage

### Batch / background processing

- Azure Functions in .NET

## 4. Front-end stack

### 4.1 Angular

Angular is the main front-end framework.

It is used for:
- routing
- screen composition
- form handling
- state orchestration
- API integration
- component-based UI development

The project favors modern Angular patterns:
- standalone components instead of legacy NgModule-heavy organization
- signals for local reactive state when appropriate
- Angular control flow blocks for clearer templates
- Reactive Forms for non-trivial forms and validation-heavy workflows

This is a good fit for VoyageVoyage because the application contains:
- business-oriented forms
- multi-step user workflows
- reusable UI elements
- stateful screens such as calendars, expense forms, uploads, and reporting views

### 4.2 Standalone components

UI features should be built using standalone components.

Why:
- they keep dependencies explicit
- they reduce module boilerplate
- they make features easier to read and test
- they align with current Angular direction

Practical rule:
- each screen or reusable UI block should own only the imports it needs
- avoid large, all-purpose components with mixed responsibilities

### 4.3 Tailwind CSS

Tailwind CSS is the main styling approach.

Why:
- it enables fast, consistent UI implementation
- it reduces custom CSS drift
- it encourages reusable visual patterns
- it works well with a component-oriented Angular application

Expected usage:
- prefer utility classes first
- add custom CSS only when utilities are not enough
- keep spacing, typography, layout, and responsive behavior consistent with the shared design language

### 4.4 Flowbite

Flowbite is used as the main UI component companion on top of Tailwind.

Why:
- it accelerates implementation of common UI patterns
- it provides a consistent visual baseline
- it avoids reinventing standard interaction components

Expected usage:
- prefer Flowbite-compatible patterns for common UI pieces such as dropdowns, modals, navigation, and input groups
- do not introduce custom visual patterns if Flowbite already covers the need well
- any customization must still respect accessibility and the shared UX rules

### 4.5 NgRx

NgRx is the preferred solution for application-level state management.

NgRx should be used for state that is:
- shared across multiple screens or features
- long-lived beyond a single component
- driven by async API workflows
- important for traceability, loading states, caching, or error handling

Typical candidates for NgRx state:
- authenticated user context if applicable
- trip calendar data
- reference data such as holidays, settings, and fiscal rules
- expense lists and summaries
- upload and processing statuses when they affect multiple views

Do not use NgRx for everything.

Use simpler local state when the data is:
- only relevant to one component tree
- short-lived
- purely presentational

Recommended rule of thumb:
- local UI state: component state with signals
- form state: Reactive Forms
- shared business state: NgRx store

### 4.6 Signals

Signals are the preferred primitive for local reactive state inside Angular components and lightweight UI services.

Use signals for:
- toggles and view modes
- current selection
- derived display values
- local loading indicators
- small orchestration logic within a feature

Avoid using signals as an ad hoc replacement for application architecture. Shared business state should still be modeled deliberately, usually through NgRx.

### 4.7 Control flow blocks

Angular control flow blocks should be preferred in templates for readability and maintainability.

Use them for:
- conditional rendering
- empty states
- loading states
- simple list rendering

The goal is to keep templates explicit and easy to scan.

### 4.8 Reactive Forms

Reactive Forms should be used wherever forms contain meaningful validation, dynamic fields, or business rules.

Typical cases include:
- trip creation and editing
- expense entry
- fiscal rule configuration
- upload metadata forms
- filters with validation or transformation rules

Why:
- validation is explicit and testable
- dynamic rules are easier to manage
- form state is predictable
- complex business forms are easier to scale over time

General expectations:
- build forms in TypeScript, not implicitly in templates
- keep validation close to the form model
- surface validation messages clearly in the UI
- preserve user input on recoverable errors

### 4.9 Internationalisation (i18n) and localisation

`@angular/localize` is the mandatory package for all internationalisation and localisation needs.

Why:
- it is the official Angular i18n solution, tightly integrated with the build toolchain
- it supports compile-time translation extraction and AOT-optimised locale builds
- it provides Angular pipes (`DatePipe`, `CurrencyPipe`, `DecimalPipe`, `PercentPipe`) that automatically respect the active locale
- it avoids introducing a third-party i18n library when the platform already covers the need

Mandatory rules:
- every user-facing string must be marked for translation — no hardcoded visible text in templates or components
- use the `i18n` attribute in templates for static text and the `$localize` tagged template literal in TypeScript for dynamic strings
- dates, numbers, currencies, and percentages must be formatted through the Angular locale pipes, never with raw `Date` methods or manual string formatting
- translation messages are maintained in JSON files under `front/src/locale/`
- the active locale is determined at build time by the Angular CLI `--localize` flag; do not implement custom runtime locale switching unless explicitly required

Expected usage in templates:
```html
<!-- static label -->
<span i18n="@@trip.title">Trip title</span>

<!-- pipe-based formatting -->
{{ expense.date | date:'shortDate' }}
{{ expense.amount | currency:expense.currency }}
```

Expected usage in TypeScript:
```typescript
const message = $localize`:@@validation.required:This field is required.`;
```

Practical checklist:
- run `ng extract-i18n --format=json` to regenerate the source JSON after adding or modifying translated strings
- review the generated JSON diff in every PR that touches user-facing text
- do not merge UI changes that introduce untranslated strings

## 5. Back-end stack

### 5.1 .NET Web API

The backend is built as a .NET Web API.

The API is responsible for:
- exposing HTTP endpoints to the Angular application
- enforcing business rules
- coordinating data persistence
- handling file-related workflows through Azure Storage
- returning stable contract shapes to the front end

### 5.2 Controller / service decomposition

The backend should follow a clear controller / service decomposition.

Expected responsibility split:

- controllers:
  - receive HTTP requests
  - validate request shape and route parameters
  - call services
  - return HTTP responses

- services:
  - implement business rules
  - orchestrate persistence and external dependencies
  - contain application logic that should not live in controllers

Practical rule:
- controllers should stay thin
- business logic should not accumulate inside endpoint methods
- services should express domain behavior in a readable way

This separation matters because VoyageVoyage has rules-heavy workflows such as:
- travel planning constraints
- expense validation
- deductible amount calculations
- receipt and file association logic

### 5.3 Azure Cosmos DB

Azure Cosmos DB is the main application database.

It is intended to store business data such as:
- trips
- expenses
- uploaded file metadata
- configuration and reference data
- fiscal rule sets
- reporting-related aggregates or supporting records where needed

Why Cosmos DB fits this project:
- flexible schema evolution for incremental product batches
- good support for document-oriented application models
- suitable for cloud-native workloads

Important mindset for developers:
- model data around access patterns, not only around abstract entities
- think early about partitioning and query behavior
- avoid writing generic repository layers that hide important query costs

### 5.4 Azure Storage

Azure Storage is used to store files, especially uploaded receipts or other documents.

Typical split:
- Cosmos DB stores metadata and references
- Azure Storage stores the actual binary files

This separation is important because application records and binary documents have different storage concerns.

General expectations:
- do not store large files directly in the database
- keep a clear link between file metadata and the business record that owns it
- handle upload, retrieval, and deletion flows carefully to avoid orphaned files or broken references

## 6. Batch processing with Azure Functions

The project may use occasional Azure Functions in .NET for background or scheduled processing.

Typical use cases:
- scheduled cleanups
- imports or synchronization jobs
- reminders and notifications
- recalculation or maintenance tasks
- long-running or asynchronous technical workflows

Why Functions are used here:
- they keep non-interactive processing out of the main API
- they are suitable for event-driven or scheduled workloads
- they help isolate operational tasks from user-facing request handling

General expectation:
- keep function entry points thin, similar to API controllers
- place real processing logic in services or reusable application code when possible
- make batch behavior observable through logging and clear failure handling

## 7. Recommended responsibility split

When adding a feature, use the following decision model.

### In Angular

Put in Angular:
- screen composition
- routing
- user interaction handling
- local display state
- client-side validation and form orchestration
- store interaction and API calls through dedicated feature services or NgRx effects

### In the .NET API

Put in the API:
- business rules
- authorization decisions where applicable
- persistence logic
- calculation rules that must remain authoritative
- file metadata coordination
- integration with Cosmos DB and Azure Storage

### In Azure Functions

Put in Functions only when the work is:
- scheduled
- event-driven
- long-running
- operationally separate from an immediate UI response

## 8. Development guidelines for new team members

### 8.1 When adding a front-end feature

- create focused standalone components
- use Reactive Forms for non-trivial forms
- use signals for local UI state
- use NgRx for shared business state
- prefer Tailwind utilities and Flowbite patterns over custom CSS
- keep templates readable with modern control flow blocks
- mark every user-facing string with `i18n` or `$localize` — no hardcoded visible text
- format dates, numbers, and currencies with Angular locale pipes

### 8.2 When adding a backend feature

- define the API contract clearly
- keep controllers thin
- place business rules in services
- design persistence around the actual read and write patterns
- store structured data in Cosmos DB and files in Azure Storage

### 8.3 When adding a batch process

- confirm that the work really belongs outside the main API
- keep the function trigger layer small
- reuse shared services where possible
- ensure failures can be diagnosed through logs and monitoring

## 9. What developers should keep in mind

- do not put business rules only in the UI
- do not put complex logic directly in Angular templates
- do not let API controllers become large procedural classes
- do not use global state when local component state is enough
- do not create custom styling if Tailwind or Flowbite already solve the problem well
- do not mix file binaries and application metadata in the same persistence model
- do not hardcode user-facing strings — every visible text must go through `@angular/localize`
- do not format dates, numbers, or currencies manually — use Angular locale pipes

Preferred mindset:
- start with clear responsibilities
- keep each layer focused on its job
- choose the simplest solution that still fits the architecture
- optimize for readability and maintainability, not cleverness

## 10. Suggested feature flow

For a typical feature such as expense creation:

1. Build the screen with Angular standalone components.
2. Use Reactive Forms for field modeling and validation.
3. Use signals for local interaction state.
4. Use NgRx if the feature state must be shared, cached, or coordinated across multiple screens.
5. Call a .NET API endpoint.
6. Let the backend service enforce business rules and persist data in Cosmos DB.
7. Store uploaded files in Azure Storage and save their metadata in Cosmos DB.
8. Use Azure Functions only if background processing is needed after the main transaction.

## 11. Related documents

- `FUNCTIONAL_DOCUMENTATION.md`
- `UX_GUIDELINES.md`

Developers should read those documents together with this one before implementing major features.
