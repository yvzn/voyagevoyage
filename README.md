# VoyageVoyage

A travel and expense management assistant for recurring professional trips. It streamlines the full workflow from trip planning and calendar visibility to receipt collection, expense declaration, and fiscal calculations.

## Stack

| Layer | Technology |
|---|---|
| Front end | Angular 22, Tailwind CSS, Flowbite, NgRx, ngx-translate |
| Backend | ASP.NET Core Web API (.NET 10) |
| Background jobs | Azure Functions isolated worker (.NET 10, Functions v4) |
| Storage | PostgreSQL (metadata) + Azure Storage (files/receipts) |

## Project structure

```
front/      Angular application
server/     ASP.NET Core Web API
batch/      Azure Functions
docs/       Functional and technical documentation
db/         Scripts and data for local database emulator / storage emulator
```

## Prerequisites

- [Node.js](https://nodejs.org/) 24 or later
- [.NET SDK](https://dotnet.microsoft.com/download) 10 or later
- A development PostgreSQL database
- Azure Functions Core Tools (for running `batch/` locally)
- Azure Storage emulator running locally (e.g. Azurite) configured with `UseDevelopmentStorage=true`

## Build & run

**Frontend**

```bash
cd front
npm ci
npm run build   # production build
npm start       # dev server on http://localhost:4200
```

**Backend**

Ensure the Azure Storage emulator and the PostgreSQL database are running before starting the server, as it depends on them for data storage.

```bash
cd server/VoyageVoyage.Server
dotnet restore
dotnet build -c Release
dotnet run
```

**Batch (Azure Functions)**

Ensure the Azure Storage emulator and the PostgreSQL database are running before starting the server, as it depends on them for data storage.

```bash
cd batch
dotnet restore
dotnet build -c Release
func start
```

The batch jobs are HTTP POST endpoints protected by Azure Functions keys:
`/api/DetectTripAnomalies`, `/api/ImportPublicHolidays`, and `/api/ImportSchoolHolidays`.
They no longer run automatically when the local host starts. Azure Functions Core Tools
disables key authorization locally by default.

Create an Azure DevOps pipeline from `azure-pipelines-batch-schedule.yml` on `main` and
authorize the `voyagevoyage-deployment` variable group. Set `functionAppUrl` to the
HTTPS base URL of the deployed function app and `functionAppKey` to a **secret** host
key that can invoke all three functions. Rotate the pipeline secret when the host key
changes. The pipeline invokes all three jobs at 00:00 UTC on the first of each month.
A manual run also invokes all three.
Scheduled runs must be enabled in Azure DevOps; deploying the function app alone does
not create the pipeline. Remove any UI-defined schedules, which override YAML schedules.
Coordinate enabling the pipeline with deployment to avoid missed or duplicate runs
during the transition. HTTP invocations do not have the timer trigger's singleton
lock, so avoid overlapping manual and scheduled runs.

Calls wait for completion and fail the pipeline on an HTTP error or timeout. Azure
Functions HTTP responses are subject to the platform's approximately 230-second
load-balancer timeout; a timed-out job may still be running, so check function logs
before manually retrying.

## Documentation

- [Functional documentation](docs/FUNCTIONAL_DOCUMENTATION.md)
- [Tech stack & developer onboarding](docs/TECH_STACK.md)
- [UX guidelines & accessibility](docs/UX_GUIDELINES.md)
