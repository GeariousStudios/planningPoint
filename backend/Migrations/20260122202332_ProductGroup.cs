using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace planningPoint.Migrations
{
    /// <inheritdoc />
    public partial class ProductGroup : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ProductFieldValue_MasterPlanFields_MasterPlanFieldId",
                table: "ProductFieldValue");

            migrationBuilder.DropForeignKey(
                name: "FK_ProductFieldValue_Products_ProductId",
                table: "ProductFieldValue");

            migrationBuilder.DropPrimaryKey(
                name: "PK_ProductFieldValue",
                table: "ProductFieldValue");

            migrationBuilder.RenameTable(
                name: "ProductFieldValue",
                newName: "ProductFieldValues");

            migrationBuilder.RenameIndex(
                name: "IX_ProductFieldValue_ProductId",
                table: "ProductFieldValues",
                newName: "IX_ProductFieldValues_ProductId");

            migrationBuilder.RenameIndex(
                name: "IX_ProductFieldValue_MasterPlanFieldId",
                table: "ProductFieldValues",
                newName: "IX_ProductFieldValues_MasterPlanFieldId");

            migrationBuilder.AddPrimaryKey(
                name: "PK_ProductFieldValues",
                table: "ProductFieldValues",
                column: "Id");

            migrationBuilder.CreateTable(
                name: "ProductGroups",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Name = table.Column<string>(type: "TEXT", maxLength: 64, nullable: false),
                    IsHidden = table.Column<bool>(type: "INTEGER", nullable: false),
                    CreationDate = table.Column<DateTime>(type: "TEXT", nullable: false),
                    UpdateDate = table.Column<DateTime>(type: "TEXT", nullable: false),
                    CreatedBy = table.Column<string>(type: "TEXT", nullable: false),
                    UpdatedBy = table.Column<string>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProductGroups", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "ProductGroupFieldValues",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    ProductGroupId = table.Column<int>(type: "INTEGER", nullable: false),
                    MasterPlanFieldId = table.Column<int>(type: "INTEGER", nullable: false),
                    Value = table.Column<string>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProductGroupFieldValues", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ProductGroupFieldValues_MasterPlanFields_MasterPlanFieldId",
                        column: x => x.MasterPlanFieldId,
                        principalTable: "MasterPlanFields",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ProductGroupFieldValues_ProductGroups_ProductGroupId",
                        column: x => x.ProductGroupId,
                        principalTable: "ProductGroups",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ProductGroupToProducts",
                columns: table => new
                {
                    ProductGroupId = table.Column<int>(type: "INTEGER", nullable: false),
                    ProductId = table.Column<int>(type: "INTEGER", nullable: false),
                    IsActive = table.Column<bool>(type: "INTEGER", nullable: false),
                    Order = table.Column<int>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProductGroupToProducts", x => new { x.ProductGroupId, x.ProductId });
                    table.ForeignKey(
                        name: "FK_ProductGroupToProducts_ProductGroups_ProductGroupId",
                        column: x => x.ProductGroupId,
                        principalTable: "ProductGroups",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ProductGroupToProducts_Products_ProductId",
                        column: x => x.ProductId,
                        principalTable: "Products",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ProductGroupFieldValues_MasterPlanFieldId",
                table: "ProductGroupFieldValues",
                column: "MasterPlanFieldId");

            migrationBuilder.CreateIndex(
                name: "IX_ProductGroupFieldValues_ProductGroupId",
                table: "ProductGroupFieldValues",
                column: "ProductGroupId");

            migrationBuilder.CreateIndex(
                name: "IX_ProductGroupToProducts_ProductId",
                table: "ProductGroupToProducts",
                column: "ProductId");

            migrationBuilder.AddForeignKey(
                name: "FK_ProductFieldValues_MasterPlanFields_MasterPlanFieldId",
                table: "ProductFieldValues",
                column: "MasterPlanFieldId",
                principalTable: "MasterPlanFields",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_ProductFieldValues_Products_ProductId",
                table: "ProductFieldValues",
                column: "ProductId",
                principalTable: "Products",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ProductFieldValues_MasterPlanFields_MasterPlanFieldId",
                table: "ProductFieldValues");

            migrationBuilder.DropForeignKey(
                name: "FK_ProductFieldValues_Products_ProductId",
                table: "ProductFieldValues");

            migrationBuilder.DropTable(
                name: "ProductGroupFieldValues");

            migrationBuilder.DropTable(
                name: "ProductGroupToProducts");

            migrationBuilder.DropTable(
                name: "ProductGroups");

            migrationBuilder.DropPrimaryKey(
                name: "PK_ProductFieldValues",
                table: "ProductFieldValues");

            migrationBuilder.RenameTable(
                name: "ProductFieldValues",
                newName: "ProductFieldValue");

            migrationBuilder.RenameIndex(
                name: "IX_ProductFieldValues_ProductId",
                table: "ProductFieldValue",
                newName: "IX_ProductFieldValue_ProductId");

            migrationBuilder.RenameIndex(
                name: "IX_ProductFieldValues_MasterPlanFieldId",
                table: "ProductFieldValue",
                newName: "IX_ProductFieldValue_MasterPlanFieldId");

            migrationBuilder.AddPrimaryKey(
                name: "PK_ProductFieldValue",
                table: "ProductFieldValue",
                column: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_ProductFieldValue_MasterPlanFields_MasterPlanFieldId",
                table: "ProductFieldValue",
                column: "MasterPlanFieldId",
                principalTable: "MasterPlanFields",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_ProductFieldValue_Products_ProductId",
                table: "ProductFieldValue",
                column: "ProductId",
                principalTable: "Products",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
