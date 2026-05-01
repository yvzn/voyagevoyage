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
- `ngx-translate` (i18n and runtime localisation)

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

`ngx-translate` (`@ngx-translate/core` and `@ngx-translate/http-loader`) is the mandatory library for all internationalisation and localisation needs.

Why:
- it enables runtime language switching without page reload or separate locale builds
- it integrates cleanly with Angular's standalone component model
- it loads translation files as plain JSON assets at runtime via `HttpClient`
- it avoids the build-time complexity and multi-bundle deployment model of `@angular/localize`

Mandatory rules:
- every user-facing string must be externalised to a translation file — no hardcoded visible text in templates or components
- use the `translate` pipe in templates for all user-facing strings
- for translated attribute values, use the pipe in a binding expression: `[attr.aria-label]="'key' | translate"`
- dates, numbers, currencies, and percentages must be formatted using JavaScript's `Intl` APIs (`Intl.DateTimeFormat`, `Intl.NumberFormat`), passing the active locale from `LocaleService.currentLocale()`
- translation files are maintained as JSON assets under `front/public/i18n/`
- `TranslatePipe` must be explicitly imported in every standalone component that uses it
- `TranslateModule.forRoot(...)` is configured once in `app.config.ts` with `TranslateHttpLoader` pointing to `/i18n/{lang}.json`
- in tests, use `TranslateModule.forRoot()` and load translations via `TranslateService.setTranslation()` in `beforeEach`

Expected usage in templates:
```html
<!-- static label -->
<span>{{ 'trip.title' | translate }}</span>

<!-- translated attribute -->
<button [attr.aria-label]="'actions.close' | translate">...</button>
```

Expected usage in TypeScript (component class):
```typescript
// inject TranslateService for programmatic translation
private readonly translate = inject(TranslateService);
const message = this.translate.instant('validation.required');
```

Adding a new translation:
1. Add the key/value pair to `front/public/i18n/en.json`
2. Add the translated value to every other locale file (e.g., `fr.json`)
3. Use the key in the template or component

Practical checklist:
- verify all locale JSON files have the same set of keys before merging UI changes
- do not merge UI changes that introduce untranslated or hardcoded strings
- `LocaleService.setLocale(locale)` is the single entry point for language switching; it calls `TranslateService.use(locale)` and updates the reactive `currentLocale` signal used for `Intl` formatting

## 5. Back-end stack

### 5.0 Full-stack implementation requirement

Every product feature must be implemented end-to-end — both the front end (Angular component, service, i18n) **and** the back end (controller, service, database access).

Practical rules:
- do not ship front-end features backed only by mock or static data
- do not ship back-end endpoints without a matching Angular service that calls them
- use the actual persistence layer (Cosmos DB) from day one; the emulator is available for local development
- in-memory or mock service implementations are not acceptable as a substitute for real persistence in any environment

### 5.1 .NET Web API

The backend is built as a .NET Web API.

The API is responsible for:
- exposing HTTP endpoints to the Angular application
- enforcing business rules
- coordinating data persistence
- handling file-related workflows through Azure Storage
- returning stable contract shapes to the front end

Routing rule for SPA hosting:
- API routes must start with `/api` so non-API routes can be safely handled by the Angular SPA fallback (`index.html`) without conflicts.

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

#### EF Core as the data access layer

EF Core with the Cosmos DB provider (`Microsoft.EntityFrameworkCore.Cosmos`) is used as the data access layer.

Practical rules:
- access data through `ApplicationDbContext` (`DbSet<T>` per entity)
- entity types are mapped in `OnModelCreating` with explicit container names and partition keys
- partition keys must always be used in queries (add `.Where(e => e.PartitionKey == value)` before querying)
- user-owned data uses `UserId` as the partition key; always filter by the current user from `ICurrentUserService`

#### Local development

Use the [Azure Cosmos DB Emulator](https://aka.ms/cosmosemulator) for local development.
The default emulator connection string is pre-configured in `appsettings.Development.json`.

For production, set the `ConnectionStrings__CosmosDb` environment variable (or equivalent App Service configuration) to the actual account connection string.

#### No in-memory or mock data stores

All service implementations must use the actual persistence layer (Cosmos DB).
In-memory or mock service implementations are not acceptable for features — use the emulator for local development instead.


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

### 5.5 Authentication and authorization (App Service Easy Auth)

Authentication is handled at the Azure App Service platform level using **Easy Auth** backed by **Microsoft Entra** (formerly Azure Active Directory).

#### How it works in production

1. Azure App Service intercepts every inbound request and validates the user's identity against Microsoft Entra before forwarding the request to the API.
2. After successful authentication, App Service injects identity headers (e.g. `X-MS-CLIENT-PRINCIPAL`, `X-MS-CLIENT-PRINCIPAL-ID`, `X-MS-CLIENT-PRINCIPAL-NAME`) into the forwarded request.
3. The ASP.NET Core API uses `Microsoft.Identity.Web` (`AddAppServicesAuthentication()`) to read these injected headers and populate `HttpContext.User` with the authenticated claims.

This means the API does **not** perform token validation itself — it trusts App Service to have already authenticated the request.

#### `ICurrentUserService` abstraction

The `ICurrentUserService` interface (under `VoyageVoyage.Server.Authentication`) is the single access point for obtaining the current user's identity from within the application.

| Environment | Implementation | Behavior |
|---|---|---|
| Production | `AppServiceCurrentUserService` | Reads claims from `HttpContext.User` populated by `AddAppServicesAuthentication()` |
| Development | `MockCurrentUserService` | Returns a hardcoded `dev@localhost` user identity |

Controllers and services that need the current user should inject `ICurrentUserService` rather than reading `HttpContext.User` directly.

#### Development mode (local)

When running locally, no Azure App Service context exists. The application registers a different set of services:

- `MockAuthHandler` — an ASP.NET Core `AuthenticationHandler` that always authenticates a hardcoded mock user and populates `HttpContext.User`, so code paths that read the claims principal work correctly in development.
- `MockCurrentUserService` — returns the same hardcoded user via `ICurrentUserService`.

No Azure credentials or App Service configuration are required to run locally.

#### Middleware registration

Both `UseAuthentication()` and `UseAuthorization()` are added to the middleware pipeline in all environments. The registration order follows ASP.NET Core conventions: after static files and before `MapControllers()`.

#### Adding authorization to a new endpoint

To require authentication on a new controller or action:

```csharp
[Authorize]
[ApiController]
[Route("api/[controller]")]
public class MyController(ICurrentUserService currentUserService) : ControllerBase
{
    [HttpGet]
    public IActionResult Get()
    {
        var user = currentUserService.GetCurrentUser();
        // ...
    }
}
```

Existing endpoints without `[Authorize]` remain accessible without authentication (no breaking change).

#### Platform setup checklist (Azure)

See `DEPLOYMENT_AZURE_APP_SERVICE.md` for the full Easy Auth platform configuration steps.

## 5.6 Observability

### Application Insights

The server integrates with Azure Application Insights via `Microsoft.ApplicationInsights.AspNetCore`.

Registration in `Program.cs`:

```csharp
builder.Services.AddApplicationInsightsTelemetry();
```

The SDK reads the connection string from configuration in order of priority:

1. `ApplicationInsights:ConnectionString` in `appsettings.json` / environment-specific files.
2. The `APPLICATIONINSIGHTS_CONNECTION_STRING` environment variable — the recommended production/staging wiring on Azure App Service. No extra code is required.

When no connection string is configured (e.g. local development), the SDK operates as a graceful no-op: the application starts and runs normally, no telemetry is emitted, and no errors are thrown.

**Do not commit real connection strings to source control.** The `appsettings.json` placeholder is intentionally empty. Set the real value via Azure App Service application settings or a Key Vault reference.

### HTTP Request/Response Logging Middleware

An opt-in middleware logs full HTTP request and response detail (headers + body) using the built-in `Microsoft.AspNetCore.HttpLogging` package. It is **off by default** and must never be enabled in production unless deliberately configured.

#### Configuration

Add or update the `HttpLogging` section in the applicable `appsettings` file:

```json
"HttpLogging": {
  "Enabled": true,
  "LogRequestHeaders": true,
  "LogResponseHeaders": true,
  "LogRequestBody": true,
  "LogResponseBody": true,
  "BodySizeLimit": 32768
}
```

Set `Enabled: false` (the default) to skip registering the middleware entirely.

Also ensure the log level is set to `Information` for the middleware logger:

```json
"Logging": {
  "LogLevel": {
    "Microsoft.AspNetCore.HttpLogging.HttpLoggingMiddleware": "Information"
  }
}
```

#### Sensitive header redaction

When the middleware is active, the following headers are always redacted from logs:

- `Authorization`
- `Cookie` / `Set-Cookie`
- `X-MS-CLIENT-PRINCIPAL*` (App Service Easy Auth principal headers)

#### Implementation

- `Infrastructure/HttpLoggingOptions.cs` — binds the `HttpLogging` configuration section.
- `Program.cs` — conditionally calls `AddHttpLogging()` and `UseHttpLogging()` based on the `Enabled` flag.

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
