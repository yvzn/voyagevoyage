using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace VoyageVoyage.Server.Migrations
{
    /// <inheritdoc />
    public partial class AddBookingConfirmations : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "BookingConfirmations",
                columns: table => new
                {
                    Id = table.Column<string>(type: "text", nullable: false),
                    UserId = table.Column<string>(type: "text", nullable: false),
                    TripId = table.Column<string>(type: "text", nullable: false),
                    Type = table.Column<int>(type: "integer", nullable: false),
                    ProviderName = table.Column<string>(type: "text", nullable: true),
                    Reference = table.Column<string>(type: "text", nullable: true),
                    FileName = table.Column<string>(type: "text", nullable: false),
                    ContentType = table.Column<string>(type: "text", nullable: false),
                    BlobName = table.Column<string>(type: "text", nullable: false),
                    UploadedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BookingConfirmations", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_BookingConfirmations_TripId",
                table: "BookingConfirmations",
                column: "TripId");

            migrationBuilder.CreateIndex(
                name: "IX_BookingConfirmations_UserId",
                table: "BookingConfirmations",
                column: "UserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "BookingConfirmations");
        }
    }
}
