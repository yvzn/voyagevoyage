namespace VoyageVoyage.Server.Authentication;

/// <summary>
/// Provides access to the identity of the user making the current request.
/// Implementations differ between production (App Service Easy Auth) and local development (mock).
/// </summary>
public interface ICurrentUserService
{
    /// <summary>
    /// Returns the current user, or null if no authenticated user is available.
    /// </summary>
    CurrentUser? GetCurrentUser();
}
