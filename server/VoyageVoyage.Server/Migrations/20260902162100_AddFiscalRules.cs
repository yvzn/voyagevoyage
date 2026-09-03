using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace VoyageVoyage.Server.Migrations
{
    /// <inheritdoc />
    public partial class AddFiscalRules : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "FiscalRules",
                columns: table => new
                {
                    Id = table.Column<string>(type: "text", nullable: false),
                    UserId = table.Column<string>(type: "text", nullable: false),
                    StartDate = table.Column<DateOnly>(type: "date", nullable: false),
                    EndDate = table.Column<DateOnly>(type: "date", nullable: false),
                    MealAllowance = table.Column<decimal>(type: "numeric", nullable: false),
                    MealVoucherFaceValue = table.Column<decimal>(type: "numeric", nullable: false),
                    MealVoucherEmployerContributionPercentage = table.Column<decimal>(type: "numeric", nullable: false),
                    RemoteWorkAllowance = table.Column<decimal>(type: "numeric", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FiscalRules", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_FiscalRules_UserId",
                table: "FiscalRules",
                column: "UserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "FiscalRules");
        }
    }
}
