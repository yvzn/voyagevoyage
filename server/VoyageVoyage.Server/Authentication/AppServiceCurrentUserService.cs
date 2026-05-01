using System.Security.Claims;
using Microsoft.Extensions.Logging;

namespace VoyageVoyage.Server.Authentication;

/// <summary>
/// Resolves the current user from the claims populated by App Service Easy Auth
/// (Microsoft Entra via <c>AddAppServicesAuthentication()</c>).
/// App Service injects authentication headers before the request reaches the API;
/// Microsoft.Identity.Web reads those headers and populates <see cref="HttpContext.User"/>.
/// </summary>
public class AppServiceCurrentUserService(
    IHttpContextAccessor httpContextAccessor,
    ILogger<AppServiceCurrentUserService> logger) : ICurrentUserService
{
    public CurrentUser? GetCurrentUser()
    {
        var user = httpContextAccessor.HttpContext?.User;

        logger.LogInformation("GetCurrentUser: IsAuthenticated={IsAuthenticated}", user?.Identity?.IsAuthenticated);

        var claimTypes = string.Join(", ", user?.Claims.Select(c => c.Type) ?? []);
        logger.LogInformation("GetCurrentUser: available claim types: {ClaimTypes}", claimTypes);

        // Log full claim values (including PII) only at Debug level for targeted diagnostics
        if (logger.IsEnabled(LogLevel.Debug))
        {
            var allClaims = user?.Claims.Select(c => $"{c.Type}={c.Value}").ToList() ?? [];
            logger.LogDebug("GetCurrentUser: available claims: {Claims}", string.Join(", ", allClaims));
        }

        if (user?.Identity?.IsAuthenticated != true)
            return null;

        var id = user.FindFirstValue("http://schemas.microsoft.com/identity/claims/objectidentifier")
            ?? user.FindFirstValue(ClaimTypes.NameIdentifier);

        logger.LogInformation("GetCurrentUser: id claim resolved={IdResolved}", !string.IsNullOrEmpty(id));

        if (string.IsNullOrEmpty(id))
            return null;

        var name = user.FindFirstValue("name")
            ?? user.FindFirstValue(ClaimTypes.Name)
            ?? string.Empty;

        var email = user.FindFirstValue("preferred_username")
            ?? user.FindFirstValue(ClaimTypes.Email)
            ?? string.Empty;

        return new CurrentUser(id, name, email);
    }
}
