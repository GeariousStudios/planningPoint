using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace planningPoint.Migrations
{
    /// <inheritdoc />
    public partial class RemoveIncrementalAssigment : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "MasterPlanIncrementalAssignments");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "MasterPlanIncrementalAssignments",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    AssignedNumber = table.Column<int>(type: "INTEGER", nullable: false),
                    CreatedBy = table.Column<string>(type: "TEXT", nullable: false),
                    CreationDate = table.Column<DateTime>(type: "TEXT", nullable: false),
                    GroupKey = table.Column<string>(type: "TEXT", maxLength: 64, nullable: false),
                    MasterPlanFieldId = table.Column<int>(type: "INTEGER", nullable: false),
                    MasterPlanId = table.Column<int>(type: "INTEGER", nullable: false),
                    UpdateDate = table.Column<DateTime>(type: "TEXT", nullable: false),
                    UpdatedBy = table.Column<string>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MasterPlanIncrementalAssignments", x => x.Id);
                });
        }
    }
}
