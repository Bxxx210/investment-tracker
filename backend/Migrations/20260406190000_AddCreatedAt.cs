using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations;

public partial class AddCreatedAt : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql(
            """
            PRAGMA foreign_keys = OFF;

            BEGIN TRANSACTION;

            ALTER TABLE exchange_transactions RENAME TO exchange_transactions_old;

            CREATE TABLE exchange_transactions (
                "Id" INTEGER NOT NULL CONSTRAINT "PK_exchange_transactions" PRIMARY KEY AUTOINCREMENT,
                "created_at" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                "date" TEXT NOT NULL,
                "thb_amount" TEXT NOT NULL,
                "foreign_amount" TEXT NOT NULL,
                "currency" TEXT NOT NULL DEFAULT 'USD',
                "mid_rate" TEXT NULL,
                "actual_rate" TEXT NOT NULL,
                "spread" TEXT NULL,
                "note" TEXT NULL
            );

            INSERT INTO exchange_transactions (
                "Id",
                "created_at",
                "date",
                "thb_amount",
                "foreign_amount",
                "currency",
                "mid_rate",
                "actual_rate",
                "spread",
                "note"
            )
            SELECT
                "Id",
                "date" || 'T12:00:00Z',
                "date",
                "thb_amount",
                "foreign_amount",
                "currency",
                "mid_rate",
                "actual_rate",
                "spread",
                "note"
            FROM exchange_transactions_old;

            DROP TABLE exchange_transactions_old;

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
                total_cost_usd TEXT NOT NULL DEFAULT 0
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
                replace("executed_at", ' ', 'T'),
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

            ALTER TABLE exchange_transactions RENAME TO exchange_transactions_old;

            CREATE TABLE exchange_transactions (
                "Id" INTEGER NOT NULL CONSTRAINT "PK_exchange_transactions" PRIMARY KEY AUTOINCREMENT,
                "date" TEXT NOT NULL,
                "thb_amount" TEXT NOT NULL,
                "foreign_amount" TEXT NOT NULL,
                "currency" TEXT NOT NULL DEFAULT 'USD',
                "mid_rate" TEXT NULL,
                "actual_rate" TEXT NOT NULL,
                "spread" TEXT NULL,
                "note" TEXT NULL
            );

            INSERT INTO exchange_transactions (
                "Id",
                "date",
                "thb_amount",
                "foreign_amount",
                "currency",
                "mid_rate",
                "actual_rate",
                "spread",
                "note"
            )
            SELECT
                "Id",
                "date",
                "thb_amount",
                "foreign_amount",
                "currency",
                "mid_rate",
                "actual_rate",
                "spread",
                "note"
            FROM exchange_transactions_old;

            DROP TABLE exchange_transactions_old;

            ALTER TABLE stock_transactions RENAME TO stock_transactions_old;

            CREATE TABLE stock_transactions (
                "Id" INTEGER NOT NULL CONSTRAINT "PK_stock_transactions" PRIMARY KEY AUTOINCREMENT,
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
                total_cost_usd TEXT NOT NULL DEFAULT 0
            );

            INSERT INTO stock_transactions (
                "Id",
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
            FROM stock_transactions_old;

            DROP TABLE stock_transactions_old;

            COMMIT;
            PRAGMA foreign_keys = ON;
            """
        );
    }
}
