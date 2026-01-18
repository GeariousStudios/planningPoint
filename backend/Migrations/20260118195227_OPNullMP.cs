using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace planningPoint.Migrations
{
    /// <inheritdoc />
    public partial class OPNullMP : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_OperationalPlans_MasterPlans_MasterPlanId",
                table: "OperationalPlans");

            migrationBuilder.AlterColumn<int>(
                name: "MasterPlanId",
                table: "OperationalPlans",
                type: "INTEGER",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "INTEGER");

            migrationBuilder.AddForeignKey(
                name: "FK_OperationalPlans_MasterPlans_MasterPlanId",
                table: "OperationalPlans",
                column: "MasterPlanId",
                principalTable: "MasterPlans",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_OperationalPlans_MasterPlans_MasterPlanId",
                table: "OperationalPlans");

            migrationBuilder.AlterColumn<int>(
                name: "MasterPlanId",
                table: "OperationalPlans",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "INTEGER",
                oldNullable: true);

            migrationBuilder.AddForeignKey(
                name: "FK_OperationalPlans_MasterPlans_MasterPlanId",
                table: "OperationalPlans",
                column: "MasterPlanId",
                principalTable: "MasterPlans",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
