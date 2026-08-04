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

## Documentation

- [Functional documentation](docs/FUNCTIONAL_DOCUMENTATION.md)
- [Tech stack & developer onboarding](docs/TECH_STACK.md)
- [UX guidelines & accessibility](docs/UX_GUIDELINES.md)
