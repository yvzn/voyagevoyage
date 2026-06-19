using batch.Data;
using batch.Services;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Builder;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

var builder = FunctionsApplication.CreateBuilder(args);

builder.ConfigureFunctionsWebApplication();

builder.Services
    .AddApplicationInsightsTelemetryWorkerService()
    .ConfigureFunctionsApplicationInsights();

// PostgreSQL for public holidays import
var postgresConnectionString = builder.Configuration["ConnectionStrings:PostgresDb"]
    ?? builder.Configuration["PostgresDb:ConnectionString"];

if (!string.IsNullOrEmpty(postgresConnectionString))
{
    builder.Services.AddDbContextFactory<BatchDbContext>(options =>
        options.UseNpgsql(postgresConnectionString));
}

// HTTP client for France public holiday API
builder.Services.AddHttpClient<FrancePublicHolidayApiService>();

// HTTP client for France school holiday API
builder.Services.AddHttpClient<FranceSchoolHolidayApiService>();

builder.Build().Run();
