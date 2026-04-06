using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations;

public partial class UpdateSchema : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.RenameColumn(
            name: "Date",
            table: "exchange_transactions",
            newName: "date");

        migrationBuilder.RenameColumn(
            name: "ThbAmount",
            table: "exchange_transactions",
            newName: "thb_amount");

        migrationBuilder.RenameColumn(
            name: "ForeignAmount",
            table: "exchange_transactions",
            newName: "foreign_amount");

        migrationBuilder.RenameColumn(
            name: "Currency",
            table: "exchange_transactions",
            newName: "currency");

        migrationBuilder.RenameColumn(
            name: "Rate",
            table: "exchange_transactions",
            newName: "actual_rate");

        migrationBuilder.RenameColumn(
            name: "Note",
            table: "exchange_transactions",
            newName: "note");

        migrationBuilder.AddColumn<decimal>(
            name: "mid_rate",
            table: "exchange_transactions",
            type: "TEXT",
            nullable: true);

        migrationBuilder.AddColumn<decimal>(
            name: "spread",
            table: "exchange_transactions",
            type: "TEXT",
            nullable: true);

        migrationBuilder.RenameColumn(
            name: "Date",
            table: "stock_transactions",
            newName: "executed_at");

        migrationBuilder.RenameColumn(
            name: "Ticker",
            table: "stock_transactions",
            newName: "ticker");

        migrationBuilder.RenameColumn(
            name: "Type",
            table: "stock_transactions",
            newName: "type");

        migrationBuilder.RenameColumn(
            name: "Quantity",
            table: "stock_transactions",
            newName: "quantity");

        migrationBuilder.RenameColumn(
            name: "PriceForeign",
            table: "stock_transactions",
            newName: "price_usd");

        migrationBuilder.RenameColumn(
            name: "FeeForeign",
            table: "stock_transactions",
            newName: "fee_usd");

        migrationBuilder.RenameColumn(
            name: "FeeThb",
            table: "stock_transactions",
            newName: "vat_usd");

        migrationBuilder.RenameColumn(
            name: "RateAtTrade",
            table: "stock_transactions",
            newName: "rate_at_trade");

        migrationBuilder.RenameColumn(
            name: "PriceThb",
            table: "stock_transactions",
            newName: "price_thb");

        migrationBuilder.RenameColumn(
            name: "Note",
            table: "stock_transactions",
            newName: "note");

        migrationBuilder.AddColumn<decimal>(
            name: "total_cost_usd",
            table: "stock_transactions",
            type: "TEXT",
            nullable: false,
            defaultValue: 0m);

        migrationBuilder.Sql(
            """
            UPDATE stock_transactions
            SET total_cost_usd = (price_usd * quantity) + fee_usd + vat_usd
            """);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropColumn(
            name: "mid_rate",
            table: "exchange_transactions");

        migrationBuilder.DropColumn(
            name: "spread",
            table: "exchange_transactions");

        migrationBuilder.RenameColumn(
            name: "date",
            table: "exchange_transactions",
            newName: "Date");

        migrationBuilder.RenameColumn(
            name: "thb_amount",
            table: "exchange_transactions",
            newName: "ThbAmount");

        migrationBuilder.RenameColumn(
            name: "foreign_amount",
            table: "exchange_transactions",
            newName: "ForeignAmount");

        migrationBuilder.RenameColumn(
            name: "currency",
            table: "exchange_transactions",
            newName: "Currency");

        migrationBuilder.RenameColumn(
            name: "actual_rate",
            table: "exchange_transactions",
            newName: "Rate");

        migrationBuilder.RenameColumn(
            name: "note",
            table: "exchange_transactions",
            newName: "Note");

        migrationBuilder.DropColumn(
            name: "total_cost_usd",
            table: "stock_transactions");

        migrationBuilder.RenameColumn(
            name: "executed_at",
            table: "stock_transactions",
            newName: "Date");

        migrationBuilder.RenameColumn(
            name: "ticker",
            table: "stock_transactions",
            newName: "Ticker");

        migrationBuilder.RenameColumn(
            name: "type",
            table: "stock_transactions",
            newName: "Type");

        migrationBuilder.RenameColumn(
            name: "quantity",
            table: "stock_transactions",
            newName: "Quantity");

        migrationBuilder.RenameColumn(
            name: "price_usd",
            table: "stock_transactions",
            newName: "PriceForeign");

        migrationBuilder.RenameColumn(
            name: "fee_usd",
            table: "stock_transactions",
            newName: "FeeForeign");

        migrationBuilder.RenameColumn(
            name: "vat_usd",
            table: "stock_transactions",
            newName: "FeeThb");

        migrationBuilder.RenameColumn(
            name: "rate_at_trade",
            table: "stock_transactions",
            newName: "RateAtTrade");

        migrationBuilder.RenameColumn(
            name: "price_thb",
            table: "stock_transactions",
            newName: "PriceThb");

        migrationBuilder.RenameColumn(
            name: "note",
            table: "stock_transactions",
            newName: "Note");
    }
}
