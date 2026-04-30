namespace VoyageVoyage.Server.Authentication;

/// <summary>
/// Returns a hardcoded mock user for local development.
/// This implementation is registered only when the application runs in Development mode,
/// so developers can exercise authenticated code paths without an Azure App Service context.
/// </summary>
public class MockCurrentUserService : ICurrentUserService
{
    public CurrentUser? GetCurrentUser()
        => new CurrentUser(
            Id: "dev-user-id",
            Name: "Developer User",
            Email: "dev@localhost"
        );
}
