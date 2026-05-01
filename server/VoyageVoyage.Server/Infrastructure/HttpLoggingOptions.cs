namespace VoyageVoyage.Server.Infrastructure;

/// <summary>
/// Configuration options for the optional HTTP request/response logging middleware.
/// Bind from the "HttpLogging" configuration section.
/// </summary>
public class HttpRequestLoggingOptions
{
    public const string SectionName = "HttpLogging";

    /// <summary>
    /// When false (the default), the middleware is not added to the pipeline at all.
    /// </summary>
    public bool Enabled { get; set; } = false;

    public bool LogRequestHeaders { get; set; } = true;
    public bool LogResponseHeaders { get; set; } = true;
    public bool LogRequestBody { get; set; } = true;
    public bool LogResponseBody { get; set; } = true;

    /// <summary>
    /// Maximum body size (in bytes) to log. Defaults to 32 KB.
    /// </summary>
    public int BodySizeLimit { get; set; } = 32768;
}
