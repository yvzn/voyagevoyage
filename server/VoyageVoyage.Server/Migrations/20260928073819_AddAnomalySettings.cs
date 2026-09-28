using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace VoyageVoyage.Server.Migrations
{
    /// <inheritdoc />
    public partial class AddAnomalySettings : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "A1MaxPastTripAgeDays",
                table: "TravelConstraints",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "A2MinCompletionDelayDays",
                table: "TravelConstraints",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<decimal>(
                name: "XAtypicalExpenseThresholdPercent",
                table: "TravelConstraints",
                type: "numeric",
                nullable: false,
                defaultValue: 0m);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "A1MaxPastTripAgeDays",
                table: "TravelConstraints");

            migrationBuilder.DropColumn(
                name: "A2MinCompletionDelayDays",
                table: "TravelConstraints");

            migrationBuilder.DropColumn(
                name: "XAtypicalExpenseThresholdPercent",
                table: "TravelConstraints");
        }
    }
}
