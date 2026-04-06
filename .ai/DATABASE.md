# Database Guide

## ตอนนี้ใช้: SQLite
- ไฟล์: investment.db (สร้างอัตโนมัติ)
- ไม่ต้อง setup อะไรเพิ่ม

## วิธีเปลี่ยนเป็น PostgreSQL (ตอน Deploy)

### 1. เปลี่ยน Package
```bash
dotnet remove package Microsoft.EntityFrameworkCore.Sqlite
dotnet add package Npgsql.EntityFrameworkCore.PostgreSQL
```

### 2. แก้ Program.cs
```csharp
// เปลี่ยนจาก
builder.Services.AddDbContext<AppDbContext>(opt =>
    opt.UseSqlite("Data Source=investment.db"));

// เป็น
builder.Services.AddDbContext<AppDbContext>(opt =>
    opt.UseNpgsql(builder.Configuration
        .GetConnectionString("DefaultConnection")));
```

### 3. แก้ appsettings.json
```json
"ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Database=investment;Username=xxx;Password=xxx"
}
```

### 4. สร้าง Migration ใหม่
```bash
dotnet ef migrations add SwitchToPostgres
dotnet ef database update
```

## Railway Deploy
- สร้าง PostgreSQL service ใน Railway
- Copy connection string มาใส่ Environment Variable
- ชื่อ variable: ConnectionStrings__DefaultConnection