using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations;

public partial class AddExchangeType : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql(
            """
            ALTER TABLE exchange_transactions ADD COLUMN exchange_type TEXT NOT NULL DEFAULT 'buy_usd';

            UPDATE exchange_transactions
            SET created_at = CASE
                WHEN created_at LIKE '%Z' THEN created_at
                ELSE created_at || 'Z'
            END;

            UPDATE stock_transactions
            SET created_at = CASE
                WHEN created_at LIKE '%Z' THEN created_at
                ELSE created_at || 'Z'
            END;

            UPDATE stock_transactions
            SET executed_at = strftime('%Y-%m-%dT%H:%M:%fZ', datetime(executed_at, '-7 hours'));
            """
        );
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql(
            """
            ALTER TABLE exchange_transactions DROP COLUMN exchange_type;
            """
        );
    }
}
