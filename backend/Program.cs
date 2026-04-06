var builder = WebApplication.CreateBuilder(args);

// เพิ่มบริการให้กับ container

builder.Services.AddControllers();
builder.Services.AddSingleton<backend.Services.IExchangeTransactionService, backend.Services.ExchangeTransactionService>();
builder.Services.AddSingleton<backend.Services.IStockTransactionService, backend.Services.StockTransactionService>();
builder.Services.AddSingleton<backend.Services.ITaxSummaryService, backend.Services.TaxSummaryService>();
// เปิดใช้งาน OpenAPI สำหรับ dev
builder.Services.AddOpenApi();

var app = builder.Build();

// ตั้งค่า pipeline ของ HTTP request
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();

app.UseAuthorization();

app.MapControllers();

app.Run();
