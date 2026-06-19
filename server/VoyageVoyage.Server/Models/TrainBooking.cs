namespace VoyageVoyage.Server.Models;

public class TrainBooking
{
    public string Departure { get; set; } = string.Empty;

    public string Arrival { get; set; } = string.Empty;

    public DateTimeOffset? DepartureDateTime { get; set; }

    public DateTimeOffset? ReturnDateTime { get; set; }
}
