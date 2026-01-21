using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace planningPoint.Migrations
{
    /// <inheritdoc />
    public partial class ProductValues : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Value",
                table: "ProductToMasterPlanFields",
                type: "TEXT",
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateTable(
                name: "ProductFieldValue",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    ProductId = table.Column<int>(type: "INTEGER", nullable: false),
                    MasterPlanFieldId = table.Column<int>(type: "INTEGER", nullable: false),
                    Value = table.Column<string>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProductFieldValue", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ProductFieldValue_MasterPlanFields_MasterPlanFieldId",
                        column: x => x.MasterPlanFieldId,
                        principalTable: "MasterPlanFields",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ProductFieldValue_Products_ProductId",
                        column: x => x.ProductId,
                        principalTable: "Products",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ProductFieldValue_MasterPlanFieldId",
                table: "ProductFieldValue",
                column: "MasterPlanFieldId");

            migrationBuilder.CreateIndex(
                name: "IX_ProductFieldValue_ProductId",
                table: "ProductFieldValue",
                column: "ProductId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ProductFieldValue");

            migrationBuilder.DropColumn(
                name: "Value",
                table: "ProductToMasterPlanFields");
        }
    }
}
