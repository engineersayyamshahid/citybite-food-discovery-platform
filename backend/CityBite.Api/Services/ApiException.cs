using CityBite.Api.DTOs;
using Microsoft.AspNetCore.Diagnostics;

namespace CityBite.Api.Services;

/// <summary>
/// Throw from a service to stop and send a clear message to the app, e.g.
/// throw new ApiException(400, "This code has expired.");  ->  400 { "message": "This code has expired." }
/// </summary>
public class ApiException(int statusCode, string message) : Exception(message)
{
    public int StatusCode { get; } = statusCode;
}

/// <summary>Turns ApiException into a JSON { message } response with its status code.</summary>
public class ApiExceptionHandler : IExceptionHandler
{
    public async ValueTask<bool> TryHandleAsync(HttpContext http, Exception exception, CancellationToken ct)
    {
        if (exception is not ApiException api) return false;   // other errors -> normal 500 handling
        http.Response.StatusCode = api.StatusCode;
        await http.Response.WriteAsJsonAsync(new MessageResponse(api.Message), ct);
        return true;
    }
}
