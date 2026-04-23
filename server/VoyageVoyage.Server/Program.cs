var builder = WebApplication.CreateBuilder(args);

builder.Services.AddOpenApi();
builder.Services.AddControllers();
builder.Services.AddSpaStaticFiles(options =>
{
    options.RootPath = "wwwroot";
});

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
app.MapControllers();
app.UseWhen(context => !context.Request.Path.StartsWithSegments("/api"), spaApp =>
{
    spaApp.UseSpa(spa =>
    {
        spa.Options.SourcePath = "wwwroot";
    });
});

app.Run();
