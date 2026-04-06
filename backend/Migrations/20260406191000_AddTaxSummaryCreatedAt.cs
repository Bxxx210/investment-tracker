using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations;

public partial class AddTaxSummaryCreatedAt : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<DateTime>(
            name: "created_at",
            table: "tax_summary",
            type: "TEXT",
            nullable: false,
            defaultValueSql: "CURRENT_TIMESTAMP");
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropColumn(
            name: "created_at",
            table: "tax_summary");
    }
}
