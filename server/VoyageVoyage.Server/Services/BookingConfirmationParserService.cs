using System.Text.RegularExpressions;
using UglyToad.PdfPig;
using VoyageVoyage.Server.Models;

namespace VoyageVoyage.Server.Services;

public partial class BookingConfirmationParserService : IBookingConfirmationParserService
{
    private static readonly HashSet<string> TrainKeywords = new(StringComparer.OrdinalIgnoreCase)
    {
        "train", "tgv", "ter", "intercités", "intercites", "thalys", "eurostar",
        "ouigo", "inOui", "inoui", "sncf", "trainline", "voyages-sncf",
    };

    private static readonly HashSet<string> HotelKeywords = new(StringComparer.OrdinalIgnoreCase)
    {
        "hotel", "hôtel", "chambre", "nuit", "booking", "accor", "novotel",
        "ibis", "mercure", "hilton", "marriott", "check-in", "check-out", "arrivée", "hébergement",
    };

    public Task<ParsedBookingConfirmation> ParseAsync(Stream content, string contentType, string fileName)
    {
        var result = contentType switch
        {
            "text/calendar" => ParseIcs(content),
            "application/pdf" => ParsePdf(content),
            _ when fileName.EndsWith(".ics", StringComparison.OrdinalIgnoreCase) => ParseIcs(content),
            _ when fileName.EndsWith(".pdf", StringComparison.OrdinalIgnoreCase) => ParsePdf(content),
            _ => new ParsedBookingConfirmation(),
        };

        return Task.FromResult(result);
    }

    // ── ICS parser ─────────────────────────────────────────────────────────────

    private sealed class IcsEvent
    {
        public string? DtStart { get; set; }
        public string? DtEnd { get; set; }
        public string? Summary { get; set; }
        public string? Location { get; set; }
        public string? Description { get; set; }
    }

    private static ParsedBookingConfirmation ParseIcs(Stream stream)
    {
        var result = new ParsedBookingConfirmation();
        var legs = new List<IcsEvent>();
        IcsEvent? current = null;
        string? currentLogicalLine = null;

        using var reader = new StreamReader(stream, leaveOpen: true);
        string? rawLine;

        while ((rawLine = reader.ReadLine()) != null)
        {
            if (rawLine.Length > 0 && (rawLine[0] == ' ' || rawLine[0] == '\t'))
            {
                currentLogicalLine = (currentLogicalLine ?? "") + rawLine[1..];
                continue;
            }

            if (currentLogicalLine != null)
                ProcessIcsLine(currentLogicalLine, legs, ref current);

            currentLogicalLine = rawLine.TrimEnd();
        }

        if (currentLogicalLine != null)
            ProcessIcsLine(currentLogicalLine, legs, ref current);

        if (legs.Count == 0) return result;

        var firstLeg = legs[0];
        var lastLeg = legs[^1];

        // First leg DTSTART → departure time
        if (firstLeg.DtStart != null && TryParseIcsDateTime(firstLeg.DtStart, out var departure))
        {
            result.DepartureDateTime = departure;
            result.StartDate = DateOnly.FromDateTime(departure.UtcDateTime);
        }

        if (legs.Count > 1)
        {
            // Return ticket: last leg DTSTART → when the return train actually leaves
            if (lastLeg.DtStart != null && TryParseIcsDateTime(lastLeg.DtStart, out var returnDt))
            {
                result.ReturnDateTime = returnDt;
                result.EndDate = DateOnly.FromDateTime(returnDt.UtcDateTime);
            }
        }
        else
        {
            // Single leg (or hotel): DTEND marks the end date
            if (firstLeg.DtEnd != null && TryParseIcsDateTime(firstLeg.DtEnd, out var end))
            {
                result.EndDate = DateOnly.FromDateTime(end.UtcDateTime);
            }
        }

        var fullText = string.Join(" ", legs.Select(l => $"{l.Summary} {l.Location} {l.Description}"));
        result.DetectedType = DetectType(fullText);

        if (result.DetectedType == BookingConfirmationType.Train)
        {
            ExtractTrainFieldsFromIcs(firstLeg.Summary, firstLeg.Location, firstLeg.Description, result);
        }
        else
        {
            ExtractHotelFieldsFromIcs(firstLeg.Summary, firstLeg.Location, firstLeg.Description, result);
            if (result.StartDate.HasValue) result.CheckInDate = result.StartDate;
            if (result.EndDate.HasValue) result.CheckOutDate = result.EndDate;
        }

        ExtractCommonFields(fullText, result);
        return result;
    }

    private static void ProcessIcsLine(string line, List<IcsEvent> legs, ref IcsEvent? current)
    {
        if (line == "BEGIN:VEVENT") { current = new IcsEvent(); return; }
        if (line == "END:VEVENT") { if (current != null) legs.Add(current); current = null; return; }
        if (current == null) return;

        if (TryGetIcsValue(line, "DTSTART", out var v)) current.DtStart = v;
        else if (TryGetIcsValue(line, "DTEND", out v)) current.DtEnd = v;
        else if (TryGetIcsValue(line, "SUMMARY", out v)) current.Summary = UnescapeIcsText(v!);
        else if (TryGetIcsValue(line, "LOCATION", out v)) current.Location = UnescapeIcsText(v!);
        else if (TryGetIcsValue(line, "DESCRIPTION", out v)) current.Description = UnescapeIcsText(v!);
    }

    private static bool TryGetIcsValue(string line, string key, out string? value)
    {
        value = null;
        if (!line.StartsWith(key, StringComparison.OrdinalIgnoreCase)) return false;
        var colonIdx = line.IndexOf(':');
        if (colonIdx < 0) return false;
        value = line[(colonIdx + 1)..].Trim();
        return true;
    }

    private static bool TryParseIcsDateTime(string value, out DateTimeOffset result)
    {
        result = default;
        var dateStr = value.Split('T')[0].Replace("-", "");
        if (dateStr.Length != 8) return false;

        if (!int.TryParse(dateStr[..4], out var y) ||
            !int.TryParse(dateStr[4..6], out var m) ||
            !int.TryParse(dateStr[6..8], out var d))
            return false;

        var timeStr = value.Contains('T') ? value.Split('T')[1].TrimEnd('Z') : "000000";
        int.TryParse(timeStr[..2], out var h);
        int.TryParse(timeStr.Length >= 4 ? timeStr[2..4] : "00", out var min);

        try
        {
            var isUtc = value.EndsWith('Z');
            result = isUtc
                ? new DateTimeOffset(y, m, d, h, min, 0, TimeSpan.Zero)
                : new DateTimeOffset(new DateTime(y, m, d, h, min, 0), TimeSpan.Zero);
            return true;
        }
        catch (ArgumentOutOfRangeException)
        {
            return false;
        }
    }

    private static void ExtractTrainFieldsFromIcs(string? summary, string? location, string? description, ParsedBookingConfirmation result)
    {
        if (summary != null)
        {
            var arrowIdx = summary.IndexOf('→');
            if (arrowIdx > 0)
            {
                result.Departure = summary[..arrowIdx].Trim();
                result.Arrival = summary[(arrowIdx + 1)..].Trim();
            }
            else
            {
                result.Departure = summary;
            }
        }

        if (location != null && result.Departure == null)
            result.Departure = location;

        if (description != null)
        {
            var refMatch = ReferenceRegex().Match(description);
            if (refMatch.Success) result.Reference = refMatch.Groups[1].Value;

            var providerMatch = ProviderRegex().Match(description);
            if (providerMatch.Success) result.ProviderName = providerMatch.Value;
        }
    }

    private static void ExtractHotelFieldsFromIcs(string? summary, string? location, string? description, ParsedBookingConfirmation result)
    {
        result.HotelName = summary;
        result.HotelAddress = location;

        if (description != null)
        {
            var refMatch = ReferenceRegex().Match(description);
            if (refMatch.Success) result.Reference = refMatch.Groups[1].Value;
        }
    }

    // ── PDF parser ─────────────────────────────────────────────────────────────

    private static ParsedBookingConfirmation ParsePdf(Stream stream)
    {
        var result = new ParsedBookingConfirmation();

        try
        {
            using var document = PdfDocument.Open(stream, new ParsingOptions { ClipPaths = false });
            var text = string.Join("\n", document.GetPages().Select(p =>
                string.Join(" ", p.GetWords().Select(w => w.Text))));

            result.DetectedType = DetectType(text);
            ExtractCommonFields(text, result);

            if (result.DetectedType == BookingConfirmationType.Train)
                ExtractTrainFieldsFromPdf(text, result);
            else
                ExtractHotelFieldsFromPdf(text, result);
        }
        catch
        {
            // Return empty result on parse failure — user fills manually
        }

        return result;
    }

    private static void ExtractTrainFieldsFromPdf(string text, ParsedBookingConfirmation result)
    {
        var arrowMatch = RouteArrowRegex().Match(text);
        if (arrowMatch.Success)
        {
            result.Departure = arrowMatch.Groups[1].Value.Trim();
            result.Arrival = arrowMatch.Groups[2].Value.Trim();
        }

        // For return tickets two dates appear: first = outbound departure, second = return departure.
        var dateMatches = FrenchDateTimeRegex().Matches(text);
        if (dateMatches.Count > 0 && TryParseFrenchDateTime(dateMatches[0], out var dt))
        {
            result.DepartureDateTime = dt;
            result.StartDate = DateOnly.FromDateTime(dt.DateTime);
        }
        if (dateMatches.Count > 1 && TryParseFrenchDateTime(dateMatches[1], out var returnDt))
        {
            result.ReturnDateTime = returnDt;
            result.EndDate = DateOnly.FromDateTime(returnDt.DateTime);
        }
    }

    private static void ExtractHotelFieldsFromPdf(string text, ParsedBookingConfirmation result)
    {
        // ── Hotel name ──────────────────────────────────────────────────────────
        // Hotels.com / Expedia: "Détails de la réservation {name} {number} Rue/Avenue..."
        var m = BookingDetailsHotelNameRegex().Match(text);
        if (m.Success)
            result.HotelName = m.Groups[1].Value.Trim();

        // All.com / Accor: "Voir les détails du prix {name} {number} avenue/rue..."
        if (result.HotelName == null)
        {
            m = AccorHotelNameRegex().Match(text);
            if (m.Success) result.HotelName = m.Groups[1].Value.Trim();
        }

        // Fallback: "Hôtel : {name}"
        if (result.HotelName == null)
        {
            m = HotelLabelRegex().Match(text);
            if (m.Success) result.HotelName = m.Groups[1].Value.Trim();
        }

        // ── Address ─────────────────────────────────────────────────────────────
        // Hotels.com / Expedia: address ends just before "Date d'arrivée"
        m = StreetAddressBeforeArrivalRegex().Match(text);
        if (m.Success)
            result.HotelAddress = m.Groups[1].Value.Trim();

        // All.com / generic: address is {number} {street} ... {5-digit postal code} {city}
        if (result.HotelAddress == null)
        {
            m = FrenchStreetAddressRegex().Match(text);
            if (m.Success) result.HotelAddress = m.Groups[1].Value.Trim();
        }

        // ── Check-in / check-out ─────────────────────────────────────────────────
        // Hotels.com / Expedia: "Date d'arrivée : {date}" and "Date de départ : {date}"
        m = CheckInDateRegex().Match(text);
        if (m.Success && TryParseFrenchDateFromGroups(m, 1, 2, 3, out var checkIn))
        { result.CheckInDate = checkIn; result.StartDate = checkIn; }

        m = CheckOutDateRegex().Match(text);
        if (m.Success && TryParseFrenchDateFromGroups(m, 1, 2, 3, out var checkOut))
        { result.CheckOutDate = checkOut; result.EndDate = checkOut; }

        // All.com / Accor: "ARRIVÉE {weekday} {date}" and "DÉPART {weekday} {date}"
        if (!result.CheckInDate.HasValue)
        {
            m = AccorArrivalDateRegex().Match(text);
            if (m.Success && TryParseFrenchDateFromGroups(m, 1, 2, 3, out var d))
            { result.CheckInDate = d; result.StartDate = d; }
        }
        if (!result.CheckOutDate.HasValue)
        {
            m = AccorDepartureDateRegex().Match(text);
            if (m.Success && TryParseFrenchDateFromGroups(m, 1, 2, 3, out var d))
            { result.CheckOutDate = d; result.EndDate = d; }
        }

        // All.com compact form: "Du 9 juillet 2026 au 10 juillet 2026"
        if (!result.CheckInDate.HasValue || !result.CheckOutDate.HasValue)
        {
            m = DuAuDateRangeRegex().Match(text);
            if (m.Success)
            {
                if (!result.CheckInDate.HasValue && TryParseFrenchDateFromGroups(m, 1, 2, 3, out var d1))
                { result.CheckInDate = d1; result.StartDate = d1; }
                if (!result.CheckOutDate.HasValue && TryParseFrenchDateFromGroups(m, 4, 5, 6, out var d2))
                { result.CheckOutDate = d2; result.EndDate = d2; }
            }
        }

        // Fallback: first French date in document
        if (!result.CheckInDate.HasValue)
        {
            m = FrenchDateTimeRegex().Match(text);
            if (m.Success && TryParseFrenchDateTime(m, out var dt))
            { result.CheckInDate = DateOnly.FromDateTime(dt.DateTime); result.StartDate = result.CheckInDate; }
        }
    }

    // ── Common helpers ─────────────────────────────────────────────────────────

    private static BookingConfirmationType DetectType(string text)
    {
        var trainScore = TrainKeywords.Count(k => text.Contains(k, StringComparison.OrdinalIgnoreCase));
        var hotelScore = HotelKeywords.Count(k => text.Contains(k, StringComparison.OrdinalIgnoreCase));
        return hotelScore > trainScore ? BookingConfirmationType.Hotel : BookingConfirmationType.Train;
    }

    private static void ExtractCommonFields(string text, ParsedBookingConfirmation result)
    {
        if (result.Reference == null)
        {
            var refMatch = ReferenceRegex().Match(text);
            if (refMatch.Success)
                result.Reference = refMatch.Groups[1].Value;

            // Hotels.com / Expedia: "Voyage Hotels.com : 72072562203942" or "Expedia : R5U-GDR-APIA"
            if (result.Reference == null)
            {
                refMatch = HotelsComReferenceRegex().Match(text);
                if (refMatch.Success) result.Reference = refMatch.Groups[1].Value;
            }

            // All.com / Accor: "NUMÉRO DE RÉSERVATION QHNPFTHD"
            if (result.Reference == null)
            {
                refMatch = AccorReferenceRegex().Match(text);
                if (refMatch.Success) result.Reference = refMatch.Groups[1].Value;
            }
        }

        if (result.ProviderName == null)
        {
            var providerMatch = ProviderRegex().Match(text);
            if (providerMatch.Success) result.ProviderName = providerMatch.Value;
        }

        var priceMatch = PriceRegex().Match(text);
        if (priceMatch.Success && decimal.TryParse(
            priceMatch.Groups[1].Value.Replace(',', '.'),
            System.Globalization.NumberStyles.Any,
            System.Globalization.CultureInfo.InvariantCulture,
            out var price))
        {
            result.Price = price;
        }
    }

    private static bool TryParseFrenchDateTime(Match match, out DateTimeOffset result)
    {
        result = default;
        var months = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase)
        {
            ["janvier"] = 1, ["février"] = 2, ["mars"] = 3, ["avril"] = 4,
            ["mai"] = 5, ["juin"] = 6, ["juillet"] = 7, ["août"] = 8,
            ["septembre"] = 9, ["octobre"] = 10, ["novembre"] = 11, ["décembre"] = 12,
        };

        if (!int.TryParse(match.Groups[1].Value, out var day)) return false;
        if (!months.TryGetValue(match.Groups[2].Value, out var month)) return false;
        if (!int.TryParse(match.Groups[3].Value, out var year)) return false;
        var hour = match.Groups.Count > 4 && int.TryParse(match.Groups[4].Value, out var h) ? h : 0;
        var min = match.Groups.Count > 5 && int.TryParse(match.Groups[5].Value, out var mi) ? mi : 0;

        try { result = new DateTimeOffset(year, month, day, hour, min, 0, TimeSpan.Zero); return true; }
        catch (ArgumentOutOfRangeException) { return false; }
    }

    private static bool TryParseFrenchDate(Match match, out DateOnly result) =>
        TryParseFrenchDateFromGroups(match, 1, 2, 3, out result);

    private static bool TryParseFrenchDateFromGroups(Match match, int dayG, int monthG, int yearG, out DateOnly result)
    {
        result = default;
        var months = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase)
        {
            ["janvier"] = 1, ["février"] = 2, ["mars"] = 3, ["avril"] = 4,
            ["mai"] = 5, ["juin"] = 6, ["juillet"] = 7, ["août"] = 8,
            ["septembre"] = 9, ["octobre"] = 10, ["novembre"] = 11, ["décembre"] = 12,
        };

        if (!int.TryParse(match.Groups[dayG].Value, out var day)) return false;
        if (!months.TryGetValue(match.Groups[monthG].Value, out var month)) return false;
        if (!int.TryParse(match.Groups[yearG].Value, out var year)) return false;

        try { result = new DateOnly(year, month, day); return true; }
        catch (ArgumentOutOfRangeException) { return false; }
    }

    private static string UnescapeIcsText(string text) =>
        text.Replace("\\\\", "\\").Replace("\\n", "\n").Replace("\\,", ",");

    // ── Compiled regexes ───────────────────────────────────────────────────────

    [GeneratedRegex(@"(?:N°\s*(?:de\s*)?(?:dossier|commande)|Référence\s+(?:de\s+)?(?:réservation|booking))\s*:?\s*([A-Z0-9\-]{4,})", RegexOptions.IgnoreCase)]
    private static partial Regex ReferenceRegex();

    // Hotels.com / Expedia: "Voyage Hotels.com : 72072562203942" or "Expedia : R5U-GDR-APIA"
    [GeneratedRegex(@"(?:Voyage\s+)?(?:Hotels\.com|Expedia)\s*:\s*([A-Z0-9][A-Z0-9\-]{3,})", RegexOptions.IgnoreCase)]
    private static partial Regex HotelsComReferenceRegex();

    [GeneratedRegex(@"\b(SNCF|Trainline|Hotels\.com|Expedia|Booking\.com|Accor|Novotel|Ibis|Mercure|Hilton|Marriott|Ouigo|inoui)\b", RegexOptions.IgnoreCase)]
    private static partial Regex ProviderRegex();

    [GeneratedRegex(@"(\d{1,2}[.,]\d{2})\s*€")]
    private static partial Regex PriceRegex();

    [GeneratedRegex(@"([A-ZÀ-Ÿa-zà-ÿ\s\-]+)\s*→\s*([A-ZÀ-Ÿa-zà-ÿ\s\-]+)")]
    private static partial Regex RouteArrowRegex();

    [GeneratedRegex(@"(\d{1,2})\s+(janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre)\s+(\d{4})(?:\s+à\s+(\d{2}):(\d{2}))?", RegexOptions.IgnoreCase)]
    private static partial Regex FrenchDateTimeRegex();

    // Hotels.com / Booking.com: hotel name appears right after "Détails de la réservation",
    // before the street number that starts the address.
    [GeneratedRegex(@"Détails de la réservation\s+(.+?)\s+\d+\s+(?:Rue|Avenue|Boulevard|Place|Impasse|Allée|Chemin|Route|Voie)\b", RegexOptions.IgnoreCase)]
    private static partial Regex BookingDetailsHotelNameRegex();

    // Address: street number + street type up to "Date d'arrivée"
    [GeneratedRegex(@"(\d+\s+(?:Rue|Avenue|Boulevard|Place|Impasse|Allée|Chemin|Route|Voie)\b.+?)\s+Date\s+d'arrivée", RegexOptions.IgnoreCase)]
    private static partial Regex StreetAddressBeforeArrivalRegex();

    // "Date d'arrivée : 4 juin 2026"
    [GeneratedRegex(@"Date\s+d'arrivée\s*:\s*(\d{1,2})\s+(janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre)\s+(\d{4})", RegexOptions.IgnoreCase)]
    private static partial Regex CheckInDateRegex();

    // "Date de départ : 5 juin 2026"
    [GeneratedRegex(@"Date\s+de\s+départ\s*:\s*(\d{1,2})\s+(janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre)\s+(\d{4})", RegexOptions.IgnoreCase)]
    private static partial Regex CheckOutDateRegex();

    // Fallback: "Hôtel : {name}" or "Hotel : {name}"
    [GeneratedRegex(@"(?:Hôtel|Hotel)\s*:?\s*([A-ZÀ-Ÿa-zà-ÿ\s\-&]+)", RegexOptions.IgnoreCase)]
    private static partial Regex HotelLabelRegex();

    // All.com / Accor: "Voir les détails du prix {HotelName} {number} avenue/rue..."
    [GeneratedRegex(@"Voir les détails du prix\s+(.+?)\s+\d+\s+(?:avenue|rue|boulevard|place|impasse|allée|chemin|route|voie)\b", RegexOptions.IgnoreCase)]
    private static partial Regex AccorHotelNameRegex();

    // Generic French address: "{number} {street type} ... {5-digit postal code} {city}"
    [GeneratedRegex(@"(\d+\s+(?:avenue|rue|boulevard|place|impasse|allée|chemin|route|voie)\b.+?\d{5}\s+[A-ZÀ-Ÿa-zà-ÿ]+(?:,\s*France)?)", RegexOptions.IgnoreCase)]
    private static partial Regex FrenchStreetAddressRegex();

    // All.com / Accor: "ARRIVÉE jeudi 9 juillet 2026"
    [GeneratedRegex(@"ARRIVÉE\s+(?:lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche)\s+(\d{1,2})\s+(janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre)\s+(\d{4})", RegexOptions.IgnoreCase)]
    private static partial Regex AccorArrivalDateRegex();

    // All.com / Accor: "DÉPART vendredi 10 juillet 2026"
    [GeneratedRegex(@"DÉPART\s+(?:lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche)\s+(\d{1,2})\s+(janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre)\s+(\d{4})", RegexOptions.IgnoreCase)]
    private static partial Regex AccorDepartureDateRegex();

    // All.com compact: "Du 9 juillet 2026 au 10 juillet 2026"
    [GeneratedRegex(@"Du\s+(\d{1,2})\s+(janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre)\s+(\d{4})\s+au\s+(\d{1,2})\s+(janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre)\s+(\d{4})", RegexOptions.IgnoreCase)]
    private static partial Regex DuAuDateRangeRegex();

    // All.com / Accor: "NUMÉRO DE RÉSERVATION QHNPFTHD"
    [GeneratedRegex(@"NUMÉRO\s+DE\s+RÉSERVATION\s+([A-Z0-9]{4,})", RegexOptions.IgnoreCase)]
    private static partial Regex AccorReferenceRegex();
}
