# VoyageVoyage

A travel and expense management assistant for recurring professional trips. It streamlines the full workflow from trip planning and calendar visibility to receipt collection, expense declaration, and fiscal calculations.

## Stack

| Layer | Technology |
|---|---|
| Front end | Angular 21, Tailwind CSS, Flowbite, NgRx, ngx-translate |
| Backend | ASP.NET Core Web API (.NET 10) |
| Background jobs | Azure Functions isolated worker (.NET 10, Functions v4) |
| Storage | Azure Cosmos DB (metadata) + Azure Storage (files/receipts) |
| Orchestration | .NET Aspire (TypeScript AppHost) |

## Project structure

```
front/      Angular application
server/     ASP.NET Core Web API
batch/      Azure Functions
apphost/    Aspire orchestration entry point
docs/       Functional and technical documentation
```

## Prerequisites

- [Node.js](https://nodejs.org/) 20.19 / 22.13 or later
- [.NET 10 SDK](https://dotnet.microsoft.com/download)
- [Aspire CLI](https://aspire.dev) (`aspire` command available on PATH)
- Azure Functions Core Tools (for running `batch/` locally)
- Azure Storage emulator (e.g. Azurite) configured with `UseDevelopmentStorage=true`
- Azure Cosmos DB emulator running locally (default endpoint: `https://localhost:8081/` with master key)
- Optional: Docker or Rancher Desktop (for running both Cosmos DB and Storage emulators)

## Build & run

### Aspire orchestration (recommended — requires Docker/Rancher for emulators)

```bash
cd apphost
aspire run
```

The front end is served at `http://localhost:4200` and the API at the port configured by Aspire.

### Individual subprojects

**Frontend**

```bash
cd front
npm ci
npm run build   # production build
npm start       # dev server on http://localhost:4200
```

**Backend**

Ensure the Cosmos DB emulator is running before starting the server, as it depends on it for data storage.

```bash
cd server/VoyageVoyage.Server
dotnet restore
dotnet build -c Release
dotnet run
```

**Batch (Azure Functions)**

Ensure the Azure Storage emulator and Cosmos DB emulator are running before starting the functions, as they depend on them for storage and data.

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
- [Azure App Service deployment](docs/DEPLOYMENT_AZURE_APP_SERVICE.md)
