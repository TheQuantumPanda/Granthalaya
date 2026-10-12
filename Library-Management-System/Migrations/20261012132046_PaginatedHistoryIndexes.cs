using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Library_Management_System.Migrations
{
    /// <inheritdoc />
    public partial class PaginatedHistoryIndexes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateIndex(
                name: "IX_ContactMessages_SubmittedAt_Id",
                table: "ContactMessages",
                columns: new[] { "SubmittedAt", "Id" });

            migrationBuilder.CreateIndex(
                name: "IX_BorrowRecords_BorrowDate_BorrowRecordId",
                table: "BorrowRecords",
                columns: new[] { "BorrowDate", "BorrowRecordId" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_ContactMessages_SubmittedAt_Id",
                table: "ContactMessages");

            migrationBuilder.DropIndex(
                name: "IX_BorrowRecords_BorrowDate_BorrowRecordId",
                table: "BorrowRecords");
        }
    }
}
