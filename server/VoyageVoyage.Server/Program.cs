using Microsoft.AspNetCore.Authentication;
using Microsoft.Identity.Web;
using VoyageVoyage.Server.Authentication;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddOpenApi();
builder.Services.AddControllers();
builder.Services.AddSpaStaticFiles(options =>
{
    options.RootPath = "wwwroot";
});

builder.Services.AddHttpContextAccessor();

if (builder.Environment.IsDevelopment())
{
    // Local development: use a mock authentication scheme and a hardcoded user identity.
    // No Azure App Service context is required.
    builder.Services
        .AddAuthentication(MockAuthHandler.SchemeName)
        .AddScheme<AuthenticationSchemeOptions, MockAuthHandler>(MockAuthHandler.SchemeName, null);

    builder.Services.AddScoped<ICurrentUserService, MockCurrentUserService>();
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

if (app.Environment.IsDevelopment())
{
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
app.UseWhen(context => !context.Request.Path.StartsWithSegments("/api"), spaApp =>
{
    spaApp.UseSpa(spa =>
    {
        spa.Options.SourcePath = "wwwroot";
    });
});

app.Run();
