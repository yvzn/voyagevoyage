using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VoyageVoyage.Server.Authentication;

namespace VoyageVoyage.Server.Controllers;

/// <summary>
/// Provides information about the authenticated user.
///
/// Note: this endpoint is stateful — it relies on the request context (App Service Easy Auth
/// headers in production, or the dev mock scheme locally) to resolve the caller's identity.
/// It is not a stateless resource endpoint.
/// </summary>
[Authorize]
[ApiController]
[Route("api/users")]
public class UsersController(ICurrentUserService currentUserService) : ControllerBase
{
    /// <summary>
    /// Returns the identity of the currently authenticated user.
    /// </summary>
    /// <remarks>
    /// Stateful: the response reflects the caller's identity for this specific request.
    /// The result must not be cached across different users or requests.
    /// </remarks>
    [HttpGet("me")]
    public ActionResult<CurrentUser> GetMe()
    {
        var user = currentUserService.GetCurrentUser();

        if (user is null)
            return Problem("Authenticated user identity could not be resolved.", statusCode: StatusCodes.Status500InternalServerError);

        return Ok(user);
    }
}
