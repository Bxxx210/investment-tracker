using backend.Data;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// เพิ่มบริการให้กับ container
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlite(builder.Configuration.GetConnectionString("DefaultConnection")
        ?? "Data Source=investment.db"));

builder.Services.AddCors(options =>
{
    options.AddPolicy("FrontendDev", policy =>
    {
        policy.WithOrigins("http://localhost:3000", "http://127.0.0.1:3000")
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

builder.Services.AddControllers();
builder.Services.AddScoped<backend.Services.IExchangeTransactionService, backend.Services.ExchangeTransactionService>();
builder.Services.AddScoped<backend.Services.IStockTransactionService, backend.Services.StockTransactionService>();
builder.Services.AddScoped<backend.Services.ITaxSummaryService, backend.Services.TaxSummaryService>();
// เปิดใช้งาน OpenAPI สำหรับ dev
builder.Services.AddOpenApi();

var app = builder.Build();

// ตั้งค่า pipeline ของ HTTP request
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();

    app.MapGet("/swagger", () =>
        Results.Content("""
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Investment Tracker Swagger</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
  <style>
    html, body { margin: 0; padding: 0; background: #0f172a; }
    #swagger-ui { min-height: 100vh; }
  </style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
  <script>
    window.onload = function () {
      window.ui = SwaggerUIBundle({
        url: '/openapi/v1.json',
        dom_id: '#swagger-ui',
        deepLinking: true,
        displayRequestDuration: true,
        presets: [SwaggerUIBundle.presets.apis],
        layout: 'BaseLayout'
      });
    };
  </script>
</body>
</html>
""", "text/html"));
}

// เปิด redirect ไป HTTPS เฉพาะตอนที่มีพอร์ต HTTPS ให้ใช้งานจริง
var httpsPort = builder.Configuration["ASPNETCORE_HTTPS_PORT"];
if (!string.IsNullOrWhiteSpace(httpsPort))
{
    app.UseHttpsRedirection();
}

app.UseCors("FrontendDev");
app.UseAuthorization();

app.MapControllers();

app.Run();
