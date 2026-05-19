using Microsoft.Azure.Functions.Worker;
using Microsoft.Extensions.Logging;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace batch;

public class Health(ILogger<Health> logger)
{
    [Function("Health")]
    public IActionResult Run([HttpTrigger(AuthorizationLevel.Anonymous, "get")] HttpRequest _)
    {
        logger.LogInformation("C# HTTP trigger function processed a request.");
        return new OkObjectResult("Healthy!");
    }
}
