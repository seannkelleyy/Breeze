using System.IdentityModel.Tokens.Jwt;
using Breeze.Data;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.Identity.Web;
using Microsoft.IdentityModel.JsonWebTokens;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;

JsonWebTokenHandler.DefaultInboundClaimTypeMap.Clear();

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.Authority = "https://apt-monkfish-71.clerk.accounts.dev";
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = "https://apt-monkfish-71.clerk.accounts.dev",
            ValidateAudience = false, // Set to true if you're using custom audience
            ValidateLifetime = true,
            NameClaimType = "sub" // This is Clerk's user ID
        };
    });



builder.Services.AddAuthorization();

builder.Services.AddControllers();
// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "Breeze API", Version = "v1" });

    // Add security definition
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme. Example: \"Authorization: Bearer {token}\"",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey
    });
    c.AddSecurityRequirement(new OpenApiSecurityRequirement
{
    {
        new OpenApiSecurityScheme
        {
            Reference = new OpenApiReference
            {
                Type = ReferenceType.SecurityScheme,
                Id = "Bearer"
            }
        },
        new string[] {}
    }
    });
});

builder.Services.AddApplicationInsightsTelemetry(options =>
{
    options.ConnectionString = builder.Configuration["ApplicationInsights:ConnectionString"];
});

// Establish connection string
builder.Services.AddDbContext<BreezeContext>(options =>
{
    if (builder.Environment.IsDevelopment())
    {
        options.UseMySql(builder.Configuration.GetConnectionString("breezeDb-local"), new MySqlServerVersion(new Version(8, 0, 33)));
    }
    else
    {
        options.UseSqlServer(builder.Configuration.GetConnectionString("breezeDb"));
    }
});

builder.Services.AddCors(options =>
{
    options.AddPolicy("localhost", policy =>
    {
        policy.AllowAnyHeader().AllowAnyMethod().WithOrigins("http://localhost:5173");
    });
    options.AddPolicy("production", policy =>
    {
        policy.AllowAnyHeader().AllowAnyMethod().WithOrigins("https://www.breeze.seannkelleyy.com");
        policy.AllowAnyHeader().AllowAnyMethod().WithOrigins("http://localhost:5173");
    });
});

builder.Services.AddControllers();


var app = builder.Build();

app.UseSwagger();
app.UseSwaggerUI();

if (app.Environment.IsDevelopment())
{
    app.UseCors("localhost");
}
else
{
    app.UseCors("production");
}

builder.Services.AddLogging(options =>
{
    options.AddConsole();
    options.AddDebug();
});


app.UseHttpsRedirection();

app.UseRouting();
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.MapControllers();

app.Run();
