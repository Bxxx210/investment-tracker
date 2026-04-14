using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations;

public partial class StandardizeTransactionTypes : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql(
            """
            PRAGMA foreign_keys = OFF;

            BEGIN TRANSACTION;

            ALTER TABLE stock_transactions RENAME TO stock_transactions_old;

            CREATE TABLE stock_transactions (
                "Id" INTEGER NOT NULL CONSTRAINT "PK_stock_transactions" PRIMARY KEY AUTOINCREMENT,
                "created_at" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                "executed_at" TEXT NOT NULL,
                "ticker" TEXT NOT NULL,
                "type" TEXT NOT NULL,
                "quantity" TEXT NOT NULL,
                "price_usd" TEXT NOT NULL,
                "rate_at_trade" TEXT NULL,
                "price_thb" TEXT NULL,
                "fee_usd" TEXT NOT NULL,
                "vat_usd" TEXT NOT NULL,
                "note" TEXT NULL,
                "total_cost_usd" TEXT NOT NULL DEFAULT 0
            );

            INSERT INTO stock_transactions (
                "Id",
                "created_at",
                "executed_at",
                "ticker",
                "type",
                "quantity",
                "price_usd",
                "rate_at_trade",
                "price_thb",
                "fee_usd",
                "vat_usd",
                "note",
                "total_cost_usd"
            )
            SELECT
                "Id",
                "created_at",
                "executed_at",
                "ticker",
                CASE CAST("type" AS TEXT)
                    WHEN '1' THEN 'buy'
                    WHEN '2' THEN 'sell'
                    WHEN '3' THEN 'dividend'
                    WHEN '4' THEN 'withdrawal'
                    ELSE lower(CAST("type" AS TEXT))
                END,
                "quantity",
                "price_usd",
                "rate_at_trade",
                "price_thb",
                "fee_usd",
                "vat_usd",
                "note",
                "total_cost_usd"
            FROM stock_transactions_old;

            DROP TABLE stock_transactions_old;

            COMMIT;
            PRAGMA foreign_keys = ON;
            """
        );
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql(
            """
            PRAGMA foreign_keys = OFF;

            BEGIN TRANSACTION;

            ALTER TABLE stock_transactions RENAME TO stock_transactions_old;

            CREATE TABLE stock_transactions (
                "Id" INTEGER NOT NULL CONSTRAINT "PK_stock_transactions" PRIMARY KEY AUTOINCREMENT,
                "created_at" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                "executed_at" TEXT NOT NULL,
                "ticker" TEXT NOT NULL,
                "type" INTEGER NOT NULL,
                "quantity" TEXT NOT NULL,
                "price_usd" TEXT NOT NULL,
                "rate_at_trade" TEXT NULL,
                "price_thb" TEXT NULL,
                "fee_usd" TEXT NOT NULL,
                "vat_usd" TEXT NOT NULL,
                "note" TEXT NULL,
                "total_cost_usd" TEXT NOT NULL DEFAULT 0
            );

            INSERT INTO stock_transactions (
                "Id",
                "created_at",
                "executed_at",
                "ticker",
                "type",
                "quantity",
                "price_usd",
                "rate_at_trade",
                "price_thb",
                "fee_usd",
                "vat_usd",
                "note",
                "total_cost_usd"
            )
            SELECT
                "Id",
                "created_at",
                "executed_at",
                "ticker",
                CASE lower("type")
                    WHEN 'buy' THEN 1
                    WHEN 'sell' THEN 2
                    WHEN 'dividend' THEN 3
                    WHEN 'withdrawal' THEN 4
                    ELSE 1
                END,
                "quantity",
                "price_usd",
                "rate_at_trade",
                "price_thb",
                "fee_usd",
                "vat_usd",
                "note",
                "total_cost_usd"
            FROM stock_transactions_old;

            DROP TABLE stock_transactions_old;

            COMMIT;
            PRAGMA foreign_keys = ON;
            """
        );
    }
}
