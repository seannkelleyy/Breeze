using Breeze.Data;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.Security.Claims;

var builder = WebApplication.CreateBuilder(args);

var domain = "https://dev-r15wsyccxyjfwrqm.us.auth0.com/";
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.Authority = domain;
        options.Audience = "http://breezebudgeting.com";
        options.TokenValidationParameters = new TokenValidationParameters
        {
            NameClaimType = ClaimTypes.NameIdentifier
        };
    });

// Add services to the container.
builder.Services.AddControllers();
// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Establish connection string
builder.Services.AddDbContext<BreezeContext>(options =>
options.UseSqlServer(builder.Configuration.GetConnectionString("breezeDb")));

builder.Services.AddCors(options =>
{
    options.AddPolicy("localhost", policy =>
    {
        policy.AllowAnyHeader().AllowAnyMethod().WithOrigins("http://localhost:*");
    });
    options.AddPolicy("production", policy =>
    {
        policy.AllowAnyHeader().AllowAnyMethod().WithOrigins("https://breeze-apiapp.azurewebsites.net/");
    });
});

var app = builder.Build();

app.UseCors("production");

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
    app.UseCors("localhost");
}


app.UseHttpsRedirection();

app.UseRouting();
app.UseAuthentication();
app.UseAuthorization();

app.UseEndpoints(endpoints =>
{
    endpoints.MapControllers();
});

app.MapControllers();

app.Run();
