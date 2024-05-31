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
        options.Audience = "http://localhost:5173";
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
        policy.AllowAnyHeader().AllowAnyMethod().WithOrigins("http://localhost:5173");
    });
    options.AddPolicy("production", policy =>
    {
        // TODO Add frontend uri when its created
        //policy.AllowAnyHeader().AllowAnyMethod().WithOrigins("https://breeze-apiapp.azurewebsites.net/");
        policy.AllowAnyHeader().AllowAnyMethod().WithOrigins("http://localhost:5173");

    });
    options.AddPolicy("OpenCorsPolicy", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

var app = builder.Build();

app.UseCors("OpenCorsPolicy");

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
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
