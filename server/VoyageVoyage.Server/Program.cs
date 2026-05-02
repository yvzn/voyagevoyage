using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.HttpLogging;
using Microsoft.EntityFrameworkCore;
using Microsoft.Identity.Web;
using System.Text.Json.Serialization;
using VoyageVoyage.Server.Authentication;
using VoyageVoyage.Server.Data;
using VoyageVoyage.Server.Infrastructure;
using VoyageVoyage.Server.Services;

var builder = WebApplication.CreateBuilder(args);

// Application Insights — graceful no-op when connection string is absent (e.g. local dev).
builder.Services.AddApplicationInsightsTelemetry();

builder.Services.AddOpenApi();
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        // Serialize enums as lowercase strings (e.g. "planned", "confirmed", "cancelled")
        // to match the Angular frontend model conventions.
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter(System.Text.Json.JsonNamingPolicy.CamelCase));
    });
builder.Services.AddSpaStaticFiles(options =>
{
    options.RootPath = "wwwroot";
});

builder.Services.AddHttpContextAccessor();

// Cosmos DB via EF Core
var cosmosConnectionString = builder.Configuration.GetConnectionString("CosmosDb");
if (string.IsNullOrEmpty(cosmosConnectionString))
    throw new InvalidOperationException("Cosmos DB connection string 'CosmosDb' is not configured.");

builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseCosmos(cosmosConnectionString, ApplicationDbContext.DatabaseName));

builder.Services.AddScoped<ITripService, CosmosDbTripService>();
builder.Services.AddScoped<DbInitializer>();

builder.Services.AddHealthChecks()
    .AddCheck<DatabaseHealthCheck>("cosmos-db");

if (builder.Environment.IsDevelopment())
{
    // Local development: use a mock authentication scheme and a hardcoded user identity.
    // No Azure App Service context is required.
    builder.Services
        .AddAuthentication(MockAuthHandler.SchemeName)
        .AddScheme<AuthenticationSchemeOptions, MockAuthHandler>(MockAuthHandler.SchemeName, null);

    builder.Services.AddScoped<ICurrentUserService, MockCurrentUserService>();

    // HTTP request/response logging — development only. All fields are logged.
    // Sensitive headers (Authorization, Cookie, X-MS-CLIENT-PRINCIPAL*, etc.) are
    // redacted automatically: only headers explicitly listed in RequestHeaders /
    // ResponseHeaders are logged in plain text; all others appear as [Redacted].
    builder.Services.AddHttpLogging(logging =>
    {
        logging.LoggingFields =
            HttpLoggingFields.RequestHeaders |
            HttpLoggingFields.ResponseHeaders |
            HttpLoggingFields.RequestBody |
            HttpLoggingFields.ResponseBody;

        logging.RequestBodyLogLimit = 32768;
        logging.ResponseBodyLogLimit = 32768;
        logging.CombineLogs = true;
    });
}
else
{
    // Production: App Service Easy Auth (Microsoft Entra) authenticates requests at the
    // platform level before they reach the API. Microsoft.Identity.Web reads the injected
    // headers and populates HttpContext.User with the authenticated identity.
    builder.Services
        .AddAuthentication(AppServicesAuthenticationDefaults.AuthenticationScheme)
        .AddAppServicesAuthentication();

    builder.Services.AddScoped<ICurrentUserService, AppServiceCurrentUserService>();
}

builder.Services.AddAuthorization();

var app = builder.Build();

// Initialize the database: ensure it exists and seed example data in development.
using (var scope = app.Services.CreateScope())
{
    var initializer = scope.ServiceProvider.GetRequiredService<DbInitializer>();
    await initializer.InitAsync();
}

if (app.Environment.IsDevelopment())
{
    app.UseHttpLogging();
    app.MapOpenApi();
    app.UseCors(policy =>
        policy.WithOrigins("http://localhost:4200")
              .AllowAnyHeader()
              .WithMethods("GET", "POST", "PUT", "PATCH", "DELETE")
    );
}

app.UseHttpsRedirection();
app.UseStaticFiles();
app.UseSpaStaticFiles();
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapHealthChecks("/api/health");
app.UseWhen(context => !context.Request.Path.StartsWithSegments("/api"), spaApp =>
{
    spaApp.UseSpa(spa =>
    {
        spa.Options.SourcePath = "wwwroot";
    });
});

app.Run();
