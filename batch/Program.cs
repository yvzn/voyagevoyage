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

// Cosmos DB for public holidays import
var cosmosConnectionString = builder.Configuration["ConnectionStrings:CosmosDb"]
    ?? builder.Configuration["CosmosDb:ConnectionString"];

if (!string.IsNullOrEmpty(cosmosConnectionString))
{
    builder.Services.AddDbContextFactory<BatchDbContext>(options =>
        options.UseCosmos(cosmosConnectionString, BatchDbContext.DatabaseName));
}

// HTTP client for France public holiday API
builder.Services.AddHttpClient<FrancePublicHolidayApiService>();

// HTTP client for France school holiday API
builder.Services.AddHttpClient<FranceSchoolHolidayApiService>();

builder.Build().Run();
