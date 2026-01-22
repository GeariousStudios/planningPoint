using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace planningPoint.Migrations
{
    /// <inheritdoc />
    public partial class ProductGroupMasterPlan : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ProductGroupToMasterPlans",
                columns: table => new
                {
                    ProductGroupId = table.Column<int>(type: "INTEGER", nullable: false),
                    MasterPlanId = table.Column<int>(type: "INTEGER", nullable: false),
                    IsActive = table.Column<bool>(type: "INTEGER", nullable: false),
                    Order = table.Column<int>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProductGroupToMasterPlans", x => new { x.ProductGroupId, x.MasterPlanId });
                    table.ForeignKey(
                        name: "FK_ProductGroupToMasterPlans_MasterPlans_MasterPlanId",
                        column: x => x.MasterPlanId,
                        principalTable: "MasterPlans",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ProductGroupToMasterPlans_ProductGroups_ProductGroupId",
                        column: x => x.ProductGroupId,
                        principalTable: "ProductGroups",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ProductGroupToMasterPlans_MasterPlanId",
                table: "ProductGroupToMasterPlans",
                column: "MasterPlanId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ProductGroupToMasterPlans");
        }
    }
}
