using System.ComponentModel.DataAnnotations;

namespace VoyageVoyage.Server.Models;

/// <summary>
/// Represents the request body for creating a new trip.
/// </summary>
public record CreateTripRequest(
    DateOnly StartDate,
    DateOnly EndDate,
    [Required, MinLength(1)] string Destination,
    TripStatus Status,
    TrainBooking? TrainBooking = null
) : IValidatableObject
{
    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (EndDate < StartDate)
            yield return new ValidationResult(
                "EndDate must be on or after StartDate.",
                [nameof(EndDate)]
            );
    }
}
