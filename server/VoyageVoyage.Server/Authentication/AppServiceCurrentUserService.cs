using System.Security.Claims;

namespace VoyageVoyage.Server.Authentication;

/// <summary>
/// Resolves the current user from the claims populated by App Service Easy Auth
/// (Microsoft Entra via <c>AddAppServicesAuthentication()</c>).
/// App Service injects authentication headers before the request reaches the API;
/// Microsoft.Identity.Web reads those headers and populates <see cref="HttpContext.User"/>.
/// </summary>
public class AppServiceCurrentUserService(IHttpContextAccessor httpContextAccessor) : ICurrentUserService
{
    public CurrentUser? GetCurrentUser()
    {
        var user = httpContextAccessor.HttpContext?.User;

        if (user?.Identity?.IsAuthenticated != true)
            return null;

        var id = user.FindFirstValue("http://schemas.microsoft.com/identity/claims/objectidentifier")
            ?? user.FindFirstValue(ClaimTypes.NameIdentifier);

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
