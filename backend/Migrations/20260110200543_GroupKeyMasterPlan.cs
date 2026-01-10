using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace planningPoint.Migrations
{
    /// <inheritdoc />
    public partial class GroupKeyMasterPlan : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsGroupKey",
                table: "MasterPlanToMasterPlanFields",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.CreateIndex(
                name: "IX_MasterPlanToMasterPlanFields_MasterPlanId",
                table: "MasterPlanToMasterPlanFields",
                column: "MasterPlanId",
                unique: true,
                filter: "[IsGroupKey] = 1");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_MasterPlanToMasterPlanFields_MasterPlanId",
                table: "MasterPlanToMasterPlanFields");

            migrationBuilder.DropColumn(
                name: "IsGroupKey",
                table: "MasterPlanToMasterPlanFields");
        }
    }
}
