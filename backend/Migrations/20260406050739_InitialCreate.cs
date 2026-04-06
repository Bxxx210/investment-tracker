using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "exchange_transactions",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Date = table.Column<DateOnly>(type: "TEXT", nullable: false),
                    ThbAmount = table.Column<decimal>(type: "TEXT", nullable: false),
                    ForeignAmount = table.Column<decimal>(type: "TEXT", nullable: false),
                    Currency = table.Column<string>(type: "TEXT", maxLength: 10, nullable: false, defaultValue: "USD"),
                    Rate = table.Column<decimal>(type: "TEXT", nullable: false),
                    Note = table.Column<string>(type: "TEXT", maxLength: 500, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_exchange_transactions", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "stock_transactions",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Date = table.Column<DateOnly>(type: "TEXT", nullable: false),
                    Ticker = table.Column<string>(type: "TEXT", maxLength: 20, nullable: false),
                    Type = table.Column<int>(type: "INTEGER", nullable: false),
                    Quantity = table.Column<decimal>(type: "TEXT", nullable: false),
                    PriceForeign = table.Column<decimal>(type: "TEXT", nullable: false),
                    RateAtTrade = table.Column<decimal>(type: "TEXT", nullable: false),
                    PriceThb = table.Column<decimal>(type: "TEXT", nullable: false),
                    FeeForeign = table.Column<decimal>(type: "TEXT", nullable: false),
                    FeeThb = table.Column<decimal>(type: "TEXT", nullable: false),
                    Note = table.Column<string>(type: "TEXT", maxLength: 500, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_stock_transactions", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "tax_summary",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Year = table.Column<int>(type: "INTEGER", nullable: false),
                    TotalIncomeThb = table.Column<decimal>(type: "TEXT", nullable: false),
                    TotalCostThb = table.Column<decimal>(type: "TEXT", nullable: false),
                    TotalFeeThb = table.Column<decimal>(type: "TEXT", nullable: false),
                    NetProfitThb = table.Column<decimal>(type: "TEXT", nullable: false),
                    TaxRate = table.Column<decimal>(type: "TEXT", nullable: false),
                    TaxAmount = table.Column<decimal>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_tax_summary", x => x.Id);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "exchange_transactions");

            migrationBuilder.DropTable(
                name: "stock_transactions");

            migrationBuilder.DropTable(
                name: "tax_summary");
        }
    }
}
