using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using NSubstitute;
using Xunit;
using VoyageVoyage.Server.Authentication;

namespace VoyageVoyage.Server.Tests.Authentication;

public class AppServiceCurrentUserServiceTests
{
    private static AppServiceCurrentUserService CreateService(ClaimsPrincipal? user)
    {
        var httpContext = Substitute.For<HttpContext>();
        httpContext.User.Returns(user ?? new ClaimsPrincipal());

        var accessor = Substitute.For<IHttpContextAccessor>();
        accessor.HttpContext.Returns(httpContext);

        var logger = Substitute.For<ILogger<AppServiceCurrentUserService>>();

        return new AppServiceCurrentUserService(accessor, logger);
    }

    private static ClaimsPrincipal AuthenticatedPrincipal(params Claim[] claims)
    {
        var identity = new ClaimsIdentity(claims, "TestScheme");
        return new ClaimsPrincipal(identity);
    }

    // --- JWT standard claims (sub / email) ---

    [Fact]
    public void GetCurrentUser_WithJwtSubClaim_ReturnsUser()
    {
        var principal = AuthenticatedPrincipal(
            new Claim("sub", "jwt-user-id"),
            new Claim("name", "JWT User"),
            new Claim("email", "jwt@example.com"));

        var service = CreateService(principal);
        var result = service.GetCurrentUser();

        Assert.NotNull(result);
        Assert.Equal("jwt-user-id", result.Id);
        Assert.Equal("JWT User", result.Name);
        Assert.Equal("jwt@example.com", result.Email);
    }

    [Fact]
    public void GetCurrentUser_WithJwtEmailClaim_ResolvesEmail()
    {
        var principal = AuthenticatedPrincipal(
            new Claim("sub", "jwt-user-id"),
            new Claim("email", "jwt-email@example.com"));

        var service = CreateService(principal);
        var result = service.GetCurrentUser();

        Assert.NotNull(result);
        Assert.Equal("jwt-email@example.com", result.Email);
    }

    // --- Azure AD OID claim ---

    [Fact]
    public void GetCurrentUser_WithAzureAdOidClaim_ReturnsUser()
    {
        var principal = AuthenticatedPrincipal(
            new Claim("http://schemas.microsoft.com/identity/claims/objectidentifier", "oid-user-id"),
            new Claim("name", "OID User"),
            new Claim("preferred_username", "oid@example.com"));

        var service = CreateService(principal);
        var result = service.GetCurrentUser();

        Assert.NotNull(result);
        Assert.Equal("oid-user-id", result.Id);
        Assert.Equal("OID User", result.Name);
        Assert.Equal("oid@example.com", result.Email);
    }

    // --- .NET ClaimTypes ---

    [Fact]
    public void GetCurrentUser_WithDotNetClaimTypes_ReturnsUser()
    {
        var principal = AuthenticatedPrincipal(
            new Claim(ClaimTypes.NameIdentifier, "dotnet-user-id"),
            new Claim(ClaimTypes.Name, "DotNet User"),
            new Claim(ClaimTypes.Email, "dotnet@example.com"));

        var service = CreateService(principal);
        var result = service.GetCurrentUser();

        Assert.NotNull(result);
        Assert.Equal("dotnet-user-id", result.Id);
        Assert.Equal("DotNet User", result.Name);
        Assert.Equal("dotnet@example.com", result.Email);
    }

    // --- Claim priority ---

    [Fact]
    public void GetCurrentUser_OidTakesPriorityOverNameIdentifier()
    {
        var principal = AuthenticatedPrincipal(
            new Claim("http://schemas.microsoft.com/identity/claims/objectidentifier", "oid-id"),
            new Claim(ClaimTypes.NameIdentifier, "nameidentifier-id"));

        var service = CreateService(principal);
        var result = service.GetCurrentUser();

        Assert.NotNull(result);
        Assert.Equal("oid-id", result.Id);
    }

    [Fact]
    public void GetCurrentUser_NameIdentifierTakesPriorityOverSub()
    {
        var principal = AuthenticatedPrincipal(
            new Claim(ClaimTypes.NameIdentifier, "nameidentifier-id"),
            new Claim("sub", "sub-id"));

        var service = CreateService(principal);
        var result = service.GetCurrentUser();

        Assert.NotNull(result);
        Assert.Equal("nameidentifier-id", result.Id);
    }

    [Fact]
    public void GetCurrentUser_PreferredUsernameTakesPriorityOverEmail()
    {
        var principal = AuthenticatedPrincipal(
            new Claim("sub", "user-id"),
            new Claim("preferred_username", "preferred@example.com"),
            new Claim("email", "email@example.com"));

        var service = CreateService(principal);
        var result = service.GetCurrentUser();

        Assert.NotNull(result);
        Assert.Equal("preferred@example.com", result.Email);
    }

    // --- Missing / null scenarios ---

    [Fact]
    public void GetCurrentUser_WhenNotAuthenticated_ReturnsNull()
    {
        var identity = new ClaimsIdentity(); // no authentication type = not authenticated
        var principal = new ClaimsPrincipal(identity);

        var service = CreateService(principal);
        var result = service.GetCurrentUser();

        Assert.Null(result);
    }

    [Fact]
    public void GetCurrentUser_WhenNoIdClaim_ReturnsNull()
    {
        var principal = AuthenticatedPrincipal(
            new Claim("name", "No ID User"));

        var service = CreateService(principal);
        var result = service.GetCurrentUser();

        Assert.Null(result);
    }

    [Fact]
    public void GetCurrentUser_WhenHttpContextIsNull_ReturnsNull()
    {
        var accessor = Substitute.For<IHttpContextAccessor>();
        accessor.HttpContext.Returns((HttpContext?)null);

        var logger = Substitute.For<ILogger<AppServiceCurrentUserService>>();
        var service = new AppServiceCurrentUserService(accessor, logger);

        var result = service.GetCurrentUser();

        Assert.Null(result);
    }

    [Fact]
    public void GetCurrentUser_WhenNameAndEmailMissing_ReturnsUserWithEmptyStrings()
    {
        var principal = AuthenticatedPrincipal(
            new Claim("sub", "jwt-user-id"));

        var service = CreateService(principal);
        var result = service.GetCurrentUser();

        Assert.NotNull(result);
        Assert.Equal("jwt-user-id", result.Id);
        Assert.Equal(string.Empty, result.Name);
        Assert.Equal(string.Empty, result.Email);
    }
}
