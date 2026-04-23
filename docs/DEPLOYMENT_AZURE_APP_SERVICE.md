# Azure App Service deployment

This project is configured for Azure DevOps deployment with `azure-pipelines.yml`.

## Pipeline overview

The pipeline has two stages:

1. **CI**
   - Builds the Angular front end (`front/`)
   - Copies production files to `server/VoyageVoyage.Server/wwwroot` (replacing the placeholder `index.html`)
   - Publishes the ASP.NET Core server application as the deployable artifact
2. **CD**
   - Runs on `main` after a successful CI stage
   - Deploys the published artifact to an existing Azure App Service

## Required pipeline variables

Configure Azure DevOps Library variable group `voyagevoyage-deployment` before enabling deployment:

- `azureServiceConnection`: service connection name that can deploy to the target App Service
- `appServiceName`: existing Azure App Service name

The pipeline also exposes `appServiceType` in YAML (default: `webAppLinux`) so the target App Service type is configurable.

## Deployment behavior

- The API and static front-end files are deployed together as one ASP.NET Core app.
- CI copies the single production front-end build folder into `server/VoyageVoyage.Server/wwwroot`.
- Any server route not matched by API controllers falls back to `wwwroot/index.html`, enabling Angular SPA routing.
- Keep all API endpoints under `/api` to avoid collisions with front-end client routes.
