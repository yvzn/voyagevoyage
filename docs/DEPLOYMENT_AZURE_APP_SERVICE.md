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

## Authentication setup (App Service Easy Auth)

The API uses **Azure App Service Easy Auth** backed by **Microsoft Entra** for user authentication. Easy Auth is configured at the platform level and does not require changes to the deployed application artifact.

### Enabling Easy Auth on the App Service

1. In the Azure Portal, open the App Service resource.
2. Go to **Settings → Authentication**.
3. Click **Add identity provider**.
4. Select **Microsoft** (Microsoft Entra).
5. Choose your Microsoft Entra tenant and configure a new or existing app registration:
   - **Supported account types**: choose the scope appropriate for your organization (typically "Current tenant – Single tenant").
   - Leave **Restrict access** set to **Require authentication**.
   - Set **Unauthenticated requests** to **HTTP 401 Unauthorized** (for an API-only surface) or **HTTP 302 Redirect** if the App Service also serves the front end.
6. Save the configuration.

After enabling, App Service will validate every inbound request against Microsoft Entra and inject the following headers before forwarding the request to the API:

| Header | Content |
|---|---|
| `X-MS-CLIENT-PRINCIPAL-ID` | Object ID (OID) of the authenticated user |
| `X-MS-CLIENT-PRINCIPAL-NAME` | Display name or UPN of the user |
| `X-MS-CLIENT-PRINCIPAL` | Base64-encoded JSON of all claims |

The ASP.NET Core application reads these headers via `Microsoft.Identity.Web` (`AddAppServicesAuthentication()`), which populates `HttpContext.User` with the authenticated claims. No additional app settings are required.

### No additional app settings required

`AddAppServicesAuthentication()` reads the headers injected by App Service directly. No `AzureAd` section in `appsettings.json` or environment variables is needed for this flow.

### App registration notes

- The app registration created during Easy Auth setup must have the App Service URL as a **Redirect URI** (type: Web, value: `https://<your-app>.azurewebsites.net/.auth/login/aad/callback`).
- Add any required API scopes or role assignments in the app registration as needed by future authorization requirements.

## Local development

When running locally (`ASPNETCORE_ENVIRONMENT=Development`), Easy Auth is not available. The application automatically substitutes:

- `MockAuthHandler` — populates `HttpContext.User` with a hardcoded mock identity.
- `MockCurrentUserService` — returns the same mock user via `ICurrentUserService`.

No Azure credentials or App Service configuration are needed to run locally. Set the environment variable or use the default `launchSettings.json`:

```json
"ASPNETCORE_ENVIRONMENT": "Development"
```

See `TECH_STACK.md` section 5.5 for the full authentication architecture and implementation details.
