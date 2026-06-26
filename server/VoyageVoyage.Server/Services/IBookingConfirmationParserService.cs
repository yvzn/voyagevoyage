using VoyageVoyage.Server.Models;

namespace VoyageVoyage.Server.Services;

/// <summary>
/// Parses a booking confirmation file (.ics or PDF) into structured data.
/// Does not persist anything — returns a transient result for user review.
/// </summary>
public interface IBookingConfirmationParserService
{
    /// <summary>
    /// Parses the given file stream and returns extracted booking data.
    /// Returns an empty <see cref="ParsedBookingConfirmation"/> if parsing fails or fields are unrecognised.
    /// </summary>
    Task<ParsedBookingConfirmation> ParseAsync(Stream content, string contentType, string fileName);
}
