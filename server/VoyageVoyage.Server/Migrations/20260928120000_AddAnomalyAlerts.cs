using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace VoyageVoyage.Server.Migrations
{
    public partial class AddAnomalyAlerts : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "AnomalyAlerts",
                columns: table => new
                {
                    Id = table.Column<string>(type: "text", nullable: false),
                    UserId = table.Column<string>(type: "text", nullable: false),
                    TripId = table.Column<string>(type: "text", nullable: false),
                    TripStartDate = table.Column<DateOnly>(type: "date", nullable: false),
                    TripEndDate = table.Column<DateOnly>(type: "date", nullable: false),
                    ExpenseId = table.Column<string>(type: "text", nullable: true),
                    ReceiptId = table.Column<string>(type: "text", nullable: true),
                    Type = table.Column<int>(type: "integer", nullable: false),
                    Description = table.Column<string>(type: "text", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    Status = table.Column<int>(type: "integer", nullable: false),
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AnomalyAlerts", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_AnomalyAlerts_TripId",
                table: "AnomalyAlerts",
                column: "TripId");

            migrationBuilder.CreateIndex(
                name: "IX_AnomalyAlerts_UserId",
                table: "AnomalyAlerts",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_AnomalyAlerts_UserId_Type_TripId_ExpenseId",
                table: "AnomalyAlerts",
                columns: new[] { "UserId", "Type", "TripId", "ExpenseId" },
                unique: true);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AnomalyAlerts");
        }
    }
}
