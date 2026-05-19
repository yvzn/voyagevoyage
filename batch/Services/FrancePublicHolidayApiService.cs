using batch.Models;
using System.Net.Http.Json;
using Microsoft.Extensions.Logging;

namespace batch.Services;

/// <summary>
/// Fetches public holidays for France (zone métropole) from the official French government API:
/// https://calendrier.api.gouv.fr/jours-feries/metropole.json
/// </summary>
public class FrancePublicHolidayApiService(HttpClient httpClient, ILogger<FrancePublicHolidayApiService> logger)
{
    public const string Region = "france-metropole";

    private const string ApiUrl = "https://calendrier.api.gouv.fr/jours-feries/metropole.json";

    /// <summary>
    /// Fetches all available public holidays for France métropole.
    /// Returns a list of <see cref="PublicHoliday"/> with <see cref="PublicHoliday.SystemUserId"/> as owner.
    /// </summary>
    public async Task<List<PublicHoliday>> FetchAsync(CancellationToken cancellationToken = default)
    {
        logger.LogInformation("Fetching France métropole public holidays from {Url}", ApiUrl);

        var response = await httpClient.GetAsync(ApiUrl, cancellationToken);
        response.EnsureSuccessStatusCode();

        // The API returns a flat JSON object: { "YYYY-MM-DD": "Holiday name", ... }
        var data = await response.Content.ReadFromJsonAsync<Dictionary<string, string>>(cancellationToken: cancellationToken)
            ?? throw new InvalidOperationException("Empty response from public holiday API.");

        var holidays = new List<PublicHoliday>(data.Count);
        foreach (var entry in data)
        {
            var dateStr = entry.Key;
            var name = entry.Value;
            if (!DateOnly.TryParseExact(dateStr, "yyyy-MM-dd", out var date))
            {
                logger.LogWarning("Could not parse holiday date '{Date}', skipping.", dateStr);
                continue;
            }

            holidays.Add(new PublicHoliday
            {
                Id = $"{Region}-{dateStr}",
                UserId = PublicHoliday.SystemUserId,
                Date = date,
                Name = name,
                Region = Region,
            });
        }

        logger.LogInformation("Fetched {Count} public holidays for region '{Region}'.", holidays.Count, Region);
        return holidays;
    }
}
