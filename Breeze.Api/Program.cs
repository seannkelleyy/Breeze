using Breeze.Data;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

//builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
//    .AddJwtBearer(options =>
//    {
//        options.Authority = "https://dev-r15wsyccxyjfwrqm.us.auth0.com/";
//        options.Audience = "breeze-apiapp.azurewebsites.net/";
//        options.TokenValidationParameters = new TokenValidationParameters
//        {
//            NameClaimType = ClaimTypes.NameIdentifier
//        };
//        options.Events = new JwtBearerEvents
//        {
//            OnTokenValidated = context =>
//            {
//                var claimsIdentity = context.Principal.Identity as ClaimsIdentity;
//                if (claimsIdentity != null)
//                {
//                    string userEmail = claimsIdentity.Claims.FirstOrDefault(c => c.Type == "email")?.Value;
//                }
//                return Task.CompletedTask;
//            }
//        };


//    });

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
        policy.AllowAnyHeader().AllowAnyMethod().WithOrigins("https://breezebudgeting.azurewebsites.net");
        policy.AllowAnyHeader().AllowAnyMethod().WithOrigins("http://localhost:5173");
    });
    options.AddPolicy("production", policy =>
    {
        policy.AllowAnyHeader().AllowAnyMethod().WithOrigins("https://breezebudgeting.azurewebsites.net");
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
app.UseSwagger();
app.UseSwaggerUI();

if (app.Environment.IsDevelopment())
{
    app.UseCors("OpenCorsPolicy");
}


app.UseHttpsRedirection();

app.UseRouting();
//app.UseAuthentication();
//app.UseAuthorization();

app.UseEndpoints(endpoints =>
{
    endpoints.MapControllers();
});

app.MapControllers();

app.Run();
