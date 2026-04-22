var builder = WebApplication.CreateBuilder(args);

builder.Services.AddOpenApi();
builder.Services.AddControllers();

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
app.MapControllers();

app.Run();
