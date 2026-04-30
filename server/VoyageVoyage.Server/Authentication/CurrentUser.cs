namespace VoyageVoyage.Server.Authentication;

/// <summary>
/// Represents the authenticated user identity resolved from the current request.
/// </summary>
public record CurrentUser(string Id, string Name, string Email);
