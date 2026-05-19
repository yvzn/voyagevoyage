using batch.Models;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.Extensions.Logging;

namespace batch.Services;

/// <summary>
/// Fetches school holidays for France (zones A, B, C) from the official French Ministry of
/// Education open-data API:
/// https://data.education.gouv.fr/api/explore/v2.1/catalog/datasets/fr-en-calendrier-scolaire/records
/// </summary>
public class FranceSchoolHolidayApiService(HttpClient httpClient, ILogger<FranceSchoolHolidayApiService> logger)
{
    public static readonly string[] Zones = ["Zone A", "Zone B", "Zone C"];

    private const string BaseUrl =
        "https://data.education.gouv.fr/api/explore/v2.1/catalog/datasets/fr-en-calendrier-scolaire/records";

    private const int PageSize = 100;

    /// <summary>
    /// Fetches school holiday periods for all three zones (A, B, C) starting from the current year.
    /// Returns a flat list of <see cref="SchoolHoliday"/> with <see cref="SchoolHoliday.SystemUserId"/> as owner.
    /// </summary>
    public async Task<List<SchoolHoliday>> FetchAllZonesAsync(CancellationToken cancellationToken = default)
    {
        var result = new List<SchoolHoliday>();
        foreach (var zone in Zones)
        {
            var holidays = await FetchZoneAsync(zone, cancellationToken);
            result.AddRange(holidays);
        }
        return result;
    }

    /// <summary>
    /// Fetches school holiday periods for a specific zone starting from the current year.
    /// </summary>
    public async Task<List<SchoolHoliday>> FetchZoneAsync(string zone, CancellationToken cancellationToken = default)
    {
        var currentYear = DateTime.UtcNow.Year;
        var zoneEncoded = Uri.EscapeDataString($"\"{zone}\"");
        var dateFilter = Uri.EscapeDataString($"date'{currentYear}'");
        var where = Uri.EscapeDataString($"zones={zoneEncoded} AND start_date > date'{currentYear}'");

        var url = $"{BaseUrl}?where={where}&limit={PageSize}&offset=0";

        logger.LogInformation("Fetching school holidays for {Zone} from {Url}", zone, url);

        var response = await httpClient.GetAsync(url, cancellationToken);
        response.EnsureSuccessStatusCode();

        var data = await response.Content.ReadFromJsonAsync<ApiResponse>(
            new JsonSerializerOptions { PropertyNameCaseInsensitive = true },
            cancellationToken: cancellationToken)
            ?? throw new InvalidOperationException("Empty response from school holiday API.");

        var holidays = new List<SchoolHoliday>(data.Results?.Count ?? 0);
        foreach (var record in data.Results ?? [])
        {
            if (string.IsNullOrWhiteSpace(record.Description)
                || string.IsNullOrWhiteSpace(record.StartDate)
                || string.IsNullOrWhiteSpace(record.EndDate))
            {
                logger.LogWarning("Skipping incomplete school holiday record: {Record}.", record.Description);
                continue;
            }

            if (!TryParseApiDate(record.StartDate, out var startDate))
            {
                logger.LogWarning("Could not parse school holiday start date '{Date}', skipping.", record.StartDate);
                continue;
            }

            if (!TryParseApiDate(record.EndDate, out var endDate))
            {
                logger.LogWarning("Could not parse school holiday end date '{Date}', skipping.", record.EndDate);
                continue;
            }

            var zoneSlug = zone.Replace(" ", "-").ToLowerInvariant();
            var id = $"school-{zoneSlug}-{record.StartDate[..10]}";

            holidays.Add(new SchoolHoliday
            {
                Id = id,
                UserId = SchoolHoliday.SystemUserId,
                StartDate = startDate,
                EndDate = endDate,
                Name = record.Description,
                Zone = zone,
            });
        }

        logger.LogInformation("Fetched {Count} school holidays for zone '{Zone}'.", holidays.Count, zone);
        return holidays;
    }

    /// <summary>
    /// Parses an API date string (ISO 8601 with offset, e.g. "2025-10-18T00:00:00+00:00") into a <see cref="DateOnly"/>.
    /// </summary>
    private static bool TryParseApiDate(string value, out DateOnly result)
    {
        result = default;
        // Take only the date part (first 10 characters: YYYY-MM-DD)
        if (value.Length >= 10 && DateOnly.TryParseExact(value[..10], "yyyy-MM-dd", out result))
            return true;
        return false;
    }

    private sealed class ApiResponse
    {
        [JsonPropertyName("total_count")]
        public int TotalCount { get; set; }

        [JsonPropertyName("results")]
        public List<ApiRecord>? Results { get; set; }
    }

    private sealed class ApiRecord
    {
        [JsonPropertyName("description")]
        public string? Description { get; set; }

        [JsonPropertyName("start_date")]
        public string? StartDate { get; set; }

        [JsonPropertyName("end_date")]
        public string? EndDate { get; set; }

        [JsonPropertyName("zones")]
        public string? Zones { get; set; }
    }
}
