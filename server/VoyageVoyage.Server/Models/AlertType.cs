using System.Text.Json.Serialization;

namespace VoyageVoyage.Server.Models;

[JsonConverter(typeof(JsonStringEnumConverter<AlertType>))]
public enum AlertType
{
    TripStillPlanned,
    MissingBooking,
    MissingReceipt,
    AtypicalReceipt,
    BookingDatesInconsistent,
}
