using System.Text.Json.Serialization;

namespace VoyageVoyage.Server.Models;

[JsonConverter(typeof(JsonStringEnumConverter<AlertStatus>))]
public enum AlertStatus
{
    New,
    Handled,
    Ignored,
}
