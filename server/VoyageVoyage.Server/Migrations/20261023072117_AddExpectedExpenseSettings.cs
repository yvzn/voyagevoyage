using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace VoyageVoyage.Server.Migrations
{
    /// <inheritdoc />
    public partial class AddExpectedExpenseSettings : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "ExpectedExpenseDestinationMinimumCount",
                table: "TravelConstraints",
                type: "integer",
                nullable: false,
                defaultValue: 3);

            migrationBuilder.AddColumn<decimal>(
                name: "ExpectedExpenseHabitThresholdPercent",
                table: "TravelConstraints",
                type: "numeric",
                nullable: false,
                defaultValue: 60m);

            migrationBuilder.AddColumn<int>(
                name: "ExpectedExpenseHistoryTripCount",
                table: "TravelConstraints",
                type: "integer",
                nullable: false,
                defaultValue: 10);

            migrationBuilder.AddColumn<int>(
                name: "ExpectedExpenseMinimumSampleSize",
                table: "TravelConstraints",
                type: "integer",
                nullable: false,
                defaultValue: 3);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ExpectedExpenseDestinationMinimumCount",
                table: "TravelConstraints");

            migrationBuilder.DropColumn(
                name: "ExpectedExpenseHabitThresholdPercent",
                table: "TravelConstraints");

            migrationBuilder.DropColumn(
                name: "ExpectedExpenseHistoryTripCount",
                table: "TravelConstraints");

            migrationBuilder.DropColumn(
                name: "ExpectedExpenseMinimumSampleSize",
                table: "TravelConstraints");
        }
    }
}
