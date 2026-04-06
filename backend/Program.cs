using backend.Data;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// เพิ่มบริการให้กับ container
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlite(builder.Configuration.GetConnectionString("DefaultConnection")
        ?? "Data Source=investment.db"));

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
}

// เปิด redirect ไป HTTPS เฉพาะตอนที่มีพอร์ต HTTPS ให้ใช้งานจริง
var httpsPort = builder.Configuration["ASPNETCORE_HTTPS_PORT"];
if (!string.IsNullOrWhiteSpace(httpsPort))
{
    app.UseHttpsRedirection();
}

app.UseAuthorization();

app.MapControllers();

app.Run();
