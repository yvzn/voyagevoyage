# Copilot Cloud Agent Onboarding - VoyageVoyage

## Repo layout and ownership

- `front/`: Angular 21 application (UI).
- `server/`: ASP.NET Core Web API (`net10.0`).
- `batch/`: Azure Functions isolated worker (`net10.0`, Functions v4).
- `docs/`: product constraints. Read before non-trivial changes:
  - `docs/FUNCTIONAL_DOCUMENTATION.md`
  - `docs/UX_GUIDELINES.md`
  - `docs/TECH_STACK.md`

Do not assume this is a monorepo with one root build command. Build and test each part from its own folder.

## First-read requirements for agents

Before implementing features, align with these project rules from docs:

- Follow incremental product scope (batches 1-6) and preserve existing behavior in completed batches.
- Accessibility is mandatory: target WCAG 2.2 AA minimum (AAA when feasible), semantic HTML first, full keyboard support, visible focus.
- All user-facing strings must be internationalized (no hardcoded visible text in templates/components).
- Prefer Angular + Tailwind + Flowbite existing patterns over custom UI patterns.
- Keep UX simple and explicit: clear labels, explicit loading/success/error states, actionable validation messages.

## Tech constraints to preserve

### Frontend (`front/`)

- Angular 21 standalone component style.
- Use Reactive Forms for business forms and non-trivial validation.
- Use NgRx for shared/business-crossing state; use signals for local UI state.
- Prefer modern Angular template control flow blocks.
- Avoid large multipurpose components.

### Backend (`server/`)

- Keep controllers/endpoints thin; business logic belongs in services.
- Preserve clear request validation and stable response contracts.
- Data model intent is Cosmos DB + Azure Storage split (metadata in DB, binaries in storage).

### Batch (`batch/`)

- Keep function entry points thin; orchestration/logic should be in reusable services.
- Ensure logging and failure handling are explicit for background jobs.

## Reliable local commands (use these to avoid failures)

Run from repository root unless noted.

### Frontend

```bash
cd front
npm ci
npm run build
npm test
```

Notes:
- `packageManager` is `npm@11.10.1`; keep npm usage consistent.
- Prefer `npm ci` in automation/reproducible runs.

### Backend

```bash
cd server/VoyageVoyage.Server
dotnet restore
dotnet build -c Release
dotnet run
```

### Batch

```bash
cd batch
dotnet restore
dotnet build -c Release
```

For local function execution, ensure Azure Functions Core Tools are available, then run from `batch/`:

```bash
func start
```

`batch/local.settings.json` expects local storage emulator (`UseDevelopmentStorage=true`).

## PR safety checklist (before opening/updating a PR)

1. Scope changes to the relevant subproject (`front`, `server`, or `batch`) and avoid unrelated refactors.
2. Build/test the touched subproject(s) with the commands above.
3. For UI changes, verify:
	- keyboard-only navigation works,
	- semantic structure is preserved,
	- status/validation messages are explicit,
	- no hardcoded user-facing strings.
4. For API/batch changes, verify:
	- thin endpoints/triggers,
	- business logic in services,
	- no breaking contract changes unless intentionally coordinated.
5. Update docs when behavior or rules change (`docs/FUNCTIONAL_DOCUMENTATION.md` and/or `docs/UX_GUIDELINES.md`).

## Common pitfalls to avoid

- Running Node or .NET commands from repo root and assuming one unified pipeline.
- Adding custom CSS/components where Tailwind/Flowbite patterns already solve the need.
- Putting business logic directly in Angular templates/components or API endpoints.
- Shipping UI without explicit loading/error/empty states.
- Introducing non-internationalized visible strings.
- Using `i18n` attributes or `$localize` — the project uses `ngx-translate` (`TranslatePipe` + JSON assets in `public/i18n/`), not `@angular/localize`.
- Forgetting to import `TranslatePipe` in standalone components that use `{{ 'key' | translate }}`.
- Adding translation keys to templates without adding matching entries in all locale JSON files (`en.json`, `fr.json`).

## When uncertain

- Prefer small, reviewable PRs.
- Keep architectural direction from `docs/TECH_STACK.md`.
- Ask for clarification rather than guessing fiscal/business rules.
