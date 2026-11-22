using System.Text;
using CityBite.Api.Data;
using CityBite.Api.Options;
using CityBite.Api.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.OpenApi;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi;

var builder = WebApplication.CreateBuilder(args);

// ---------- Services ----------

// Database: SQL Server (connection string in appsettings.json -> ConnectionStrings:CityBiteDb)
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("CityBiteDb")));

// Settings from appsettings.json
builder.Services.Configure<JwtOptions>(builder.Configuration.GetSection("Jwt"));
builder.Services.Configure<OtpOptions>(builder.Configuration.GetSection("Otp"));

// Our services
builder.Services.AddScoped<TokenService>();
builder.Services.AddScoped<OtpService>();
builder.Services.AddScoped<RatingService>();
builder.Services.AddScoped<BrowseService>();
builder.Services.AddScoped<DemoSeeder>();
builder.Services.AddScoped<BillService>();
builder.Services.AddScoped<ImageStorage>();
builder.Services.AddScoped<PromotionService>();

// ApiException -> { "message": "..." } with the right status code
builder.Services.AddExceptionHandler<ApiExceptionHandler>();
builder.Services.AddProblemDetails();

// Login: apps send "Authorization: Bearer <token>" and the API checks it here.
var jwt = builder.Configuration.GetSection("Jwt").Get<JwtOptions>()!;
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.MapInboundClaims = false;   // keep claim names as we wrote them (sub, role, ...)
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = jwt.Issuer,
            ValidateAudience = true,
            ValidAudience = jwt.Audience,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwt.Key)),
            ValidateLifetime = true,
            NameClaimType = AppClaims.Name,
            RoleClaimType = AppClaims.Role,      // so [Authorize(Roles = "restaurant_owner")] works
        };
    });
builder.Services.AddAuthorization();

builder.Services.AddControllers();

// OpenAPI document (/openapi/v1.json) — Swagger UI reads this.
// The transformer adds the "Authorize" (Bearer token) button to Swagger.
builder.Services.AddOpenApi(options => options.AddDocumentTransformer<BearerSecurityTransformer>());

// CORS: lets the React web app (running in a browser) call this API.
// Mobile apps (Kotlin, Flutter, React Native) don't need CORS.
// Any origin is allowed because the app runs offline on a local network and
// login uses a JWT in the Authorization header (no cookies).
builder.Services.AddCors(options =>
{
    options.AddPolicy("Frontends", policy =>
        policy.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod());
});

var app = builder.Build();

// One-time demo data:  dotnet run -- --seed-demo   (or the "seed-demo" profile in Visual Studio)
if (args.Contains("--seed-demo"))
{
    using var scope = app.Services.CreateScope();
    await scope.ServiceProvider.GetRequiredService<DemoSeeder>().SeedAsync();
    return;
}

// ---------- Request pipeline ----------

app.UseExceptionHandler();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();                       // http://localhost:5000/openapi/v1.json
    app.UseSwaggerUI(options =>             // http://localhost:5000/swagger
    {
        options.SwaggerEndpoint("/openapi/v1.json", "CityBite API v1");
        options.DocumentTitle = "CityBite API";
    });
}

// No HTTPS redirect: offline phones talk to the laptop over plain HTTP.

// Serves files from wwwroot, e.g. dish/review photos at /uploads/dish5.jpg
app.UseStaticFiles();

app.UseCors("Frontends");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();

/// <summary>Adds a "Bearer" security scheme so Swagger shows the Authorize button.</summary>
internal sealed class BearerSecurityTransformer : IOpenApiDocumentTransformer
{
    public Task TransformAsync(OpenApiDocument document, OpenApiDocumentTransformerContext context, CancellationToken cancellationToken)
    {
        document.Components ??= new OpenApiComponents();
        document.Components.SecuritySchemes ??= new Dictionary<string, IOpenApiSecurityScheme>();
        document.Components.SecuritySchemes["Bearer"] = new OpenApiSecurityScheme
        {
            Type = SecuritySchemeType.Http,
            Scheme = "bearer",
            BearerFormat = "JWT",
            Description = "Paste the token from /api/auth/login or /api/auth/verify-otp",
        };
        document.Security ??= [];
        document.Security.Add(new OpenApiSecurityRequirement
        {
            [new OpenApiSecuritySchemeReference("Bearer", document)] = []
        });
        return Task.CompletedTask;
    }
}
